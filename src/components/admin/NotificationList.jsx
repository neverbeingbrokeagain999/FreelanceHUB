import React from 'react';
import { format } from 'date-fns';

const NotificationList = ({ notifications, onDismiss }) => (
  <div className="fixed top-4 right-4 w-96 space-y-2 z-50">
    {notifications.map((notification, index) => (
      <div
        key={index}
        className={`p-4 rounded-lg shadow-lg ${
          notification.type === 'error'
            ? 'bg-red-100 border-l-4 border-red-500'
            : notification.type === 'success'
            ? 'bg-green-100 border-l-4 border-green-500'
            : 'bg-blue-100 border-l-4 border-blue-500'
        }`}
      >
        <div className="flex justify-between items-center">
          <p className={`text-sm ${notification.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
            {notification.message}
          </p>
          <button onClick={() => onDismiss(index)} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{format(new Date(notification.time), 'HH:mm')}</p>
      </div>
    ))}
  </div>
);

export default NotificationList;
