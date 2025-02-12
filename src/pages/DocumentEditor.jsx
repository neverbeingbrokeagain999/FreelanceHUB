import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Share2, Save, History, Settings2, ChevronLeft,
  Download, Users, Globe, Lock
} from 'lucide-react';
import CollaborativeEditor from '../components/document/CollaborativeEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import { useDocument } from '../hooks/useDocument';

const DocumentEditor = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    document,
    activeUsers,
    currentVersion,
    loading,
    error,
    updateSettings,
    createSnapshot,
    updateCollaborators
  } = useDocument(documentId);

  if (loading) return <LoadingSpinner />;
  if (error) {
    toast.error(error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate('/documents')}
          className="text-blue-500 hover:underline"
        >
          Back to Documents
        </button>
      </div>
    );
  }

  const handleShare = async (email, role) => {
    try {
      await updateCollaborators([
        ...document.collaborators,
        { email, role }
      ]);
      toast.success('Collaborator added successfully');
      setShowSharingModal(false);
    } catch (err) {
      toast.error('Failed to add collaborator');
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${document.title}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export document');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/documents')}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">
                {document.title}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Active Users */}
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {activeUsers.slice(0, 3).map(user => (
                    <div
                      key={user._id}
                      className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm border-2 border-white"
                      title={user.name}
                    >
                      {user.name[0]}
                    </div>
                  ))}
                </div>
                {activeUsers.length > 3 && (
                  <span className="ml-2 text-sm text-gray-500">
                    +{activeUsers.length - 3} more
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSharingModal(true)}
                  className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share
                </button>
                <button
                  onClick={() => setShowVersionHistory(true)}
                  className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <History className="w-5 h-5 mr-2" />
                  History
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <Settings2 className="w-5 h-5 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CollaborativeEditor documentId={documentId} />
      </main>

      {/* Sharing Modal */}
      {showSharingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Share Document</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Access
                </label>
                <div className="mt-1 p-2 border rounded-lg">
                  {document.collaborators.map(collaborator => (
                    <div
                      key={collaborator.user}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                          {collaborator.name?.[0]}
                        </div>
                        <span className="ml-2">{collaborator.email}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {collaborator.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Collaborator */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleShare(formData.get('email'), formData.get('role'));
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="mt-1 block w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      name="role"
                      className="mt-1 block w-full px-3 py-2 border rounded-lg"
                      defaultValue="viewer"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="commenter">Commenter</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowSharingModal(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Share
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentEditor;
