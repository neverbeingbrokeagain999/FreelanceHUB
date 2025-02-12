import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import useSocket from './useSocket';
import errorHandler from '../utils/errorHandler';

/**
 * Custom hook for managing code snippets with real-time collaboration
 * @param {string} snippetId - ID of the code snippet
 * @param {Object} options - Configuration options
 * @returns {Object} Snippet state and methods
 */
const useCodeSnippet = (snippetId, options = {}) => {
  const { user } = useAuth();
  const [snippet, setSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [remoteSelections, setRemoteSelections] = useState({});
  const [executionResult, setExecutionResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const cursorRef = useRef(null);
  const selectionRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  // Initialize socket connection
  const {
    socket,
    subscribe,
    emit,
    joinRoom,
    leaveRoom,
    isConnected
  } = useSocket('/code-snippets');

  // Fetch snippet data
  const fetchSnippet = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/code-snippets/${snippetId}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch snippet');
      }

      const data = await response.json();
      setSnippet(data.data);
      setError(null);
    } catch (error) {
      setError(error.message);
      errorHandler.handle(error);
    } finally {
      setLoading(false);
    }
  }, [snippetId, user]);

  // Update snippet content
  const updateContent = useCallback(async (content, origin) => {
    try {
      if (!snippet) return;

      // Optimistically update local state
      setSnippet(prev => ({ ...prev, content }));

      // Emit changes to other users
      emit('snippet:update', {
        content,
        origin
      });

      // Debounce save to database
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(async () => {
        const response = await fetch(`/api/code-snippets/${snippetId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({ content })
        });

        if (!response.ok) {
          throw new Error('Failed to save changes');
        }
      }, 1000);
    } catch (error) {
      errorHandler.handle(error);
    }
  }, [snippetId, user, snippet, emit]);

  // Update cursor position
  const updateCursor = useCallback((position) => {
    if (!isConnected() || !position) return;
    cursorRef.current = position;
    emit('snippet:cursor', { position });
  }, [emit, isConnected]);

  // Update selection
  const updateSelection = useCallback((selection) => {
    if (!isConnected() || !selection) return;
    selectionRef.current = selection;
    emit('snippet:selection', { selection });
  }, [emit, isConnected]);

  // Execute code
  const executeCode = useCallback(async (code, config = {}) => {
    try {
      setExecuting(true);
      const response = await fetch(`/api/code-snippets/${snippetId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({ code, config })
      });

      if (!response.ok) {
        throw new Error('Execution failed');
      }

      const result = await response.json();
      setExecutionResult(result.data);
      
      // Share execution results with collaborators
      emit('snippet:execution', { result: result.data });
      
      return result.data;
    } catch (error) {
      setExecutionResult({ error: error.message });
      throw error;
    } finally {
      setExecuting(false);
    }
  }, [snippetId, user, emit]);

  // Save version
  const saveVersion = useCallback(async (commitMessage) => {
    try {
      const response = await fetch(`/api/code-snippets/${snippetId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          content: snippet.content,
          commitMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save version');
      }

      const data = await response.json();
      setSnippet(prev => ({
        ...prev,
        versions: [...(prev.versions || []), data.data]
      }));
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }, [snippetId, user, snippet]);

  // Restore version
  const restoreVersion = useCallback(async (versionId) => {
    try {
      const response = await fetch(
        `/api/code-snippets/${snippetId}/versions/${versionId}/restore`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user?.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

      const data = await response.json();
      setSnippet(data.data);
      emit('snippet:update', {
        content: data.data.content,
        origin: 'version'
      });
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }, [snippetId, user, emit]);

  // Setup socket subscriptions
  useEffect(() => {
    if (!snippetId || !isConnected()) return;

    const unsubscribers = [
      // Join snippet room
      subscribe('snippet:state', ({ content, version, users }) => {
        setSnippet(prev => ({ ...prev, content, version }));
        setActiveUsers(users);
      }),

      // Handle content updates
      subscribe('snippet:update', ({ userId, content, origin }) => {
        if (userId !== user?._id) {
          setSnippet(prev => ({ ...prev, content }));
        }
      }),

      // Handle cursor updates
      subscribe('snippet:cursor', ({ userId, position }) => {
        if (userId !== user?._id) {
          setRemoteCursors(prev => ({
            ...prev,
            [userId]: position
          }));
        }
      }),

      // Handle selection updates
      subscribe('snippet:selection', ({ userId, selection }) => {
        if (userId !== user?._id) {
          setRemoteSelections(prev => ({
            ...prev,
            [userId]: selection
          }));
        }
      }),

      // Handle execution results
      subscribe('snippet:execution', ({ userId, result }) => {
        if (userId !== user?._id) {
          setExecutionResult(result);
        }
      }),

      // Handle user presence
      subscribe('snippet:users', ({ users }) => {
        setActiveUsers(users);
      })
    ];

    // Join snippet room
    joinRoom(`snippet:${snippetId}`, {
      userId: user?._id,
      username: user?.name
    });

    // Cleanup
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      leaveRoom(`snippet:${snippetId}`);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [snippetId, user, isConnected, subscribe, joinRoom, leaveRoom]);

  // Initial fetch
  useEffect(() => {
    if (snippetId) {
      fetchSnippet();
    }
  }, [snippetId, fetchSnippet]);

  // Reconnection handling
  useEffect(() => {
    if (isConnected() && cursorRef.current) {
      emit('snippet:cursor', { position: cursorRef.current });
    }
    if (isConnected() && selectionRef.current) {
      emit('snippet:selection', { selection: selectionRef.current });
    }
  }, [isConnected, emit]);

  return {
    snippet,
    loading,
    error,
    activeUsers,
    remoteCursors,
    remoteSelections,
    executionResult,
    executing,
    updateContent,
    updateCursor,
    updateSelection,
    executeCode,
    saveVersion,
    restoreVersion,
    isConnected: isConnected()
  };
};

export default useCodeSnippet;
