import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const Notifications = () => {
  const { user } = useAuth();
  
  // Mock notifications data
  const [notifications] = useState([
    {
      id: 1,
      type: 'project',
      title: 'New Project Invitation',
      message: 'You have been invited to submit a proposal for "E-commerce Website Development"',
      timestamp: '10 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'message',
      title: 'New Message',
      message: 'John Smith sent you a message about your proposal',
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment Received',
      message: 'You received a payment of $500 for Project XYZ',
      timestamp: '2 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'review',
      title: 'New Review',
      message: 'Client left a 5-star review for your work',
      timestamp: '1 day ago',
      read: true
    }
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'project':
        return '📋';
      case 'message':
        return '✉️';
      case 'payment':
        return '💰';
      case 'review':
        return '⭐';
      default:
        return '🔔';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
              <button className="text-sm text-blue-600 hover:text-blue-500">
                Mark all as read
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5 text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        !notification.read ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500">{notification.timestamp}</p>
                    </div>
                    <p className={`mt-1 text-sm ${
                      !notification.read ? 'text-blue-800' : 'text-gray-600'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-gray-500">No notifications yet</p>
            </div>
          )}

          {/* Load More */}
          {notifications.length > 0 && (
            <div className="px-4 py-4 border-t border-gray-200 sm:px-6">
              <button className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                Load more notifications
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
