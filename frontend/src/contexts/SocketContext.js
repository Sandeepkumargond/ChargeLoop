'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { isTokenExpired } from '../utils/auth';

const SocketContext = createContext({ socket: null });

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const currentTokenRef = useRef(null);
  const socketRef = useRef(null);

  const syncSocketConnection = useCallback(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');

    // If token is missing or expired, disconnect any existing socket
    if (!token || isTokenExpired(token)) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        currentTokenRef.current = null;
        setSocket(null);
      }
      return;
    }

    // If already connected with the same valid token, no need to reconnect
    if (socketRef.current && currentTokenRef.current === token) {
      return;
    }

    // If token changed, disconnect old socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    currentTokenRef.current = token;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socketInstance = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 10000
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect_error', (err) => {
      // If authentication failed on server, clean up socket
      if (err.message && err.message.toLowerCase().includes('auth')) {
        console.warn('WebSocket authentication failed:', err.message);
        socketInstance.disconnect();
      }
    });
  }, []);

  useEffect(() => {
    syncSocketConnection();

    const handleAuthChange = () => {
      syncSocketConnection();
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        currentTokenRef.current = null;
      }
    };
  }, [syncSocketConnection]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
