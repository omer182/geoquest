import { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketState, WebSocketAction, WebSocketContextValue } from '../types/websocket';
import { SOCKET_EVENTS } from '../types/socket-events';

/**
 * Initial WebSocket state before connection is established.
 */
const initialState: WebSocketState = {
  connectionStatus: 'disconnected',
  socket: null,
  error: null,
  sessionId: null,
  latency: null,
  reconnectAttempts: 0,
};

/**
 * Session storage key for persisting session ID across page refreshes.
 */
const SESSION_STORAGE_KEY = 'geoquest_session_id';

/**
 * Maximum number of reconnection attempts before giving up.
 */
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Pure reducer function to handle all WebSocket state transitions.
 * Returns a new state object for each action, never mutating the original state.
 *
 * @param state - Current WebSocket state
 * @param action - Action to perform
 * @returns New WebSocket state after action is applied
 */
export function websocketReducer(state: WebSocketState, action: WebSocketAction): WebSocketState {
  switch (action.type) {
    case 'CONNECT_INIT': {
      return {
        ...state,
        connectionStatus: 'connecting',
        socket: action.payload.socket,
        error: null,
      };
    }

    case 'CONNECT_SUCCESS': {
      return {
        ...state,
        socket: state.socket, // Preserve socket from CONNECT_INIT
        connectionStatus: 'connected',
        error: null,
        sessionId: action.payload.sessionId || state.sessionId,
        reconnectAttempts: 0,
      };
    }

    case 'CONNECT_ERROR': {
      return {
        ...state,
        connectionStatus: 'error',
        error: action.payload.error,
      };
    }

    case 'DISCONNECT': {
      return {
        ...state,
        connectionStatus: 'disconnected',
        latency: null,
      };
    }

    case 'RECONNECT_ATTEMPT': {
      return {
        ...state,
        connectionStatus: 'reconnecting',
        reconnectAttempts: action.payload.attemptNumber,
      };
    }

    case 'UPDATE_LATENCY': {
      return {
        ...state,
        latency: action.payload.latency,
      };
    }

    case 'UPDATE_SESSION_ID': {
      return {
        ...state,
        sessionId: action.payload.sessionId,
      };
    }

    case 'RESET_RECONNECT_ATTEMPTS': {
      return {
        ...state,
        reconnectAttempts: 0,
      };
    }

    default:
      return state;
  }
}

/**
 * React Context for WebSocket connection management.
 * Provides WebSocket state and control functions to all child components.
 */
const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

/**
 * Props for WebSocketProvider component.
 */
interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the application and provides WebSocket connection via Context.
 * Uses useReducer to manage connection state transitions in a predictable way.
 *
 * Features:
 * - Automatic connection initialization
 * - Session persistence across page refreshes (5-minute window)
 * - Automatic reconnection with exponential backoff (1s → 2s → 4s → 8s → 16s)
 * - Heartbeat monitoring (ping/pong every 10 seconds)
 * - Development mode logging
 *
 * @param props - Component props
 * @returns Provider component wrapping children
 */
export function WebSocketProvider({ children }: WebSocketProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(websocketReducer, initialState);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  /**
   * Logs WebSocket events in development mode with timestamps.
   *
   * @param message - Log message
   * @param data - Optional data to log
   */
  const log = (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      const timestamp = new Date().toISOString();
      console.log(`[WebSocket ${timestamp}]`, message, data || '');
    }
  };

  /**
   * Logs errors in all environments.
   *
   * @param message - Error message
   * @param error - Error object or data
   */
  const logError = (message: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    console.error(`[WebSocket ${timestamp}]`, message, error || '');
  };

  /**
   * Calculates the backoff delay for reconnection attempts using exponential backoff.
   * Delays: 1s, 2s, 4s, 8s, 16s (capped at 30s)
   *
   * @param attemptNumber - Current reconnection attempt number (1-based)
   * @returns Delay in milliseconds
   */
  const calculateBackoffDelay = (attemptNumber: number): number => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds cap
    const delay = baseDelay * Math.pow(2, attemptNumber - 1);
    return Math.min(delay, maxDelay);
  };

  /**
   * Attempts to reconnect to the WebSocket server with exponential backoff.
   *
   * @param attemptNumber - Current reconnection attempt number
   */
  const attemptReconnect = (attemptNumber: number) => {
    if (attemptNumber > MAX_RECONNECT_ATTEMPTS) {
      logError('Max reconnection attempts reached. Please retry manually.');
      dispatch({
        type: 'CONNECT_ERROR',
        payload: { error: 'Failed to reconnect after multiple attempts. Please retry manually.' },
      });
      return;
    }

    const delay = calculateBackoffDelay(attemptNumber);
    log(`Reconnecting in ${delay}ms (attempt ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS})`);

    dispatch({
      type: 'RECONNECT_ATTEMPT',
      payload: { attemptNumber },
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        log(`Attempting reconnection ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS}`);
        socketRef.current.connect();
      }
    }, delay);
  };

  /**
   * Manually trigger reconnection.
   */
  const reconnect = () => {
    log('Manual reconnection triggered');

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Reset reconnection attempts
    dispatch({ type: 'RESET_RECONNECT_ATTEMPTS' });

    // Attempt connection
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  /**
   * Manually disconnect from the WebSocket server.
   */
  const disconnect = () => {
    log('Manual disconnection triggered');

    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Clear session from storage on manual disconnect
    sessionStorage.removeItem(SESSION_STORAGE_KEY);

    dispatch({ type: 'DISCONNECT' });
  };

  /**
   * Initialize Socket.IO connection and set up event listeners.
   */
  useEffect(() => {
    // Get WebSocket URL from environment
    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';

    // Check for existing session ID in sessionStorage
    const existingSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

    log('Initializing WebSocket connection', { url: socketUrl, sessionId: existingSessionId });

    // Initialize Socket.IO client
    const socket = io(socketUrl, {
      autoConnect: true, // Auto-connect on initialization
      reconnection: false, // Disable built-in reconnection (we'll handle it manually)
      timeout: 10000, // Connection timeout
      transports: ['websocket', 'polling'], // Prefer websocket, fallback to polling
      auth: existingSessionId
        ? {
            sessionId: existingSessionId,
          }
        : undefined,
    });

    socketRef.current = socket;

    // Dispatch connection initialization
    dispatch({
      type: 'CONNECT_INIT',
      payload: { socket },
    });

    // Connection successful
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      log('WebSocket connected', { socketId: socket.id });

      // Clear any reconnection timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      dispatch({
        type: 'CONNECT_SUCCESS',
        payload: { sessionId: existingSessionId },
      });
    });

    // Connection error
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      logError('WebSocket connection error', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to connect to server';

      dispatch({
        type: 'CONNECT_ERROR',
        payload: { error: errorMessage },
      });

      // Attempt reconnection if this was a network error
      const currentAttempts = state.reconnectAttempts + 1;
      attemptReconnect(currentAttempts);
    });

    // Disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      log('WebSocket disconnected', { reason });

      dispatch({ type: 'DISCONNECT' });

      // Attempt automatic reconnection for certain disconnect reasons
      const shouldReconnect =
        reason === 'transport error' ||
        reason === 'ping timeout' ||
        reason === 'transport close';

      if (shouldReconnect) {
        const currentAttempts = state.reconnectAttempts + 1;
        attemptReconnect(currentAttempts);
      }
    });

    // Generic error handler
    socket.on(SOCKET_EVENTS.ERROR, (error) => {
      logError('WebSocket error', error);

      const errorMessage =
        typeof error === 'string'
          ? error
          : error?.message || 'An unexpected error occurred';

      dispatch({
        type: 'CONNECT_ERROR',
        payload: { error: errorMessage },
      });
    });

    // Session restored event (from server)
    socket.on(SOCKET_EVENTS.SESSION_RESTORED, (data) => {
      log('Session restored', data);

      if (data.sessionId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
        dispatch({
          type: 'UPDATE_SESSION_ID',
          payload: { sessionId: data.sessionId },
        });
      }
    });

    // Ping/pong heartbeat monitoring
    let pingTime = 0;

    // Listen to Socket.IO engine ping/pong events
    socket.io.engine.on('ping', () => {
      pingTime = Date.now();
      log('Heartbeat ping sent');
    });

    socket.io.engine.on('pong', () => {
      const latency = Date.now() - pingTime;
      log('Heartbeat pong received', { latency });

      dispatch({
        type: 'UPDATE_LATENCY',
        payload: { latency },
      });
    });

    // Handle session ID from connect_success event (custom event from our backend)
    socket.on('connect_success', (data) => {
      log('Connection success event received', data);

      if (data.socketId && !existingSessionId) {
        // Store new session ID (using socket ID as session ID)
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.socketId);
        dispatch({
          type: 'UPDATE_SESSION_ID',
          payload: { sessionId: data.socketId },
        });
      }
    });

    // Cleanup on unmount
    return () => {
      log('Cleaning up WebSocket connection');

      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Remove all listeners
      socket.removeAllListeners();

      // Disconnect socket
      socket.disconnect();

      socketRef.current = null;
    };
  }, []); // Empty dependency array - only run on mount/unmount

  const value: WebSocketContextValue = {
    state,
    socket: state.socket, // Convenience accessor
    dispatch,
    reconnect,
    disconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

/**
 * Custom hook to access WebSocket state and control functions.
 * Must be used within a WebSocketProvider component.
 *
 * @returns WebSocket context value with state and control functions
 * @throws Error if used outside of WebSocketProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { state, reconnect, disconnect } = useSocket();
 *
 *   if (state.connectionStatus === 'connected') {
 *     return <div>Connected! Latency: {state.latency}ms</div>;
 *   }
 *
 *   return <button onClick={reconnect}>Reconnect</button>;
 * }
 * ```
 */
export function useSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);

  if (context === undefined) {
    throw new Error('useSocket must be used within a WebSocketProvider');
  }

  return context;
}
