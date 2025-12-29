# Task Breakdown: Multiplayer Room System UI

## Overview
Total Task Groups: 5
Focus: Building complete multiplayer lobby UI for room creation, joining, and management.

This breakdown implements Phase 4 of the GeoQuest multiplayer system, building on the completed Phase 3 WebSocket infrastructure. The implementation extends the existing GameContext with multiplayer state while preserving all single-player functionality.

## Task List

### Backend Alignment

#### Task Group 1: Room Code Format Alignment
**Dependencies:** None

- [ ] 1.0 Align room code format between backend and UI requirements
  - [ ] 1.1 Write 2-4 focused tests for room code generation
    - Test that generated codes are exactly 5 characters long
    - Test that codes contain only numeric digits (0-9)
    - Test that codes are unique across multiple generations
  - [ ] 1.2 Update RoomManager.generateRoomCode() method
    - Change from 6-character alphanumeric to 5-digit numeric format
    - Generate codes in range 00000-99999
    - Maintain uniqueness check logic
    - Location: backend/src/services/RoomManager.ts
  - [ ] 1.3 Update Room interface documentation
    - Update code property comment to reflect 5-digit format
    - Location: src/types/socket-events.ts
  - [ ] 1.4 Update validation patterns
    - Update any regex patterns that validate room codes
    - Ensure JoinRoomRequest accepts 5-digit codes
    - Location: backend/src/services/RoomManager.ts
  - [ ] 1.5 Ensure room code tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify 5-digit codes are generated correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 1.1 pass
- Room codes are exactly 5 digits (numeric only)
- Backend accepts and validates 5-digit codes
- Type definitions reflect 5-digit format

### State Management

#### Task Group 2: GameContext Multiplayer Extensions
**Dependencies:** Task Group 1

- [ ] 2.0 Extend GameContext with multiplayer state
  - [ ] 2.1 Write 2-6 focused tests for multiplayer state management
    - Test SET_MULTIPLAYER_ROOM action updates room and player state
    - Test UPDATE_ROOM_STATE action merges room updates
    - Test LEAVE_MULTIPLAYER_ROOM action clears multiplayer state
    - Test SET_DIFFICULTY action updates difficulty selection
    - Test that single-player actions remain unaffected
  - [ ] 2.2 Extend GameState interface with multiplayer properties
    - Add multiplayerMode: boolean (default: false)
    - Add currentRoom: Room | null (default: null)
    - Add currentPlayer: Player | null (default: null)
    - Add difficulty: 'easy' | 'medium' | 'hard' | null (default: null)
    - Location: src/types/game.ts
  - [ ] 2.3 Add multiplayer action types to GameAction union
    - SET_MULTIPLAYER_ROOM: { room: Room; player: Player }
    - UPDATE_ROOM_STATE: { room: Room }
    - LEAVE_MULTIPLAYER_ROOM: {}
    - SET_DIFFICULTY: { difficulty: 'easy' | 'medium' | 'hard' }
    - Location: src/types/game.ts
  - [ ] 2.4 Update gameReducer with multiplayer action handlers
    - SET_MULTIPLAYER_ROOM: sets multiplayerMode=true, currentRoom, currentPlayer
    - UPDATE_ROOM_STATE: updates currentRoom while preserving other state
    - LEAVE_MULTIPLAYER_ROOM: resets to initialState, clears multiplayer fields
    - SET_DIFFICULTY: updates difficulty field
    - Maintain immutability with spread operators
    - Location: src/context/GameContext.tsx
  - [ ] 2.5 Update initialState with new multiplayer fields
    - Set all new fields to their default values
    - Preserve existing single-player fields unchanged
    - Location: src/context/GameContext.tsx
  - [ ] 2.6 Ensure GameContext tests pass
    - Run ONLY the 2-6 tests written in 2.1
    - Verify multiplayer actions work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-6 tests written in 2.1 pass
- GameState includes all multiplayer fields with correct types
- Reducer handles all multiplayer actions without breaking single-player logic
- State remains immutable across all actions
- Existing single-player game flow is unaffected

### Core UI Components

#### Task Group 3: Menu and Multiplayer Entry Components
**Dependencies:** Task Group 2

- [ ] 3.0 Build main menu and multiplayer entry screens
  - [ ] 3.1 Write 2-8 focused tests for menu navigation
    - Test MainMenu component renders three buttons (Single Player, Multiplayer, About)
    - Test MultiplayerSubmenu component renders Create/Join options
    - Test navigation between menu screens
    - Test AboutModal displays and closes correctly
  - [ ] 3.2 Create MainMenu component
    - Replace "Start Game" button in Game.tsx READY state
    - Three centered buttons: Single Player, Multiplayer, About
    - Follow LevelComplete.tsx gradient button styling
    - Dark theme: bg-dark-base, text-primary accents
    - Min-height: 44px for touch targets
    - Location: src/components/multiplayer/MainMenu.tsx
  - [ ] 3.3 Create MultiplayerSubmenu component
    - Two centered buttons: Create Room, Join Room
    - Back button returns to MainMenu
    - Gradient styling matching MainMenu
    - Centered layout with consistent spacing
    - Location: src/components/multiplayer/MultiplayerSubmenu.tsx
  - [ ] 3.4 Create AboutModal component
    - Modal overlay with dark theme styling
    - Display game rules and information
    - Close button to dismiss
    - Follow LevelComplete.tsx modal pattern (fixed inset-0, centered)
    - Location: src/components/multiplayer/AboutModal.tsx
  - [ ] 3.5 Update Game.tsx READY state
    - Replace single button with MainMenu component
    - Handle navigation state between Main/Multiplayer/About screens
    - Integrate single-player start with MainMenu "Single Player" button
    - Maintain existing handleStartGame logic
    - Location: src/components/Game.tsx
  - [ ] 3.6 Ensure menu component tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify navigation flows work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass
- MainMenu displays three options with proper styling
- MultiplayerSubmenu navigates correctly
- About modal shows/hides properly
- Single-player flow remains unchanged
- All buttons meet 44px minimum height

#### Task Group 4: Room Creation and Joining Flow
**Dependencies:** Task Group 3

- [ ] 4.0 Implement Create Room and Join Room flows
  - [ ] 4.1 Write 2-8 focused tests for room creation/joining
    - Test CreateRoomForm validates player name (required, max 20 chars)
    - Test JoinRoomForm validates room code (5 digits) and player name
    - Test WebSocket event emission on form submission
    - Test error handling for room creation/join failures
    - Test URL parameter parsing for shareable links
  - [ ] 4.2 Create CreateRoomForm component
    - Player name input (required, max 20 characters, validated)
    - Submit button emits SOCKET_EVENTS.CREATE_ROOM
    - Payload: { playerName, maxPlayers: 2 }
    - Listen for SOCKET_EVENTS.ROOM_CREATED with useSocketEvent hook
    - Dispatch SET_MULTIPLAYER_ROOM action on success
    - Show error toast on SOCKET_EVENTS.ROOM_ERROR
    - Navigate to RoomLobby on successful creation
    - Location: src/components/multiplayer/CreateRoomForm.tsx
  - [ ] 4.3 Create JoinRoomForm component
    - Room code input: 5 digits, auto-format to uppercase/numbers
    - Player name input (required, max 20 characters)
    - Pre-fill room code from URL parameter if present (?code=12345)
    - Submit button emits SOCKET_EVENTS.JOIN_ROOM
    - Payload: { roomCode, playerName }
    - Listen for SOCKET_EVENTS.ROOM_JOINED with useSocketEvent hook
    - Dispatch SET_MULTIPLAYER_ROOM action on success
    - Show specific error messages for ROOM_NOT_FOUND, ROOM_FULL, GAME_IN_PROGRESS
    - Navigate to RoomLobby on successful join
    - Location: src/components/multiplayer/JoinRoomForm.tsx
  - [ ] 4.4 Implement shareable link URL handling
    - On app load, check window.location.search for ?code= parameter
    - If code found, automatically navigate to JoinRoomForm with code pre-filled
    - Add logic to App.tsx or Game.tsx useEffect
    - Location: src/components/Game.tsx or src/App.tsx
  - [ ] 4.5 Create error message mapping utility
    - Map SocketErrorCode enum to user-friendly messages
    - ROOM_NOT_FOUND: "Room not found. Please check the code."
    - ROOM_FULL: "This room is full."
    - GAME_IN_PROGRESS: "Game is already in progress."
    - VALIDATION_ERROR: "Invalid input. Please check your entries."
    - Location: src/utils/socketErrors.ts
  - [ ] 4.6 Ensure room flow tests pass
    - Run ONLY the 2-8 tests written in 4.1
    - Verify form validation and WebSocket integration
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 4.1 pass
- CreateRoomForm validates input and creates rooms successfully
- JoinRoomForm validates 5-digit codes and joins rooms
- URL parameters pre-fill join form
- Error messages are user-friendly and specific
- Forms emit correct WebSocket events
- GameContext updates with room/player state

#### Task Group 5: Room Lobby and Real-Time Updates
**Dependencies:** Task Group 4

- [ ] 5.0 Build interactive room lobby with real-time features
  - [ ] 5.1 Write 2-8 focused tests for lobby functionality
    - Test RoomLobby displays room code, player list, and ready states
    - Test host can select difficulty and start game
    - Test non-host players can toggle ready status
    - Test real-time updates when players join/leave
    - Test "Share Link" copies URL to clipboard
    - Test host leave behavior destroys room
  - [ ] 5.2 Create RoomLobby component structure
    - Display room code prominently at top (large, readable)
    - "Share Link" button copies full URL to clipboard
    - Player list with names, ready indicators (checkmark icon)
    - Highlight host with crown icon or "HOST" badge
    - Show player count: "X/Y players"
    - Location: src/components/multiplayer/RoomLobby.tsx
  - [ ] 5.3 Implement player-specific controls
    - For non-host: "Ready" toggle button
    - For host: difficulty dropdown (Easy, Medium, Hard) + "Start Game" button
    - Start Game disabled unless all non-host players are ready
    - Emit SOCKET_EVENTS.PLAYER_READY when toggling ready
    - Emit SOCKET_EVENTS.GAME_START when host starts game
    - Location: src/components/multiplayer/RoomLobby.tsx
  - [ ] 5.4 Add real-time event listeners with useSocketEvent
    - Listen to PLAYER_JOINED: dispatch UPDATE_ROOM_STATE
    - Listen to PLAYER_LEFT: dispatch UPDATE_ROOM_STATE
    - Listen to PLAYER_READY_CHANGED: dispatch UPDATE_ROOM_STATE
    - Listen to ROOM_UPDATED: dispatch UPDATE_ROOM_STATE
    - All listeners update GameContext with new room state
    - Location: src/components/multiplayer/RoomLobby.tsx
  - [ ] 5.5 Implement "Leave Room" functionality
    - "Leave Room" button for all players
    - Emit SOCKET_EVENTS.LEAVE_ROOM with roomCode
    - Dispatch LEAVE_MULTIPLAYER_ROOM action
    - Navigate back to MainMenu
    - Location: src/components/multiplayer/RoomLobby.tsx
  - [ ] 5.6 Handle host disconnection behavior
    - Listen for PLAYER_LEFT event where host left
    - Show modal: "The host has left. The room has been closed."
    - Auto-navigate to MainMenu after 3 seconds
    - Dispatch LEAVE_MULTIPLAYER_ROOM to clear state
    - Location: src/components/multiplayer/RoomLobby.tsx
  - [ ] 5.7 Implement "Share Link" with clipboard API
    - Generate shareable URL: window.location.origin + /room?code=[code]
    - Copy to clipboard using navigator.clipboard.writeText
    - Show "Link copied!" toast notification
    - Location: src/components/multiplayer/RoomLobby.tsx
  - [ ] 5.8 Handle WebSocket reconnection in lobby
    - Show "Reconnecting..." indicator when connection lost
    - Disable all action buttons during reconnection
    - Attempt session restore on reconnect using RESTORE_SESSION event
    - Location: src/components/multiplayer/RoomLobby.tsx
  - [ ] 5.9 Store difficulty selection in GameContext
    - When host selects difficulty, dispatch SET_DIFFICULTY action
    - Difficulty value passed with GAME_START event
    - Location: src/components/multiplayer/RoomLobby.tsx
  - [ ] 5.10 Ensure lobby tests pass
    - Run ONLY the 2-8 tests written in 5.1
    - Verify all lobby interactions work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 5.1 pass
- Room lobby displays all required information accurately
- Real-time updates reflect player joins/leaves/ready changes
- Host can select difficulty and start game only when all ready
- Non-host players can toggle ready status
- Share Link copies correct URL to clipboard
- Host leave closes room and notifies all players
- Reconnection handling works during connection loss

### Styling and Polish

#### Task Group 6: Dark Theme Styling and Visual Polish
**Dependencies:** Task Group 5

- [ ] 6.0 Apply consistent dark theme styling across all components
  - [ ] 6.1 Write 2-4 focused tests for visual consistency
    - Test all buttons meet 44px minimum height
    - Test dark theme colors are applied consistently
    - Test animations and transitions render correctly
  - [ ] 6.2 Apply dark theme color palette
    - Main background: bg-dark-base (#0f172a)
    - Card surfaces: bg-dark-elevated (#334155)
    - Primary accent: text-primary, cyan-500 (#06b6d4)
    - Secondary accent: amber-500 (#f59e0b) for highlights
    - Match existing Game.tsx, LevelComplete.tsx patterns
    - Location: All multiplayer components
  - [ ] 6.3 Style buttons with gradients and shadows
    - Primary action buttons: gradient-to-r from-cyan-600 to-blue-600
    - Secondary buttons: gradient-to-r from-teal-600 to-cyan-600
    - Hover effects: shadow-xl, scale-105 transform
    - Follow LevelComplete.tsx button patterns
    - Location: All multiplayer components
  - [ ] 6.4 Add smooth transitions and animations
    - Screen transitions: animate-fade-in, animate-slide-up
    - Button hover: transition-all duration-200
    - Modal overlays: fade-in animation
    - Match existing Tailwind config animations
    - Location: All multiplayer components
  - [ ] 6.5 Ensure accessibility standards
    - All interactive elements: min-height 44px
    - Keyboard navigation: proper focus indicators
    - ARIA labels for icon-only buttons (crown, checkmark)
    - Semantic HTML: button, nav, main elements
    - Color contrast: 4.5:1 ratio for text
    - Location: All multiplayer components
  - [ ] 6.6 Match existing component layout patterns
    - Modal overlays: fixed inset-0 with centered content (LevelComplete.tsx)
    - Card design: rounded-xl, shadow-lg (GameInfoCard.tsx)
    - Spacing: consistent padding and margins
    - Responsive design: mobile-first approach
    - Location: All multiplayer components
  - [ ] 6.7 Ensure styling tests pass
    - Run ONLY the 2-4 tests written in 6.1
    - Verify visual consistency across components
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 6.1 pass
- All components use consistent dark theme colors
- Buttons have gradients, shadows, and smooth hover effects
- Animations match existing game components
- All touch targets meet 44px minimum
- Accessibility standards are met (semantic HTML, ARIA, contrast)

### Testing and Integration

#### Task Group 7: Test Review & Integration Verification
**Dependencies:** Task Groups 1-6

- [ ] 7.0 Review tests and verify end-to-end multiplayer flows
  - [ ] 7.1 Review tests from previous task groups
    - Review the 2-4 tests from room code generation (Task 1.1)
    - Review the 2-6 tests from GameContext extensions (Task 2.1)
    - Review the 2-8 tests from menu components (Task 3.1)
    - Review the 2-8 tests from room flows (Task 4.1)
    - Review the 2-8 tests from lobby functionality (Task 5.1)
    - Review the 2-4 tests from styling (Task 6.1)
    - Total existing tests: approximately 12-38 tests
  - [ ] 7.2 Analyze test coverage gaps for multiplayer feature
    - Identify critical multiplayer workflows lacking coverage
    - Create room → Share link → Join via link → Start game
    - Host leaves → Room closes → Players redirected
    - WebSocket reconnection → Session restore
    - Focus ONLY on gaps in this spec's multiplayer requirements
    - Do NOT assess entire application coverage
  - [ ] 7.3 Write up to 10 additional integration tests maximum
    - Test complete create-to-lobby-to-game flow
    - Test complete join-via-link-to-lobby flow
    - Test host leave triggers room closure for all players
    - Test reconnection restores player to lobby
    - Test difficulty selection persists to game start
    - Do NOT write exhaustive edge case tests
    - Skip performance, load, and stress testing
    - Location: src/components/multiplayer/__tests__/
  - [ ] 7.4 Verify single-player mode remains unaffected
    - Run existing single-player game tests
    - Ensure START_GAME, SUBMIT_GUESS, NEXT_ROUND actions still work
    - Verify single-player scoring and level progression
    - Confirm no regressions in existing gameplay
  - [ ] 7.5 Test multiplayer UI flows manually
    - Create room → Lobby → Share link
    - Open link in new tab → Join room → Toggle ready
    - Host selects difficulty → Starts game
    - Test on mobile viewport (320px) and desktop (1024px+)
    - Verify dark theme consistency across all screens
  - [ ] 7.6 Run multiplayer feature tests only
    - Run ONLY tests related to multiplayer feature (1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.3)
    - Expected total: approximately 22-48 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical multiplayer workflows pass

**Acceptance Criteria:**
- All multiplayer feature tests pass (approximately 22-48 tests total)
- Critical multiplayer workflows are covered end-to-end
- No more than 10 additional tests added for integration gaps
- Single-player mode is unaffected and tests still pass
- Manual testing confirms UI works on mobile and desktop
- Testing focused exclusively on Phase 4 multiplayer requirements

## Execution Order

Recommended implementation sequence:

1. **Backend Alignment** (Task Group 1)
   - Ensures room codes match UI requirements before building UI

2. **State Management** (Task Group 2)
   - Establishes data foundation for all UI components

3. **Core UI Components** (Task Group 3)
   - Builds navigation structure and entry points

4. **Room Creation/Joining** (Task Group 4)
   - Implements user flows to enter multiplayer mode

5. **Room Lobby** (Task Group 5)
   - Completes interactive lobby with real-time features

6. **Styling and Polish** (Task Group 6)
   - Applies consistent theme and accessibility standards

7. **Testing and Integration** (Task Group 7)
   - Verifies complete feature works end-to-end

## Implementation Notes

### WebSocket Integration Patterns

All components should use the existing WebSocket infrastructure:

```typescript
// Get socket instance
const { socket, isConnected } = useSocket();

// Listen to events
useSocketEvent(SOCKET_EVENTS.ROOM_CREATED, (data: RoomCreatedResponse) => {
  // Handle event
});

// Emit events
socket.emit(SOCKET_EVENTS.CREATE_ROOM, {
  playerName: 'Player1',
  maxPlayers: 2
});
```

### GameContext Usage Pattern

All components should interact with GameContext via dispatch:

```typescript
const { state, dispatch } = useGame();

// Update multiplayer state
dispatch({
  type: 'SET_MULTIPLAYER_ROOM',
  payload: { room, player }
});

// Check multiplayer mode
if (state.multiplayerMode) {
  // Multiplayer logic
}
```

### Component File Organization

```
src/components/
├── multiplayer/
│   ├── MainMenu.tsx
│   ├── MultiplayerSubmenu.tsx
│   ├── AboutModal.tsx
│   ├── CreateRoomForm.tsx
│   ├── JoinRoomForm.tsx
│   ├── RoomLobby.tsx
│   └── __tests__/
│       ├── MainMenu.test.tsx
│       ├── CreateRoomForm.test.tsx
│       ├── JoinRoomForm.test.tsx
│       ├── RoomLobby.test.tsx
│       └── integration.test.tsx
```

### Responsive Design Breakpoints

- **Mobile:** 320px - 768px
- **Tablet:** 768px - 1024px
- **Desktop:** 1024px+

All components should be mobile-first with appropriate scaling.

### Error Handling Pattern

```typescript
useSocketEvent(SOCKET_EVENTS.ROOM_ERROR, (error: SocketError) => {
  const message = getErrorMessage(error.code);
  // Show toast notification
  showToast(message, 'error');
});
```

## Out of Scope for This Phase

- Multiplayer gameplay synchronization (Phase 5)
- Real-time guess sharing during rounds (Phase 5)
- Chat functionality
- Spectator mode
- Custom game settings beyond difficulty
- Room passwords or private rooms
- Kicking players
- Persistent player accounts or authentication
- In-game leaderboards

## Dependencies and Prerequisites

**Required Before Starting:**
- Phase 3 WebSocket infrastructure is complete and tested
- WebSocketContext provides useSocket() and useSocketEvent() hooks
- SOCKET_EVENTS constants and types are defined
- Backend RoomManager handles all room operations
- ConnectionStatus component displays connection state

**Existing Code to Leverage:**
- GameContext pattern (reducer, actions, dispatch)
- LevelComplete.tsx (modal overlay, gradient buttons, dark theme)
- Game.tsx (screen state management, layout patterns)
- Tailwind config (dark theme colors, animations)
- Type definitions in socket-events.ts (Room, Player, events)
