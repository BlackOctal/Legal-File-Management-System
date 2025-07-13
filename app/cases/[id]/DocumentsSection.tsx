
'use client';
import { useState } from 'react';

interface DocumentsSectionProps {
  caseId: string;
}

const mockDocuments = [
  {
    id: '1',
    name: 'Initial Complaint.pdf',
    type: 'Legal Filing',
    uploadDate: '2024-01-15',
    uploadedBy: 'Sarah Johnson',
    size: '2.4 MB',
    status: 'Approved',
    hearingDate: '2024-11-15'
  },
  {
    id: '2',
    name: 'Financial Statements.xlsx',
    type: 'Evidence',
    uploadDate: '2024-02-10',
    uploadedBy: 'Mike Davis',
    size: '1.8 MB',
    status: 'Pending Review',
    hearingDate: '2024-12-28'
  },
  {
    id: '3',
    name: 'Settlement Agreement Draft.docx',
    type: 'Contract',
    uploadDate: '2024-11-20',
    uploadedBy: 'Sarah Johnson',
    size: '876 KB',
    status: 'In Review',
    hearingDate: '2024-12-28'
  },
  {
    id: '4',
    name: 'Witness Affidavit - John Smith.pdf',
    type: 'Testimony',
    uploadDate: '2024-12-01',
    uploadedBy: 'Legal Assistant',
    size: '1.2 MB',
    status: 'Required',
    hearingDate: '2024-12-30'
  }
];

export default function DocumentsSection({ caseId }: DocumentsSectionProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-800';
      case 'In Review': return 'bg-blue-100 text-blue-800';
      case 'Required': return 'bg-red-100 text-red-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Legal Filing': return 'ri-file-text-line';
      case 'Evidence': return 'ri-camera-line';
      case 'Contract': return 'ri-file-paper-line';
      case 'Testimony': return 'ri-mic-line';
      default: return 'ri-file-line';
    }
  };

  const filteredDocuments = mockDocuments.filter(doc => {
    if (filter === 'all') return true;
    return doc.status.toLowerCase().replace(' ', '_') === filter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Case Documents</h3>
        <div className="flex items-center space-x-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Documents</option>
            <option value="approved">Approved</option>
            <option value="pending_review">Pending Review</option>
            <option value="in_review">In Review</option>
            <option value="required">Required</option>
          </select>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition duration-200 whitespace-nowrap cursor-pointer"
          >
            + Upload Document
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredDocuments.map((document) => (
          <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                  <i className={`${getTypeIcon(document.type)} text-lg`}></i>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{document.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>{document.type}</span>
                    <span>{document.size}</span>
                    <span>Uploaded by {document.uploadedBy}</span>
                    <span>{document.uploadDate}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
                <div className="flex items-center space-x-2">
                  <button className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded cursor-pointer">
                    <i className="ri-download-line"></i>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
                    <i className="ri-eye-line"></i>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded cursor-pointer">
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            </div>
            
            {document.hearingDate && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  <i className="ri-calendar-line mr-1"></i>
                  Required for hearing on {document.hearingDate}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-8">
          <i className="ri-folder-open-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No documents found</p>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Upload Document</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8">
                    <option value="">Select document type</option>
                    <option value="legal_filing">Legal Filing</option>
                    <option value="evidence">Evidence</option>
                    <option value="contract">Contract</option>
                    <option value="testimony">Testimony</option>
                    <option value="correspondence">Correspondence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <i className="ri-upload-cloud-line text-2xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-600">Drop files here or click to browse</p>
                    <input type="file" className="hidden" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Related Hearing (Optional)</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8">
                    <option value="">Select hearing</option>
                    <option value="2024-12-28">Pre-trial Conference - Dec 28, 2024</option>
                    <option value="2024-12-30">Final Hearing - Dec 30, 2024</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200 whitespace-nowrap cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 whitespace-nowrap cursor-pointer"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
