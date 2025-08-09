const express = require('express');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');

const router = express.Router();

// @desc    Get dashboard overview data
// @route   GET /api/dashboard/overview
// @access  Private
router.get('/overview', async (req, res) => {
  try {
    console.log('📊 GET /api/dashboard/overview - Fetching dashboard data');
    console.log('User:', req.user.name, req.user.role);

    // Get case statistics
    const caseStats = await Case.aggregate([
      {
        $group: {
          _id: null,
          totalCases: { $sum: 1 },
          activeCases: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          pendingCases: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          closedCases: {
            $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] }
          },
          inactiveCases: {
            $sum: { $cond: ['$isInactive', 1, 0] }
          },
          highPriorityCases: {
            $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get cases by category
    const categoryCounts = await Case.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get upcoming hearings (next 14 days)
    const upcomingHearings = await Hearing.getUpcomingHearings(14);

    // Get required documents from upcoming hearings
    const requiredDocuments = await getRequiredDocuments();

    // Get inactive cases (>10 months without hearing)
    const inactiveCases = await Case.find({ isInactive: true })
      .sort({ lastHearingDate: 1 })
      .limit(10)
      .populate('createdBy', 'name');

    // Get recent cases (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCases = await Case.find({
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name');

    console.log('✅ Dashboard data fetched successfully');
    console.log('Case stats:', caseStats[0]);
    console.log('Category counts:', categoryCounts.length);
    console.log('Upcoming hearings:', upcomingHearings.length);
    console.log('Required documents:', requiredDocuments.length);

    res.json({
      success: true,
      data: {
        caseStats: caseStats[0] || {
          totalCases: 0,
          activeCases: 0,
          pendingCases: 0,
          closedCases: 0,
          inactiveCases: 0,
          highPriorityCases: 0
        },
        categoryCounts,
        upcomingHearings,
        requiredDocuments,
        inactiveCases,
        recentCases
      }
    });

  } catch (error) {
    console.error('❌ Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @desc    Get upcoming hearings for next 2 weeks
// @route   GET /api/dashboard/upcoming-hearings
// @access  Private
router.get('/upcoming-hearings', async (req, res) => {
  try {
    console.log('📅 GET /api/dashboard/upcoming-hearings');
    
    const { days = 14 } = req.query;
    
    const upcomingHearings = await Hearing.getUpcomingHearings(parseInt(days));

    // Group hearings by urgency
    const now = new Date();
    const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
    const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    const groupedHearings = {
      urgent: upcomingHearings.filter(hearing => new Date(hearing.date) <= tomorrow),
      thisWeek: upcomingHearings.filter(hearing => {
        const hearingDate = new Date(hearing.date);
        return hearingDate > tomorrow && hearingDate <= nextWeek;
      }),
      upcoming: upcomingHearings.filter(hearing => new Date(hearing.date) > nextWeek)
    };

    console.log(`✅ Found ${upcomingHearings.length} upcoming hearings`);

    res.json({
      success: true,
      data: { 
        hearings: upcomingHearings,
        groupedHearings
      }
    });

  } catch (error) {
    console.error('❌ Get upcoming hearings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming hearings'
    });
  }
});

// @desc    Get required documents for upcoming hearings
// @route   GET /api/dashboard/required-documents
// @access  Private
router.get('/required-documents', async (req, res) => {
  try {
    console.log('📋 GET /api/dashboard/required-documents');
    
    const requiredDocuments = await getRequiredDocuments();
    
    console.log(`✅ Found ${requiredDocuments.length} required documents`);

    res.json({
      success: true,
      data: { requiredDocuments }
    });

  } catch (error) {
    console.error('❌ Get required documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching required documents'
    });
  }
});

// Helper function to get required documents from upcoming hearings
const getRequiredDocuments = async () => {
  try {
    // Get hearings in the next 30 days that have documentsRequired
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const hearingsWithDocs = await Hearing.find({
      date: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      },
      status: 'Scheduled',
      documentsRequired: { $exists: true, $ne: '', $ne: null }
    })
    .populate('caseId', 'referenceNumber title')
    .sort({ date: 1 });

    console.log(`Found ${hearingsWithDocs.length} hearings with documents required`);

    // Transform hearings into required documents format
    const requiredDocuments = [];
    
    for (const hearing of hearingsWithDocs) {
      if (hearing.documentsRequired && hearing.caseId) {
        console.log(`Processing hearing ${hearing._id} with docs: ${hearing.documentsRequired}`);
        
        // Split documents by common separators and create separate entries
        const documents = hearing.documentsRequired
          .split(/[,;|\n]/) // Split by comma, semicolon, pipe, or newline
          .map(doc => doc.trim())
          .filter(doc => doc.length > 0);

        console.log(`Split into ${documents.length} documents:`, documents);

        for (let i = 0; i < documents.length; i++) {
          const document = documents[i];
          requiredDocuments.push({
            id: `${hearing._id}-${i}`, // Use index to ensure unique IDs
            caseNumber: hearing.caseId.referenceNumber,
            caseTitle: hearing.caseId.title,
            caseId: hearing.caseId._id,
            hearingId: hearing._id,
            document: document,
            dueDate: hearing.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            hearingType: hearing.type,
            status: 'pending',
            urgency: getDaysUntilDue(hearing.date)
          });
        }
      }
    }

    const getDaysUntilDue = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 7) return 'this-week';
  return 'upcoming';
};


    console.log(`Total required documents: ${requiredDocuments.length}`);

    // Sort by urgency (closest dates first)
    requiredDocuments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return requiredDocuments;
  } catch (error) {
    console.error('Error getting required documents:', error);
    return [];
  }

  
};

// @desc    Get inactive cases
// @route   GET /api/dashboard/inactive-cases
// @access  Private
router.get('/inactive-cases', async (req, res) => {
  try {
    console.log('⚠️ GET /api/dashboard/inactive-cases');

    const inactiveCases = await Case.find({ isInactive: true })
      .sort({ monthsInactive: -1, lastHearingDate: 1 })
      .populate('createdBy', 'name')
      .populate('lastUpdatedBy', 'name');

    console.log(`✅ Found ${inactiveCases.length} inactive cases`);

    res.json({
      success: true,
      data: { inactiveCases }
    });

  } catch (error) {
    console.error('❌ Get inactive cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inactive cases'
    });
  }
});

module.exports = router;