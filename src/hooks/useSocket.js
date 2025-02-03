import { useEffect } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (onUpdate) => {
  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    socket.on('connect', () => socket.emit('joinAdminRoom'));
    socket.on('platformUpdate', onUpdate);
    
    return () => socket.disconnect();
  }, [onUpdate]);
};
