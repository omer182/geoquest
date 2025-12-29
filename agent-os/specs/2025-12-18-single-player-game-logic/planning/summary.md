# Phase 2 Planning Summary

## Status: COMPLETE ✓

**Phase:** Single Player Game Logic
**Spec Folder:** `/Users/omersher/Documents/projects/geoquest/agent-os/specs/2025-12-18-single-player-game-logic/`
**Date:** 2025-12-18

---

## Documents Created

### 1. Requirements Documentation
**File:** [planning/requirements.md](planning/requirements.md)

Documented all Phase 2 requirements based on your answers:
- Distance-based scoring algorithm (1000 pts for <10km down to 0 pts for ≥1000km)
- Level progression with minimum score thresholds
- Tier-based difficulty (Levels 1-3 use Tier 1 cities)
- City display format (city + country name)
- Fresh session state (no localStorage)
- Round flow with floating confirm button
- Distance precision (rounded to nearest km)
- Out of scope features explicitly documented
- Technical requirements for implementation

### 2. Specification Document
**File:** [spec.md](spec.md)

Complete implementation specification including:
- Goal and user stories
- City database structure with TypeScript types
- Haversine distance calculation algorithm
- Six-tier scoring algorithm (1000/750/500/250/100/0 points)
- Level progression logic with thresholds
- Game state management using React Context + useReducer
- GameStatus enum with 7 states
- Six action types for state transitions
- UI component architecture (6 components)
- Integration with Phase 1 InteractiveMap
- Session management approach (in-memory only)
- Out of scope items

### 3. Tasks Breakdown
**File:** [tasks.md](tasks.md)

Strategic task organization across 6 task groups:

1. **Data Layer** (Task Group 1)
   - City database with TypeScript types
   - Seed data (35+ cities across 3 tiers)
   - City selection logic
   - 2-4 focused tests

2. **Utilities Layer** (Task Group 2)
   - Haversine distance calculation
   - Scoring algorithm
   - Level threshold configuration
   - 3-5 focused tests

3. **State Management Layer** (Task Group 3)
   - GameStatus enum and GameState interface
   - Game reducer with 6 action types
   - React Context provider
   - 4-6 focused tests

4. **UI Components Layer** (Task Group 4)
   - 6 game components (GameHeader, CityPrompt, ScoreDisplay, ConfirmButton, RoundResults, LevelComplete)
   - Tailwind CSS styling
   - Touch-friendly design (44px minimum)
   - 4-7 focused tests

5. **Integration & Game Flow** (Task Group 5)
   - Main Game component orchestration
   - InteractiveMap integration from Phase 1
   - State transition logic
   - Complete round and level flows
   - 3-6 focused tests

6. **Final Verification** (Task Group 6)
   - Review existing 16-28 tests
   - Add maximum 8 strategic tests to fill gaps
   - Manual gameplay testing
   - Code quality and performance verification
   - **Total expected tests: 24-36 maximum**

---

## Key Design Decisions

### Scoring System
- Distance-based with 6 thresholds
- Haversine formula for accurate great circle distance
- Rounded to nearest kilometer

### Level Progression
- Infinite progression starting at Level 1
- 5 cities per level
- Minimum score threshold required to advance
- Levels 1-3 use Tier 1 cities, then gradual progression
- Retry on failure or restart from Level 1

### State Management
- React Context API + useReducer pattern
- Immutable state updates
- Pure reducer function
- 7 game statuses: READY, GUESSING, ROUND_COMPLETE, LEVEL_COMPLETE, LEVEL_FAILED
- 6 action types for complete game control

### UI/UX Flow
1. Display city name + country
2. User places pin on map
3. Floating confirm button appears from bottom
4. User confirms guess
5. Calculate distance and score
6. Show results with distance display
7. Continue to next round or level summary

### Integration with Phase 1
- Leverages existing InteractiveMap component
- Uses `onPinPlaced` callback for coordinate capture
- Resets map between rounds
- Maintains dark-mode premium styling

### Session Management
- Fresh sessions (no localStorage)
- All state in memory via React Context
- Browser refresh resets progress
- Can add persistence in future phases

---

## Open Questions for Future Phases

### Multiplayer Consideration
**Your Question:** "How will that played out in the multiplayer?"

**Context:** You asked about the tier progression system (Levels 1-3 use Tier 1) and its implications for multiplayer gameplay in Phase 6.

**Recommendation for Phase 6:**
- Option 1: Both players see same cities at same difficulty (sync by room level)
- Option 2: Each player has independent level progression (async difficulty)
- Option 3: Match players of similar skill/level ranges
- This decision should be addressed during Phase 6 specification

---

## Standards Compliance

✓ React 18 functional components with hooks
✓ TypeScript strict mode throughout
✓ Tailwind CSS for all styling
✓ Focused testing approach (2-8 tests per group during development)
✓ Maximum 24-36 tests total for Phase 2
✓ Pure functions for business logic
✓ Immutable state management
✓ Mobile-first responsive design
✓ Component-based architecture
✓ Single responsibility principle

---

## Next Steps

Phase 2 specification is **COMPLETE and READY FOR IMPLEMENTATION**.

To begin implementation, you can:
1. Review the [spec.md](spec.md) for technical details
2. Follow the [tasks.md](tasks.md) implementation order
3. Start with Task Group 1 (Data Layer) or run both TG1 and TG2 in parallel

The specification provides a complete blueprint for building the single-player game logic feature.
