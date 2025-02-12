import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';

export const useDocument = (documentId) => {
  const socket = useSocket();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [version, setVersion] = useState(1);

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }

        const data = await response.json();
        setContent(data.content);
        setCollaborators(data.collaborators);
        setVersion(data.version);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (documentId) {
      fetchDocument();
    }
  }, [documentId, user.token]);

  // Handle real-time updates
  useEffect(() => {
    if (!socket || !documentId) return;

    socket.emit('document:join', { documentId });

    socket.on('document:update', ({ content: newContent, version: newVersion }) => {
      setContent(newContent);
      setVersion(newVersion);
    });

    socket.on('document:collaborator-joined', (collaborator) => {
      setCollaborators(prev => [...prev, collaborator]);
    });

    socket.on('document:collaborator-left', (collaboratorId) => {
      setCollaborators(prev => prev.filter(c => c._id !== collaboratorId));
    });

    return () => {
      socket.emit('document:leave', { documentId });
      socket.off('document:update');
      socket.off('document:collaborator-joined');
      socket.off('document:collaborator-left');
    };
  }, [socket, documentId]);

  // Update document content
  const updateContent = useCallback(async (newContent) => {
    try {
      if (!socket) return;

      socket.emit('document:update', {
        documentId,
        content: newContent,
        version: version + 1
      });

      setContent(newContent);
      setVersion(prev => prev + 1);

      await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          content: newContent,
          version: version + 1
        })
      });
    } catch (err) {
      setError(err.message);
    }
  }, [documentId, socket, user.token, version]);

  return {
    content,
    loading,
    error,
    collaborators,
    version,
    updateContent
  };
};
