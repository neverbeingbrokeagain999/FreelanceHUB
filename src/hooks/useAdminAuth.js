import { useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { handleError } from '../utils/errorUtils';

/**
 * Hook for admin authentication and actions
 * @returns {Object} Admin authentication methods
 */
export const useAdminAuth = () => {
  const { user } = useAuthContext();

  const moderateJob = useCallback(async (jobId, action, reason) => {
    try {
      // Here you would normally make an API call
      // For now, simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate permissions
      if (!user?.roles?.includes('admin')) {
        throw new Error('Unauthorized: Admin access required');
      }

      if (!jobId || !action) {
        throw new Error('Invalid job ID or action');
      }

      // For testing purposes, always return success
      return {
        success: true,
        message: `Job ${jobId} has been ${action}ed`
      };
    } catch (err) {
      const message = handleError(err, {
        context: 'moderateJob',
        user: user?.id,
        jobId,
        action
      });
      throw new Error(message);
    }
  }, [user]);

  const verifyUser = useCallback(async (profileId, action) => {
    try {
      if (!user?.roles?.includes('admin')) {
        throw new Error('Unauthorized: Admin access required');
      }

      if (!profileId || !action) {
        throw new Error('Invalid profile ID or action');
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/verify-profiles/${profileId}/${action}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to verify user');
      }

      const data = await response.json();
      return data.success;
    } catch (err) {
      const message = handleError(err, {
        context: 'verifyUser',
        user: user?.id,
        profileId,
        action
      });
      console.error(message);
      return false;
    }
  }, [user]);

  return {
    moderateJob,
    verifyUser
  };
};

export default useAdminAuth;
