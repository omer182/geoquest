# Spec Requirements: Increase Multiplayer Capacity to 5 Players

## Initial Description
**Feature Description**: Increase multiplayer room capacity from 2 to 5 players

Currently, GeoQuest supports 2-player multiplayer rooms. This feature will expand capacity to allow up to 5 players to join and play together in a single room.

## Requirements Discussion

### First Round Questions

**Q1:** Mobile UI Fixes Scope - I noticed from the product context that GeoQuest is mobile-first (iPhone 12 Pro target). Are there any existing mobile UI issues with the current 2-player multiplayer (like timer visibility, score/city text overlap) that should be addressed as part of this spec, or should those be tracked separately?

**Answer:** SEPARATE ISSUE - do not include existing mobile UI fixes (timer visibility, score/city overlap) in this spec. Note them as separate issues.

**Q2:** Host Capacity Selection - Should the host be able to choose the room capacity (2, 3, 4, or 5 players) when creating a room, or is the capacity always fixed at 5 players maximum?

**Answer:** NO SELECTION NEEDED - Room max is simply fixed at 5 players maximum. Host does NOT choose capacity. All players in the lobby must be ready before host can start the game.

**Q3:** Player Limit Enforcement - When a 5th player joins a room, should new join attempts show an error message like "Room is full (5/5 players)"?

**Answer:** YES - Show "Room is full" error message when someone tries to join a full room (5 players).

**Q4:** Pin Colors Assignment - The roadmap mentions current multiplayer uses "blue, green, purple, orange" for multi-player pins. For 5 players, I'm assuming we add "yellow" as the 5th color. What should the player assignment order be? (e.g., Player 1: Blue, Player 2: Green, Player 3: Purple, Player 4: Orange, Player 5: Yellow)

**Answer:** CONFIRMED sequence:
- Player 1: Blue
- Player 2: Green
- Player 3: Purple
- Player 4: Orange
- Player 5: Yellow

**Q5:** Waiting Indicator Update - The current WaitingIndicator.tsx shows "Waiting for [PlayerName]..." for 2 players. For 5 players, should this change to something more generic like "Waiting for other players to submit..." or list each player who hasn't submitted yet?

**Answer:** Update waiting indicator to "Waiting for other players to submit" (generic message).

**Q6:** Final Results Medal Display - The roadmap mentions "Vertical stack on mobile, horizontal podium on desktop" for final results. For 5 players, should we keep this same layout but show medals/podium for top 3 players, or change the layout?

**Answer:** Keep current VERTICAL layout, just ensure it fits iPhone 12 Pro screen properly. Show medals for top 3 players in final results.

**Q7:** Ready-Up System - Should ALL 5 players need to be ready before the host can start the game, or can the host start with a minimum number of players (e.g., at least 2 ready)?

**Answer:** All players in the lobby must be ready before host can start the game.

**Q8:** Scope Boundaries - Are there any features or enhancements that should explicitly NOT be included in this spec (like timer changes, scoring system modifications, or other game logic changes)?

**Answer:** Out of scope:
- Existing mobile UI fixes (timer visibility, score/city overlap in SP) - separate issue
- Host capacity selection - not needed, fixed at max 5
- Scoring system changes
- Timer logic changes
- Game flow changes
- Room lobby vertical layout changes
- Round results table format changes

### Existing Code to Reference

**Similar Features Identified:**
User did not provide specific paths to similar features, but noted that the following should remain unchanged and can serve as reference patterns:
- Current 2-player multiplayer implementation
- Existing room lobby vertical layout
- Current round results table format
- Current scoring system
- Current timer logic
- Current game flow

### Follow-up Questions

No follow-up questions were needed. All requirements were clearly defined in the initial response.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
Not applicable - no visual files were provided in the visuals folder.

## Requirements Summary

### Functional Requirements

**Core Capacity Changes:**
- Increase maximum room capacity from 2 players to 5 players
- Room capacity is fixed at 5 maximum (no host selection required)
- All 5 players must be ready before host can start the game
- Display "Room is full" error message when 6th player attempts to join

**Player Pin Color System:**
- Player 1: Blue pin
- Player 2: Green pin
- Player 3: Purple pin
- Player 4: Orange pin
- Player 5: Yellow pin (NEW)
- Add yellow as the 5th distinct player color

**UI Updates:**
- Update WaitingIndicator to show generic message: "Waiting for other players to submit"
- Maintain vertical layout for lobby, results, and final standings on mobile (iPhone 12 Pro)
- Ensure all screens fit within mobile viewport (375px width minimum, based on iPhone SE compatibility mentioned in roadmap)
- Display medals/podium for top 3 players in final results screen
- Properly fit final results display on iPhone 12 Pro screen

**Player Name Labels:**
- Display colored player name labels above each of the 5 pins (as mentioned in roadmap: "Player Name Labels: Permanently visible colored text above each pin")
- Labels must be color-matched to their respective pins

**Map Visualization:**
- Auto-zoom map to fit all 5 player pins in view using `flyToBounds()` with proper padding
- Display distance lines from each of the 5 player guesses to target location
- Color-match distance lines to player pin colors
- Maintain interactive map functionality during results viewing

### Reusability Opportunities

**Components that can be extended from existing 2-player implementation:**
- RoomLobby.tsx - Extend player list display to support 5 players
- MultiplayerTimer.tsx - No changes needed, already supports multiple players
- WaitingIndicator.tsx - Update message text from specific player name to generic
- MultiplayerRoundResults.tsx - Extend round results table to handle 5 player rows
- MultiplayerGameComplete.tsx - Update final results to show 5 players with top 3 podium
- DisconnectedPlayerModal.tsx - No changes needed

**Backend patterns to reference:**
- GameSessionManager - Extend to support 5 players
- RoomManager service - Update MAX_PLAYERS_PER_ROOM constant from 2 to 5
- Socket.IO event handlers - Extend to broadcast to 5 players instead of 2

**Existing multiplayer features to model after:**
- Current multi-player pin rendering logic (extend from 4 colors to 5)
- Current ready-up mechanics (same pattern, just support 5 ready states)
- Current rematch system (same checkmark pattern for 5 players)
- Current disconnection handling (same toast/modal logic for 5 players)

### Scope Boundaries

**In Scope:**
- Increase room capacity from 2 to 5 players maximum
- Add yellow as 5th player pin color
- Update waiting indicator to generic message
- Enforce "room is full" error at 5 players
- All players must be ready before game start
- Display top 3 medals in final results
- Ensure mobile viewport compatibility (iPhone 12 Pro)
- Extend player list displays, round results tables, and final standings to support 5 players
- Update map auto-zoom to fit 5 pins
- Color-matched pin labels and distance lines for 5 players

**Out of Scope:**
- Existing mobile UI issues (timer visibility, score/city text overlap in single-player mode) - to be tracked as separate issues
- Host capacity selection feature - not needed, capacity is fixed at 5
- Changes to scoring system or scoring formulas
- Changes to timer logic or timer duration options
- Changes to overall game flow or round progression
- Changes to room lobby vertical layout design
- Changes to round results table format or styling

**Future Enhancements (mentioned but deferred):**
- None specifically mentioned for this feature

### Technical Considerations

**Mobile-First Design (iPhone 12 Pro):**
- Target resolution: 390x844 pixels (iPhone 12 Pro)
- Minimum compatibility: 375px width (iPhone SE, as mentioned in roadmap)
- Maintain vertical stack layouts for mobile screens
- Ensure no horizontal scrolling
- Maintain 44x44px minimum touch targets

**Integration Points:**
- Frontend: React components (RoomLobby, MultiplayerTimer, WaitingIndicator, MultiplayerRoundResults, MultiplayerGameComplete)
- Backend: Socket.IO server with RoomManager and GameSessionManager services
- WebSocket Events: Extend existing event handlers to support 5-player room state
- Map Library: Leaflet.js with React-Leaflet for rendering 5 player pins and distance lines

**Existing System Constraints:**
- Mobile-first responsive design (Tailwind CSS)
- React 18+ with Context API + useReducer for state management
- Socket.IO for real-time bidirectional communication
- No database - in-memory session management
- 5-round match format remains unchanged
- Server-driven countdown synchronization

**Similar Code Patterns to Follow:**
- Current multi-player pin color system (blue, green, purple, orange) - extend to include yellow
- Existing ready-up mechanics with green dot + checkmark pattern
- Current vertical layout pattern for lobby and results screens
- Existing auto-zoom logic using `flyToBounds()` for map camera
- Current player name label rendering above pins
- Existing rematch functionality with checkmark pattern
- Current disconnection handling with toast notifications and blocking modals

**Technology Stack (from tech-stack.md):**
- Frontend: React 18+, Tailwind CSS, Leaflet.js, React-Leaflet
- Backend: Node.js, Express.js, Socket.IO
- State Management: React Context API + useReducer
- Testing: Vitest (backend unit tests), Jest + React Testing Library (frontend)
- Deployment: Docker with Docker Compose
