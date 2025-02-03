import { useState, useCallback } from 'react';
import { useNotifications } from './useNotifications';
import { adminService } from '../services/adminService';

export const useAdminData = () => {
  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      totalJobs: 0,
      totalEarnings: 0,
      disputeRate: 0
    },
    freelancers: [],
    disputes: []
  });
  const [loading, setLoading] = useState(true);
  const { addError, addSuccess } = useNotifications();

  const fetchDashboardData = useCallback(async (timeRange) => {
    try {
      // Try to get from cache first
      const cachedData = await cacheService.get(`dashboard-${timeRange}`);
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      const result = await adminService.getDashboardData(timeRange);
      
      // Cache the result
      await cacheService.set(`dashboard-${timeRange}`, result, 300); // 5 minutes
      setData(result);
    } catch (error) {
      addError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [addError]);

  const updateFreelancer = useCallback(async (id, action) => {
    try {
      if (action === 'verify') {
        await adminService.verifyFreelancer(id);
        addSuccess('Freelancer verified successfully');
      } else if (action === 'suspend') {
        await adminService.suspendFreelancer(id);
        addSuccess('Freelancer suspended successfully');
      }
      
      // Invalidate cache
      await cacheService.del('dashboard-*');
      await fetchDashboardData();
    } catch (error) {
      addError(`Failed to ${action} freelancer`);
    }
  }, [fetchDashboardData, addSuccess, addError]);

  const resolveDispute = useCallback(async (disputeId) => {
    try {
      await adminService.resolveDispute(disputeId, 'resolved');
      addSuccess('Dispute resolved successfully');
      
      // Invalidate cache
      await cacheService.del('dashboard-*');
      await fetchDashboardData();
    } catch (error) {
      addError('Failed to resolve dispute');
    }
  }, [fetchDashboardData, addSuccess, addError]);

  return {
    data,
    loading,
    fetchDashboardData,
    updateFreelancer,
    resolveDispute
  };
};
