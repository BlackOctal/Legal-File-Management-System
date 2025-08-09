'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../lib/api';

interface CaseNotificationsProps {
  data?: any;
}

interface UpcomingHearing {
  _id: string;
  date: string;
  time: string;
  type: string;
  caseId: {
    _id: string;
    referenceNumber: string;
    title: string;
    clientNames: string[];
  };
  judge: string;
  courtroom: string;
  documentsRequired?: string;
}

interface RequiredDocument {
  id: string;
  caseNumber: string;
  caseTitle: string;
  caseId: string;
  hearingId: string;
  document: string;
  dueDate: string;
  hearingType: string;
  status: string;
  urgency: string;
}

export default function CaseNotifications({ data }: CaseNotificationsProps) {
  const [upcomingHearings, setUpcomingHearings] = useState<UpcomingHearing[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotificationData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (data && data.upcomingHearings && data.requiredDocuments) {
          // Use data from parent component if available
          console.log('Using data from parent:', {
            hearings: data.upcomingHearings.length,
            documents: data.requiredDocuments.length
          });
          setUpcomingHearings(data.upcomingHearings);
          setRequiredDocuments(data.requiredDocuments);
        } else {
          // Fetch data separately
          console.log('Fetching data separately...');
          const [hearingsResponse, documentsResponse] = await Promise.all([
            dashboardAPI.getUpcomingHearings(14),
            dashboardAPI.getRequiredDocuments()
          ]);

          console.log('Hearings response:', hearingsResponse);
          console.log('Documents response:', documentsResponse);

          if (hearingsResponse.success) {
            setUpcomingHearings(hearingsResponse.data.hearings || []);
          }

          if (documentsResponse.success) {
            setRequiredDocuments(documentsResponse.data.requiredDocuments || []);
          }
        }

      } catch (error) {
        console.error('Error fetching notification data:', error);
        setError('Failed to load notifications');
        setUpcomingHearings([]);
        setRequiredDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationData();
  }, [data]);

  const getTimeLeft = (dateString: string) => {
    const now = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  const isUrgent = (dateString: string) => {
    const now = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return 'bg-red-100 text-red-700 border-l-red-500';
      case 'today': return 'bg-red-100 text-red-700 border-l-red-500';
      case 'tomorrow': return 'bg-orange-100 text-orange-700 border-l-orange-500';
      case 'urgent': return 'bg-yellow-100 text-yellow-700 border-l-yellow-500';
      case 'this-week': return 'bg-blue-100 text-blue-700 border-l-blue-500';
      default: return 'bg-gray-100 text-gray-700 border-l-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Hearings</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Hearings</h2>
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Hearings</h2>
      
      <div className="space-y-3 mb-6">
        {upcomingHearings.length > 0 ? (
          upcomingHearings.slice(0, 3).map((hearing) => {
            const timeLeft = getTimeLeft(hearing.date);
            const urgent = isUrgent(hearing.date);
            
            return (
              <Link key={hearing._id} href={`/cases/${hearing.caseId._id}`} className="cursor-pointer">
                <div className={`p-4 rounded-lg border-l-4 ${
                  urgent ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
                } hover:bg-opacity-80 transition duration-200`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {hearing.caseId.referenceNumber}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      urgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {timeLeft}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {hearing.caseId.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {hearing.caseId.clientNames?.join(', ') || 'No client info'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">{hearing.type}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(hearing.date).toLocaleDateString()} at {hearing.time}
                    </span>
                  </div>
                  {hearing.documentsRequired && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Docs Required:</span> {hearing.documentsRequired}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No upcoming hearings</p>
          </div>
        )}
      </div>

      {/* <div className="border-t border-gray-200 pt-4">
        <h3 className="text-md font-medium text-gray-900 mb-3">Required Documents</h3>
        <div className="space-y-2">
          {requiredDocuments.length > 0 ? (
            requiredDocuments.slice(0, 4).map((doc) => (
              <Link key={doc.id} href={`/cases/${doc.caseId}`} className="cursor-pointer">
                <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getUrgencyColor(doc.urgency)} hover:bg-opacity-80 transition duration-200`}>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{doc.document}</p>
                    <p className="text-xs text-gray-600">{doc.caseNumber} - {doc.hearingType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Due: {new Date(doc.dueDate).toLocaleDateString()}</p>
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      doc.urgency === 'overdue' || doc.urgency === 'today' ? 'bg-red-500' :
                      doc.urgency === 'tomorrow' || doc.urgency === 'urgent' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}></span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-500 text-sm">No pending documents</p>
            </div>
          )}
        </div>
      </div> */}

      <div className="mt-4 pt-4 border-t border-gray-200">
        {upcomingHearings.length > 3 && (
          <div className="mb-2">
            <Link href="/cases" className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer">
              View All Cases with Hearings ({upcomingHearings.length})
            </Link>
          </div>
        )}
        {requiredDocuments.length > 4 && (
          <div>
            <Link href="/cases" className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer">
              View All Cases with Required Documents ({requiredDocuments.length})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}