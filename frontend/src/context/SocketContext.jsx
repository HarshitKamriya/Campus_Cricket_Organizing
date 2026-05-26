import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  // Track which rooms we've joined so we can re-join after reconnection
  const joinedRoomsRef = useRef(new Set());

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected:', newSocket.id);
      setConnected(true);

      // Re-join all previously joined rooms after reconnection
      // This is critical — when the socket reconnects, the server
      // assigns a new socket ID and the old room memberships are lost.
      joinedRoomsRef.current.forEach((matchId) => {
        console.log('[Socket] Re-joining match after connect:', matchId);
        newSocket.emit('match:join', matchId);
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      setConnected(false);
    });

    newSocket.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
      setConnected(true);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      joinedRoomsRef.current.clear();
    };
  }, []);

  const joinMatch = useCallback(
    (matchId) => {
      // Always track the room, even if not connected yet.
      // The 'connect' handler will re-join tracked rooms.
      joinedRoomsRef.current.add(String(matchId));

      if (socketRef.current && socketRef.current.connected) {
        console.log('[Socket] Joining match:', matchId);
        socketRef.current.emit('match:join', matchId);
      } else {
        console.log('[Socket] Not connected yet, will join match', matchId, 'on connect');
      }
    },
    []
  );

  const leaveMatch = useCallback(
    (matchId) => {
      joinedRoomsRef.current.delete(String(matchId));

      if (socketRef.current && socketRef.current.connected) {
        console.log('[Socket] Leaving match:', matchId);
        socketRef.current.emit('match:leave', matchId);
      }
    },
    []
  );

  const value = {
    socket,
    connected,
    joinMatch,
    leaveMatch,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
