import { useState } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message) => {
    setNotifications(prev => [{
      type,
      message,
      time: new Date()
    }, ...prev]);
  };

  const removeNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addError = (message) => addNotification('error', message);
  const addSuccess = (message) => addNotification('success', message);
  const addInfo = (message) => addNotification('info', message);

  return {
    notifications,
    addError,
    addSuccess,
    addInfo,
    removeNotification,
    clearNotifications
  };
};
