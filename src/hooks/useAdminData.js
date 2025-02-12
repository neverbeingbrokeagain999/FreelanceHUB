import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { handleError } from '../utils/errorUtils';

/**
 * Hook for managing admin data and jobs
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Admin data and functions
 */
export const useAdminData = (initialFilters = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    users: { total: 0 },
    jobs: { active: 0, total: 0 },
    verifications: { pending: 0 },
    disputes: { open: 0 },
    contracts: { total: 0 },
    revenue: { total: 0 },
    jobsList: [],
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0
  });
  const [filters, setFilters] = useState(initialFilters);
  const { user } = useAuthContext();

  const fetchData = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for dashboard and job list
      const mockData = {
        users: { total: 1250 },
        jobs: { active: 45, total: 120 },
        verifications: { pending: 15 },
        disputes: { open: 8 },
        contracts: { total: 95 },
        revenue: { total: 125000 },
        jobsList: [
          {
            id: 1,
            title: 'Full Stack Developer Needed',
            description: 'Looking for an experienced full stack developer...',
            budget: '$3000-5000',
            status: 'pending',
            createdAt: '2024-02-09',
            client: {
              name: 'Tech Corp',
              rating: 4.5
            }
          },
          {
            id: 2,
            title: 'UI/UX Designer for Mobile App',
            description: 'Need a talented designer for our mobile app...',
            budget: '$2000-4000',
            status: 'active',
            createdAt: '2024-02-08',
            client: {
              name: 'Design Studio',
              rating: 4.8
            }
          },
          {
            id: 3,
            title: 'Backend Developer Required',
            description: 'Seeking a Node.js expert for our backend...',
            budget: '$4000-6000',
            status: 'pending',
            createdAt: '2024-02-07',
            client: {
              name: 'Software Solutions',
              rating: 4.2
            }
          }
        ],
        currentPage: page,
        totalPages: 3,
        totalJobs: 25
      };

      const newData = mockData;

      setData(newData);
      return newData;
    } catch (err) {
      const message = handleError(err, {
        context: 'fetchData',
        user: user?.id
      });
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    fetchData(1); // Reset to first page with new filters
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData(1).catch(console.error);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    fetchData
  };
};

export default useAdminData;
