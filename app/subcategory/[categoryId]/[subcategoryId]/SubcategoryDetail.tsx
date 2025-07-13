
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../../dashboard/DashboardHeader';

interface SubcategoryDetailProps {
  categoryId: string;
  subcategoryId: string;
}

const mockCases = [
  {
    id: '1',
    referenceNumber: 'LC-2024-001',
    fileNumber: 'F-001-2024',
    caseNumber: 'C-24-001',
    clientNames: ['Johnson & Associates', 'ABC Corporation'],
    lastHearingDate: '2024-11-15',
    nextHearingDate: '2024-12-28',
    status: 'Active',
    priority: 'High',
    category: 'Financial',
    subcategory: 'Loan Settlement'
  },
  {
    id: '2',
    referenceNumber: 'LC-2024-002',
    fileNumber: 'F-002-2024',
    caseNumber: 'C-24-002',
    clientNames: ['Maria Rodriguez'],
    lastHearingDate: '2024-10-20',
    nextHearingDate: '2024-12-30',
    status: 'Active',
    priority: 'Medium',
    category: 'Financial',
    subcategory: 'Debt Recovery'
  },
  {
    id: '3',
    referenceNumber: 'LC-2024-003',
    fileNumber: 'F-003-2024',
    caseNumber: 'C-24-003',
    clientNames: ['Tech Solutions Inc', 'Digital Partners LLC'],
    lastHearingDate: '2024-12-01',
    nextHearingDate: null,
    status: 'Pending',
    priority: 'Low',
    category: 'Financial',
    subcategory: 'Bankruptcy'
  },
  {
    id: '4',
    referenceNumber: 'LC-2024-004',
    fileNumber: 'F-004-2024',
    caseNumber: 'C-24-004',
    clientNames: ['Robert Wilson', 'Sarah Wilson'],
    lastHearingDate: '2024-09-15',
    nextHearingDate: '2025-01-15',
    status: 'Active',
    priority: 'Medium',
    category: 'Property Deeds',
    subcategory: 'Property Transfer'
  }
];

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
  }
};

export default function SubcategoryDetail({ categoryId, subcategoryId }: SubcategoryDetailProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

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
    return <div>Subcategory not found</div>;
  }

  const filteredCases = mockCases.filter(case_item => {
    const matchesSearch = case_item.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         case_item.clientNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || case_item.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{subcategory.name}</h1>
          <p className="text-gray-600">{subcategory.description}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search by case number or client name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
              <Link href="/cases/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 whitespace-nowrap cursor-pointer">
                + New Case
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Reference No.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">File No.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Case No.</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Client(s)</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Last Hearing</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Next Hearing</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Priority</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((case_item) => (
                  <tr key={case_item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <Link href={`/cases/${case_item.id}`} className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                        {case_item.referenceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{case_item.fileNumber}</td>
                    <td className="py-3 px-2 text-gray-700">{case_item.caseNumber}</td>
                    <td className="py-3 px-2">
                      <div className="space-y-1">
                        {case_item.clientNames.map((name, index) => (
                          <div key={index} className="text-sm text-gray-700">{name}</div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-600 text-sm">{case_item.lastHearingDate}</td>
                    <td className="py-3 px-2 text-gray-600 text-sm">
                      {case_item.nextHearingDate || 'Not scheduled'}
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
                      <Link href={`/cases/${case_item.id}`} className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCases.length === 0 && (
            <div className="text-center py-8">
              <i className="ri-folder-open-line text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">No cases found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
