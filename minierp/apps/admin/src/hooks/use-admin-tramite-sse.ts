'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export interface AdminTramiteSSEEvent {
  tramiteId: string;
  idSeguimiento: string;
  estado: string;
  fecha: string;
  detalles?: Record<string, unknown>;
}

interface UseAdminTramiteSSEOptions {
  onNuevoTramite?: (event: AdminTramiteSSEEvent) => void;
  onTramiteActualizado?: (event: AdminTramiteSSEEvent) => void;
  onTramiteDerivado?: (event: AdminTramiteSSEEvent) => void;
  onTramiteObservado?: (event: AdminTramiteSSEEvent) => void;
  onTramiteAprobado?: (event: AdminTramiteSSEEvent) => void;
  enabled?: boolean;
}

interface UseAdminTramiteSSEReturn {
  isConnected: boolean;
  lastEvent: AdminTramiteSSEEvent | null;
  reconnecting: boolean;
}

export function useAdminTramiteSSE(
  options: UseAdminTramiteSSEOptions = {}
): UseAdminTramiteSSEReturn {
  const {
    onNuevoTramite,
    onTramiteActualizado,
    onTramiteDerivado,
    onTramiteObservado,
    onTramiteAprobado,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AdminTramiteSSEEvent | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseDelay = 1000;

  const getReconnectDelay = useCallback(() => {
    const attempt = reconnectAttemptsRef.current;
    return Math.min(baseDelay * Math.pow(2, attempt), 30000);
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const api_url = 'https://aimachristian-backendintegrador.ajcxjb.easypanel.host';
    const eventSource = new EventSource(`${api_url}/api/tramites/stream`, {
      withCredentials: true,
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setReconnecting(false);
      reconnectAttemptsRef.current = 0;
    };

    const eventHandlers: Record<string, (event: AdminTramiteSSEEvent) => void> = {};
    if (onNuevoTramite) eventHandlers['admin:tramite:nuevo'] = onNuevoTramite;
    if (onTramiteActualizado) eventHandlers['admin:tramite:actualizado'] = onTramiteActualizado;
    if (onTramiteDerivado) eventHandlers['tramite:derivado'] = onTramiteDerivado;
    if (onTramiteObservado) eventHandlers['tramite:observado'] = onTramiteObservado;
    if (onTramiteAprobado) eventHandlers['tramite:aprobado'] = onTramiteAprobado;

    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      eventSource.addEventListener(eventName, ((e: MessageEvent) => {
        try {
          const data: AdminTramiteSSEEvent = JSON.parse(e.data);
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

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      }
    };
  }, [enabled, onNuevoTramite, onTramiteActualizado, onTramiteDerivado, onTramiteObservado, onTramiteAprobado, getReconnectDelay]);

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
