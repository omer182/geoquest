# Recent Updates Summary

**Last Updated:** January 2026

This document provides a quick reference for recent changes that should be considered when writing new specs.

## Quick Reference

### Map Styling
- **Tile Provider:** CartoDB Positron No Labels (realistic map without labels)
- **Country Colors:** 4-color vibrant palette (pink, blue, green, yellow) - 60% opacity
- **USA States:** Subtle borders (0.8px) with transparent fill
- **Ocean Color:** `#4A90E2` (vibrant blue)
- **Distance Lines:** Dashed pattern (`dashArray: '10, 8'`)

### Scoring Logic
- **Time Bonus:** 25% of base score (not fixed amount)
- **Time Bonus Rule:** If base score is 0, time bonus is also 0
- **Results Sorting:** By total score (highest first)
- **Crown:** Always on top player (highest total score)

### Component Behavior
- **Timer:** Starts after CityPrompt animation completes
- **CityPrompt:** Static version only shows after animation completes (prevents blinking)
- **LevelAnnouncement:** Hidden when `gameStatus === LEVEL_COMPLETE`
- **GameInfoCard:** Green progress bar + confetti when threshold passed
- **ConfirmButton:** Handles waiting state (replaces WaitingIndicator)

### Mobile UX
- **Component Alignment:** Timer, CityPrompt, WaitingIndicator have consistent styling
- **Timer Position:** Mobile top-left, desktop centered top
- **Padding:** `px-3 sm:px-4 py-2.5` for overlay components
- **Border:** `border border-primary/30` for consistency

### Technical Details
- **Vite Cache:** Custom directory `.vite-cache` (avoids permission issues)
- **Environment:** Separate `.env` files for frontend and backend
- **Debug Logs:** Removed from production code

## Files to Review for New Specs

1. **`product/changelog.md`** - Detailed changelog of all changes
2. **`product/tech-stack.md`** - Updated map tile provider information
3. **`standards/frontend/components.md`** - Component-specific guidelines
4. **`standards/backend/scoring.md`** - Scoring logic standards

## Key Considerations

When writing new specs, keep in mind:

1. **Map must have no labels** - Critical for guessing game
2. **Timer synchronization** - Coordinate with CityPrompt animation
3. **Time bonus calculation** - Percentage-based, not fixed
4. **Component consistency** - Use established styling patterns
5. **Mobile-first** - All components must work on 375px+ width
6. **Animation timing** - Prevent component flashing/blinking

