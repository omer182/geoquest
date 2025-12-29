import { useSocket as useSocketContext } from '../context/WebSocketContext';

/**
 * Convenience hook to access the WebSocket socket instance and connection status.
 * This is a re-export of the useSocket hook from WebSocketContext for cleaner imports.
 *
 * Must be used within a WebSocketProvider component.
 *
 * @returns WebSocket context value with state and control functions
 * @throws Error if used outside of WebSocketProvider
 *
 * @example
 * ```tsx
 * import { useSocket } from '../hooks/useSocket';
 *
 * function MyComponent() {
 *   const { state, reconnect } = useSocket();
 *
 *   return (
 *     <div>
 *       <p>Status: {state.connectionStatus}</p>
 *       <p>Latency: {state.latency}ms</p>
 *       <button onClick={reconnect}>Reconnect</button>
 *     </div>
 *   );
 * }
 * ```
 */
export { useSocketContext as useSocket };
