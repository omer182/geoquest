/**
 * WebSocket State Management Types
 *
 * Type definitions for the WebSocket context and reducer.
 */

import { Socket } from 'socket.io-client';
import { ConnectionStatus } from './socket-events';

/**
 * WebSocket connection state
 */
export interface WebSocketState {
  /**
   * Current connection status
   */
  connectionStatus: ConnectionStatus;

  /**
   * Socket.IO client instance (null when not connected)
   */
  socket: Socket | null;

  /**
   * Error message when status is 'error'
   */
  error: string | null;

  /**
   * Session ID for reconnection persistence
   */
  sessionId: string | null;

  /**
   * Connection latency in milliseconds (null when not connected)
   */
  latency: number | null;

  /**
   * Number of reconnection attempts made
   */
  reconnectAttempts: number;
}

/**
 * WebSocket action types - discriminated union for type-safe reducer
 */
export type WebSocketAction =
  | { type: 'CONNECT_INIT'; payload: { socket: Socket } }
  | { type: 'CONNECT_SUCCESS'; payload: { sessionId: string | null } }
  | { type: 'CONNECT_ERROR'; payload: { error: string } }
  | { type: 'DISCONNECT' }
  | { type: 'RECONNECT_ATTEMPT'; payload: { attemptNumber: number } }
  | { type: 'UPDATE_LATENCY'; payload: { latency: number } }
  | { type: 'UPDATE_SESSION_ID'; payload: { sessionId: string } }
  | { type: 'RESET_RECONNECT_ATTEMPTS' };

/**
 * WebSocket context value shape
 */
export interface WebSocketContextValue {
  /**
   * Current WebSocket state
   */
  state: WebSocketState;

  /**
   * Socket.IO client instance (null when not connected)
   * Convenience accessor for state.socket
   */
  socket: Socket | null;

  /**
   * Dispatch function for state updates
   */
  dispatch: React.Dispatch<WebSocketAction>;

  /**
   * Manually trigger reconnection
   */
  reconnect: () => void;

  /**
   * Manually disconnect
   */
  disconnect: () => void;
}
