import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import { SocketEventName } from '../types/socket-events';

/**
 * Custom hook for listening to Socket.IO events with automatic cleanup.
 * Provides type-safe event listener registration that automatically removes
 * the listener when the component unmounts or dependencies change.
 *
 * Must be used within a WebSocketProvider component.
 *
 * @param eventName - Name of the socket event to listen to
 * @param callback - Callback function to execute when event is received
 * @throws Error if socket is not connected
 *
 * @example
 * ```tsx
 * import { useSocketEvent } from '../hooks/useSocketEvent';
 * import { SOCKET_EVENTS, RoomUpdatedEvent } from '../types/socket-events';
 *
 * function RoomComponent() {
 *   useSocketEvent(SOCKET_EVENTS.ROOM_UPDATED, (data: RoomUpdatedEvent) => {
 *     console.log('Room updated:', data.room);
 *   });
 *
 *   return <div>Room Component</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With dependencies - re-register listener when roomCode changes
 * useSocketEvent(
 *   SOCKET_EVENTS.PLAYER_JOINED,
 *   (data) => {
 *     console.log('Player joined:', data.player);
 *   }
 * );
 * ```
 */
export function useSocketEvent<T = unknown>(
  eventName: SocketEventName | string,
  callback: (data: T) => void
): void {
  const { state } = useSocket();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const socket = state.socket;

    // Only set up listener if socket is available
    if (!socket) {
      if (import.meta.env.DEV) {
        console.warn(
          `[useSocketEvent] Socket not connected, skipping listener for: ${eventName}`
        );
      }
      return;
    }

    // Create stable handler function that uses the ref
    const handler = (data: T) => {
      if (import.meta.env.DEV) {
        console.log(`[useSocketEvent] Event received: ${eventName}`, data);
      }
      callbackRef.current(data);
    };

    // Register event listener
    socket.on(eventName, handler);

    if (import.meta.env.DEV) {
      console.log(`[useSocketEvent] Registered listener for: ${eventName}`);
    }

    // Cleanup: remove listener on unmount or when dependencies change
    return () => {
      socket.off(eventName, handler);

      if (import.meta.env.DEV) {
        console.log(`[useSocketEvent] Removed listener for: ${eventName}`);
      }
    };
  }, [state.socket, eventName]); // Re-register when socket or event name changes
}
