
'use client';
import Link from 'next/link';

const upcomingHearings = [
  {
    id: '1',
    caseNumber: 'LC-2024-001',
    clientName: 'Johnson & Associates',
    hearingDate: '2024-12-28',
    timeLeft: '2 days',
    type: 'Pre-trial Conference',
    urgent: true
  },
  {
    id: '2',
    caseNumber: 'LC-2024-015',
    clientName: 'Maria Rodriguez',
    hearingDate: '2024-12-30',
    timeLeft: '4 days',
    type: 'Final Hearing',
    urgent: false
  },
  {
    id: '3',
    caseNumber: 'LC-2024-008',
    clientName: 'Tech Solutions Inc',
    hearingDate: '2025-01-05',
    timeLeft: '10 days',
    type: 'Motion Hearing',
    urgent: false
  }
];

const requiredDocuments = [
  {
    caseNumber: 'LC-2024-001',
    document: 'Financial Statements',
    dueDate: '2024-12-27',
    status: 'pending'
  },
  {
    caseNumber: 'LC-2024-015',
    document: 'Witness Affidavits',
    dueDate: '2024-12-29',
    status: 'pending'
  }
];

export default function CaseNotifications() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Hearings</h2>
      
      <div className="space-y-3 mb-6">
        {upcomingHearings.map((hearing) => (
          <Link key={hearing.id} href={`/cases/${hearing.id}`} className="cursor-pointer">
            <div className={`p-4 rounded-lg border-l-4 ${
              hearing.urgent ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
            } hover:bg-opacity-80 transition duration-200`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{hearing.caseNumber}</span>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  hearing.urgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {hearing.timeLeft}
                </span>
              </div>
              <p className="text-sm text-gray-600">{hearing.clientName}</p>
              <p className="text-sm text-gray-500">{hearing.type}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-md font-medium text-gray-900 mb-3">Required Documents</h3>
        <div className="space-y-2">
          {requiredDocuments.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{doc.document}</p>
                <p className="text-xs text-gray-600">{doc.caseNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Due: {doc.dueDate}</p>
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
