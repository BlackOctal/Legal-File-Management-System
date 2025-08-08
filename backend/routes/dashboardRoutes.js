const express = require('express');
const Case = require('../models/Case');

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
    console.log('Inactive cases:', inactiveCases.length);

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
        upcomingHearings: [], // Will be populated when hearing system is complete
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
    
    // For now, return empty array until hearing system is implemented
    res.json({
      success: true,
      data: { 
        hearings: [],
        groupedHearings: {
          urgent: [],
          thisWeek: [],
          upcoming: []
        }
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