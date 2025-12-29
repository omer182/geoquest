# Product Roadmap

0. [x] Initial Project Setup — Establish complete development foundation with React 18 + TypeScript + Vite frontend, Node.js + Express + Socket.IO backend, Tailwind CSS, ESLint/Prettier, Docker development environment, and comprehensive documentation. `M` **COMPLETED**

1. [x] Interactive Map Component — Build the core map interface with Leaflet integration, allowing users to pan, zoom, and place pins on touch-enabled mobile screens. Include country boundary visualization with Four Color Theorem coloring and no country labels. `M` **COMPLETED**

2. [x] Single Player Game Logic — Implement infinite progression single-player mode with level system (starting at Level 1), city database organized by 3 difficulty tiers (35+ cities), 5 rounds per level, distance-based scoring using Haversine formula, and React Context state management with useReducer pattern. `L` **COMPLETED**

3. [x] Game Round Flow UI — Create the complete round experience including level announcements, animated city prompt transitions, pin placement with floating confirmation button, smooth camera zoom animations, and results screen showing visual distance lines with fade-in effects, colored pin differentiation (cyan/red), and horizontal results card layout. `M` **COMPLETED**

4. [x] WebSocket Real-Time Infrastructure — Set up WebSocket server and client connection handling for real-time multiplayer synchronization between players' devices, including connection state management and reconnection logic. `L` **COMPLETED**

5. [x] Multiplayer Room System — Build room creation, unique code generation, room joining via code/link, player ready-up state management, and lobby UI showing both players and their ready status. `M` **COMPLETED**

6. [x] Multiplayer Game Session — Implement synchronized 5-round multiplayer matches including turn-by-turn pin placement coordination, simultaneous results display for both players, round-winner determination, cumulative scoring across rounds, and final winner declaration. `L` **COMPLETED**

7. [x] Results Visualization & Transitions — Create the post-round results screen with map zoom-out animation, colored player lines from pins to target location, distance display for each player, 10-second countdown to next round, and smooth transitions between game states. `S` **COMPLETED**

8. [x] Rematch & Session Management — Add "Play Again" functionality for multiplayer games to start a new 5-round match with the same players in the same room, plus proper game state reset and session continuation logic. `S` **COMPLETED**

> Notes
> - Order items by technical dependencies and product architecture
> - Each item should represent an end-to-end (frontend + backend) functional and testable feature

---

## Phase 2 UI/UX Refinements (December 2024)

The following enhancements were made to polish the single-player experience:

### Visual Feedback
- **Distance Line & Label**: 1.5s fade-in transition for distance line and midpoint label
- **Pin Differentiation**: Separate red pin SVG for target locations (cyan for user guess)
- **Results Card**: Horizontal layout with centered bottom positioning

### Animation System
- **Camera Zoom**: flyToBounds with 1.5s duration, 0.25 easeLinearity, maxZoom 7 (15% wider view)
- **Level Announcement**: 1.2s display duration with fade transitions
- **City Prompt**: 4-phase animation state machine (fadeIn → center → flyingUp → static)
- **Map Persistence**: Single persistent map instance eliminates reset during state transitions

### Component Architecture
- **GameInfoCard**: Consolidated display showing current/required score format
- **RoundResults**: Horizontal layout (feedback left, stats center, button right)
- **CityPrompt**: Merged animated and static variants into single component

### Technical Optimizations
- **Leaflet Pane Layering**: Proper z-index hierarchy (tilePane 200, shadowPane 500, markerPane 600)
- **Single Map Instance**: Conditional props instead of conditional rendering prevents unmounting
- **State Management**: React Context with useReducer for clean state transitions

**Status**: Production-ready, fully tested, comprehensively documented

---

## Phase 3 Implementation: WebSocket Real-Time Infrastructure (December 20, 2024)

### Backend Infrastructure
- **Socket.IO Server**: Express + Socket.IO with enhanced connection health monitoring (25s ping interval, 10s timeout)
- **RoomManager Service**: In-memory room/session storage with Maps, 6-character unique codes, 5-minute session persistence
- **Event Handlers**: Complete Socket.IO event handling (create, join, leave, ready, restore session)
- **Type Safety**: Shared TypeScript event definitions between frontend and backend
- **Monitoring**: `/health` and `/stats` HTTP endpoints for server monitoring
- **Graceful Shutdown**: SIGTERM/SIGINT handlers for clean server shutdown

### Frontend Infrastructure
- **WebSocket Context**: React Context with useReducer pattern for connection state management
- **Reconnection Strategy**: Exponential backoff (1s → 2s → 4s → 8s → 16s), max 5 attempts
- **Session Persistence**: sessionStorage for session ID preservation across reconnections
- **Custom Hooks**: `useSocket()` for context access, `useSocketEvent()` for type-safe event listeners
- **ConnectionStatus UI**: Real-time connection indicator with latency display and manual retry
- **Latency Tracking**: Socket.IO engine ping/pong events for round-trip time measurement

### Testing & Quality
- **46 Tests Total**: 30 RoomManager unit tests + 16 Socket.IO integration tests
- **100% Pass Rate**: All tests passing with ~200ms execution time
- **Test Framework**: Vitest with v8 coverage reporting
- **Integration Testing**: Full Socket.IO client-server interaction tests

### Key Features
- ✅ Room creation with unique 6-character codes
- ✅ Join/leave room with validation (capacity, game status)
- ✅ Player ready status with real-time broadcasting
- ✅ Session restoration after disconnect (5-minute window)
- ✅ Automatic cleanup of expired sessions and empty rooms
- ✅ Host transfer when host leaves
- ✅ Type-safe event system with TypeScript
- ✅ Comprehensive error handling with standardized codes
- ✅ Real-time latency monitoring
- ✅ Visual connection status indicators

**Status**: Production-ready WebSocket infrastructure, comprehensively tested, fully documented

---

## Phase 4 Implementation: Multiplayer Room System (December 20, 2024)

### Room Management
- **Room Lobby UI**: Complete lobby interface with room code display, player list, ready status indicators
- **Difficulty Selector**: Host controls for easy/medium/hard difficulty with visual feedback
- **Player Ready System**: Green dot + checkmark pattern for ready status visualization
- **Room Navigation**: Join room modal, copy room code/link functionality
- **Host Controls**: Only host can change difficulty and start game

### Frontend Components
- **RoomLobby.tsx**: Full-featured lobby with player management, difficulty selection, ready system
- **JoinRoomModal.tsx**: Clean modal for joining rooms via code
- **MainMenu.tsx**: Updated with multiplayer options and "Built by Rio" footer
- **Routing**: Multi-page navigation system with room code in URLs

### Game Integration
- **GameContext Updates**: Multiplayer mode support, room state management
- **Mode Selection**: Single-player vs multiplayer mode tracking
- **Player Management**: Current player tracking, opponent identification

### Key Features
- ✅ Room creation with shareable codes and links
- ✅ Join room via 6-character code
- ✅ Player ready status with real-time updates
- ✅ Host-only game controls
- ✅ Difficulty selection (easy/medium/hard)
- ✅ Visual player list with ready indicators
- ✅ Room code copy-to-clipboard
- ✅ Clean navigation between main menu and lobby

**Status**: Fully functional multiplayer lobby system

---

## Phase 5 Implementation: Multiplayer Game Logic (December 21-27, 2024)

### Backend Game Session Management
- **GameSessionManager**: Complete session lifecycle with configurable timer (15s/30s/45s/60s)
- **City Selection**: 500 cities across 10 difficulty levels (expanded from 35 cities, 3 tiers)
  - Easy: Levels 1-3 (150 famous cities like Tokyo, Paris, London)
  - Medium: Levels 4-7 (200 moderately known cities)
  - Hard: Levels 8-10 (150 obscure expert-level cities)
- **Scoring System Overhaul**: New exponential decay formula with tier and level multipliers
  - Base formula: `5000 / (1 + distance / 100)`
  - Tier multipliers: Tier 1 (×1.0), Tier 2 (×1.5), Tier 3 (×2.0)
  - Level multipliers: 1.0 + (level - 1) × 0.2
- **Distance Calculation**: Haversine formula for accurate geographic distance

### Real-Time Game Flow
- **Configurable Timer**: Host selects 15s/30s/45s/60s in lobby, applied to all rounds
- **Final Round Urgency**: Round 5 automatically uses 5-second timer for dramatic finish
- **Server-Synced Timer**: Pure server timestamp calculation (no client setInterval)
- **Percentage-Based Colors**: White (100-67%), Amber (66-33%), Red with pulse (32-0%)
- **Immediate Results**: Results display instantly when all players submit (don't wait for timer)
- **Auto-Submit**: Missing guesses auto-submitted as (0,0) on timer expiration
- **Server-Driven Countdown**: 5-second countdown with tick events keeps all players synchronized

### Multiplayer UI Components
- **MultiplayerTimer.tsx**: Server timestamp-based countdown with color states
- **WaitingIndicator.tsx**: Post-submission waiting state ("Waiting for [PlayerName]...")
- **MultiplayerRoundResults.tsx**: Round results table with rankings and countdown
- **MultiplayerGameComplete.tsx**: Final results with podium, statistics, rematch UI
- **DisconnectedPlayerModal.tsx**: Blocking modal for disconnection handling

### Map Enhancements
- **Multi-Player Pins**: Distinct colors for each player (blue, green, purple, orange)
- **Player Name Labels**: Permanently visible colored text above each pin
- **Distance Lines**: Color-matched dashed lines from each guess to target
- **Auto-Zoom**: `flyToBounds()` automatically frames all pins with proper padding
- **Interactive Map**: Remains fully interactive (pan/zoom) during results viewing
- **Z-Index Layering**: Lines render behind pins (overlayPane vs markerPane)

### Rematch System
- **Checkmark Pattern**: Reuses exact lobby ready status UI for consistency
- **All-Ready Trigger**: When all players click "Play Again", room resets to lobby
- **Session Reset**: Clean state reset while preserving room code and players
- **Leave Handling**: Proper cleanup when players leave during rematch screen

### Error Handling
- **Mid-Round Disconnection**: Toast notification, game continues normally
- **Final Results Disconnection**: Blocking modal forces navigation to main menu
- **Session Preservation**: 5-minute reconnection window
- **Graceful Degradation**: Auto-submit for disconnected players

### Mobile Optimization
- **Responsive Timer**: text-xl (mobile) → text-2xl (desktop)
- **Responsive Results**: Abbreviated column names on mobile ("Distance" → "Dist.")
- **Responsive Final Results**: Vertical stack on mobile, horizontal podium on desktop
- **Responsive UI Cards**: GameInfoCard hidden in multiplayer, CityPrompt repositioned
- **No Horizontal Scroll**: All screens fit 375px width (iPhone SE)
- **Touch Targets**: 44x44px minimum for mobile usability

### UI/UX Improvements
- **Component Redesigns**:
  - RoundResults: Bottom card with dark theme, no blur
  - GameInfoCard: Compact dark design (single-player only)
  - CityPrompt: Fixed animation loop, +1s timing
  - LevelAnnouncement: +1s display timing
- **Map Flicker Fix**: useCallback and hasZoomedRef prevent unnecessary re-renders
- **Animation Timing**: Improved pacing for better user experience
- **Dark Theme**: Consistent styling across all components

### Testing & Quality
- **Backend Tests**: 12/12 GameSessionManager tests passing
- **Build Status**: Frontend builds in ~1s with no errors
- **Backend Server**: Running stable on port 3001
- **Manual Testing**: Full multiplayer flow verified
- **Production Ready**: All features complete and functional

### Key Features
- ✅ Configurable timer duration (15s/30s/45s/60s)
- ✅ Final round urgency (5-second timer on round 5)
- ✅ Server timestamp-based timer (no clock drift)
- ✅ Immediate results when all players submit
- ✅ Multi-player pins with distinct colors and names
- ✅ Auto-zoom to fit all pins in view
- ✅ Interactive map during results viewing
- ✅ Server-driven countdown synchronization
- ✅ 5-round progression with cumulative scoring
- ✅ Podium final results with comprehensive statistics
- ✅ Rematch functionality with lobby return
- ✅ Disconnection handling (toast and modal)
- ✅ Mobile responsive (375px+ width)
- ✅ 500-city database across 10 difficulty levels
- ✅ New exponential decay scoring system
- ✅ Clean UI with dark theme consistency

**Status**: Production-ready multiplayer game logic, fully tested and optimized