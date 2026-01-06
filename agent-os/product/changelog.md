# GeoQuest Changelog

This document tracks significant changes and improvements made to the GeoQuest application.

## 2026-01-XX - Map Styling & UI Enhancements

### Map Visual Updates

**Map Tile Provider:**
- Changed from custom-colored GeoJSON polygons to realistic map tiles
- Using CartoDB Positron No Labels tiles (`https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png`)
- Provides realistic terrain, roads, and geographic features without city/country labels (critical for guessing game)

**Country Coloring:**
- Updated to vibrant 4-color palette using Four Color Theorem:
  - `#FFB6C1` - Light pink
  - `#87CEEB` - Sky blue
  - `#98D8C8` - Mint green
  - `#F0E68C` - Khaki yellow
- Countries use 60% fill opacity for visibility while allowing map tiles to show through
- Country borders: 1.2px weight, 0.9 opacity, `#666666` color

**USA State Borders:**
- Rendered separately from country boundaries
- Subtle styling: 0.8px weight, 0.6 opacity, `#999999` color
- Transparent fill so USA country color shows through
- USA country is included in countries GeoJSON (not filtered out)

**Ocean/Water Styling:**
- Background color: `#4A90E2` (vibrant blue)
- Applied to MapContainer background

**Map Line Styling:**
- Distance lines use dashed pattern: `dashArray: '10, 8'`
- Applied to both single-player and multiplayer lines
- Consistent styling across all player lines

### Component Styling Updates

**CityPrompt Component:**
- When centered (large): Matches LevelAnnouncement styling
  - Background: `bg-dark-elevated` (solid, no transparency)
  - Border: `border-2 border-primary` (thicker, primary color)
  - City name: `text-primary` with `font-bold`
  - Country: `text-gray-300` with `font-semibold`
  - Rounded corners: `rounded-xl`
  - Shadow: `shadow-2xl`
- Animation: Only shows static version after animation completes (prevents blinking)
- Both city and country use same white color when centered

**GameInfoCard Component:**
- When level threshold is passed (`pointsNeeded === 0`):
  - Progress bar changes from blue (`bg-primary`) to green (`bg-green-500`)
  - "to advance" text is hidden (no overlap)
  - Card becomes clickable with hover effect (`hover:scale-105`)
  - Small confetti animation triggers automatically
  - Clicking card retriggers confetti
- Confetti configuration:
  - 100 particles, 20-degree spread
  - Positioned at `{ x: 0.1, y: 0.15 }` (top-left area)
  - Colors: Green, teal, blue, purple, amber
  - Smaller scale (`scalar: 0.8`) for contained effect

**LevelAnnouncement:**
- Hidden when `gameStatus === GameStatus.LEVEL_COMPLETE` to prevent brief flash before level summary

### Gameplay Logic Updates

**Timer Synchronization:**
- Multiplayer timer starts only after CityPrompt animation completes
- Timer starts from full duration when displayed (not from server time)
- Uses `pendingRoundStart` state to coordinate timing

**Scoring Logic:**
- Time bonus is 25% of base score (not fixed amount)
- Time bonus formula: `(remainingSeconds / timerDuration) * (baseScore * 0.25)`
- If base score is 0, time bonus is also 0 (no time bonus without distance score)
- Round results sorted by total score (highest first)
- Crown icon always on top player (highest total score)

**UI Component Consolidation:**
- Removed separate `WaitingIndicator` component
- `ConfirmButton` now handles waiting state with `isWaiting` prop
- Shows loading spinner and "Waiting for other players..." text

### Mobile UX Improvements

**Component Alignment:**
- Timer, CityPrompt, and WaitingIndicator have consistent:
  - Height and vertical alignment
  - Padding: `px-3 sm:px-4 py-2.5`
  - Border styling: `border border-primary/30`
  - Background: `bg-dark-elevated/90 backdrop-blur-sm`

**Timer Positioning:**
- Mobile: Top-left corner (`top-4 left-4`)
- Desktop: Centered top (`top-4 left-1/2 -translate-x-1/2`)

### Technical Updates

**Vite Configuration:**
- Custom cache directory: `.vite-cache` (avoids permission issues)
- Server configuration: `host: true`, `strictPort: true`
- Allowed hosts: `.ngrok-free.dev`, `.ngrok.io`, `.ngrok.app`, `localhost`

**Environment Variables:**
- Frontend `.env`: `VITE_WEBSOCKET_URL`, `VITE_MAP_PROVIDER`, `VITE_MAP_API_KEY`
- Backend `.env`: `PORT`, `CORS_ORIGIN`, `NODE_ENV`

**Debug Logging:**
- Removed all console.log debug statements from production code

### Files Modified

**Frontend:**
- `src/components/InteractiveMap.tsx` - Map tiles, country colors, line styling
- `src/components/GameInfoCard.tsx` - Threshold pass indicator, confetti
- `src/components/CityPrompt.tsx` - Styling updates, animation fixes
- `src/components/Game.tsx` - Timer synchronization, component consolidation
- `src/components/MultiplayerTimer.tsx` - Mobile positioning
- `src/components/ConfirmButton.tsx` - Waiting state integration
- `src/components/MultiplayerRoundResults.tsx` - Score sorting, crown logic
- `src/index.css` - Map label hiding, line styling
- `vite.config.ts` - Cache directory, server configuration

**Backend:**
- `backend/services/GameSessionManager.js` - Time bonus calculation, score validation

### Breaking Changes

None - all changes are backward compatible.

### Notes for Future Specs

- Map uses realistic tiles with no labels - critical for guessing game
- Country colors are vibrant and distinct (4-color theorem)
- USA states render as subtle overlays (don't block country color)
- Timer synchronization requires coordination with CityPrompt animation
- Time bonus is percentage-based (25% of base score)
- GameInfoCard has interactive confetti when threshold passed
- LevelAnnouncement should not show when LevelComplete screen is visible

