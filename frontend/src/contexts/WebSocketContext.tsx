import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  sendMessage: (type: string, content: any) => void;
  lastMessage: any;
  isConnected: boolean;
  connect: (quizId: string) => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const currentQuizId = useRef<string | null>(null);

  const connect = (quizId: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      disconnect();
    }

    currentQuizId.current = quizId;
    const wsUrl = `ws://localhost:8083/ws/${quizId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      
      // Set the Authorization header via a custom protocol
      if (token) {
        ws.current?.send(JSON.stringify({
          type: 'auth',
          content: { token }
        }));
      }
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setLastMessage(message);
      console.log('Received message:', message);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setIsConnected(false);
    };
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      currentQuizId.current = null;
      setIsConnected(false);
    }
  };

  const sendMessage = (type: string, content: any) => {
    if (ws.current?.readyState === WebSocket.OPEN && currentQuizId.current) {
      const message = {
        quiz_id: currentQuizId.current,
        type,
        content
      };
      ws.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, isConnected, connect, disconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
