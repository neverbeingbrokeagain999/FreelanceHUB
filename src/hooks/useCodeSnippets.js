import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import errorHandler from '../utils/errorHandler';

/**
 * Custom hook for managing code snippets list
 * @returns {Object} Snippets state and methods
 */
const useCodeSnippets = () => {
  const { user } = useAuth();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    visibility: 'all',
    language: 'all'
  });
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetch all snippets
   */
  const fetchSnippets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/code-snippets', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch snippets');
      }

      const { data } = await response.json();
      setSnippets(data);
    } catch (error) {
      setError('Failed to fetch snippets');
      errorHandler.handle(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Create a new snippet
   */
  const createSnippet = useCallback(async (snippet) => {
    try {
      const response = await fetch('/api/code-snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(snippet)
      });

      if (!response.ok) {
        throw new Error('Failed to create snippet');
      }

      const { data } = await response.json();
      setSnippets(prev => [data, ...prev]);
      return data;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }, [user]);

  /**
   * Refresh snippets list
   */
  const refresh = useCallback(async () => {
    try {
      await fetchSnippets();
    } catch (error) {
      errorHandler.handle(error);
    }
  }, [fetchSnippets]);

  /**
   * Filter and sort snippets
   */
  const filteredSnippets = useMemo(() => {
    let result = [...snippets];

    // Apply visibility filter
    if (filters.visibility !== 'all') {
      result = result.filter(s => s.visibility === filters.visibility);
    }

    // Apply language filter
    if (filters.language !== 'all') {
      result = result.filter(s => s.language === filters.language);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'updatedAt') {
        return sortDirection === 'desc'
          ? new Date(b.updatedAt) - new Date(a.updatedAt)
          : new Date(a.updatedAt) - new Date(b.updatedAt);
      }
      // Add more sorting options here
      return 0;
    });

    return result;
  }, [snippets, filters, sortBy, sortDirection, searchQuery]);

  /**
   * Load snippets on mount
   */
  useEffect(() => {
    if (user) {
      fetchSnippets();
    }
  }, [user, fetchSnippets]);

  return {
    snippets,
    loading,
    error,
    filteredSnippets,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    searchQuery,
    setSearchQuery,
    createSnippet,
    refresh
  };
};

export default useCodeSnippets;
