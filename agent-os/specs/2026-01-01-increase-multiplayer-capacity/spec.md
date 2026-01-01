# Specification: Increase Multiplayer Capacity to 5 Players

## Goal
Expand GeoQuest's multiplayer room capacity from 2 to 5 players, enabling larger group gameplay while maintaining the existing mobile-first design and game flow. All UI components must accommodate 5 players on iPhone 12 Pro (390x844px) viewport.

## User Stories
- As a player, I want to create a room that supports up to 5 players so that I can play with larger groups of friends
- As a player joining a full room, I want to see a clear "Room is full" error message so that I understand why I cannot join

## Specific Requirements

**Backend Capacity Configuration**
- Update `RoomManager.createRoom()` default `maxPlayers` parameter from 2 to 5 (line 54 in backend/services/RoomManager.js)
- No other backend changes required - existing `GameSessionManager`, `socketHandlers`, and room logic already support variable player counts through `playerData.size` checks and dynamic Map structures
- Room full validation already exists at line 84-86 in RoomManager.js and returns appropriate error code

**5-Player Pin Color System**
- Add yellow (#eab308 - yellow-500) as the 5th player color to the existing color array in Game.tsx line 582
- Update color array from `['#3b82f6', '#10b981', '#a855f7', '#f97316']` to include yellow as 5th element
- Player color assignment order: Player 1 = Blue (#3b82f6), Player 2 = Green (#10b981), Player 3 = Purple (#a855f7), Player 4 = Orange (#f97316), Player 5 = Yellow (#eab308)
- Existing `createColoredPinIcon()` function in InteractiveMap.tsx (line 143) already supports dynamic color assignment via parameter
- Existing map rendering logic already iterates through `playerGuesses` array and applies colors dynamically

**Room Lobby UI Updates (RoomLobby.tsx)**
- Update player count display at line 254 to show "Players (X/5)" instead of "(X/2)"
- Extend vertical player list (lines 257-285) to render up to 5 player rows with same styling pattern
- Maintain existing ready-up indicators (green/gray dots), host badges, and "You" labels for all 5 players
- No layout changes required - existing vertical stack design already accommodates variable player counts
- Ensure 44x44px minimum touch targets maintained for all interactive elements per responsive standards

**Waiting Indicator Update (WaitingIndicator.tsx)**
- Replace specific player name prop `opponentName` with generic message "other players to submit"
- Update text at line 20-21 from "Waiting for {opponentName}..." to "Waiting for other players to submit..."
- Remove `opponentName` prop from component interface (line 3)
- Update all call sites in Game.tsx to remove player name parameter

**Round Results Table (MultiplayerRoundResults.tsx)**
- Extend results table tbody (lines 78-114) to render up to 5 player rows
- Maintain existing compact mobile styling: 11px/12px font sizes, 2px padding, abbreviated "D." column header on mobile
- Existing sorting logic already handles variable player counts (line 46)
- Crown emoji winner indicator and "You" label logic already supports any player count
- Verify table fits within 280px max-width mobile container without horizontal scroll

**Final Results Screen (MultiplayerGameComplete.tsx)**
- Extend vertical podium list (lines 84-124) to display all 5 players with existing card styling
- Show medals (🥇🥈🥉) for top 3 players only as per requirements
- Players ranked 4th and 5th display without medal emoji
- Extend rematch player list (lines 133-178) to show all 5 players with ready indicators and buttons
- Maintain existing green dot + checkmark pattern for ready status
- Verify all 5 player cards + rematch section fit within iPhone 12 Pro viewport (390x844px) with scrolling enabled

**Map Auto-Zoom for 5 Pins**
- Existing `flyToBounds()` logic in InteractiveMap.tsx already calculates bounds from all pins in `playerGuesses` array
- No changes required - dynamic bounds calculation supports any number of player pins
- Existing padding configuration ensures all 5 pins visible with appropriate margins

**Ready-Up Validation**
- Backend already enforces all players ready before game start (line 263 in socketHandlers.js)
- Frontend `canStartGame()` logic in RoomLobby.tsx line 203 already checks `currentRoom.players.every((p) => p.isReady)`
- No changes required - existing logic supports variable player counts

## Visual Design
No visual assets provided in planning/visuals folder.

## Existing Code to Leverage

**RoomManager.js (backend/services/RoomManager.js)**
- Variable `maxPlayers` parameter already supported in `createRoom()` method (line 54)
- Room full validation logic exists at lines 84-86 with proper error code (`ROOM_FULL`)
- Player array and session management use dynamic Map/Array structures that scale to any player count
- Re-use existing room structure and validation patterns

**GameSessionManager.js (backend/services/GameSessionManager.js)**
- `playerData` and `playerScores` use Map structures that support any number of players
- `isRoundComplete()` check at line 132 dynamically compares `playerData.size` to `roundGuesses.size`
- Score calculation and results generation iterate through Maps, supporting variable player counts
- No modifications needed - existing architecture is player-count agnostic

**InteractiveMap.tsx (src/components/InteractiveMap.tsx)**
- `createColoredPinIcon()` function at line 143 accepts dynamic color parameter for pin rendering
- Existing map logic iterates through `playerGuesses` array and renders each pin with assigned color
- Player name labels already render above pins using color-matched styling
- Re-use existing pin rendering and bounds calculation logic

**Game.tsx Player Color Assignment (src/components/Game.tsx)**
- Line 582 contains player color array: `['#3b82f6', '#10b981', '#a855f7', '#f97316']`
- Colors assigned to players using `index % 4` pattern - extend array to 5 colors and update modulo
- Existing logic assigns colors when building `playerGuesses` array for map rendering
- Extend existing color array pattern to include yellow as 5th color

**RoomLobby.tsx Vertical Player List (src/components/RoomLobby.tsx)**
- Lines 257-285 render player list with green/gray ready dots, host badges, and "You" labels
- Existing `map()` iteration over `currentRoom.players` array already handles variable counts
- Player card styling uses flex layout with 3px gap, fitting multiple players vertically
- Re-use existing player card component structure for all 5 players

## Out of Scope
- Existing mobile UI fixes for timer visibility or score/city text overlap in single-player mode (tracked separately)
- Host capacity selection feature (2, 3, 4, or 5 player options) - capacity fixed at 5 maximum
- Changes to scoring system formulas or score calculation logic
- Changes to timer duration logic or timer display behavior
- Changes to game flow, round progression, or auto-advance timing
- Modifications to room lobby vertical layout design or spacing
- Changes to round results table format, styling, or column structure beyond supporting 5 rows
- Changes to map interaction behavior, zoom levels, or pan controls
- Updates to rematch system logic or countdown timing
- Modifications to disconnection handling or reconnection flow
- Changes to ready-up animation or visual effects
