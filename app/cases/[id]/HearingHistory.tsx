import React, { useState, useEffect } from "react";
import { hearingsAPI } from "../../../lib/api"; // Import your API config

interface HearingHistoryProps {
  caseId: string;
  refreshTrigger?: number;
}

interface Hearing {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  judge: string;
  courtroom: string;
  outcome?: string;
  notes?: string;
  documentsRequired?: string;
}

interface HearingFormData {
  date: string;
  time: string;
  type: string;
  judge: string;
  courtroom: string;
  notes: string;
  documentsRequired: string;
}

export default function HearingHistory({
  caseId,
  refreshTrigger,
}: HearingHistoryProps) {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHearing, setEditingHearing] = useState<Hearing | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<HearingFormData>({
    date: "",
    time: "",
    type: "",
    judge: "",
    courtroom: "",
    notes: "",
    documentsRequired: "",
  });

  const hearingTypes = [
    "Initial Hearing",
    "Pre-trial Conference",
    "Motion Hearing",
    "Settlement Conference",
    "Trial",
    "Final Hearing",
    "Status Conference",
    "Mediation",
    "Arbitration",
    "Case Filing",
  ];

  useEffect(() => {
    fetchHearings();
  }, [caseId, refreshTrigger]);

  const fetchHearings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use your API config instead of direct fetch
      const data = await hearingsAPI.getByCaseId(caseId);
      setHearings(data.data?.hearings || data.hearings || []);
    } catch (error) {
      console.error("Error fetching hearings:", error);
      setError("Failed to load hearings");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      time: "",
      type: "",
      judge: "",
      courtroom: "",
      notes: "",
      documentsRequired: "",
    });
    setEditingHearing(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async () => {
    if (
      !formData.date ||
      !formData.time ||
      !formData.type ||
      !formData.judge ||
      !formData.courtroom
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      if (editingHearing) {
        // Update existing hearing
        await hearingsAPI.update(editingHearing.id, formData);
      } else {
        // Create new hearing
        await hearingsAPI.create(caseId, formData);
      }

      await fetchHearings();
      resetForm();
      alert(`Hearing ${editingHearing ? "updated" : "created"} successfully!`);
    } catch (error) {
      console.error(
        `Error ${editingHearing ? "updating" : "creating"} hearing:`,
        error
      );
      alert(
        error instanceof Error
          ? error.message
          : `Failed to ${editingHearing ? "update" : "create"} hearing`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHearing = async (hearingId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this hearing? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await hearingsAPI.delete(hearingId);
      await fetchHearings();
      alert("Hearing deleted successfully!");
    } catch (error) {
      console.error("Error deleting hearing:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete hearing"
      );
    }
  };

  const handleEditHearing = (hearing: Hearing) => {
    setEditingHearing(hearing);
    setFormData({
      date: hearing.date.split("T")[0], // Convert to YYYY-MM-DD format
      time: hearing.time,
      type: hearing.type,
      judge: hearing.judge,
      courtroom: hearing.courtroom,
      notes: hearing.notes || "",
      documentsRequired: hearing.documentsRequired || "",
    });
    setShowCreateForm(true);
  };

  const handleStatusUpdate = async (
    hearingId: string,
    status: string,
    outcome?: string
  ) => {
    try {
      const updateData: any = { status };

      if (status === "Completed" && outcome) {
        updateData.outcome = outcome;
      }

      await hearingsAPI.update(hearingId, updateData);
      await fetchHearings();
    } catch (error) {
      console.error("Error updating hearing status:", error);
      alert("Failed to update hearing status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Postponed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOutcomeColor = (outcome: string | null) => {
    if (!outcome) return "";
    switch (outcome) {
      case "Favorable":
        return "bg-green-100 text-green-800";
      case "Unfavorable":
        return "bg-red-100 text-red-800";
      case "Adjourned":
        return "bg-yellow-100 text-yellow-800";
      case "Filed":
        return "bg-blue-100 text-blue-800";
      case "Settlement Reached":
        return "bg-green-100 text-green-800";
      case "Dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span className="text-gray-600">Loading hearings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <div className="text-2xl">⚠️</div>
        </div>
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={fetchHearings}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Hearing Form */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Hearing History</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 cursor-pointer"
        >
          + Schedule New Hearing
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            {editingHearing ? "Edit Hearing" : "Schedule New Hearing"}
          </h4>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hearing Date
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hearing Type
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="">Select hearing type</option>
                {hearingTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presiding Judge
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hon. Judge Name"
                  value={formData.judge}
                  onChange={(e) =>
                    setFormData({ ...formData, judge: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Courtroom
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Courtroom 3A"
                  value={formData.courtroom}
                  onChange={(e) =>
                    setFormData({ ...formData, courtroom: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents Required
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="List any specific documents required for this hearing..."
                value={formData.documentsRequired}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    documentsRequired: e.target.value,
                  })
                }
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.documentsRequired.length}/500 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Additional notes about this hearing..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.notes.length}/1000 characters
              </p>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? editingHearing
                    ? "Updating..."
                    : "Creating..."
                  : editingHearing
                  ? "Update Hearing"
                  : "Schedule Hearing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hearings List */}
      {hearings.map((hearing) => (
        <div key={hearing.id} className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                {hearing.type}
              </h4>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-gray-600">
                  📅 {hearing.date} at {hearing.time}
                </span>
                <span className="text-gray-600">📍 {hearing.courtroom}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  hearing.status
                )}`}
              >
                {hearing.status}
              </span>
              {hearing.outcome && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getOutcomeColor(
                    hearing.outcome
                  )}`}
                >
                  {hearing.outcome}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Presiding Judge
              </label>
              <p className="text-gray-900">{hearing.judge}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Location
              </label>
              <p className="text-gray-900">{hearing.courtroom}</p>
            </div>
          </div>

          {hearing.documentsRequired && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-500">
                Documents Required
              </label>
              <p className="text-gray-700 mt-1">{hearing.documentsRequired}</p>
            </div>
          )}

          {hearing.notes && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="text-gray-700 mt-1">{hearing.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleEditHearing(hearing)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteHearing(hearing.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
              >
                Delete
              </button>
            </div>

            {hearing.status === "Scheduled" && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    handleStatusUpdate(hearing.id, "Completed", "Favorable")
                  }
                  className="text-green-600 hover:text-green-700 text-sm font-medium cursor-pointer"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => handleStatusUpdate(hearing.id, "Cancelled")}
                  className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusUpdate(hearing.id, "Postponed")}
                  className="text-yellow-600 hover:text-yellow-700 text-sm font-medium cursor-pointer"
                >
                  Postpone
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {hearings.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl text-gray-400 mb-4">📅</div>
          <p className="text-gray-600">No hearings scheduled for this case</p>
          <p className="text-sm text-gray-500 mt-2">
            Click the "Schedule New Hearing" button above to get started
          </p>
        </div>
      )}
    </div>
  );
}
