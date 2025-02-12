import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useCodeSnippet from '../hooks/useCodeSnippet';
import CodeSnippetPlayground from '../components/CodeSnippetPlayground';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FaShare,
  FaHistory,
  FaCog,
  FaTrash,
  FaUsers,
  FaSave
} from 'react-icons/fa';

const CodeSnippet = () => {
  const { snippetId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saveVersionModalOpen, setSaveVersionModalOpen] = useState(false);

  const {
    snippet,
    loading,
    error,
    activeUsers,
    remoteCursors,
    remoteSelections,
    executionResult,
    executing,
    updateContent,
    updateCursor,
    updateSelection,
    executeCode,
    saveVersion,
    restoreVersion,
    isConnected
  } = useCodeSnippet(snippetId);

  useEffect(() => {
    if (error) {
      // Handle unauthorized access
      if (error === 'Access denied') {
        navigate('/code-snippets');
      }
    }
  }, [error, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!snippet) return null;

  const handleShare = async (email, role) => {
    try {
      await fetch(`/api/code-snippets/${snippetId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ email, role })
      });
      setShareModalOpen(false);
    } catch (error) {
      console.error('Failed to share snippet:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/code-snippets/${snippetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      navigate('/code-snippets');
    } catch (error) {
      console.error('Failed to delete snippet:', error);
    }
  };

  const handleSaveVersion = async (commitMessage) => {
    try {
      await saveVersion(commitMessage);
      setSaveVersionModalOpen(false);
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl text-white font-semibold">{snippet.title}</h1>
            <p className="text-sm text-gray-400">
              Created by {snippet.creator.name}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              <div className="w-2 h-2 rounded-full mr-2 bg-current" />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Active Users */}
            <div className="flex items-center">
              <FaUsers className="text-gray-400 mr-2" />
              <div className="flex -space-x-2">
                {activeUsers.map(user => (
                  <div
                    key={user._id}
                    className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"
                    title={user.name}
                  >
                    {user.name[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShareModalOpen(true)}
                className="btn btn-secondary"
              >
                <FaShare className="mr-1" />
                Share
              </button>

              <button
                onClick={() => setHistoryModalOpen(true)}
                className="btn btn-secondary"
              >
                <FaHistory className="mr-1" />
                History
              </button>

              <button
                onClick={() => setSaveVersionModalOpen(true)}
                className="btn btn-primary"
              >
                <FaSave className="mr-1" />
                Save Version
              </button>

              <button
                onClick={() => setSettingsModalOpen(true)}
                className="btn btn-secondary"
              >
                <FaCog className="mr-1" />
                Settings
              </button>

              {snippet.creator._id === user._id && (
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="btn btn-danger"
                >
                  <FaTrash className="mr-1" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1">
        <CodeSnippetPlayground
          content={snippet.content}
          language={snippet.language}
          readOnly={!snippet.canEdit}
          onContentChange={updateContent}
          onCursorChange={updateCursor}
          onSelectionChange={updateSelection}
          onExecute={executeCode}
          remoteCursors={remoteCursors}
          remoteSelections={remoteSelections}
          executionResult={executionResult}
          executing={executing}
        />
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <ShareModal
          onClose={() => setShareModalOpen(false)}
          onShare={handleShare}
          collaborators={snippet.collaborators}
        />
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <HistoryModal
          onClose={() => setHistoryModalOpen(false)}
          versions={snippet.versions}
          onRestore={restoreVersion}
        />
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <SettingsModal
          onClose={() => setSettingsModalOpen(false)}
          snippet={snippet}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <DeleteModal
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDelete}
        />
      )}

      {/* Save Version Modal */}
      {saveVersionModalOpen && (
        <SaveVersionModal
          onClose={() => setSaveVersionModalOpen(false)}
          onSave={handleSaveVersion}
        />
      )}
    </div>
  );
};

// Modal Components
const ShareModal = ({ onClose, onShare, collaborators }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="text-lg font-semibold mb-4">Share Snippet</h2>
        
        <div className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter email"
              className="input"
            />
          </div>
          
          <div>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="select"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={() => onShare(email, role)}
              className="btn btn-primary"
            >
              Share
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Current Collaborators</h3>
          <div className="space-y-2">
            {collaborators.map(collab => (
              <div
                key={collab._id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="font-medium">{collab.user.name}</p>
                  <p className="text-sm text-gray-400">{collab.user.email}</p>
                </div>
                <span className="text-sm capitalize">{collab.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryModal = ({ onClose, versions, onRestore }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="text-lg font-semibold mb-4">Version History</h2>
        
        <div className="space-y-4">
          {versions.map(version => (
            <div
              key={version._id}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="font-medium">{version.commitMessage}</p>
                <p className="text-sm text-gray-400">
                  {new Date(version.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => onRestore(version._id)}
                className="btn btn-secondary"
              >
                Restore
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ onClose, snippet }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="text-lg font-semibold mb-4">Snippet Settings</h2>
        
        {/* Add settings form */}
        
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ onClose, onConfirm }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="text-lg font-semibold mb-4">Delete Snippet</h2>
        
        <p className="text-gray-400 mb-4">
          Are you sure you want to delete this snippet? This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const SaveVersionModal = ({ onClose, onSave }) => {
  const [commitMessage, setCommitMessage] = useState('');

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 className="text-lg font-semibold mb-4">Save Version</h2>
        
        <div>
          <textarea
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            placeholder="Enter commit message"
            className="textarea"
            rows={3}
          />
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => onSave(commitMessage)}
            className="btn btn-primary"
            disabled={!commitMessage.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeSnippet;
