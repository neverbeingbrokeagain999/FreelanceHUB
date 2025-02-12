import React from 'react';
import { CogIcon, ShieldCheckIcon, ShareIcon, TagIcon } from '@heroicons/react/24/outline';

const CodeSnippetSettings = ({ 
  settings, 
  onUpdate, 
  availableLanguages,
  executionLimits 
}) => {
  const handleChange = (key, value) => {
    onUpdate({ ...settings, [key]: value });
  };

  const formatBytes = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return `${Math.round(mb)}MB`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CogIcon className="w-5 h-5" />
          Settings
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* General Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ShareIcon className="w-4 h-4" />
            General Settings
          </h4>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Language</label>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Visibility</label>
              <select
                value={settings.visibility}
                onChange={(e) => handleChange('visibility', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Execution Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4" />
            Execution Settings
          </h4>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Execution Timeout
              </label>
              <select
                value={settings.executionConfig?.timeout}
                onChange={(e) => handleChange('executionConfig', {
                  ...settings.executionConfig,
                  timeout: Number(e.target.value)
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={1000}>1 second</option>
                <option value={5000}>5 seconds</option>
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Memory Limit
              </label>
              <select
                value={settings.executionConfig?.memory}
                onChange={(e) => handleChange('executionConfig', {
                  ...settings.executionConfig,
                  memory: Number(e.target.value)
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={64 * 1024 * 1024}>64MB</option>
                <option value={128 * 1024 * 1024}>128MB</option>
                <option value={256 * 1024 * 1024}>256MB</option>
                <option value={512 * 1024 * 1024}>512MB</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <TagIcon className="w-4 h-4" />
            Tags
          </h4>

          <div>
            <input
              type="text"
              placeholder="Add tags (comma separated)"
              value={settings.tags?.join(', ') || ''}
              onChange={(e) => {
                const tags = e.target.value
                  .split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0);
                handleChange('tags', tags);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum 10 tags, each tag up to 30 characters
            </p>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Resource Limits</h4>
          <div className="text-sm text-gray-600">
            <div>Maximum timeout: {executionLimits.maxTimeout / 1000} seconds</div>
            <div>Maximum memory: {formatBytes(executionLimits.maxMemory)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeSnippetSettings;
