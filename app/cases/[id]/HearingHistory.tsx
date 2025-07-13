
'use client';

interface HearingHistoryProps {
  caseId: string;
}

const mockHearings = [
  {
    id: '1',
    date: '2024-12-28',
    time: '10:00 AM',
    type: 'Pre-trial Conference',
    status: 'Scheduled',
    judge: 'Hon. Michael Roberts',
    courtroom: 'Courtroom 3A',
    outcome: null,
    notes: 'Pre-trial conference to discuss settlement options and case timeline.'
  },
  {
    id: '2',
    date: '2024-11-15',
    time: '2:30 PM',
    type: 'Initial Hearing',
    status: 'Completed',
    judge: 'Hon. Michael Roberts',
    courtroom: 'Courtroom 3A',
    outcome: 'Adjourned',
    notes: 'Initial hearing completed. Case adjourned for document submission. Opposing counsel requested additional time for discovery.'
  },
  {
    id: '3',
    date: '2024-10-20',
    time: '9:00 AM',
    type: 'Case Filing',
    status: 'Completed',
    judge: 'Hon. Michael Roberts',
    courtroom: 'Clerk Office',
    outcome: 'Filed',
    notes: 'Case officially filed with the court. All initial documents submitted successfully.'
  }
];

export default function HearingHistory({ caseId }: HearingHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Postponed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeColor = (outcome: string | null) => {
    if (!outcome) return '';
    switch (outcome) {
      case 'Favorable': return 'bg-green-100 text-green-800';
      case 'Unfavorable': return 'bg-red-100 text-red-800';
      case 'Adjourned': return 'bg-yellow-100 text-yellow-800';
      case 'Filed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {mockHearings.map((hearing) => (
        <div key={hearing.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{hearing.type}</h4>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-gray-600">
                  <i className="ri-calendar-line mr-1"></i>
                  {hearing.date} at {hearing.time}
                </span>
                <span className="text-gray-600">
                  <i className="ri-map-pin-line mr-1"></i>
                  {hearing.courtroom}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(hearing.status)}`}>
                {hearing.status}
              </span>
              {hearing.outcome && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOutcomeColor(hearing.outcome)}`}>
                  {hearing.outcome}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Presiding Judge</label>
              <p className="text-gray-900">{hearing.judge}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Location</label>
              <p className="text-gray-900">{hearing.courtroom}</p>
            </div>
          </div>

          {hearing.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="text-gray-700 mt-1">{hearing.notes}</p>
            </div>
          )}

          {hearing.status === 'Scheduled' && (
            <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-200">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer">
                Edit Hearing
              </button>
              <button className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">
                Cancel Hearing
              </button>
              <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium cursor-pointer">
                Postpone Hearing
              </button>
            </div>
          )}
        </div>
      ))}

      {mockHearings.length === 0 && (
        <div className="text-center py-8">
          <i className="ri-calendar-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No hearings scheduled for this case</p>
        </div>
      )}
    </div>
  );
}
