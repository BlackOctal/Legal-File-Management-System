'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../lib/api';

interface InactiveCasesProps {
  data?: any;
}

export default function InactiveCases({ data }: InactiveCasesProps) {
  const [inactiveCases, setInactiveCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInactiveCases = async () => {
      try {
        if (data && data.inactiveCases) {
          setInactiveCases(data.inactiveCases);
        } else {
          // Fetch inactive cases
          const response = await dashboardAPI.getInactiveCases();
          if (response.success) {
            setInactiveCases(response.data.inactiveCases || []);
          }
        }
      } catch (error) {
        console.error('Error fetching inactive cases:', error);
        setInactiveCases([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInactiveCases();
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inactive Cases</h2>
          <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Inactive Cases</h2>
        {inactiveCases.length > 0 && (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Cases with no upcoming hearings and inactive for 10+ months
      </p>

      <div className="space-y-3">
        {inactiveCases.length > 0 ? (
          inactiveCases.slice(0, 3).map((case_item: any) => (
            <Link key={case_item._id} href={`/cases/${case_item._id}`} className="cursor-pointer">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{case_item.referenceNumber}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    {case_item.monthsInactive || 'N/A'} months
                  </span>
                </div>
                <p className="text-sm text-gray-600">{case_item.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 capitalize">{case_item.category}</span>
                  <span className="text-xs text-gray-500">
                    Last: {case_item.lastHearingDate ? 
                      new Date(case_item.lastHearingDate).toLocaleDateString() : 
                      'No hearing date'
                    }
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-4">
            <div className="text-green-500 text-2xl mb-2">✅</div>
            <p className="text-gray-500 text-sm">No inactive cases found</p>
            <p className="text-xs text-gray-400 mt-1">All cases are active and up to date</p>
          </div>
        )}
      </div>

      {inactiveCases.length > 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link href="/cases?filter=inactive" className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer">
            View All Inactive Cases →
          </Link>
        </div>
      )}
    </div>
  );
}