import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

const useWhiteboard = (whiteboardId) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [whiteboard, setWhiteboard] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const canvasRef = useRef(null);

  // Fetch whiteboard data
  const fetchWhiteboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/whiteboards/${whiteboardId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch whiteboard');
      }

      const data = await response.json();
      setWhiteboard(data.data);
      setElements(data.data.elements);
      setCollaborators(data.data.collaborators);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load whiteboard');
    } finally {
      setLoading(false);
    }
  }, [whiteboardId]);

  // Add new element
  const addElement = useCallback(async (elementData) => {
    try {
      const response = await fetch(`/api/whiteboards/${whiteboardId}/elements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(elementData)
      });

      if (!response.ok) {
        throw new Error('Failed to add element');
      }

      const data = await response.json();
      setElements(prev => [...prev, data.data]);
      return data.data;
    } catch (err) {
      toast.error('Failed to add element');
      throw err;
    }
  }, [whiteboardId]);

  // Update existing element
  const updateElement = useCallback(async (elementId, updates) => {
    try {
      const response = await fetch(`/api/whiteboards/${whiteboardId}/elements/${elementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update element');
      }

      const data = await response.json();
      setElements(prev => 
        prev.map(el => el._id === elementId ? { ...el, ...updates } : el)
      );
      return data.data;
    } catch (err) {
      toast.error('Failed to update element');
      throw err;
    }
  }, [whiteboardId]);

  // Delete element
  const deleteElement = useCallback(async (elementId) => {
    try {
      const response = await fetch(`/api/whiteboards/${whiteboardId}/elements/${elementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete element');
      }

      setElements(prev => prev.filter(el => el._id !== elementId));
    } catch (err) {
      toast.error('Failed to delete element');
      throw err;
    }
  }, [whiteboardId]);

  // Create snapshot
  const createSnapshot = useCallback(async () => {
    try {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const imageUrl = canvas.toDataURL('image/png');

      const response = await fetch(`/api/whiteboards/${whiteboardId}/snapshots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ imageUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to create snapshot');
      }

      const data = await response.json();
      toast.success('Snapshot created successfully');
      return data.data;
    } catch (err) {
      toast.error('Failed to create snapshot');
      throw err;
    }
  }, [whiteboardId, canvasRef]);

  // Update settings
  const updateSettings = useCallback(async (settings) => {
    try {
      const response = await fetch(`/api/whiteboards/${whiteboardId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setWhiteboard(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
      return data.data;
    } catch (err) {
      toast.error('Failed to update settings');
      throw err;
    }
  }, [whiteboardId]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !whiteboardId) return;

    // Join whiteboard room
    socket.emit('join_whiteboard', { whiteboardId });

    // Listen for element events
    socket.on('element_added', ({ element }) => {
      setElements(prev => [...prev, element]);
    });

    socket.on('element_updated', ({ elementId, updates }) => {
      setElements(prev => 
        prev.map(el => el._id === elementId ? { ...el, ...updates } : el)
      );
    });

    socket.on('element_deleted', ({ elementId }) => {
      setElements(prev => prev.filter(el => el._id !== elementId));
    });

    socket.on('settings_updated', ({ settings }) => {
      setWhiteboard(prev => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    });

    socket.on('collaborator_joined', ({ collaborator }) => {
      setCollaborators(prev => [...prev, collaborator]);
    });

    socket.on('collaborator_left', ({ userId }) => {
      setCollaborators(prev => prev.filter(c => c.user !== userId));
    });

    // Cleanup
    return () => {
      socket.emit('leave_whiteboard', { whiteboardId });
      socket.off('element_added');
      socket.off('element_updated');
      socket.off('element_deleted');
      socket.off('settings_updated');
      socket.off('collaborator_joined');
      socket.off('collaborator_left');
    };
  }, [socket, whiteboardId]);

  // Initial load
  useEffect(() => {
    if (whiteboardId) {
      fetchWhiteboard();
    }
  }, [whiteboardId, fetchWhiteboard]);

  return {
    whiteboard,
    elements,
    selectedElement,
    tool,
    color,
    strokeWidth,
    isDrawing,
    collaborators,
    loading,
    error,
    canvasRef,
    setSelectedElement,
    setTool,
    setColor,
    setStrokeWidth,
    setIsDrawing,
    addElement,
    updateElement,
    deleteElement,
    createSnapshot,
    updateSettings
  };
};

export default useWhiteboard;
