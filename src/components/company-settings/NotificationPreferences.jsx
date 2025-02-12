import React from 'react';
import { Bell } from '../../components/icons';

export const NotificationPreferences = ({ companyData, handleNotificationChange }) => {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Bell className="h-5 w-5 mr-2" />
        Notification Preferences
      </h2>
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="emailAlerts"
            checked={companyData.notificationPreferences.emailAlerts}
            onChange={handleNotificationChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-3 text-sm text-gray-700">
            Email Alerts
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="jobApplications"
            checked={companyData.notificationPreferences.jobApplications}
            onChange={handleNotificationChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-3 text-sm text-gray-700">
            Job Application Notifications
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="messages"
            checked={companyData.notificationPreferences.messages}
            onChange={handleNotificationChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-3 text-sm text-gray-700">
            Message Notifications
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="projectUpdates"
            checked={companyData.notificationPreferences.projectUpdates}
            onChange={handleNotificationChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-3 text-sm text-gray-700">
            Project Update Notifications
          </label>
        </div>
      </div>
    </div>
  );
};
