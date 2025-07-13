
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../dashboard/DashboardHeader';
import HearingHistory from './HearingHistory';
import AddHearingModal from './AddHearingModal';
import DocumentsSection from './DocumentsSection';
import NotesSection from './NotesSection';

interface CaseDetailProps {
  caseId: string;
}

const mockCase = {
  id: '1',
  referenceNumber: 'LC-2024-001',
  fileNumber: 'F-001-2024',
  caseNumber: 'C-24-001',
  title: 'Loan Settlement Dispute',
  clientNames: ['Johnson & Associates', 'ABC Corporation'],
  category: 'Financial',
  subcategory: 'Loan Settlement',
  status: 'Active',
  priority: 'High',
  description: 'Complex loan settlement case involving multiple parties and significant financial exposure. Requires careful documentation and strategic approach.',
  createdDate: '2024-01-15',
  lastUpdated: '2024-12-15',
  assignedLawyer: 'Sarah Johnson',
  nextHearingDate: '2024-12-28',
  lastHearingDate: '2024-11-15',
  courtName: 'District Court Central',
  judgeAssigned: 'Hon. Michael Roberts'
};

export default function CaseDetail({ caseId }: CaseDetailProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddHearing, setShowAddHearing] = useState(false);
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
          <p className="text-gray-600">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleDeleteCase = () => {
    if (user.role !== 'super_admin') {
      alert('Only Super Admin can delete cases');
      return;
    }
    if (confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      // Handle case deletion
      router.push('/dashboard');
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{mockCase.title}</h1>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-medium text-gray-700">{mockCase.referenceNumber}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mockCase.status)}`}>
                  {mockCase.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(mockCase.priority)}`}>
                  {mockCase.priority}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href={`/cases/${caseId}/edit`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer">
                Edit Case
              </Link>
              {user.role === 'super_admin' && (
                <button
                  onClick={handleDeleteCase}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer"
                >
                  Delete Case
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: 'ri-file-text-line' },
                { id: 'hearings', name: 'Hearings', icon: 'ri-calendar-line' },
                { id: 'documents', name: 'Documents', icon: 'ri-folder-line' },
                { id: 'notes', name: 'Notes', icon: 'ri-sticky-note-line' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={tab.icon}></i>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Reference Number</label>
                        <p className="text-gray-900">{mockCase.referenceNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">File Number</label>
                        <p className="text-gray-900">{mockCase.fileNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Case Number</label>
                        <p className="text-gray-900">{mockCase.caseNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-gray-900">{mockCase.category} - {mockCase.subcategory}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Client Names</label>
                      <div className="space-y-1">
                        {mockCase.clientNames.map((name, index) => (
                          <p key={index} className="text-gray-900">{name}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-900">{mockCase.description}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assigned Lawyer</label>
                        <p className="text-gray-900">{mockCase.assignedLawyer}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Judge Assigned</label>
                        <p className="text-gray-900">{mockCase.judgeAssigned}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Court Name</label>
                      <p className="text-gray-900">{mockCase.courtName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Next Hearing</label>
                        <p className="text-gray-900">{mockCase.nextHearingDate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Hearing</label>
                        <p className="text-gray-900">{mockCase.lastHearingDate}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created Date</label>
                        <p className="text-gray-900">{mockCase.createdDate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="text-gray-900">{mockCase.lastUpdated}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hearings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Hearing History</h3>
                  <button
                    onClick={() => setShowAddHearing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer"
                  >
                    + Schedule Hearing
                  </button>
                </div>
                <HearingHistory caseId={caseId} />
              </div>
            )}

            {activeTab === 'documents' && <DocumentsSection caseId={caseId} />}
            {activeTab === 'notes' && <NotesSection caseId={caseId} />}
          </div>
        </div>
      </div>

      {showAddHearing && (
        <AddHearingModal
          caseId={caseId}
          onClose={() => setShowAddHearing(false)}
        />
      )}
    </div>
  );
}
