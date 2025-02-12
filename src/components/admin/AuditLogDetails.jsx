import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';

const AuditLogDetails = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const formatValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) {
      return <p className="text-gray-500 italic">No changes recorded</p>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(changes).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-sm font-medium text-gray-500">{key}:</span>
            <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-x-auto">
              {formatValue(value)}
            </pre>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                Audit Log Details
              </Dialog.Title>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Action</h3>
                <p className="mt-1 text-sm text-gray-900">{log.action}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Target Type</h3>
                <p className="mt-1 text-sm text-gray-900">{log.targetType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(log.metadata.timestamp), 'PPpp')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className={`mt-1 text-sm ${
                  log.status === 'SUCCESS' ? 'text-green-600' : 
                  log.status === 'FAILURE' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {log.status}
                </p>
              </div>
            </div>

            {/* Changes */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Changes</h3>
              {renderChanges(log.changes)}
            </div>

            {/* Metadata */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Metadata</h3>
              <div className="bg-gray-50 rounded p-4 space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">IP Address:</span>
                  <span className="ml-2 text-sm text-gray-900">{log.metadata.ipAddress}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">User Agent:</span>
                  <span className="ml-2 text-sm text-gray-900">{log.metadata.userAgent}</span>
                </div>
                {log.metadata.location && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location:</span>
                    <span className="ml-2 text-sm text-gray-900">{log.metadata.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Review Status */}
            {log.isReviewed && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Review Details</h3>
                <div className="bg-gray-50 rounded p-4 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Reviewed By:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {log.reviewedBy?.name || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Review Notes:</span>
                    <p className="mt-1 text-sm text-gray-900">{log.reviewNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

AuditLogDetails.propTypes = {
  log: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    targetType: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    changes: PropTypes.object,
    metadata: PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      ipAddress: PropTypes.string.isRequired,
      userAgent: PropTypes.string.isRequired,
      location: PropTypes.string
    }).isRequired,
    isReviewed: PropTypes.bool,
    reviewedBy: PropTypes.shape({
      name: PropTypes.string
    }),
    reviewNotes: PropTypes.string
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default AuditLogDetails;
