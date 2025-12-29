# Phase 4: Multiplayer Room System UI

## Context

GeoQuest is a mobile-first geography learning game. We've completed:
- **Phase 1**: Interactive Map Component with Leaflet
- **Phase 2**: Single Player Game Logic (5 rounds per level, infinite progression)
- **Phase 3**: WebSocket Real-Time Infrastructure (Socket.IO, room management, session persistence)

## Phase 4 Overview

Build the multiplayer room system UI that allows players to:
1. Create rooms with unique 6-character codes
2. Join existing rooms via room codes
3. See a lobby with player list and ready status
4. Start the game when all players are ready

## Technical Foundation Already Built

### Backend (Phase 3 - Complete):
- RoomManager service with in-memory storage
- 6-character unique room code generation
- Socket.IO event handlers for:
  - `room:create` - Create room
  - `room:join` - Join room by code
  - `room:leave` - Leave room
  - `player:ready` - Toggle ready status
  - Session restoration after disconnect
- Type-safe event definitions in `backend/types/socket-events.ts`

### Frontend (Phase 3 - Complete):
- WebSocketContext with connection management
- useSocket() and useSocketEvent() hooks
- ConnectionStatus UI component
- Type definitions in `src/types/socket-events.ts`

### Existing Game UI (Phase 2):
- Game.tsx - Main game component
- GameContext with useReducer state management
- InteractiveMap component
- Single-player flow: Level announcement → 5 rounds → Results → Next level

## Requirements to Shape

Please gather requirements for:

1. **Main Menu / Mode Selection**
   - Should we add a mode selection screen (Single Player vs Multiplayer)?
   - Or should we have buttons on the existing game screen?
   - What should the user see when they first open the app?

2. **Room Creation Flow**
   - What information should be required? (Player name? Max players? Difficulty?)
   - Should room codes be displayed immediately or after creation?
   - How should the UI handle errors (e.g., failed to create room)?

3. **Room Joining Flow**
   - How should users enter room codes? (Text input? Share link?)
   - Should there be validation/formatting of room codes?
   - What happens if room is full or doesn't exist?

4. **Lobby Screen**
   - What should be displayed? (Player list, room code, ready status?)
   - Who can start the game? (Only host? All players when ready?)
   - Can players leave the lobby? What happens to the room?
   - Should there be a copy/share room code button?

5. **Game State Integration**
   - Should we create a separate MultiplayerGameContext or extend GameContext?
   - How should game state transition: Menu → Lobby → Game → Results?
   - Should multiplayer games use the same 5-round structure as single player?

6. **UI/UX Patterns**
   - Should we match the existing single-player UI style (dark theme, cyan accents)?
   - Mobile-first responsive design patterns?
   - Loading states and transitions?

7. **Error Handling**
   - What should happen if a player disconnects during lobby?
   - How to handle room not found, room full, etc.?
   - Reconnection flow - should users rejoin the same lobby?
