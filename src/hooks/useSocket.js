import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './useAuth';

let socket = null;

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(socket);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    if (!socketRef.current) {
      try {
        // Connect to WebSocket server using the same port as the API
        socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
          auth: {
            token: localStorage.getItem('token')
          },
          transports: ['websocket', 'polling'],
          reconnectionDelayMax: 10000,
          reconnectionAttempts: 5,
          path: '/socket.io'
        });

        // Connection event handlers
        socketRef.current.on('connect', () => {
          console.log('Socket connected');
          setError(null);
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            socketRef.current.connect();
          }
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError('Failed to connect to video server');
        });

        socketRef.current.on('error', (err) => {
          console.error('Socket error:', err);
          setError('Video server error occurred');
        });

        // Update global socket reference
        socket = socketRef.current;
      } catch (err) {
        console.error('Socket initialization error:', err);
        setError('Failed to initialize video connection');
      }
    }

    // Cleanup on unmount or user change
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
        socket = null;
        setError(null);
      }
    };
  }, [user]);

  return { socket: socketRef.current, error };
};

// Helper function to emit socket events with error handling
export const emitSocketEvent = (socket, event, data) => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Socket not connected'));
      return;
    }

    // Set up acknowledgment timeout
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Socket event timed out'));
    }, 5000);

    // Set up acknowledgment handler
    socket.emit(event, data, (response) => {
      cleanup();
      if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });

    // Cleanup function
    const cleanup = () => {
      clearTimeout(timeout);
    };
  });
};

// Helper function to handle socket event listening
export const onSocketEvent = (socket, event, callback) => {
  if (!socket) return () => {};

  const wrappedCallback = (...args) => {
    try {
      callback(...args);
    } catch (err) {
      console.error(`Error in socket event ${event} handler:`, err);
    }
  };

  socket.on(event, wrappedCallback);
  return () => socket.off(event, wrappedCallback);
};

export default useSocket;
