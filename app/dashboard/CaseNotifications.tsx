"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboardAPI } from "../../lib/api";

interface CaseNotificationsProps {
  data?: any;
}

export default function CaseNotifications({ data }: CaseNotificationsProps) {
  const [upcomingHearings, setUpcomingHearings] = useState<any[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotificationData = async () => {
      try {
        if (data && data.upcomingHearings) {
          setUpcomingHearings(data.upcomingHearings);
        } else {
          // Fetch upcoming hearings
          const hearingsResponse = await dashboardAPI.getUpcomingHearings(14);
          if (hearingsResponse.success) {
            setUpcomingHearings(hearingsResponse.data.hearings || []);
          }
        }

        // For required documents, we'll simulate some data since the endpoint might not be ready
        // In a real scenario, this would come from the backend
        setRequiredDocuments([
          {
            caseNumber: "LC-2024-001",
            document: "Financial Statements",
            dueDate: "2024-12-27",
            status: "pending",
          },
          {
            caseNumber: "LC-2024-002",
            document: "Witness Affidavits",
            dueDate: "2024-12-29",
            status: "pending",
          },
        ]);
      } catch (error) {
        console.error("Error fetching notification data:", error);
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

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };

  const isUrgent = (dateString: string) => {
    const now = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Hearings
        </h2>
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
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Upcoming Hearings
      </h2>

      <div className="space-y-3 mb-6">
        {upcomingHearings.length > 0 ? (
          upcomingHearings.slice(0, 3).map((hearing: any) => {
            const timeLeft = getTimeLeft(hearing.date);
            const urgent = isUrgent(hearing.date);

            return (
              <Link
                key={hearing._id}
                href={`/cases/${hearing.caseId._id || hearing.caseId}`}
                className="cursor-pointer"
              >
                <div
                  className={`p-4 rounded-lg border-l-4 ${
                    urgent
                      ? "border-red-500 bg-red-50"
                      : "border-blue-500 bg-blue-50"
                  } hover:bg-opacity-80 transition duration-200`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {hearing.caseId?.referenceNumber || "Unknown Case"}
                    </span>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        urgent
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {timeLeft}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {hearing.caseId?.clientNames?.join(", ") ||
                      "No client info"}
                  </p>
                  <p className="text-sm text-gray-500">{hearing.type}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(hearing.date).toLocaleDateString()} at{" "}
                    {hearing.time}
                  </p>
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

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-md font-medium text-gray-900 mb-3">
          Required Documents
        </h3>
        <div className="space-y-2">
          {requiredDocuments.length > 0 ? (
            requiredDocuments.map((doc: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {doc.document}
                  </p>
                  <p className="text-xs text-gray-600">{doc.caseNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Due: {doc.dueDate}</p>
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-500 text-sm">No pending documents</p>
            </div>
          )}
        </div>
      </div>

      {upcomingHearings.length > 3 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href="/hearings"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
          >
            View All Hearings →
          </Link>
        </div>
      )}
    </div>
  );
}
