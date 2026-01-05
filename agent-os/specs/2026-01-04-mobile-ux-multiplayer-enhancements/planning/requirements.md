# Spec Requirements: Mobile UX and Multiplayer Enhancements

## Initial Description
**Feature Description**: Polish the multiplayer experience and fix mobile UI issues across all multiplayer screens.

This spec focuses on improving the user experience in multiplayer mode with 9 key enhancements:
1. Continue button for round results
2. Final round message update
3. Cumulative score display
4. Time-based bonus scoring
5. Mobile text overlap fixes
6. Back to main menu navigation
7. Font color standardization
8. Gradient background consistency
9. Winner confetti animation
10. No-pin timeout handling

## Requirements Discussion

### Answers to Clarifying Questions

**Q1: Continue Button Behavior** - Should the continue button work alongside the existing countdown or replace it?

**Answer:** Works alongside existing countdown. Shows remaining time on the button. Game advances when ALL players click continue OR when timer reaches 0 - whichever comes first.

**Q2: Partial Continue Clicks** - What happens if only some players click continue?

**Answer:** Don't show the counter to players who clicked continue. Just wait silently until all players click or timer expires.

**Q3: Time Bonus Formula** - What should the maximum bonus points be? Should it scale with difficulty?

**Answer:**
- Maximum bonus points: 2000
- Does NOT scale with difficulty level
- Bonus is purely for speed (no accuracy requirement)
- Formula suggestion: `timeBonus = (remainingSeconds / totalRoundSeconds) * 2000`

**Q4: Final Round Message** - Should "Calculating results..." only show on the final round?

**Answer:** YES. "Calculating results..." only shows on round 5 results (before final summary). Rounds 1-4 still show "Next round in X..."

**Q5: Mobile Text Overlap** - Which components need fixing for iPhone 14 Pro?

**Answer:** Audit ALL multiplayer components to fit within 390x844px viewport (iPhone 14 Pro) without scrolling:
- RoomLobby.tsx
- MultiplayerRoundResults.tsx
- MultiplayerGameComplete.tsx
- CityPrompt.tsx
- GameHeader.tsx
- Ensure components don't overlap each other

**Q6: Back to Main Menu Confirmation** - Should there be a confirmation dialog?

**Answer:** NO confirmation dialog needed. This button is on the multiplayer menu screen (after clicking "Multiplayer" button but BEFORE joining/creating a room). User is not in a room yet, so no room to leave.

**Q7: Room Cleanup on Leave** - What happens when host leaves a lobby?

**Answer:** Transfer host status to another player when host leaves the lobby.

**Q8: Font Color Standardization** - Should we audit and define standard colors?

**Answer:** YES. Audit current text colors across all cards and define a standard Tailwind palette (e.g., white for primary text, gray-300 for secondary, gray-400 for labels).

**Q9: Confetti Animation** - Who sees it and how long does it run?

**Answer:**
- Only plays on winner's screen (not all players)
- Duration: 5 seconds
- Full-screen effect
- Auto-play 1 second after final results show
- Use Preline confetti library: https://preline.co/docs/confetti.html

**Q10: No-Pin Timeout Handling** - What happens if a player doesn't place a pin before timer expires?

**Answer:** If someone didn't place a pin within the timer (e.g., 30s for medium difficulty), don't show their pin on the map in the round results and give them 0 points for that round.

### Existing Code to Reference

**Similar Features Identified:**

**Continue Button Pattern:**
- MultiplayerRoundResults.tsx already has auto-advance countdown
- Can reference existing countdown logic in MultiplayerTimer.tsx
- Similar button patterns in ConfirmButton.tsx

**Gradient Background:**
- MainMenu.tsx has the gradient background with animated orbs
- Pattern: `bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900`

**Confirmation Dialogs:**
- DisconnectedPlayerModal.tsx shows modal pattern
- RoomLobby.tsx has leave room confirmation

**Mobile Responsive Patterns:**
- Existing components use Tailwind responsive classes
- Touch target sizing: 44x44px minimum (spacing.touch)
- Max-width containers for readable text

**Animation Patterns:**
- CityPrompt.tsx has 4-phase animation state machine
- Tailwind animations: fade-in, fade-in-up, slide-up

**Scoring System:**
- src/utils/scoring.ts has existing distance-based scoring
- Can extend with time bonus calculation

### Follow-up Questions

No follow-up questions needed. All requirements are clearly defined.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
Not applicable - no visual files were provided in the visuals folder.

## Requirements Summary

### Functional Requirements

#### 1. Continue Button in Round Results

**Behavior:**
- Add "Continue" button to MultiplayerRoundResults.tsx
- Button displays countdown timer text (e.g., "Continue (5s)")
- When a player clicks continue, hide the countdown for that player
- Game advances to next round when ALL players click continue OR timer reaches 0 (whichever comes first)
- Visual indicator showing which players have clicked continue vs waiting

**Technical Details:**
- Socket.IO event: `round:player_ready` (client → server)
- Server tracks which players clicked continue
- Server emits `round:all_ready` when all players ready OR timer expires
- Button styling: Same as existing confirm button (teal-to-blue gradient)
- Fixed bottom-center positioning with slide-up animation

#### 2. Final Round Message Update

**Behavior:**
- On round 5 results ONLY, change auto-advance text from "Next round in X..." to "Calculating results..."
- Rounds 1-4 keep existing "Next round in X..." text
- Message should animate/pulse to indicate server is processing

**Technical Details:**
- Check `currentRound === totalRounds` in MultiplayerRoundResults.tsx
- Conditional rendering: `{isLastRound ? "Calculating results..." : "Next round in {countdown}s"}`
- Apply pulse animation class to "Calculating results..." text

#### 3. Cumulative Total Score Display

**Behavior:**
- In MultiplayerRoundResults.tsx, show both round score AND total cumulative score
- Display format: "Round Score: +500 | Total: 2,300"
- Total score should be prominently displayed (larger/bolder than round score)
- Update after each round to show running total

**Technical Details:**
- Backend calculates cumulative totals in GameSessionManager
- Socket event `game:round_complete` includes both `roundScore` and `totalScore` for each player
- Frontend displays both values in results table
- Number formatting with commas for readability

#### 4. Time-Based Bonus Scoring

**Behavior:**
- Award bonus points based on how quickly player places pin and confirms
- Maximum bonus: 2000 points
- Formula: `timeBonus = (remainingSeconds / totalRoundSeconds) * 2000`
- Example: 15s remaining out of 30s total = (15/30) * 2000 = 1000 bonus points
- Bonus does NOT scale with difficulty level
- Bonus applies regardless of accuracy (pure speed reward)
- Display time bonus separately in round results: "Distance Score: 1,500 + Time Bonus: 1,000 = Total: 2,500"

**Technical Details:**
- Track `guessSubmittedAt` timestamp when player confirms pin
- Calculate `remainingSeconds = roundDuration - (guessSubmittedAt - roundStartTime)`
- Apply formula: `Math.floor((remainingSeconds / roundDuration) * 2000)`
- Store time bonus in `PlayerRoundResult` interface
- Backend: Update GameSessionManager.processGuess() to calculate time bonus
- Frontend: Display time bonus breakdown in MultiplayerRoundResults

#### 5. Mobile Text Overlap Fixes (iPhone 14 Pro)

**Target Device:**
- iPhone 14 Pro: 390x844px viewport
- Also test on iPhone SE: 375x667px (minimum width)

**Components to Audit & Fix:**

**RoomLobby.tsx:**
- Player list with ready status indicators
- Room code display
- Difficulty selector
- Start game button
- Ensure no overlap between player names, ready icons, and buttons
- Vertical scrolling should work if needed for 5 players

**MultiplayerRoundResults.tsx:**
- Results table with 5 player rows
- Columns: Player Name, Distance, Round Score, Total Score
- Ensure table fits within 390px width (may need horizontal scroll)
- Compact padding and font sizes for mobile
- Test with long player names (truncate if needed)

**MultiplayerGameComplete.tsx:**
- Final standings with podium (top 3 medals)
- Player cards showing total score
- Rematch buttons
- Ensure all 5 player cards visible without text overflow
- Test with varying score values (1-digit to 5-digit scores)

**CityPrompt.tsx:**
- City name and country display
- Animation from center to top-right corner
- Ensure text doesn't overlap with GameHeader when in top-right position
- Test with long city/country names

**GameHeader.tsx:**
- Round indicator (Round X/5)
- Score display
- Timer display
- Ensure elements don't overlap on small screens
- Use responsive font sizes (text-sm on mobile, text-lg on desktop)

**General Fixes:**
- Use `text-sm` or `text-xs` for mobile screens
- Implement `truncate` class for long text
- Use `max-w-[Xpx]` to constrain element widths
- Add responsive padding: `px-2 md:px-4`
- Test all screens in Chrome DevTools iPhone 14 Pro emulation

#### 6. Back to Main Menu Button

**Location:**
- Add button to the multiplayer menu/selection screen
- This is the screen shown AFTER clicking "Multiplayer" from main menu
- Shows options like "Create Room" and "Join Room"
- Button should navigate back to MainMenu.tsx

**Behavior:**
- No confirmation dialog needed (user hasn't joined a room yet)
- Simple navigation: `navigate('/')` or similar
- Button styling: Secondary/outline style (not primary CTA)
- Positioned at top-left or bottom of screen

**Technical Details:**
- Add button to MultiplayerMenu component (create if doesn't exist)
- Use React Router's `useNavigate()` hook
- Button text: "← Back to Main Menu" or "← Back"
- Tailwind classes: `text-gray-300 hover:text-white transition-colors`

#### 7. Font Color Standardization

**Current State Audit:**
- Identify all text color variations across cards/components
- Note inconsistencies (e.g., some use text-white, others text-gray-100)

**Standardized Palette:**
- **Primary Text**: `text-white` - Main headings, player names, scores
- **Secondary Text**: `text-gray-300` - Descriptions, labels, helper text
- **Tertiary Text**: `text-gray-400` - Timestamps, metadata, footnotes
- **Disabled Text**: `text-gray-500` - Disabled buttons, inactive states
- **Success Text**: `text-green-400` - Positive actions, wins
- **Warning Text**: `text-amber-400` - Warnings, cautions
- **Error Text**: `text-red-400` - Errors, disconnections

**Components to Update:**
- RoomLobby.tsx - Player list text
- MultiplayerRoundResults.tsx - Table text
- MultiplayerGameComplete.tsx - Standings text
- All card components - Ensure consistent hierarchy
- Button text - Primary vs secondary buttons

**Implementation:**
- Create Tailwind utility classes if needed
- Update all components to use standardized classes
- Document in component library or style guide

#### 8. Gradient Background on MP Final Summary

**Current State:**
- MultiplayerGameComplete.tsx has plain black background

**Desired State:**
- Use same gradient background as MainMenu.tsx
- Pattern: `bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900`
- Include animated orbs if possible (floating background elements)

**Technical Details:**
- Copy gradient classes from MainMenu.tsx
- Apply to MultiplayerGameComplete container div
- Ensure text contrast is maintained (white text on dark gradient)
- Test readability of player cards on gradient background
- May need semi-transparent card backgrounds: `bg-slate-800/50 backdrop-blur-sm`

#### 9. Confetti Animation for Winner

**Library:**
- Preline Confetti: https://preline.co/docs/confetti.html
- Install via npm: `npm install preline`

**Behavior:**
- Auto-play confetti animation 1 second after final results show
- Only plays on winner's screen (not all players)
- Full-screen effect (covers entire viewport)
- Duration: 5 seconds
- No user click required (auto-triggered)

**Technical Details:**
- Import confetti library in MultiplayerGameComplete.tsx
- Use `useEffect` hook to trigger animation after 1 second delay
- Check if current player is winner: `currentPlayer.id === standings[0].playerId`
- Configure confetti options: `{ particleCount: 100, spread: 70, origin: { y: 0.6 } }`
- Clean up animation on component unmount
- Confetti should render above all other content (high z-index)

**Implementation Steps:**
1. Install Preline library
2. Import confetti function
3. Add useEffect with 1s setTimeout
4. Trigger confetti if current player is winner
5. Test on mobile (ensure performance is acceptable)

#### 10. No-Pin Timeout Handling

**Behavior:**
- If a player doesn't place a pin before timer expires, they get 0 points for that round
- Their pin should NOT appear on the map in round results
- Results table shows their distance as "—" or "No guess"
- Score shows 0 for that round

**Technical Details:**
- Backend: Track which players submitted guesses in GameSessionManager
- Players who didn't submit get default result: `{ distance: null, score: 0, timeBonus: 0 }`
- Frontend: Check if player has `distance === null` in MultiplayerRoundResults
- Conditional rendering: Don't render pin marker if no guess
- Display "—" or "No guess" in distance column
- Ensure map zoom still works with subset of pins (only players who guessed)

**Edge Cases:**
- If NO players submit guesses, show message: "No guesses submitted this round"
- If only 1 player submits, show just their pin
- Disconnected players also get 0 points and no pin

### Reusability Opportunities

**Components that can be extended:**
- MultiplayerRoundResults.tsx - Add continue button, cumulative score, time bonus display
- MultiplayerGameComplete.tsx - Add gradient background, confetti animation
- GameSessionManager.js - Extend scoring logic with time bonus calculation
- MultiplayerTimer.tsx - Reference for countdown logic
- ConfirmButton.tsx - Reference for button styling
- MainMenu.tsx - Reference for gradient background pattern

**Backend patterns to reference:**
- GameSessionManager.processGuess() - Extend with time bonus calculation
- Socket.IO event handlers - Add round:player_ready event
- RoomManager - Reference for host transfer logic

**Existing patterns to model after:**
- CityPrompt animation state machine
- DisconnectedPlayerModal for modal patterns
- Existing countdown timers in MultiplayerTimer
- Gradient backgrounds in MainMenu

### Scope Boundaries

**In Scope:**
1. Continue button with countdown in round results
2. Final round message update to "Calculating results..."
3. Cumulative total score display in round summaries
4. Time-based bonus scoring (max 2000 points)
5. Mobile text overlap fixes for iPhone 14 Pro (390x844px)
6. Back to main menu button on multiplayer selection screen
7. Font color standardization across all cards
8. Gradient background on MP final summary screen
9. Confetti animation for winner (5s, full-screen, auto-play)
10. No-pin timeout handling (0 points, no pin on map)

**Out of Scope:**
- Sound effects for confetti or button clicks
- New multiplayer features beyond these UI improvements
- Single-player mode UI fixes
- Changes to game rules or round structure
- Database/persistence for scores or stats
- Leaderboard or player profiles
- Custom confetti designs (use Preline defaults)
- Animation changes to existing components (except confetti)

**Future Enhancements (deferred):**
- Sound effects library integration
- Haptic feedback for mobile devices
- Advanced analytics or score tracking
- Social sharing of results
- Replay/spectator mode

### Technical Considerations

**Mobile-First Design (iPhone 14 Pro):**
- Target resolution: 390x844 pixels
- Minimum compatibility: 375x667 pixels (iPhone SE)
- No horizontal scrolling (except results table if needed)
- All touch targets ≥ 44x44px
- Test in both portrait and landscape orientations
- Ensure text legibility at default iOS font sizes

**Integration Points:**
- Frontend: React components (MultiplayerRoundResults, MultiplayerGameComplete, RoomLobby, etc.)
- Backend: Socket.IO server with GameSessionManager and RoomManager
- WebSocket Events: New event for round:player_ready
- External Library: Preline confetti library
- Styling: Tailwind CSS with responsive utilities

**Existing System Constraints:**
- React 18+ with Context API + useReducer
- Socket.IO for real-time communication
- No database - in-memory session management
- 5-round match format unchanged
- Existing difficulty levels (easy/medium/hard) unchanged
- Existing map library (Leaflet.js) unchanged

**Similar Code Patterns to Follow:**
- Countdown timers: MultiplayerTimer.tsx
- Button animations: ConfirmButton.tsx slide-up pattern
- Gradient backgrounds: MainMenu.tsx gradient and orbs
- Conditional rendering based on round: Existing round logic in Game.tsx
- Responsive design: Existing Tailwind responsive classes across components
- Socket event handling: Existing patterns in useSocket and socketHandlers.js

**Technology Stack (from tech-stack.md):**
- Frontend: React 18+, Tailwind CSS, Leaflet.js
- Backend: Node.js, Express.js, Socket.IO
- State Management: React Context API + useReducer
- New Dependency: Preline confetti library
- Testing: Vitest (backend), Jest + React Testing Library (frontend)

**Performance Considerations:**
- Confetti animation should not impact game performance on mobile
- Test on actual iPhone 14 Pro device if possible
- Ensure button click handlers are debounced to prevent double-clicks
- Time bonus calculation should be server-side to prevent cheating
- Optimize re-renders when updating countdown timers

**Security Considerations:**
- Time bonus calculation must be server-authoritative (client can't manipulate)
- Validate all Socket.IO events from clients
- Prevent players from clicking continue multiple times (idempotent)
- Ensure only winner's client triggers confetti (server sends winner ID)

**Accessibility Considerations:**
- Ensure color contrast meets WCAG AA standards (standardized colors)
- Button text clearly indicates purpose ("Continue" vs just icon)
- Screen reader support for countdown timers
- Confetti should not interfere with screen readers (decorative only)
- Touch targets meet minimum size requirements

**Testing Requirements:**
- Unit tests for time bonus calculation logic
- Integration tests for round:player_ready Socket.IO event
- Visual regression tests for mobile layouts (390px and 375px widths)
- Manual testing on actual iPhone 14 Pro device
- Test confetti animation performance on mid-range Android devices
- Test all edge cases: no pins submitted, partial pins, disconnections
