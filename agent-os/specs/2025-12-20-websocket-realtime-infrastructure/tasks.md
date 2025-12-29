# Task Breakdown: WebSocket Real-Time Infrastructure

## Overview
Total Task Groups: 6
Implementation Order: Backend Foundation -> Frontend Foundation -> Integration -> Connection Health -> Testing & Verification
Estimated Total Complexity: Large (L)

## Task List

### Backend Foundation

#### Task Group 1: TypeScript Event Definitions and Server Configuration
**Dependencies:** None
**Complexity:** Medium (M)

- [x] 1.0 Complete TypeScript event type definitions and server configuration
  - [x] 1.1 Write 2-4 focused tests for type safety and server initialization
    - Test Socket.IO server initializes with correct configuration
    - Test server accepts typed event payloads
    - Test server rejects invalid event structures
  - [x] 1.2 Create shared socket event type definitions
    - File: `backend/types/socket-events.ts`
    - Define ServerToClientEvents interface with: connection:status, room:updated, session:restored, connection:health, error
    - Define ClientToServerEvents interface with: room:create, room:join, room:leave, player:ready
    - Define RoomData interface with: roomId (string), players (PlayerData[]), gameState (enum), createdAt (timestamp)
    - Define PlayerData interface with: socketId (string), username (string), isReady (boolean), isHost (boolean)
    - Define ConnectionStatus enum: DISCONNECTED, CONNECTING, CONNECTED, RECONNECTING, ERROR
    - Add comprehensive JSDoc comments explaining each event's purpose
    - Export all interfaces and enums for use in frontend and backend
  - [x] 1.3 Configure Socket.IO server with health monitoring settings
    - File: `backend/src/server.js`
    - Update Socket.IO Server instantiation with TypeScript generics for type safety
    - Configure pingInterval: 25000ms and pingTimeout: 10000ms in server options
    - Set transports: ['websocket', 'polling'] with websocket preferred
    - Maintain existing CORS configuration from current server.js
    - Add environment variable validation on startup (CORS_ORIGIN, PORT)
    - Log server configuration on startup with [Socket.IO] prefix
  - [x] 1.4 Copy type definitions to frontend shared types
    - File: `src/types/socket-events.ts`
    - Copy all interfaces from backend/types/socket-events.ts
    - Ensure both files stay in sync (same event definitions)
    - Export types for use in WebSocketContext and React hooks
  - [x] 1.5 Run type definition and configuration tests
    - Execute ONLY the 2-4 tests written in 1.1
    - Verify server initializes with correct ping/pong settings
    - Confirm type safety is enforced

**Acceptance Criteria:**
- All socket event interfaces properly typed with JSDoc comments
- Socket.IO server configured with health monitoring settings
- Type definitions synchronized between backend and frontend
- All 2-4 tests pass successfully

**Files Created/Modified:**
- `backend/types/socket-events.ts` (completed)
- `src/types/socket-events.ts` (completed)
- `backend/src/server.js` (completed)

---

#### Task Group 2: Room Management System
**Dependencies:** Task Group 1
**Complexity:** Large (L)

- [x] 2.0 Complete in-memory room management system
  - [x] 2.1 Write 3-6 focused tests for room management
    - Test room:create generates unique 6-character alphanumeric room code
    - Test room:join adds player to existing room and prevents overfilling
    - Test room:leave removes player and cleans up empty rooms
    - Test player:ready updates player ready status in room
  - [x] 2.2 Implement in-memory room storage data structure
    - File: `backend/services/RoomManager.ts` (completed)
    - Create Map data structure: roomId -> room metadata
    - Room metadata includes: roomId, players array, gameState enum, createdAt timestamp
    - GameState enum values: 'waiting', 'playing', 'complete'
    - Implement getRooms(), getRoom(roomId), createRoom(), updateRoom(), deleteRoom() methods
    - Export RoomManager class or singleton instance
  - [x] 2.3 Implement room:create event handler
    - File: `backend/src/handlers/socketHandlers.js` (completed)
    - Generate unique 6-character alphanumeric room code using random generation
    - Create new room with creating player as host (isHost: true, isReady: false)
    - Store room in RoomManager Map with gameState: 'waiting'
    - Join socket to Socket.IO room using socket.join(roomId)
    - Emit room:updated event to room with new room data
    - Return roomId to creating client
    - Log room creation with [Socket.IO] prefix
  - [x] 2.4 Implement room:join event handler
    - File: `backend/src/handlers/socketHandlers.js` (completed)
    - Validate room exists (emit error event if not found)
    - Check room not full (max 2-4 players, emit error if full)
    - Add player to room players array (isHost: false, isReady: false)
    - Extract username from socket auth or handshake data
    - Join socket to Socket.IO room using socket.join(roomId)
    - Emit room:updated event to all players in room
    - Store current roomId in socket.data.roomId for cleanup tracking
    - Log player join with [Socket.IO] prefix
  - [x] 2.5 Implement room:leave event handler
    - File: `backend/src/handlers/socketHandlers.js` (completed)
    - Remove player from room's players array
    - Leave Socket.IO room using socket.leave(roomId)
    - Emit room:updated to remaining players
    - Delete room from RoomManager if empty (last player left)
    - Clear socket.data.roomId
    - Log player leave with [Socket.IO] prefix
  - [x] 2.6 Implement player:ready event handler
    - File: `backend/src/handlers/socketHandlers.js` (completed)
    - Find player in room by socket.id
    - Update player's isReady status (toggle or set from payload)
    - Emit room:updated event to all players in room with updated ready states
    - Log ready status change with [Socket.IO] prefix
  - [x] 2.7 Implement automatic room cleanup on disconnect
    - File: `backend/src/handlers/socketHandlers.js` (completed)
    - Extend existing disconnect handler
    - Check if disconnecting socket was in a room (socket.data.roomId)
    - Remove player from room and delete room if empty
    - Emit room:updated to remaining players if room still exists
    - Log cleanup with [Socket.IO] prefix
  - [x] 2.8 Run room management tests
    - Execute ONLY the 3-6 tests written in 2.1
    - Verify room creation, joining, leaving, and cleanup work correctly
    - Confirm ready status updates emit to all room members

**Acceptance Criteria:**
- RoomManager service handles all room CRUD operations
- room:create generates unique codes and initializes rooms correctly
- room:join validates capacity and adds players with proper error handling
- room:leave and disconnect cleanup empty rooms automatically
- player:ready updates broadcast to all room members
- All 3-6 tests pass successfully

**Files Created/Modified:**
- `backend/services/RoomManager.ts` (completed)
- `backend/src/handlers/socketHandlers.js` (completed)

---

#### Task Group 3: Connection Health Monitoring and Session Persistence
**Dependencies:** Task Group 2
**Complexity:** Medium (M)

- [x] 3.0 Complete connection health monitoring and session persistence
  - [x] 3.1 Write 2-5 focused tests for health monitoring and reconnection
    - Test heartbeat ping/pong mechanism tracks latency correctly
    - Test sessionId generation and storage on initial connection
    - Test session restoration on reconnect with valid sessionId
    - Test expired session cleanup after 5 minutes
  - [x] 3.2 Implement heartbeat ping/pong mechanism
    - File: `backend/src/server.js` (completed)
    - Listen to Socket.IO built-in 'ping' and 'pong' events
    - Track last heartbeat timestamp per socket in Map: socketId -> lastPongTime
    - Calculate latency on each pong event: Date.now() - lastPingTime
    - Emit connection:health event to client with latency measurement
    - Log connection health warnings when ping timeout occurs before disconnect
    - Store connection metadata in socket.data: connectTime, reconnectCount
  - [x] 3.3 Implement session ID generation and storage
    - File: `backend/services/SessionManager.ts` (completed)
    - Generate unique sessionId on initial connection (UUID or socket.id derivative)
    - Store sessionId -> session data mapping in Map: sessionId -> { socketId, roomId, timestamp }
    - Session data includes: socketId, current roomId (if in room), creation timestamp
    - Implement getSession(sessionId), createSession(socketId), updateSession(), deleteSession() methods
    - Export SessionManager class or singleton
  - [x] 3.4 Implement session persistence and restoration logic
    - File: `backend/src/handlers/socketHandlers.js` (completed)
    - On connection, check if client sent sessionId in auth payload (socket.handshake.auth.sessionId)
    - If sessionId valid and not expired (< 5 minutes old), restore session
    - Restore room membership if session had roomId and room still exists
    - Emit session:restored event to client with previous game state (room data)
    - Increment socket.data.reconnectCount if restoring session
    - If new session, create sessionId and store in SessionManager
    - Send sessionId to client so it can be stored in sessionStorage
    - Log session creation/restoration with [Socket.IO] prefix
  - [x] 3.5 Implement session cleanup task
    - File: `backend/src/handlers/socketHandlers.js` (completed)
    - Use setInterval to run cleanup every 60 seconds
    - Find sessions older than 5 minutes (300000ms) in SessionManager
    - Delete expired sessions from SessionManager Map
    - Log cleanup summary with [Socket.IO] prefix (e.g., "Cleaned up 3 expired sessions")
    - Clear interval on server shutdown in SIGTERM handler
  - [x] 3.6 Run health monitoring and session tests
    - Execute ONLY the 2-5 tests written in 3.1
    - Verify ping/pong latency tracking works correctly
    - Confirm session restoration rejoins user to previous room
    - Test session expiration after 5 minutes

**Acceptance Criteria:**
- Heartbeat mechanism tracks connection health and emits latency to clients
- SessionManager creates and stores sessions on connection
- Session restoration rejoins users to their previous room if valid
- Expired sessions cleaned up automatically every 60 seconds
- All 2-5 tests pass successfully

**Files Created/Modified:**
- `backend/services/SessionManager.ts` (completed)
- `backend/src/handlers/socketHandlers.js` (completed)

---

### Frontend Foundation

#### Task Group 4: WebSocket Context and Provider
**Dependencies:** Task Group 1
**Complexity:** Large (L)

- [x] 4.0 Complete WebSocket Context architecture with React
  - [x] 4.1 Write 3-6 focused tests for WebSocketContext
    - Test WebSocketProvider initializes socket connection correctly
    - Test connection state transitions (DISCONNECTED -> CONNECTING -> CONNECTED)
    - Test socket disconnects and cleans up on component unmount
    - Test useSocket hook throws error when used outside provider
  - [x] 4.2 Define WebSocket state interface and action types
    - File: `src/types/websocket.ts` (completed)
    - Define WebSocketState interface with: connectionStatus (enum), socket (Socket | null), error (string | null), sessionId (string | null), latency (number | null)
    - Define WebSocketAction discriminated union with types: CONNECT_INIT, CONNECT_SUCCESS, CONNECT_ERROR, DISCONNECT, RECONNECT_ATTEMPT, UPDATE_LATENCY, UPDATE_SESSION_ID
    - Use ConnectionStatus enum from socket-events.ts
    - Export WebSocketState and WebSocketAction types
  - [x] 4.3 Implement WebSocket reducer function
    - File: `src/context/WebSocketContext.tsx` (completed)
    - Function: `websocketReducer(state: WebSocketState, action: WebSocketAction): WebSocketState`
    - Handle all action types with immutable state updates
    - CONNECT_INIT sets status to CONNECTING
    - CONNECT_SUCCESS sets status to CONNECTED, stores socket instance
    - CONNECT_ERROR sets status to ERROR, stores error message
    - DISCONNECT sets status to DISCONNECTED, clears socket
    - RECONNECT_ATTEMPT sets status to RECONNECTING
    - UPDATE_LATENCY stores latency measurement
    - UPDATE_SESSION_ID stores sessionId in state
    - Pure function with no side effects
  - [x] 4.4 Create WebSocketContext with provider component
    - File: `src/context/WebSocketContext.tsx` (completed)
    - Use React.createContext with WebSocketState and dispatch
    - Initialize socket.io-client in WebSocketProvider useEffect
    - Get WebSocket URL from import.meta.env.VITE_WEBSOCKET_URL
    - Configure socket with: autoConnect: true, reconnection: false (manual), timeout: 10000, transports: ['websocket', 'polling']
    - Pass sessionId in auth object during connection if available in sessionStorage
    - Set up connection, disconnect, connect_error event listeners
    - Dispatch appropriate actions on each event
    - Clean up socket on component unmount: socket.disconnect(), socket.removeAllListeners()
    - Follow GameContext.tsx pattern for provider structure
  - [x] 4.5 Implement sessionId persistence in sessionStorage
    - File: `src/context/WebSocketContext.tsx` (completed)
    - On mount, read sessionId from sessionStorage.getItem('geoquest_session_id')
    - Pass sessionId in socket auth if found
    - Listen for session:restored event from server
    - On new connection, listen for sessionId from server and store in sessionStorage
    - Store using sessionStorage.setItem('geoquest_session_id', sessionId)
    - Clear sessionId from sessionStorage on explicit disconnect (not on page refresh)
  - [x] 4.6 Create useSocket custom hook
    - File: `src/context/WebSocketContext.tsx` (completed)
    - Export useSocket hook returning { state, dispatch, reconnect, disconnect }
    - Throw error with descriptive message if used outside WebSocketProvider
    - Follow useGame pattern from GameContext.tsx
    - Type return value explicitly for IntelliSense support
  - [x] 4.7 Run WebSocketContext tests
    - Execute ONLY the 3-6 tests written in 4.1
    - Verify provider initializes and manages socket lifecycle
    - Confirm reducer handles all state transitions correctly

**Acceptance Criteria:**
- WebSocketState and actions properly typed with discriminated unions
- Reducer handles all connection state transitions immutably
- WebSocketProvider initializes socket.io-client with correct configuration
- sessionId persists in sessionStorage across page refresh
- useSocket hook provides socket instance and connection status
- All 3-6 tests pass successfully

**Files Created/Modified:**
- `src/types/websocket.ts` (completed)
- `src/context/WebSocketContext.tsx` (completed)

---

#### Task Group 5: Custom React Hooks and Reconnection Logic
**Dependencies:** Task Group 4
**Complexity:** Medium (M)

- [x] 5.0 Complete custom React hooks and automatic reconnection
  - [x] 5.1 Write 2-5 focused tests for custom hooks and reconnection
    - Test useSocketEvent registers and cleans up event listener correctly
    - Test useSocketEvent callback receives typed event payload
    - Test automatic reconnection with exponential backoff on disconnect
    - Test manual retry after max reconnection attempts
  - [x] 5.2 Create useSocketEvent custom hook
    - File: `src/hooks/useSocketEvent.ts` (completed)
    - Accept event name and callback function as parameters
    - Use TypeScript generics to enforce type-safe event names matching socket-events.ts
    - Set up socket.on(eventName, callback) in useEffect
    - Clean up listener on unmount or when dependencies change using socket.off()
    - Throw error if socket is null (connection not established)
    - Return void (hook manages side effect only)
    - Add JSDoc explaining usage and type safety
  - [x] 5.3 Implement automatic reconnection with exponential backoff
    - File: `src/context/WebSocketContext.tsx` (completed)
    - Listen to disconnect event in WebSocketProvider
    - Check disconnect reason (transport error, ping timeout) to determine if reconnection needed
    - Transition to RECONNECTING status if disconnect was due to network issue
    - Implement manual exponential backoff using setTimeout
    - Backoff delays: 1s, 2s, 4s, 8s, 16s (capped at 30s max)
    - Track reconnection attempt count in state
    - After max attempts (5), transition to ERROR status
    - Allow manual retry by exposing reconnect() function from useSocket hook
    - On successful reconnect, reset backoff delay to 1s
    - Emit reconnection:success or reconnection:failed for UI feedback
  - [x] 5.4 Implement connection health event listener
    - File: `src/context/WebSocketContext.tsx` (completed)
    - Listen to ping/pong events from Socket.IO
    - Calculate latency from ping/pong round-trip
    - Dispatch UPDATE_LATENCY action to store in state
    - Latency available via useSocket hook for UI display
  - [x] 5.5 Add development mode logging
    - File: `src/context/WebSocketContext.tsx` (completed)
    - Log all socket events in development mode (import.meta.env.DEV)
    - Use console.log with [WebSocket] prefix and timestamp
    - Log: connect, disconnect, error, reconnect attempts, session restoration
    - Suppress verbose logging in production mode
    - Only log errors and critical events in production
  - [x] 5.6 Run custom hooks and reconnection tests
    - Execute ONLY the 2-5 tests written in 5.1
    - Verify useSocketEvent registers listeners with type safety
    - Confirm exponential backoff reconnection works correctly

**Acceptance Criteria:**
- useSocketEvent hook provides type-safe event listener registration
- Automatic reconnection attempts with exponential backoff on network failures
- Manual retry available after max reconnection attempts exceeded
- connection:health events update latency in state
- Development logging aids debugging without cluttering production
- All 2-5 tests pass successfully

**Files Created/Modified:**
- `src/hooks/useSocketEvent.ts` (completed)
- `src/hooks/useSocket.ts` (completed - convenience re-export)
- `src/context/WebSocketContext.tsx` (completed)

---

### UI Layer

#### Task Group 6: Connection Status UI Component
**Dependencies:** Task Group 5
**Complexity:** Small (S)

- [x] 6.0 Complete connection status indicator UI component
  - [x] 6.1 Write 2-4 focused tests for ConnectionStatusIndicator
    - Test component renders green dot when status is CONNECTED
    - Test component renders yellow pulsing dot when CONNECTING or RECONNECTING
    - Test component renders red dot when DISCONNECTED or ERROR
    - Test latency displays correctly when connected
  - [x] 6.2 Create ConnectionStatusIndicator component
    - File: `src/components/ConnectionStatus.tsx` (completed)
    - Use useSocket hook to get connectionStatus and latency
    - Display colored dot indicator based on status:
      - Green dot: CONNECTED
      - Yellow pulsing dot: CONNECTING or RECONNECTING
      - Red dot: DISCONNECTED or ERROR
    - Show latency in ms next to indicator when CONNECTED
    - Display reconnection attempt count during RECONNECTING state
    - Position in top-right corner with fixed positioning (fixed top-4 right-4)
    - Use high z-index (z-50) to stay above other UI elements
    - Props: none (reads from context)
  - [x] 6.3 Add tooltip with connection status details
    - File: `src/components/ConnectionStatus.tsx` (completed)
    - Show tooltip on hover with current status text
    - Include reconnection attempt count if reconnecting
    - Include error message if status is ERROR
    - Use Tailwind CSS for tooltip styling
  - [x] 6.4 Add manual retry button for ERROR state
    - File: `src/components/ConnectionStatus.tsx` (completed)
    - Show retry button when status is ERROR
    - Clicking triggers manual reconnection attempt
    - Call reconnect() function from useSocket hook
    - Button appears as small icon or text next to red dot
    - Accessible with proper ARIA labels
  - [x] 6.5 Add pulsing animation for connecting states
    - File: `src/components/ConnectionStatus.tsx` (completed)
    - Create CSS animation for yellow dot pulse effect
    - Use Tailwind CSS animate-pulse or custom keyframe animation
    - Animation indicates active connection attempt in progress
  - [x] 6.6 Integrate ConnectionStatusIndicator into App
    - File: `src/App.tsx` (completed)
    - Wrap app with WebSocketProvider from WebSocketContext
    - Render ConnectionStatus as fixed overlay
    - Ensure indicator appears on all pages/routes
    - Position does not interfere with existing GameInfoCard (top-left)
  - [x] 6.7 Run ConnectionStatusIndicator tests
    - Execute ONLY the 2-4 tests written in 6.1
    - Verify component renders correct indicators for each status
    - Confirm latency displays when connected

**Acceptance Criteria:**
- ConnectionStatusIndicator component displays correct colored dot for each connection status
- Latency shown in ms when connected
- Reconnection attempt count visible during reconnecting state
- Manual retry button appears on error state
- Pulsing animation for connecting/reconnecting states
- Component positioned in top-right corner without interfering with game UI
- All 2-4 tests pass successfully

**Files Created/Modified:**
- `src/components/ConnectionStatus.tsx` (completed)
- `src/App.tsx` (completed)

---

### Environment Configuration

#### Task Group 7: Environment Variables and Documentation
**Dependencies:** None (can run in parallel with Task Group 1)
**Complexity:** Small (S)

- [x] 7.0 Complete environment variable configuration
  - [x] 7.1 Update .env.example for frontend
    - File: `.env.example` (completed)
    - Add VITE_WEBSOCKET_URL with default value ws://localhost:3001
    - Add comment explaining ws:// for local dev, wss:// for production
    - Add comment for Docker setup: ws://backend:3001
  - [ ] 7.2 Update .env.example for backend
    - File: `backend/.env.example`
    - Add PORT with default value 3001
    - Add CORS_ORIGIN with default value http://localhost:5173
    - Add NODE_ENV with default value development
    - Add comments explaining each variable's purpose
  - [ ] 7.3 Update README with WebSocket configuration documentation
    - File: `README.md`
    - Add section explaining WebSocket setup for Phase 3
    - Document environment variables: VITE_WEBSOCKET_URL, PORT, CORS_ORIGIN
    - Provide examples for local development vs Docker setup
    - Explain difference between ws:// and wss:// protocols
    - Note that this phase is infrastructure only (multiplayer in Phase 4)
  - [x] 7.4 Validate environment variables on server startup
    - File: `backend/src/server.js` (completed)
    - Check if CORS_ORIGIN is set, log warning if using default
    - Validate PORT is a valid number
    - Log all WebSocket-related configuration on startup
    - Exit with error message if critical variables missing

**Acceptance Criteria:**
- .env.example files updated with WebSocket-related variables
- README documents WebSocket setup for different environments
- Server validates environment variables on startup
- Clear documentation for ws:// vs wss:// protocols

**Files Created/Modified:**
- `.env.example` (completed)
- `backend/.env.example` (pending)
- `README.md` (pending)
- `backend/src/server.js` (completed)

---

### Testing & Integration

#### Task Group 8: Integration Testing and Error Handling
**Dependencies:** Task Groups 1-6
**Complexity:** Medium (M)

- [ ] 8.0 Complete integration testing and centralized error handling
  - [ ] 8.1 Write 3-7 focused tests for integration and error handling
    - Test complete connection flow: connect -> join room -> disconnect -> reconnect -> restore session
    - Test server-side error events propagate to client and display in UI
    - Test room:updated events trigger re-renders in UI components
    - Test connection timeout scenario and error handling
  - [ ] 8.2 Implement centralized error handling in WebSocketContext
    - File: `src/context/WebSocketContext.tsx`
    - Listen to error events from server
    - Parse error payload: { code, message, severity }
    - Dispatch CONNECT_ERROR action with user-friendly message
    - Map technical error codes to user-friendly messages
    - Store error in state for display by ConnectionStatusIndicator
    - Log full error details in development mode only
  - [ ] 8.3 Implement server-side payload validation
    - File: `backend/src/server.js`
    - Validate all incoming event payloads before processing
    - Check required fields exist and have correct types
    - Emit error event to client if validation fails
    - Error format: { code: string, message: string, severity: 'warning' | 'error' | 'critical' }
    - Example: room:join requires { roomId: string, username: string }
    - Log validation failures with [Socket.IO] prefix
  - [ ] 8.4 Add error logging for critical server errors
    - File: `backend/src/server.js`
    - Catch errors in event handlers using try/catch
    - Log error stack traces with [Socket.IO] prefix
    - Emit error event to client with safe error message (no technical details)
    - Track error frequency for monitoring (simple counter)
  - [ ] 8.5 Test room event propagation to frontend
    - Create test utility component that uses useSocketEvent hook
    - Listen to room:updated event and verify callback triggered
    - Confirm event payload matches RoomData interface type
    - Test with multiple clients in same room (requires test setup)
  - [ ] 8.6 Test session restoration end-to-end
    - Simulate disconnect -> reconnect flow with sessionId
    - Verify client sends sessionId in auth payload on reconnect
    - Confirm server restores room membership
    - Verify session:restored event received by client with room data
  - [ ] 8.7 Run integration and error handling tests
    - Execute ONLY the 3-7 tests written in 8.1
    - Verify complete connection lifecycle works end-to-end
    - Confirm error handling displays user-friendly messages

**Acceptance Criteria:**
- Centralized error handling in WebSocketContext maps server errors to user-friendly messages
- Server validates all incoming event payloads and emits errors on validation failure
- Integration tests verify complete connection flow including session restoration
- room:updated events properly propagate to frontend components
- All 3-7 tests pass successfully

**Files Created/Modified:**
- `src/context/WebSocketContext.tsx` (modified)
- `backend/src/server.js` (modified)

---

### Final Verification

#### Task Group 9: End-to-End Verification and Code Quality
**Dependencies:** Task Groups 1-8
**Complexity:** Medium (M)

- [ ] 9.0 Complete final verification, testing, and code quality review
  - [ ] 9.1 Review all tests from previous task groups
    - Review 2-4 tests from Task 1.1 (type definitions)
    - Review 3-6 tests from Task 2.1 (room management)
    - Review 2-5 tests from Task 3.1 (health monitoring)
    - Review 3-6 tests from Task 4.1 (WebSocketContext)
    - Review 2-5 tests from Task 5.1 (custom hooks)
    - Review 2-4 tests from Task 6.1 (UI component)
    - Review 3-7 tests from Task 8.1 (integration)
    - Total existing tests: approximately 17-37 tests
  - [ ] 9.2 Analyze test coverage gaps for Phase 3 feature only
    - Identify critical WebSocket workflows lacking test coverage
    - Focus ONLY on gaps related to real-time infrastructure
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end connection flows over isolated unit tests
  - [ ] 9.3 Write up to 8 additional strategic tests maximum
    - Add maximum of 8 new tests to fill identified critical gaps
    - Focus on integration between frontend and backend WebSocket events
    - Test multi-client scenarios (multiple users in same room)
    - Test edge cases: network interruption during room join, stale session restoration
    - Do NOT write comprehensive coverage for all scenarios
    - Skip performance tests and stress tests unless business-critical
  - [ ] 9.4 Run all Phase 3 feature tests
    - Run ONLY tests related to WebSocket infrastructure feature
    - Expected total: approximately 25-45 tests maximum
    - Do NOT run entire application test suite
    - Verify all critical workflows pass
    - Generate test coverage report for Phase 3 code only
  - [ ] 9.5 Manual integration testing with multiple clients
    - Start backend server with `npm run dev`
    - Open multiple browser tabs/windows with frontend
    - Test room creation and joining from different clients
    - Test real-time room:updated events propagate to all clients
    - Test disconnect/reconnect with session restoration
    - Test connection status indicator updates in real-time
    - Verify latency displays correctly in ConnectionStatusIndicator
  - [ ] 9.6 Code quality review
    - Verify TypeScript types properly defined for all socket events
    - Confirm no linting errors with `npm run lint` in both frontend and backend
    - Run `npm run format` to ensure consistent code style
    - Check for unused imports or dead code
    - Verify all functions are properly typed (no implicit any)
    - Ensure all event handlers have error handling (try/catch)
  - [ ] 9.7 Documentation review
    - Verify JSDoc comments on all interfaces in socket-events.ts
    - Ensure WebSocketContext and custom hooks have usage examples
    - Confirm README accurately documents WebSocket setup
    - Add inline comments for complex reconnection logic
  - [ ] 9.8 Performance and cleanup verification
    - Test with React DevTools to check for unnecessary re-renders in WebSocketProvider
    - Verify socket cleanup on unmount (no memory leaks)
    - Test with browser DevTools Network tab to confirm WebSocket connection established
    - Monitor ping/pong messages in network traffic
    - Verify session cleanup task runs every 60 seconds on backend
    - Check that empty rooms are deleted automatically

**Acceptance Criteria:**
- All Phase 3 feature tests pass (approximately 25-45 tests total)
- No more than 8 additional tests added when filling gaps
- Manual testing confirms multi-client room management works correctly
- Code passes linting and formatting checks
- No console errors during connection lifecycle
- WebSocket connection visible in browser DevTools
- Session restoration works after page refresh within 5 minutes
- All JSDoc comments and documentation complete

**Files Modified:**
- Various test files across frontend and backend
- Documentation files (README.md)

---

## Execution Order

Recommended implementation sequence:

1. **Backend Foundation - Type Definitions** (Task Group 1) - Establish type-safe event contracts ✅
2. **Backend Foundation - Room Management** (Task Group 2) - Build core room functionality ✅
3. **Backend Foundation - Health & Sessions** (Task Group 3) - Add connection monitoring and persistence ✅
4. **Frontend Foundation - Context** (Task Group 4) - Create WebSocket React architecture ✅
5. **Frontend Foundation - Hooks** (Task Group 5) - Build custom hooks and reconnection ✅
6. **UI Layer** (Task Group 6) - Add connection status indicator ✅
7. **Environment Configuration** (Task Group 7) - Can run in parallel with Task Group 1 (Partial)
8. **Testing & Integration** (Task Group 8) - Verify frontend-backend integration
9. **Final Verification** (Task Group 9) - End-to-end testing and polish

**Parallel Execution Opportunities:**
- Task Group 7 (Environment Config) can run parallel to Task Group 1
- Task Groups 4-5 (Frontend) can begin as soon as Task Group 1 (Types) is complete

---

## Implementation Notes

**Technology Stack:**
- **Backend:** Node.js, Express, Socket.IO 4.x, ES6 modules
- **Frontend:** React 18.3, TypeScript, socket.io-client
- **Testing:** Vitest for unit tests, manual multi-client testing
- **Storage:** In-memory Maps (no database), sessionStorage for sessionId

**Key Technical Decisions:**
- **In-memory only:** All rooms and sessions stored in memory, lost on server restart
- **No persistence:** This is infrastructure phase, full multiplayer game logic in Phase 4
- **Type safety:** Shared type definitions between frontend and backend for compile-time safety
- **Session window:** 5-minute session persistence allows reconnection after brief disconnects
- **Manual backoff:** Implement exponential backoff manually (not relying on Socket.IO built-in)
- **No auth:** Player identification via username only, no authentication in this phase

**Testing Strategy:**
- Write 2-7 focused tests per task group during development
- Test critical behaviors only: connection lifecycle, room management, session restoration
- Run only newly written tests at end of each task group
- Add up to 8 strategic tests maximum in final verification phase
- Manual multi-client testing required for real-time event propagation
- Focus on integration tests over exhaustive unit test coverage

**Design Considerations:**
- **Non-intrusive UI:** ConnectionStatusIndicator in top-right, small and unobtrusive
- **Clear feedback:** Color-coded connection status (green/yellow/red) for quick recognition
- **Graceful degradation:** Handle errors without crashing, provide retry mechanism
- **Development experience:** Verbose logging in dev mode, silent in production
- **Accessibility:** Proper ARIA labels on retry button and status indicator

**Out of Scope for Phase 3:**
- Full multiplayer game synchronization (Phase 4)
- Room lobby UI with player list (Phase 4)
- Real-time guess submission (Phase 4)
- Persistent room codes in database
- User authentication or accounts
- Rate limiting or abuse prevention
- Redis adapter for horizontal scaling
- Production WebSocket deployment configuration (wss://, SSL)

---

## Files Summary

### New Files Created (13 total)
**Backend:**
- `backend/types/socket-events.ts` - Shared TypeScript event type definitions ✅
- `backend/services/RoomManager.ts` - In-memory room management service ✅
- `backend/services/SessionManager.ts` - Session persistence service ✅

**Frontend:**
- `src/types/socket-events.ts` - Shared TypeScript event type definitions (copy) ✅
- `src/types/websocket.ts` - WebSocket state and action types ✅
- `src/context/WebSocketContext.tsx` - React Context for WebSocket connection ✅
- `src/hooks/useSocket.ts` - Convenience hook for accessing socket ✅
- `src/hooks/useSocketEvent.ts` - Custom hook for type-safe event listeners ✅
- `src/components/ConnectionStatus.tsx` - Connection status UI component ✅

**Tests (approximately 5-10 test files):**
- Various test files for backend services, frontend context, hooks, and components

**Documentation:**
- `.env.example` entries ✅
- `backend/.env.example` entries (pending)
- `README.md` sections (pending)

### Modified Files (5 total)
- `backend/src/server.js` - Enhanced with room management, health monitoring, session persistence ✅
- `backend/src/handlers/socketHandlers.js` - Socket event handlers ✅
- `src/App.tsx` - Wrapped with WebSocketProvider, added ConnectionStatus ✅
- `.env.example` - Added VITE_WEBSOCKET_URL ✅
- `backend/.env.example` - (pending)
- `README.md` - (pending)
