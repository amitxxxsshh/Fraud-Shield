import { useEffect, useRef, useState, useCallback } from 'react';
import { LiveRiskEvent } from '../types';

export function useWebSocket(onEventReceived?: (event: LiveRiskEvent) => void) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<LiveRiskEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onEventReceived);

  callbackRef.current = onEventReceived;

  const connect = useCallback(() => {
    try {
      let wsUrl = '';
      if (import.meta.env.VITE_WS_URL) {
        wsUrl = import.meta.env.VITE_WS_URL;
      } else if (import.meta.env.VITE_API_URL) {
        const rawApi = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
        const wsBase = rawApi.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
        wsUrl = `${wsBase}/ws/risk-events`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        wsUrl = `${protocol}//${host}/ws/risk-events`;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected to Real-Time Risk Channel:', wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'pong') return;

          setLastEvent(data);
          if (callbackRef.current) {
            callbackRef.current(data);
          }
        } catch (e) {
          console.warn('[WebSocket] Non-JSON payload received:', event.data);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WebSocket] Disconnected. Reconnecting in 3s...');
        setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Connection Error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[WebSocket] Init failed:', err);
    }
  }, []);

  useEffect(() => {
    connect();

    // Keepalive ping every 25s
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected, lastEvent };
}
