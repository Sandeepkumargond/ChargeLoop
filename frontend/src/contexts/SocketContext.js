'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only connect if we have a token
    const token = localStorage.getItem('token');
    
    if (token) {
      const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
        auth: {
          token
        },
        withCredentials: true,
      });

      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
