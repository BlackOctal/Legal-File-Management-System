
'use client';
import Link from 'next/link';

const inactiveCases = [
  {
    id: '1',
    caseNumber: 'LC-2023-045',
    clientName: 'ABC Corporation',
    lastHearing: '2023-02-15',
    monthsInactive: 11,
    category: 'Financial'
  },
  {
    id: '2',
    caseNumber: 'LC-2023-023',
    clientName: 'David Thompson',
    lastHearing: '2023-01-20',
    monthsInactive: 12,
    category: 'Property Deeds'
  },
  {
    id: '3',
    caseNumber: 'LC-2023-067',
    clientName: 'Smith & Partners',
    lastHearing: '2023-03-10',
    monthsInactive: 10,
    category: 'Civil'
  }
];

export default function InactiveCases() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Inactive Cases</h2>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Cases with no upcoming hearings and inactive for 10+ months
      </p>

      <div className="space-y-3">
        {inactiveCases.map((case_item) => (
          <Link key={case_item.id} href={`/cases/${case_item.id}`} className="cursor-pointer">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{case_item.caseNumber}</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  {case_item.monthsInactive} months
                </span>
              </div>
              <p className="text-sm text-gray-600">{case_item.clientName}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{case_item.category}</span>
                <span className="text-xs text-gray-500">Last: {case_item.lastHearing}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link href="/cases?filter=inactive" className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">
          View All Inactive Cases →
        </Link>
      </div>
    </div>
  );
}
