import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export const useEscrow = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { token } = useAuth();

  // Create new escrow
  const createEscrow = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create escrow');
      }

      setSuccess('Escrow created successfully');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fund escrow
  const fundEscrow = useCallback(async (escrowId, transactionId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/escrow/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ escrowId, transactionId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fund escrow');
      }

      setSuccess('Escrow funded successfully');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Release escrow
  const releaseEscrow = useCallback(async (escrowId, data = {}) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/escrow/${escrowId}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to release escrow');
      }

      setSuccess('Funds released successfully');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Dispute escrow
  const disputeEscrow = useCallback(async (escrowId, reason) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/escrow/${escrowId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to dispute escrow');
      }

      setSuccess('Dispute filed successfully');
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Get user's escrows
  const getUserEscrows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/escrow/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch escrows');
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Get escrow statistics
  const getEscrowStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/escrow/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch escrow statistics');
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Get single escrow details
  const getEscrowDetails = useCallback(async (escrowId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/escrow/${escrowId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch escrow details');
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    loading,
    error,
    success,
    createEscrow,
    fundEscrow,
    releaseEscrow,
    disputeEscrow,
    getUserEscrows,
    getEscrowStats,
    getEscrowDetails,
    clearMessages
  };
};

export default useEscrow;
