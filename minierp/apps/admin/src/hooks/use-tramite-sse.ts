'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface TramiteSSEEvent {
  tramiteId: string;
  idSeguimiento: string;
  estado: string;
  fecha: string;
  detalles?: Record<string, unknown>;
}

interface UseTramiteSSEOptions {
  onCreated?: (event: TramiteSSEEvent) => void;
  onEstado?: (event: TramiteSSEEvent) => void;
  onObservado?: (event: TramiteSSEEvent) => void;
  onDerivado?: (event: TramiteSSEEvent) => void;
  onAprobado?: (event: TramiteSSEEvent) => void;
  onDocumento?: (event: TramiteSSEEvent) => void;
  onFinalizado?: (event: TramiteSSEEvent) => void;
  enabled?: boolean;
}

interface UseTramiteSSEReturn {
  isConnected: boolean;
  lastEvent: TramiteSSEEvent | null;
  reconnecting: boolean;
}

export function useTramiteSSE(
  options: UseTramiteSSEOptions = {}
): UseTramiteSSEReturn {
  const {
    onCreated,
    onEstado,
    onObservado,
    onDerivado,
    onAprobado,
    onDocumento,
    onFinalizado,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<TramiteSSEEvent | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseDelay = 1000;

  const getReconnectDelay = useCallback(() => {
    const attempt = reconnectAttemptsRef.current;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
    return delay;
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const eventSource = new EventSource(`${api_url}/api/tramites/stream`, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
      console.log('📡 SSE connected');
    };

    const eventHandlers: Record<string, (event: TramiteSSEEvent) => void> = {};
    if (onCreated) eventHandlers['tramite:created'] = onCreated;
    if (onEstado) eventHandlers['tramite:estado'] = onEstado;
    if (onObservado) eventHandlers['tramite:observado'] = onObservado;
    if (onDerivado) eventHandlers['tramite:derivado'] = onDerivado;
    if (onAprobado) eventHandlers['tramite:aprobado'] = onAprobado;
    if (onDocumento) eventHandlers['tramite:documento'] = onDocumento;
    if (onFinalizado) eventHandlers['tramite:finalizado'] = onFinalizado;

    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      eventSource.addEventListener(eventName, ((e: MessageEvent) => {
        try {
          const data: TramiteSSEEvent = JSON.parse(e.data);
          setLastEvent(data);
          handler(data);
        } catch (err) {
          console.error(`SSE parse error for ${eventName}:`, err);
        }
      }) as EventListener);
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        setReconnecting(true);
        const delay = getReconnectDelay();
        console.log(`📡 SSE reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      } else {
        console.log('📡 SSE max reconnect attempts reached');
      }
    };
  }, [
    enabled,
    onCreated,
    onEstado,
    onObservado,
    onDerivado,
    onAprobado,
    onDocumento,
    onFinalizado,
    getReconnectDelay,
  ]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [enabled, connect]);

  return { isConnected, lastEvent, reconnecting };
}
