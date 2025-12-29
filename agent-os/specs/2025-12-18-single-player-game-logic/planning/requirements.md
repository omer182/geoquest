# Phase 2: Single Player Game Logic - Requirements

## 1. Scoring Algorithm
**Decision**: Distance-based scoring using the following formula:
- < 10 km: 1000 points
- < 50 km: 750 points
- < 100 km: 500 points
- < 500 km: 250 points
- < 1000 km: 100 points
- ≥ 1000 km: 0 points

**Implementation**: Use Haversine formula for distance calculation

## 2. Level Progression Requirements
**Decision**: Players must achieve a minimum score threshold based on their current level to advance to the next level.

**Note**: Specific threshold values per level to be defined in specification.

## 3. Difficulty Tier to Level Mapping
**Decision**: Gradual progression system
- Levels 1-3: Use Tier 1 cities
- Progressive difficulty scaling for higher levels

**Open Question for Future Phases**: How will this tier system impact multiplayer gameplay (Phase 6)? Needs consideration during multiplayer spec phase.

## 4. City Display Format
**Decision**: Display both city name AND country name
- Example: "Paris, France"

## 5. State Persistence
**Decision**: Fresh session approach (Phase 2)
- Each game session starts fresh
- No localStorage persistence initially
- Can be enhanced in future phases if needed

## 6. Round Flow After Pin Placement
**Decision**: Two-step confirmation and results flow
1. User places pin on map
2. Floating confirm button appears from bottom of screen
3. User taps confirm button
4. System calculates distance using Haversine formula
5. Display results screen showing:
   - Distance from pin to actual target location
   - Points earned for the round
   - Visual feedback (to be designed)

## 7. Distance Precision
**Decision**: Round all distances to the nearest kilometer
- Example: 47.8 km → 48 km

## 8. Out of Scope Features (Phase 2)
The following features are explicitly OUT OF SCOPE for Phase 2:
- Hints system
- Time bonuses
- Streak bonuses
- Leaderboards
- Achievements
- Power-ups
- Sound effects
- Animations (beyond basic transitions)

These may be considered for future enhancement phases.

## 9. Visual Assets and UI/UX Requirements
**Status**: No pre-existing visual assets available
- UI components will be designed during implementation
- Focus on clean, functional design using Tailwind CSS
- Mobile-first responsive approach

### UI Layout Refinements (implemented during development)
- **Consolidated Header**: Single GameInfoCard in top-left corner showing level, round, current score, and total score
- **Animation Sequence**: Three-phase intro for each round:
  1. Level Announcement: Full-screen "Level X - Round Y/5" display (1.5s)
  2. City Animation: City/country name appears in center (1.5s), then transitions to top
  3. Gameplay: Static city prompt at top-center, map interactive
- **Compact Results**: RoundResults redesigned as small card at bottom-center to keep distance line visible on map
- **Distance Visualization**: Green dashed line (Polyline) connecting guess pin to target city on results screen
- **Z-Index Layering**: Map at z-0 (background), UI overlays at z-10-50 (foreground)

## Technical Requirements

### City Database Structure
- City name (string)
- Country name (string)
- Latitude (number)
- Longitude (number)
- Difficulty tier (number: 1, 2, 3, etc.)

### Game State Management
- Use React Context API + useReducer pattern
- Track:
  - Current level
  - Current round (1-5)
  - Cities for current level
  - Pin positions for each round
  - Scores for each round
  - Total score for current level
  - Game status (playing, round_complete, level_complete)

### Integration with Phase 1
- Leverage existing InteractiveMap component
- Use `onPinPlaced` callback to capture user's guess
- Extended with `targetLocation` and `showLine` props for round results
- Display Polyline (from react-leaflet) connecting guess to target with green dashed styling
- Position map as background layer (z-index: 0) with UI components layered above
- Reset map state and animation states between rounds

### Distance Calculation
- Implement Haversine formula
- Account for Earth's curvature
- Return distance in kilometers
- Round to nearest whole number
