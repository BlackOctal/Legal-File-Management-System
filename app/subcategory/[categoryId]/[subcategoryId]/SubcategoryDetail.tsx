'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../../dashboard/DashboardHeader';
import { casesAPI } from '../../../../lib/api';

interface SubcategoryDetailProps {
  categoryId: string;
  subcategoryId: string;
}

interface Case {
  _id: string;
  id: string;
  referenceNumber: string;
  fileNumber: string;
  caseNumber: string;
  title: string;
  clientNames: string[];
  category: string;
  subcategory: string;
  status: string;
  priority: string;
  nextHearingDate?: string;
  lastHearingDate?: string;
  assignedLawyer: string;
  createdAt: string;
  updatedAt: string;
}

const subcategoryData: Record<string, Record<string, any>> = {
  financial: {
    'loan-settlement': { name: 'Loan Settlements', description: 'Mortgage and personal loan settlement cases' },
    'debt-recovery': { name: 'Debt Recovery', description: 'Debt collection and recovery proceedings' },
    'bankruptcy': { name: 'Bankruptcy', description: 'Corporate and personal bankruptcy cases' }
  },
  deeds: {
    'property-transfer': { name: 'Property Transfers', description: 'Property ownership transfer cases' },
    'title-dispute': { name: 'Title Disputes', description: 'Property title and ownership disputes' },
    'registration': { name: 'Registration', description: 'Property registration matters' }
  },
  criminal: {
    'defense': { name: 'Criminal Defense', description: 'Criminal defense representation' },
    'prosecution': { name: 'Prosecution', description: 'State prosecution cases' },
    'appeals': { name: 'Criminal Appeals', description: 'Criminal appeal proceedings' }
  },
  civil: {
    'contract-dispute': { name: 'Contract Disputes', description: 'Business and personal contracts' },
    'personal-injury': { name: 'Personal Injury', description: 'Accident and injury claims' },
    'torts': { name: 'Tort Cases', description: 'Civil wrong and damages' }
  },
  family: {
    'divorce': { name: 'Divorce Cases', description: 'Marriage dissolution proceedings' },
    'custody': { name: 'Child Custody', description: 'Child custody and support' },
    'adoption': { name: 'Adoption', description: 'Adoption proceedings' }
  },
  corporate: {
    'formation': { name: 'Business Formation', description: 'Company setup and structure' },
    'contracts': { name: 'Corporate Contracts', description: 'Business agreements' },
    'compliance': { name: 'Compliance', description: 'Regulatory compliance matters' }
  }
};

// Map URL-friendly subcategory IDs to actual subcategory names
const subcategoryMapping: Record<string, Record<string, string>> = {
  financial: {
    'loan-settlement': 'Loan Settlement',
    'debt-recovery': 'Debt Recovery',
    'bankruptcy': 'Bankruptcy'
  },
  deeds: {
    'property-transfer': 'Property Transfer',
    'title-dispute': 'Title Dispute',
    'registration': 'Registration'
  },
  criminal: {
    'defense': 'Defense',
    'prosecution': 'Prosecution',
    'appeals': 'Appeals'
  },
  civil: {
    'contract-dispute': 'Contract Dispute',
    'personal-injury': 'Personal Injury',
    'torts': 'Torts'
  },
  family: {
    'divorce': 'Divorce',
    'custody': 'Custody',
    'adoption': 'Adoption'
  },
  corporate: {
    'formation': 'Formation',
    'contracts': 'Contracts',
    'compliance': 'Compliance'
  }
};

export default function SubcategoryDetail({ categoryId, subcategoryId }: SubcategoryDetailProps) {
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCases: 0
  });
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchCases();
  }, [router, categoryId, subcategoryId]);

  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [searchTerm, statusFilter, priorityFilter]);

  const fetchCases = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Get the actual subcategory name from the mapping
      const actualSubcategory = subcategoryMapping[categoryId]?.[subcategoryId];
      
      if (!actualSubcategory) {
        throw new Error('Invalid category or subcategory');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        category: categoryId,
        subcategory: actualSubcategory,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter })
      });

      console.log('Fetching cases with params:', params.toString());
      const data = await casesAPI.getAll(params);
      
      console.log('API Response:', data);
      
      // Handle different response structures
      const casesData = data.data?.cases || data.cases || [];
      const paginationData = data.data?.pagination || data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCases: casesData.length
      };

      setCases(casesData);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError(error instanceof Error ? error.message : 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cases...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const subcategory = subcategoryData[categoryId]?.[subcategoryId];
  if (!subcategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="ri-error-warning-line text-4xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Subcategory Not Found</h2>
          <p className="text-gray-600 mb-4">The requested subcategory could not be found.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href={`/category/${categoryId}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block cursor-pointer">
            ← Back to Category
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{subcategory.name}</h1>
              <p className="text-gray-600">{subcategory.description}</p>
            </div>
            <Link href="/cases/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer">
              + New Case
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-500 mr-2"></i>
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => fetchCases()}
                className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search by case number, title, or client name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Reference No.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">File No.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Case No.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Title</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Client(s)</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Assigned Lawyer</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Last Hearing</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Next Hearing</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Priority</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((case_item) => (
                  <tr key={case_item._id || case_item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Link href={`/cases/${case_item._id || case_item.id}`} className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                        {case_item.referenceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{case_item.fileNumber}</td>
                    <td className="py-3 px-2 text-gray-700">{case_item.caseNumber}</td>
                    <td className="py-3 px-2 text-gray-900 font-medium">{case_item.title}</td>
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        {case_item.clientNames?.map((name, index) => (
                          <div key={index} className="text-sm text-gray-700">{name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{case_item.assignedLawyer}</td>
                    <td className="py-3 px-2 text-gray-600 text-sm">
                      {case_item.lastHearingDate ? 
                        new Date(case_item.lastHearingDate).toLocaleDateString() : 
                        'No previous hearing'
                      }
                    </td>
                    <td className="py-3 px-2 text-gray-600 text-sm">
                      {case_item.nextHearingDate ? 
                        new Date(case_item.nextHearingDate).toLocaleDateString() : 
                        'Not scheduled'
                      }
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_item.status)}`}>
                        {case_item.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(case_item.priority)}`}>
                        {case_item.priority}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-2">
                        <Link href={`/cases/${case_item._id || case_item.id}`} className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer">
                          View
                        </Link>
                        <Link href={`/cases/${case_item._id || case_item.id}/edit`} className="text-green-600 hover:text-green-700 text-sm cursor-pointer">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cases.length === 0 && !loading && (
            <div className="text-center py-8">
              <i className="ri-folder-open-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">No cases found in this subcategory</p>
              <p className="text-sm text-gray-500 mt-2">Create your first case in this category to get started</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
              <p>Showing {cases.length} of {pagination.totalCases} cases</p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchCases(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                <button
                  onClick={() => fetchCases(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}