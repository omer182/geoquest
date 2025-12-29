# Specification: Multiplayer Room System UI

## Goal
Build the complete multiplayer lobby UI that enables players to create rooms, join via room codes or shareable links, manage ready states, and start multiplayer games. This phase focuses solely on the room management interface and does not include gameplay synchronization (reserved for Phase 5).

## User Stories
- As a player, I want to access a main menu where I can choose between single player and multiplayer modes so that I can easily navigate game modes
- As a host, I want to create a multiplayer room and share the room code or link with friends so that they can join my game
- As a player, I want to join a room using a 5-digit code or shareable link so that I can play with others
- As a host, I want to select difficulty and start the game when all players are ready so that we can begin playing together

## Specific Requirements

**Main Menu Screen**
- Replace the current "Start Game" button in Game.tsx READY state with a main menu offering three options: "Single Player", "Multiplayer", and "About"
- Use dark theme styling consistent with existing components (dark-base background, primary accent colors)
- Center menu on screen with large, touch-friendly buttons (min-height: 44px)
- Single Player launches the existing single-player game flow unchanged
- Multiplayer navigates to the multiplayer submenu
- About shows a simple modal with game information and rules

**Multiplayer Submenu**
- Display two options: "Create Room" and "Join Room"
- Both buttons use gradient styling similar to LevelComplete component
- Include a back button to return to main menu
- Maintain centered layout with consistent spacing

**Create Room Flow**
- Prompt for player name input (required, max 20 characters, validated)
- On submit, emit SOCKET_EVENTS.CREATE_ROOM with playerName and maxPlayers (default: 2)
- Listen for SOCKET_EVENTS.ROOM_CREATED response to receive room code and player info
- Navigate to Room Lobby screen automatically on successful creation
- Show error toast if room creation fails using existing error handling patterns

**Join Room Flow**
- Display input for 5-digit room code (uppercase letters/numbers only, auto-format as user types)
- Prompt for player name input (required, max 20 characters)
- Support URL parameter-based joining (e.g., /room?code=ABC12) for shareable links
- On submit, emit SOCKET_EVENTS.JOIN_ROOM with roomCode and playerName
- Listen for SOCKET_EVENTS.ROOM_JOINED response
- Navigate to Room Lobby screen on successful join
- Show specific error messages for ROOM_NOT_FOUND, ROOM_FULL, or GAME_IN_PROGRESS errors

**Room Lobby Screen**
- Display room code prominently at top (large, easy to read, copyable)
- Show "Share Link" button that copies full URL with room code to clipboard
- List all players in room with names and ready status indicators (checkmark icon when ready)
- Highlight host with a crown icon or "HOST" badge
- Show current player count (e.g., "2/2 players")
- For non-host players: show "Ready" toggle button
- For host: show difficulty selector dropdown (Easy, Medium, Hard) and "Start Game" button (disabled until all non-host players are ready)
- Include "Leave Room" button for all players
- Use real-time updates via SOCKET_EVENTS listeners (PLAYER_JOINED, PLAYER_LEFT, PLAYER_READY_CHANGED, ROOM_UPDATED)

**Room Code Alignment**
- Backend currently generates 6-character codes, but user requires 5-digit codes
- Update RoomManager.generateRoomCode() to generate 5-digit numeric codes instead of 6-character alphanumeric
- Update Room interface code property documentation to reflect 5-digit format
- Ensure UI validation and display logic supports 5-digit codes

**Host Controls**
- Only the host can select difficulty level (stored in GameContext multiplayer state)
- Only the host can click "Start Game" button
- Start Game button is disabled unless all non-host players have isReady: true
- When host clicks Start Game, emit SOCKET_EVENTS.GAME_START with difficulty and roomCode
- Transition all players to the multiplayer game screen (Phase 5 implementation)

**Host Leave Behavior**
- When host leaves via Leave Room button or disconnection, backend automatically destroys the room
- All remaining players receive a ROOM_UPDATED event showing empty room or PLAYER_LEFT event
- Display modal to all players: "The host has left. The room has been closed."
- Automatically navigate all players back to main menu after 3 seconds
- Clear any room state from GameContext

**Play Again Feature**
- After multiplayer game ends (Phase 5), show "Play Again" button in results screen
- Clicking "Play Again" returns all players to Room Lobby with same players
- Maintain room code and player list, reset ready states to false
- Host can select new difficulty and start another game

**GameContext Extensions**
- Extend existing GameContext (do NOT create separate context) with new multiplayer-specific state properties
- Add: multiplayerMode (boolean), currentRoom (Room | null), currentPlayer (Player | null), difficulty ('easy' | 'medium' | 'hard' | null)
- Add new actions: SET_MULTIPLAYER_ROOM, UPDATE_ROOM_STATE, LEAVE_MULTIPLAYER_ROOM, SET_DIFFICULTY
- Update reducer to handle multiplayer actions without affecting existing single-player logic
- Preserve all existing single-player state and actions

**WebSocket Integration**
- Use existing useSocket() and useSocketEvent() hooks from Phase 3
- Emit events using: state.socket.emit(SOCKET_EVENTS.EVENT_NAME, payload)
- Listen to events using: useSocketEvent(SOCKET_EVENTS.EVENT_NAME, callback)
- Handle connection status from WebSocketContext to show reconnecting state in lobby
- Display ConnectionStatus indicator (already in App.tsx) at all times
- Handle reconnection by attempting to restore session using SOCKET_EVENTS.RESTORE_SESSION

**Shareable Room Links**
- Generate shareable link format: https://[domain]/room?code=[5-digit-code]
- Clicking "Share Link" button copies full URL to clipboard and shows "Link copied!" toast
- On app load, check URL for ?code= parameter
- If code parameter exists, automatically show Join Room screen with code pre-filled
- Use react-router or window.location for URL handling

**Error Handling**
- Display user-friendly error messages for all socket errors using toast notifications
- Map SocketErrorCode enum values to readable messages (e.g., ROOM_NOT_FOUND: "Room not found. Please check the code.")
- Show reconnecting state in lobby if WebSocket disconnects
- Prevent room actions during reconnection with disabled buttons
- Auto-retry failed actions after successful reconnection

**Visual Design**
- Use existing dark theme color palette: dark-base (#0f172a), dark-surface (#1e293b), dark-elevated (#334155)
- Primary accent: cyan-500 (#06b6d4) for interactive elements
- Secondary accent: amber-500 (#f59e0b) for highlights
- Use existing animations: fade-in, slide-up for screen transitions
- Match button styling from LevelComplete.tsx (gradients, shadows, hover effects)
- Use GameInfoCard.tsx layout patterns for player list cards
- Ensure all touch targets meet 44px minimum for mobile accessibility

## Existing Code to Leverage

**WebSocketContext and Hooks**
- useSocket() hook provides socket instance, connection status, reconnect/disconnect functions
- useSocketEvent() hook enables type-safe event listeners with automatic cleanup
- WebSocketProvider already wraps App.tsx, available everywhere
- ConnectionStatus component displays real-time connection state in top-right corner
- Use existing SOCKET_EVENTS constants and TypeScript types from socket-events.ts

**RoomManager Backend Service**
- createRoom(playerName, socketId, maxPlayers) generates room and returns Room object
- joinRoom(roomCode, playerName, socketId) adds player to existing room
- leaveRoom(roomCode, socketId) removes player, handles host reassignment, destroys empty rooms
- setPlayerReady(roomCode, socketId, isReady) toggles player ready state
- All methods emit proper events (room:created, room:joined, player:joined, etc.) to connected sockets

**GameContext Pattern**
- Follow existing reducer pattern with pure functions and action types
- Maintain immutability (spread operators for state updates)
- Use GameProvider wrapper component to provide context
- Export custom useGame() hook for component access
- Add multiplayer actions alongside existing single-player actions

**UI Component Patterns**
- LevelComplete.tsx demonstrates modal overlay, gradient buttons, progress indicators, centered layout
- GameInfoCard.tsx shows dark-themed card design with grid layout for info display
- Game.tsx READY state shows how to render initial screens before gameplay
- Use similar structure: overlay with centered card, multiple action buttons, responsive design

**Dark Theme Utilities**
- Tailwind config defines custom dark theme colors and animations
- Use bg-dark-base for main backgrounds, bg-dark-elevated for cards
- Apply text-primary for accents, text-gray-400 for secondary text
- Leverage animate-fade-in and animate-slide-up for transitions
- Use rounded-lg or rounded-xl for consistent border radius

## Out of Scope
- Multiplayer gameplay synchronization (Phase 5)
- Real-time guess sharing during rounds (Phase 5)
- Chat functionality between players
- Spectator mode for non-playing viewers
- Custom game settings beyond difficulty (round count, time limits, etc.)
- Multiple simultaneous rounds or tournaments
- Player authentication or persistent accounts
- Room passwords or private rooms
- Kicking players from room
- In-game leaderboards or statistics
