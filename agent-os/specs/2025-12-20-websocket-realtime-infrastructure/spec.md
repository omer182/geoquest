# Specification: WebSocket Real-Time Infrastructure

## Goal
Build the foundational Socket.IO WebSocket infrastructure to enable reliable real-time bidirectional communication between clients and server, supporting future multiplayer game sessions with room management, connection health monitoring, and robust reconnection handling.

## User Stories
- As a player, I want the game to establish and maintain a stable WebSocket connection so that I can participate in real-time multiplayer sessions
- As a player, I want the game to automatically reconnect when my connection drops so that temporary network issues don't disrupt my gameplay
- As a developer, I want a clean event-driven architecture so that adding multiplayer features in Phase 4 is straightforward and maintainable

## Specific Requirements

**Socket.IO Server Enhancement**
- Extend existing server.js in backend/src with room management capabilities
- Implement in-memory Map data structure to track active rooms (roomId -> room metadata)
- Each room stores roomId, players array (socketId, username, ready status), gameState enum (waiting, playing, complete), createdAt timestamp
- Add event handlers for room:create, room:join, room:leave, player:ready events
- Implement room:create handler generating unique 6-character alphanumeric room codes using random generation
- Implement room:join handler validating room exists, not full (max 2-4 players), and adding player to room
- Emit room:updated event to all players in room when room state changes (player joins, leaves, ready status)
- Clean up empty rooms automatically when last player disconnects

**Connection Health Monitoring**
- Implement heartbeat ping/pong mechanism using Socket.IO built-in ping/pong events
- Configure pingInterval to 25000ms and pingTimeout to 10000ms in Socket.IO server options
- Track last heartbeat timestamp per socket connection in Map data structure
- Log connection health warnings when ping timeout occurs before disconnect
- Emit connection:health event to client with latency measurement on each successful pong
- Store connection metadata (connect time, reconnect count, current room) per socket using socket.data property

**Reconnection Logic with Session Persistence**
- Generate unique sessionId on initial connection using UUID or socket.id derivative
- Store sessionId -> socket mapping in server memory for 5 minute window after disconnect
- On reconnect, client sends previous sessionId in auth payload during connection handshake
- Server validates sessionId, restores room membership if session found and room still active
- Emit session:restored event to client with previous game state if restoration successful
- Clear expired sessions using setInterval cleanup task running every 60 seconds
- Client stores sessionId in sessionStorage (persists across page refresh, not browser close)

**TypeScript Event Type Definitions**
- Create shared types/socket-events.ts file defining all Socket.IO event interfaces
- Define ServerToClientEvents interface with connection:status, room:updated, session:restored, error events
- Define ClientToServerEvents interface with room:create, room:join, room:leave, player:ready events
- Define RoomData interface with roomId, players, gameState, createdAt fields
- Define PlayerData interface with socketId, username, isReady, isHost fields
- Use TypeScript generics to type Socket.IO Server and Socket instances for compile-time safety
- Export event types for use in both backend and frontend codebases

**Frontend WebSocket Context Architecture**
- Create src/context/WebSocketContext.tsx using React Context API and useReducer pattern
- State includes connectionStatus enum (disconnected, connecting, connected, error), socket instance, error message, sessionId, latency
- ConnectionStatus enum values: DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING, ERROR
- Reducer handles CONNECT_INIT, CONNECT_SUCCESS, CONNECT_ERROR, DISCONNECT, RECONNECT_ATTEMPT, UPDATE_LATENCY actions
- WebSocketProvider component initializes Socket.IO client in useEffect with URL from import.meta.env.VITE_WEBSOCKET_URL
- Clean up socket connection on component unmount using socket.disconnect() and socket.removeAllListeners()

**Socket.IO Client Configuration**
- Configure client with autoConnect: false to allow manual connection control
- Set reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 5000, reconnectionAttempts: 5
- Implement exponential backoff by doubling reconnectionDelay on each failed attempt (manual calculation)
- Configure timeout: 10000ms for connection attempt timeout
- Pass sessionId in auth object during connection handshake if available in sessionStorage
- Use transports: ['websocket', 'polling'] with websocket preferred for lower latency

**Custom React Hooks for Socket Usage**
- Create useSocket hook returning socket instance and connectionStatus from WebSocketContext
- Create useSocketEvent hook accepting event name and callback, setting up listener with useEffect
- useSocketEvent automatically cleans up listener on unmount or when dependencies change
- Both hooks throw error if used outside WebSocketProvider with clear error message
- Type useSocketEvent with generics to enforce type-safe event names and payloads matching socket-events.ts

**Automatic Reconnection with Exponential Backoff**
- Listen to disconnect event and transition to RECONNECTING status if disconnect reason is transport error or ping timeout
- Implement manual exponential backoff using setTimeout with delays: 1s, 2s, 4s, 8s, 16s (capped at 30s)
- Display reconnection attempt count in UI connection status indicator
- After max reconnection attempts (5), transition to ERROR status and allow manual retry
- On successful reconnect, reset backoff delay to initial value and restore session if sessionId valid
- Emit reconnection:success or reconnection:failed events to notify UI components

**Error Handling and Logging**
- Implement centralized error handling in WebSocketContext for connection errors, event errors, room errors
- Log all socket events (connect, disconnect, error) in development mode using console.log with timestamps
- Suppress verbose logging in production mode, only log errors and critical events
- Emit error events from server with error code, message, and severity (warning, error, critical)
- Client displays user-friendly error messages in UI without exposing technical details
- Server validates all incoming event payloads, reject with error event if validation fails

**Connection Status UI Component**
- Create ConnectionStatusIndicator component displaying current connection state as colored dot with tooltip
- Green dot for CONNECTED, yellow pulsing dot for CONNECTING/RECONNECTING, red dot for DISCONNECTED/ERROR
- Show latency in ms next to indicator when CONNECTED using connection:health event data
- Position indicator in top-right corner of screen with fixed positioning and high z-index
- Display reconnection attempt count during RECONNECTING state
- Clicking indicator when ERROR shows retry button to manually attempt reconnection

**Environment Variable Configuration**
- Add VITE_WEBSOCKET_URL to .env.example with default ws://localhost:3001 for local development
- Add PORT and CORS_ORIGIN to backend/.env.example with defaults 3001 and http://localhost:5173
- Document WebSocket URL configuration in README for Docker (ws://backend:3001) vs local setup
- Support both ws:// and wss:// protocols for local development and production deployment
- Validate environment variables on server startup, log warning if CORS_ORIGIN not set

## Existing Code to Leverage

**GameContext Pattern from src/context/GameContext.tsx**
- Use similar Context + useReducer architecture for WebSocketContext
- Follow pattern of createContext, Provider component, and custom hook (useGame -> useSocket)
- Implement pure reducer function handling state transitions immutably
- Define clear TypeScript interfaces for state, actions, and context value
- Throw error from custom hook if used outside provider with descriptive message

**Express and Socket.IO Setup from backend/src/server.js**
- Extend existing Express app and Socket.IO server configuration
- Leverage existing CORS configuration and health check endpoint pattern
- Build on existing connection/disconnection handlers with enhanced room logic
- Follow existing console.log pattern for server-side logging with [Socket.IO] prefix
- Maintain existing graceful shutdown handler with SIGTERM

**React Hooks Pattern from src/components/Game.tsx**
- Use useState, useEffect, useRef hooks for managing socket state and side effects
- Follow pattern of cleanup functions in useEffect return for socket listener removal
- Implement similar key-based remounting strategy if needed for connection reset
- Use dependency arrays in useEffect to control when socket events are registered

**TypeScript Type Safety from src/types/game.ts**
- Create parallel socket-events.ts file with similar enum and interface patterns
- Use discriminated unions for event types if needed (similar to GameAction)
- Export types for shared use between backend and frontend
- Add JSDoc comments for all interfaces explaining field purposes

**Environment Variable Usage from .env.example**
- Follow existing VITE_ prefix pattern for frontend environment variables
- Use import.meta.env.VITE_WEBSOCKET_URL in WebSocketContext for Socket.IO URL
- Mirror backend/.env.example structure for backend environment variables
- Document all WebSocket-related variables with clear examples for different environments

## Out of Scope
- Full multiplayer game synchronization logic (Phase 4)
- Room lobby UI with player list and ready status (Phase 4)
- Game session management with round synchronization (Phase 4)
- Real-time guess submission and scoring in multiplayer mode (Phase 4)
- Spectator mode or observer connections
- Chat or messaging between players
- Persistent room codes stored in database
- User authentication or player accounts
- Rate limiting or abuse prevention for room creation
- Analytics or telemetry for connection metrics
- WebRTC for peer-to-peer communication
- Server-side game state validation beyond room management
- Horizontal scaling with Redis adapter for multiple server instances
- Load balancing or server clustering
- Advanced reconnection strategies like session migration across servers
