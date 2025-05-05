import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';

type WebSocketMessage = {
  type: string;
  data?: any;
  messageId?: number;
  status?: string;
  message?: string;
  userId?: number;
  users?: number[];
};

export function useWebSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create WebSocket connection
  const connect = useCallback(() => {
    if (!user) return;

    try {
      // Clean up previous connection if exists
      if (socketRef.current) {
        socketRef.current.close();
      }

      // Create new connection using the same origin as the HTTP requests
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      console.log('Connecting to WebSocket URL:', wsUrl);
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setError(null);

        // Send authentication message with user ID
        const authMessage: WebSocketMessage = {
          type: 'auth',
          userId: user.id
        };

        socket.send(JSON.stringify(authMessage));
      };

      socket.onclose = (event) => {
        setIsConnected(false);

        // If not a normal closure (code 1000), attempt to reconnect
        if (event.code !== 1000) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000); // Try to reconnect after 3 seconds
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setIsConnected(false);
        setError('Connection error occurred');
      };
    } catch (err) {
      setError('Failed to establish WebSocket connection');
      console.error('WebSocket connection error:', err);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback((messageData: WebSocketMessage) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(messageData));
      return true;
    }
    return false;
  }, [isConnected]);

  // Add a message listener
  const addMessageListener = useCallback((callback: (data: any) => void) => {
    if (socketRef.current) {
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socketRef.current.addEventListener('message', messageHandler);

      // Return function to remove the listener
      return () => {
        if (socketRef.current) {
          socketRef.current.removeEventListener('message', messageHandler);
        }
      };
    }

    // If no socket, return a no-op cleanup function
    return () => {};
  }, []);

  // Connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [user, connect]);

  return {
    isConnected,
    error,
    sendMessage,
    addMessageListener,
    connect,
  };
}