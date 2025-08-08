'use client';
import { useState, useEffect } from 'react';
import { documentsAPI } from '../../../lib/api';

interface DocumentsSectionProps {
  caseId: string;
  refreshTrigger?: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  uploadedBy: string;
  size: string;
  status: string;
  hearingDate?: string;
  description?: string;
  tags?: string[];
  downloadCount?: number;
  isConfidential?: boolean;
  storageType?: 'local' | 's3';
}

export default function DocumentsSection({ caseId, refreshTrigger = 0 }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch documents when component mounts or refresh is triggered
  useEffect(() => {
    fetchDocuments();
  }, [caseId, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching documents for case:', caseId);
      const data = await documentsAPI.getByCaseId(caseId);
      console.log('Documents fetched:', data);
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      console.log('Starting upload for case:', caseId);
      
      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (err) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || 'Upload failed'));
            } catch (err) {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/documents/case/${caseId}/upload`);
        const token = localStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });

      const result = await uploadPromise;
      console.log('Upload successful:', result);
      
      // Refresh documents list
      await fetchDocuments();
      setShowUploadModal(false);
      
      // Reset form
      form.reset();
      
      // Show success message
      alert('Document uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading document:', error);
      alert(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (documentId: string, documentName: string) => {
    try {
      setLoading(true);
      const blob = await documentsAPI.download(documentId);

      // Create blob and download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Refresh documents to update download count
      setTimeout(() => fetchDocuments(), 1000);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await documentsAPI.delete(documentId);
      
      // Refresh documents list
      await fetchDocuments();
      alert('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

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
      case 'Financial Statement': return 'ri-money-dollar-circle-line';
      case 'Court Order': return 'ri-hammer-line';
      case 'Affidavit': return 'ri-file-shield-line';
      default: return 'ri-file-line';
    }
  };

  const getStorageIcon = (storageType?: string) => {
    switch (storageType) {
      case 's3': return 'ri-cloud-line';
      case 'local': return 'ri-hard-drive-line';
      default: return 'ri-file-line';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.status.toLowerCase().replace(' ', '_') === filter;
  });

  if (loading && !uploading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
        <span className="text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <i className="ri-error-warning-line text-2xl"></i>
        </div>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchDocuments}
          className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

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
                    {document.storageType && (
                      <span className="flex items-center space-x-1">
                        <i className={`${getStorageIcon(document.storageType)} text-xs`}></i>
                        <span className="capitalize">{document.storageType}</span>
                      </span>
                    )}
                    {document.downloadCount !== undefined && document.downloadCount > 0 && (
                      <span className="text-blue-600">
                        <i className="ri-download-line mr-1"></i>
                        {document.downloadCount}
                      </span>
                    )}
                  </div>
                  {document.description && (
                    <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                  )}
                  {document.tags && document.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {document.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
                  {document.status}
                </span>
                {document.isConfidential && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                    <i className="ri-lock-line mr-1"></i>
                    Confidential
                  </span>
                )}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handleDownload(document.id, document.name)}
                    className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                    title="Download document"
                    disabled={loading}
                  >
                    <i className="ri-download-line"></i>
                  </button>
                  <button 
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 rounded cursor-pointer"
                    title="Preview document"
                    disabled={loading}
                  >
                    <i className="ri-eye-line"></i>
                  </button>
                  <button 
                    onClick={() => handleDelete(document.id)}
                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded cursor-pointer"
                    title="Delete document"
                    disabled={loading}
                  >
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

      {filteredDocuments.length === 0 && !loading && (
        <div className="text-center py-8">
          <i className="ri-folder-open-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No documents found</p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear filter to see all documents
            </button>
          )}
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
                  disabled={uploading}
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type *</label>
                  <select 
                    name="type"
                    required
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 disabled:opacity-50"
                  >
                    <option value="">Select document type</option>
                    <option value="Legal Filing">Legal Filing</option>
                    <option value="Evidence">Evidence</option>
                    <option value="Contract">Contract</option>
                    <option value="Testimony">Testimony</option>
                    <option value="Correspondence">Correspondence</option>
                    <option value="Financial Statement">Financial Statement</option>
                    <option value="Court Order">Court Order</option>
                    <option value="Affidavit">Affidavit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File *</label>
                  <input 
                    type="file" 
                    name="file"
                    required
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT (Max: 10MB)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea 
                    name="description"
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    rows={3}
                    placeholder="Brief description of the document..."
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    disabled={uploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="e.g. contract, evidence, urgent (comma separated)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Access Level</label>
                    <select
                      name="accessLevel"
                      disabled={uploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 disabled:opacity-50"
                    >
                      <option value="internal">Internal</option>
                      <option value="public">Public</option>
                      <option value="restricted">Restricted</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isConfidential"
                        disabled={uploading}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700">Confidential</span>
                    </label>
                  </div>
                </div>

                {uploading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 whitespace-nowrap cursor-pointer disabled:opacity-50 flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-upload-line"></i>
                        <span>Upload</span>
                      </>
                    )}
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