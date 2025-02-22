import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
interface SocketContextType {
  socket: Socket | null;
  username: string;
  setUsername: (name: string) => void;
}

const defaultContextValue: SocketContextType = {
  socket: null,
  username: '',
  setUsername: () => {},
};

// ✅ FIX: Use createContext without passing generic type directly
const SocketContext = createContext(defaultContextValue);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const newSocket = io('http://localhost:8080');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, username, setUsername }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
