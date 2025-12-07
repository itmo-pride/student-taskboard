import { useEffect, useRef, useCallback, useState } from 'react';
import { DrawObject, WSMessage } from '../types/board';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

interface UseWhiteboardSocketProps {
  boardId: string;
  onSync: (objects: DrawObject[]) => void;
  onDraw: (object: DrawObject) => void;
  onDelete: (objectId: string) => void;
  onClear: () => void;
}

export function useWhiteboardSocket({
  boardId,
  onSync,
  onDraw,
  onDelete,
  onClear,
}: UseWhiteboardSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const connectingRef = useRef(false); 

  const callbacksRef = useRef({ onSync, onDraw, onDelete, onClear });
  callbacksRef.current = { onSync, onDraw, onDelete, onClear };

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    connectingRef.current = false;
  }, []);

  const connect = useCallback(() => {
    if (isUnmountedRef.current || connectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token || !boardId) return;

    connectingRef.current = true;

    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    console.log('Connecting to WebSocket...', boardId);
    const ws = new WebSocket(`${WS_URL}/ws/boards/${boardId}?token=${token}`);

    ws.onopen = () => {
      if (isUnmountedRef.current) {
        ws.close();
        return;
      }
      console.log('WebSocket connected to board:', boardId);
      setIsConnected(true);
      connectingRef.current = false;
    };

    ws.onmessage = (event) => {
      if (isUnmountedRef.current) return;
      
      try {
        const messages = event.data.split('\n').filter(Boolean);

        for (const msgStr of messages) {
          const message: WSMessage = JSON.parse(msgStr);

          switch (message.type) {
            case 'sync':
              callbacksRef.current.onSync(message.payload?.objects || []);
              break;
            case 'draw':
              if (message.payload?.object) {
                callbacksRef.current.onDraw(message.payload.object);
              }
              break;
            case 'delete':
              if (message.payload?.objectId) {
                callbacksRef.current.onDelete(message.payload.objectId);
              }
              break;
            case 'clear':
              callbacksRef.current.onClear();
              break;
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected', event.code, event.reason);
      setIsConnected(false);
      connectingRef.current = false;
      wsRef.current = null;

      if (!isUnmountedRef.current && event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isUnmountedRef.current) {
            console.log('Reconnecting...');
            connect();
          }
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      connectingRef.current = false;
    };

    wsRef.current = ws;
  }, [boardId]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      console.log('Cleaning up WebSocket connection');
      isUnmountedRef.current = true;
      disconnect();
    };
  }, [boardId]);

  const sendDraw = useCallback((object: DrawObject) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'draw',
          payload: { object },
        })
      );
    }
  }, []);

  const sendDelete = useCallback((objectId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'delete',
          payload: { objectId },
        })
      );
    }
  }, []);

  const sendClear = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'clear',
          payload: {},
        })
      );
    }
  }, []);

  return {
    isConnected,
    sendDraw,
    sendDelete,
    sendClear,
  };
}
