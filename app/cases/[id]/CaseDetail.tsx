'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardHeader from '../../dashboard/DashboardHeader';
import HearingHistory from './HearingHistory';
import AddHearingModal from './AddHearingModal';
import DocumentsSection from './DocumentsSection';
import NotesSection from './NotesSection';
import { casesAPI } from '../../../lib/api';

interface CaseDetailProps {
  caseId: string;
}

interface CaseData {
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
  description: string;
  createdDate: string;
  lastUpdated: string;
  assignedLawyer: string;
  nextHearingDate?: string;
  lastHearingDate?: string;
  courtName?: string;
  judgeAssigned?: string;
}

export default function CaseDetail({ caseId }: CaseDetailProps) {
  const [user, setUser] = useState<any>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchCaseData();
  }, [router, caseId, refreshTrigger]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await casesAPI.getById(caseId);
      const caseInfo = data.data?.case || data.case || data;
      setCaseData(caseInfo);
    } catch (error) {
      console.error('Error fetching case:', error);
      setError(error instanceof Error ? error.message : 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async () => {
    if (user.role !== 'super_admin') {
      alert('Only Super Admin can delete cases');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this case? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Attempting to delete case:', caseId);
      await casesAPI.delete(caseId);
      
      alert('Case deleted successfully');
      router.push('/cases');
    } catch (error) {
      console.error('Error deleting case:', error);
      alert(`Failed to delete case: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleHearingAdded = () => {
    setShowAddHearing(false);
    handleRefresh();
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <i className="ri-error-warning-line text-4xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Case</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={fetchCaseData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
            <Link href="/cases" className="text-blue-600 hover:text-blue-700">
              Back to Cases
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !caseData) return null;

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
          <Link href="/cases" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block cursor-pointer">
            ← Back to Cases
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{caseData.title}</h1>
              <div className="flex items-center space-x-4">
                <span className="text-lg font-medium text-gray-700">{caseData.referenceNumber}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseData.status)}`}>
                  {caseData.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(caseData.priority)}`}>
                  {caseData.priority}
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
                        <p className="text-gray-900">{caseData.referenceNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">File Number</label>
                        <p className="text-gray-900">{caseData.fileNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Case Number</label>
                        <p className="text-gray-900">{caseData.caseNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-gray-900">{caseData.category} - {caseData.subcategory}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Client Names</label>
                      <div className="space-y-1">
                        {caseData.clientNames.map((name, index) => (
                          <p key={index} className="text-gray-900">{name}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-900">{caseData.description}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Details</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assigned Lawyer</label>
                        <p className="text-gray-900">{caseData.assignedLawyer}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Judge Assigned</label>
                        <p className="text-gray-900">{caseData.judgeAssigned || 'Not assigned'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Court Name</label>
                      <p className="text-gray-900">{caseData.courtName || 'Not specified'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Next Hearing</label>
                        <p className="text-gray-900">{caseData.nextHearingDate || 'Not scheduled'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Hearing</label>
                        <p className="text-gray-900">{caseData.lastHearingDate || 'No previous hearing'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created Date</label>
                        <p className="text-gray-900">{caseData.createdDate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="text-gray-900">{caseData.lastUpdated}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hearings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  {/* <h3 className="text-lg font-semibold text-gray-900">Hearing History</h3>
                  <button
                    onClick={() => setShowAddHearing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer"
                  >
                    + Schedule Hearing
                  </button> */}
                </div>
                <HearingHistory caseId={caseId} refreshTrigger={refreshTrigger} />
              </div>
            )}

            {activeTab === 'documents' && (
              <DocumentsSection caseId={caseId} refreshTrigger={refreshTrigger} />
            )}

            {activeTab === 'notes' && (
              <NotesSection caseId={caseId} refreshTrigger={refreshTrigger} />
            )}
          </div>
        </div>
      </div>

      {showAddHearing && (
        <AddHearingModal
          caseId={caseId}
          onClose={() => setShowAddHearing(false)}
          onHearingAdded={handleHearingAdded}
        />
      )}
    </div>
  );
}