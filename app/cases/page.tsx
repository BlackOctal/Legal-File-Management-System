'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../dashboard/DashboardHeader';
import { casesAPI } from '../../lib/api';

interface Case {
  _id: string;
  id: string;
  referenceNumber: string;
  title: string;
  clientNames: string[];
  category: string;
  subcategory: string;
  status: string;
  priority: string;
  nextHearingDate?: string;
  assignedLawyer: string;
}

export default function AllCasesPage() {
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
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
  }, [router]);

  // Separate useEffect for filters to avoid infinite loops
  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const fetchCases = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter })
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block cursor-pointer">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All Cases</h1>
              <p className="text-gray-600">Manage and view all legal cases</p>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Search and Filter Section */}
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
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="financial">Financial</option>
                <option value="deeds">Property Deeds</option>
                <option value="criminal">Criminal</option>
                <option value="civil">Civil</option>
                <option value="family">Family</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </div>

          {/* Cases Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Reference No.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Title</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Client(s)</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Category</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Assigned Lawyer</th>
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
                    <td className="py-3 px-2 text-gray-900 font-medium">{case_item.title}</td>
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        {case_item.clientNames?.map((name, index) => (
                          <div key={index} className="text-sm text-gray-700">{name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-sm text-gray-700">{case_item.category}</div>
                      <div className="text-xs text-gray-500">{case_item.subcategory}</div>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{case_item.assignedLawyer}</td>
                    <td className="py-3 px-2 text-gray-600 text-sm">
                        {case_item.nextHearingDate 
                          ? new Date(case_item.nextHearingDate).toLocaleDateString()
                          : 'Not scheduled'
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
              <p className="text-gray-600">No cases found matching your criteria</p>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <p>Showing {cases.length} of {pagination.totalCases} cases</p>
            
            {pagination.totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchCases(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                <button
                  onClick={() => fetchCases(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}