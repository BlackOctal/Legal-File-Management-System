'use client';
import { useState } from 'react';
import { hearingsAPI } from '../../../lib/api';

interface AddHearingModalProps {
  caseId: string;
  onClose: () => void;
  onHearingAdded?: () => void;
}

export default function AddHearingModal({ caseId, onClose, onHearingAdded }: AddHearingModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: '',
    judge: '',
    courtroom: '',
    notes: '',
    documentsRequired: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      console.log('Creating hearing for case:', caseId);
      console.log('Hearing data:', formData);

      // Call the API
      const result = await hearingsAPI.create(caseId, formData);
      console.log('Hearing created successfully:', result);

      // Success - close modal and refresh parent
      alert('Hearing scheduled successfully!');
      onClose();
      if (onHearingAdded) {
        onHearingAdded();
      }
      
      // Reset form
      setFormData({
        date: '',
        time: '',
        type: '',
        judge: '',
        courtroom: '',
        notes: '',
        documentsRequired: ''
      });

    } catch (error) {
      console.error('Error creating hearing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create hearing';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const hearingTypes = [
    'Initial Hearing',
    'Pre-trial Conference',
    'Motion Hearing',
    'Settlement Conference',
    'Trial',
    'Final Hearing',
    'Status Conference',
    'Mediation',
    'Arbitration',
    'Case Filing'
  ];

  // Get today's date in YYYY-MM-DD format for min date validation
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Schedule New Hearing</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hearing Date *</label>
                <input
                  type="date"
                  required
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.date}
                  onChange={(e) => {
                    console.log('Date changed:', e.target.value);
                    setFormData({...formData, date: e.target.value});
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <input
                  type="time"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.time}
                  onChange={(e) => {
                    console.log('Time changed:', e.target.value);
                    setFormData({...formData, time: e.target.value});
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hearing Type *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                value={formData.type}
                onChange={(e) => {
                  console.log('Type changed:', e.target.value);
                  setFormData({...formData, type: e.target.value});
                }}
              >
                <option value="">Select hearing type</option>
                {hearingTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Presiding Judge *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Hon. Judge Name"
                  value={formData.judge}
                  onChange={(e) => setFormData({...formData, judge: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Courtroom *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Courtroom 3A"
                  value={formData.courtroom}
                  onChange={(e) => setFormData({...formData, courtroom: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Documents Required</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="List any specific documents required for this hearing..."
                value={formData.documentsRequired}
                onChange={(e) => setFormData({...formData, documentsRequired: e.target.value})}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.documentsRequired.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Additional notes about this hearing..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/500 characters</p>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Scheduling...' : 'Schedule Hearing'}
              </button>
            </div>
          </form>

          {/* Debug Info */}
          <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
            <strong>Debug:</strong> Case ID: {caseId}, Form Data: {JSON.stringify(formData)}
          </div>
        </div>
      </div>
    </div>
  );
}