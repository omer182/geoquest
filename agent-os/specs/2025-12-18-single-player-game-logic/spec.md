# Specification: Single Player Game Logic

## Goal
Build an infinite progression single-player mode with level-based difficulty, distance-based scoring, and 5-city rounds that integrates with the existing InteractiveMap component from Phase 1.

## User Stories
- As a player, I want to guess city locations across 5 rounds per level so that I can progress through increasingly difficult geography challenges
- As a player, I want to see my score based on guess accuracy so that I receive immediate feedback on my geographic knowledge
- As a player, I want to advance through infinite levels so that I can continuously challenge myself without game ending

## Specific Requirements

**City Database Structure**
- Create TypeScript type for city data with name, country, latitude, longitude, and tier fields
- Organize cities into difficulty tiers (Tier 1 for easier cities, higher tiers for harder)
- Store city data in a TypeScript constant or JSON file for easy expansion
- Implement city selection function that randomly picks 5 unique cities from appropriate tier based on current level
- Levels 1-3 use Tier 1 cities exclusively, higher levels use progressively harder tiers

**Distance Calculation with Haversine Formula**
- Create utility function in src/utils/ directory that implements Haversine formula
- Accept two coordinate pairs (user guess and actual city location) as parameters
- Calculate great circle distance accounting for Earth's curvature
- Return distance in kilometers rounded to nearest whole number using Math.round()
- Use Earth radius constant of 6371 km for calculations

**Scoring Algorithm**
- Implement pure function that takes distance in km and returns point value
- Less than 10 km returns 1000 points
- Less than 50 km returns 750 points
- Less than 100 km returns 500 points
- Less than 500 km returns 250 points
- Less than 1000 km returns 100 points
- Greater than or equal to 1000 km returns 0 points
- Function should be deterministic and easily testable

**Level Progression Logic**
- Define minimum score thresholds for each level (e.g., Level 1 requires 1000/5000 points, Level 2 requires 1500/5000, scaling upward)
- After 5 rounds, calculate total score and compare against threshold
- If threshold met, advance to next level and reset round counter
- If threshold not met, display failure state with option to retry current level or restart from Level 1
- Track highest level reached during session for player reference

**Game State Management**
- Use React Context API with useReducer pattern in src/context/ directory
- State should include: currentLevel, currentRound (1-5), selectedCities array, userGuesses array, roundScores array, totalScore, gameStatus enum
- GameStatus enum values: READY, GUESSING, ROUND_COMPLETE, LEVEL_COMPLETE, LEVEL_FAILED
- Define actions: START_GAME, SUBMIT_GUESS, NEXT_ROUND, ADVANCE_LEVEL, RETRY_LEVEL, RESTART_GAME
- Reducer should be pure function with no side effects, handling all state transitions immutably
- Provide context provider component to wrap game UI components

**Round Flow and UI States**
- GUESSING state: Three-phase animation sequence on round start:
  1. Level Announcement: Full-screen overlay showing "Level X - Round Y/5" for 1.2 seconds
  2. City Animation: City/country name appears in center, stays briefly, then smoothly transitions to top with size/layout change over 700ms
  3. Gameplay: City prompt visible at top-center, map interactive for pin placement
- GameInfoCard displayed in top-left corner showing level, round, current score, and required score (current/required format) in consolidated card
- After pin placed, show floating confirm button sliding up from bottom (fixed position, bottom-6, Tailwind CSS)
- On confirm, transition to ROUND_COMPLETE state with 300ms delay before smooth zoom animation (flyToBounds) to show both pins
- Distance line and distance label fade in after 500ms delay for polished visual effect
- Display compact results card at bottom-center without emoji, showing feedback message, distance, and score
- Display continue button to advance to next round or level complete screen
- Reset map pin state and animation states between rounds for fresh guessing experience
- After round 5, show level summary with total score, threshold comparison, and advance/retry options

**Game UI Components**
- Create LevelAnnouncement component displaying level and round number with fade-in/fade-out animation (1.2s display duration)
- Create consolidated CityPrompt component with conditional animation support (showInitialAnimation prop)
  - Animation phases: fadeIn → center (large display) → flyingUp (smooth transition to top) → static
  - Static mode: compact card at top showing "Find: City, Country"
- Create GameInfoCard component consolidating level, round, current round score, and score progress (current/required format)
- Create RoundResults component as compact card without emoji, with distance and score displayed inline
- Create LevelComplete component summarizing performance with threshold progress bar
- Create ConfirmButton component as floating action button with touch-friendly 44px minimum size

**Integration with Phase 1 InteractiveMap**
- Use existing InteractiveMap component's onPinPlaced callback to capture user guess coordinates
- Store guess coordinates in game state when pin is placed
- On round complete, display second marker (red pin) showing actual city location with visual line connecting guess (cyan pin) to target
- Pin differentiation: User guess uses cyan pin SVG, target location uses red pin SVG (pin-red.svg)
- Line rendered using Polyline from react-leaflet with dashed cyan line styling in shadowPane (z-index 500)
- Distance label displayed at midpoint of line with dark background, cyan border, fading in after 500ms
- Smooth camera zoom using flyToBounds with 300ms delay, 1.5s duration, easeLinearity 0.1, maxZoom 8
- Distance displayed inline within compact RoundResults card at bottom-center of screen
- Line and distance label use fade-in transition (opacity 0 → 1 over 500ms) for polished appearance
- Leaflet pane layering: GeoJSON countries in tilePane (z-index 200), polyline in shadowPane (z-index 500), markers in markerPane (z-index 600)
- Reset InteractiveMap by remounting component or clearing pin state between rounds
- Map positioned as background layer with UI overlays properly layered above
- Maintain existing map styling and touch interactions from Phase 1

**Initial City Data Seed**
- Include at least 15 Tier 1 cities in initial implementation (e.g., New York USA, London UK, Tokyo Japan, Paris France, Sydney Australia)
- Include at least 10 Tier 2 cities for future level progression
- Include at least 10 Tier 3 cities for advanced levels
- Ensure geographic diversity across continents for varied gameplay
- Cities should have accurate latitude/longitude coordinates verified against reliable sources

**Session State Management**
- All game state lives in memory via React Context, no localStorage or persistence
- Each browser session starts fresh at Level 1
- Closing browser or refreshing page resets all progress
- This approach simplifies Phase 2 implementation, persistence can be added in future phases

## Out of Scope
- Hints system or help features during guessing
- Time limits or time-based bonus points
- Streak bonuses for consecutive accurate guesses
- Global or friend leaderboards
- Achievement badges or unlockables
- Power-ups or special abilities
- Sound effects or background music
- Complex animations beyond basic CSS transitions
- Multiplayer or competitive modes
- User authentication or accounts
- Data persistence across sessions using localStorage or database
