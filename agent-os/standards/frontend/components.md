## UI component best practices

- **Single Responsibility**: Each component should have one clear purpose and do it well
- **Reusability**: Design components to be reused across different contexts with configurable props
- **Composability**: Build complex UIs by combining smaller, simpler components rather than monolithic structures
- **Clear Interface**: Define explicit, well-documented props with sensible defaults for ease of use
- **Encapsulation**: Keep internal implementation details private and expose only necessary APIs
- **Consistent Naming**: Use clear, descriptive names that indicate the component's purpose and follow team conventions
- **State Management**: Keep state as local as possible; lift it up only when needed by multiple components
- **Minimal Props**: Keep the number of props manageable; if a component needs many props, consider composition or splitting it
- **Documentation**: Document component usage, props, and provide examples for easier adoption by team members

## Component-Specific Guidelines

### GameInfoCard
- Shows level, round, current score, and progress bar
- When level threshold is passed (`pointsNeeded === 0`):
  - Progress bar changes to green (`bg-green-500`)
  - "to advance" text is hidden
  - Card becomes clickable to retrigger confetti
  - Small confetti animation triggers automatically on threshold pass
- Confetti uses `canvas-confetti` library with localized positioning

### CityPrompt
- Has two display modes: centered (large) and corner (small)
- Centered mode matches LevelAnnouncement styling (solid background, thick border)
- Animation sequence: fadeIn → center → flyingUp → static
- Static version only shows after animation completes (prevents blinking)
- Both city name and country use white color when centered

### MultiplayerTimer
- Starts only after CityPrompt animation completes
- Mobile: positioned top-left (`top-4 left-4`)
- Desktop: centered top (`top-4 left-1/2 -translate-x-1/2`)
- Consistent styling with other overlay components

### ConfirmButton
- Handles both normal confirm state and waiting state (`isWaiting` prop)
- Waiting state shows loading spinner and "Waiting for other players..." text
- Replaces separate WaitingIndicator component

### LevelAnnouncement
- Should NOT be shown when `gameStatus === GameStatus.LEVEL_COMPLETE`
- Prevents brief flash before level summary screen
