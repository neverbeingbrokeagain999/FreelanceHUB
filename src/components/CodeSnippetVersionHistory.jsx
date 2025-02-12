import React, { useState } from 'react';
import { format } from 'date-fns';
import { Transition } from '@headlessui/react';
import { ClockIcon, ArrowPathIcon, CodeIcon } from '@heroicons/react/24/outline';

const CodeSnippetVersionHistory = ({ versions, onRestore, currentVersion }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);

  const handleRestore = (version) => {
    if (window.confirm('Are you sure you want to restore this version?')) {
      onRestore(version._id);
      setSelectedVersion(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            Version History
          </h3>
          <span className="text-sm text-gray-500">
            Current Version: {currentVersion}
          </span>
        </div>
      </div>

      <div className="divide-y max-h-96 overflow-auto">
        {versions.map((version) => (
          <div
            key={version._id}
            className={`p-4 hover:bg-gray-50 cursor-pointer ${
              selectedVersion?._id === version._id ? 'bg-blue-50' : ''
            }`}
            onClick={() => setSelectedVersion(version)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{version.commitMessage}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(version.timestamp), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(version);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                  title="Restore this version"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVersion(version);
                  }}
                  className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-50"
                  title="View code"
                >
                  <CodeIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {versions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No versions saved yet
          </div>
        )}
      </div>

      <Transition
        show={!!selectedVersion}
        enter="transition-opacity duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-3xl mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h4 className="font-semibold">{selectedVersion?.commitMessage}</h4>
              <button
                onClick={() => setSelectedVersion(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 font-mono text-sm">
                {selectedVersion?.content}
              </pre>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setSelectedVersion(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              <button
                onClick={() => handleRestore(selectedVersion)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Restore This Version
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default CodeSnippetVersionHistory;
