/**
 * Format a date string or timestamp into a human-readable format
 * @param {string | number | Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  try {
    const dateObj = new Date(date);
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Get relative time string (e.g. "2 hours ago", "3 days ago")
 * @param {string | number | Date} date - Date to format
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return '';

  try {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const dateObj = new Date(date);
    const now = new Date();
    const diffInSeconds = (dateObj.getTime() - now.getTime()) / 1000;
    const diffInDays = Math.floor(diffInSeconds / 86400);
    
    if (Math.abs(diffInDays) < 1) {
      const diffInHours = Math.floor(diffInSeconds / 3600);
      if (Math.abs(diffInHours) < 1) {
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        return rtf.format(diffInMinutes, 'minute');
      }
      return rtf.format(diffInHours, 'hour');
    }
    
    if (Math.abs(diffInDays) < 30) {
      return rtf.format(diffInDays, 'day');
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) {
      return rtf.format(diffInMonths, 'month');
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return rtf.format(diffInYears, 'year');
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
};

/**
 * Check if a date is in the past
 * @param {string | number | Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  try {
    return new Date(date) < new Date();
  } catch {
    return false;
  }
};

/**
 * Check if a date is in the future
 * @param {string | number | Date} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  try {
    return new Date(date) > new Date();
  } catch {
    return false;
  }
};

/**
 * Calculate duration between two dates in specified unit
 * @param {string | number | Date} startDate - Start date
 * @param {string | number | Date} endDate - End date
 * @param {string} unit - Unit of duration ('days', 'hours', 'minutes', 'seconds')
 * @returns {number} Duration in specified unit
 */
export const getDuration = (startDate, endDate, unit = 'days') => {
  if (!startDate || !endDate) return 0;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMs = Math.abs(end.getTime() - start.getTime());
    
    switch (unit.toLowerCase()) {
      case 'days':
        return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      case 'hours':
        return Math.floor(diffInMs / (1000 * 60 * 60));
      case 'minutes':
        return Math.floor(diffInMs / (1000 * 60));
      case 'seconds':
        return Math.floor(diffInMs / 1000);
      default:
        return diffInMs;
    }
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 0;
  }
};
