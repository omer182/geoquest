# Specification: Mobile UX and Multiplayer Enhancements

## Goal
Improve the multiplayer experience with 10 polish enhancements focusing on mobile UI, user experience, and gameplay feedback through better scoring, navigation, and visual consistency.

## User Stories
- As a mobile player, I want all multiplayer screens to fit properly on my iPhone without text overlap so that I can easily read and interact with the game
- As a multiplayer player, I want to skip waiting after round results by clicking continue so that gameplay feels faster when all players are ready
- As a competitive player, I want to see time-based bonus points and cumulative totals so that I understand my complete scoring performance
- As a winner, I want celebratory confetti animation so that my victory feels rewarding and satisfying

## Specific Requirements

**Continue Button for Round Results**
- Add interactive continue button to MultiplayerRoundResults component
- Button displays countdown timer text showing remaining seconds (e.g., "Continue (5s)")
- When player clicks continue, hide countdown for that player only
- Game advances when ALL players click continue OR timer reaches 0, whichever comes first
- Socket.IO event `round:player_ready` sent from client to server when continue clicked
- Server tracks which players are ready and emits `round:all_ready` when condition met
- Button styling uses teal-to-blue gradient matching ConfirmButton pattern with slide-up animation
- Fixed bottom-center positioning identical to ConfirmButton layout

**Final Round Message Update**
- Change auto-advance text on round 5 results from "Next round in X..." to "Calculating results..."
- Rounds 1-4 keep existing countdown text
- Conditional check: `currentRound === totalRounds` in MultiplayerRoundResults
- Apply pulse animation to "Calculating results..." text to indicate server processing
- No changes to timing, only text content

**Cumulative Total Score Display**
- Display both round score AND total cumulative score in MultiplayerRoundResults
- Already implemented in current code with totalScore in results table
- Enhance visibility by making total score more prominent with larger font and bold styling
- Backend GameSessionManager already calculates cumulative totals correctly
- Format numbers with commas using existing formatNumber function

**Time-Based Bonus Scoring**
- Award bonus points based on guess submission speed
- Maximum bonus: 2000 points, does NOT scale with difficulty
- Formula: `timeBonus = Math.floor((remainingSeconds / totalRoundSeconds) * 2000)`
- Track timestamp when player confirms guess in backend GameSessionManager
- Calculate remainingSeconds from roundStartTime and submission timestamp
- Update PlayerRoundResult interface to include timeBonus field
- Display time bonus separately in round results showing breakdown (Distance Score + Time Bonus = Total)
- Backend implementation in GameSessionManager.addGuess() method
- Server-authoritative calculation to prevent client manipulation

**Mobile Text Overlap Fixes for iPhone 14 Pro (390x844px)**
- Audit and fix RoomLobby.tsx: player list, room code, difficulty selector, start button spacing
- Audit and fix MultiplayerRoundResults.tsx: table with 5 player rows fits 390px width
- Audit and fix MultiplayerGameComplete.tsx: all 5 player cards visible without overflow
- Audit and fix CityPrompt.tsx: ensure no overlap with GameHeader in top-right position
- Audit and fix GameHeader.tsx: round indicator, score, timer don't overlap on small screens
- Use responsive font sizes: text-xs or text-sm on mobile, text-lg on desktop
- Implement truncate class for long player names and city names
- Add responsive padding: px-2 md:px-4
- Test all screens at 390px and 375px widths (iPhone SE minimum)
- Ensure minimum touch target size of 44x44px for all interactive elements

**Back to Main Menu Button**
- Add button to multiplayer menu/selection screen (shown after clicking "Multiplayer" but before joining room)
- No confirmation dialog needed since user hasn't joined a room yet
- Simple navigation using React Router's useNavigate() hook to return to MainMenu
- Button text: "← Back to Main Menu"
- Secondary styling: text-gray-300 hover:text-white with border
- Positioned at top-left or bottom of screen for easy access

**Font Color Standardization**
- Define standardized Tailwind color palette for text hierarchy
- Primary text: text-white for main headings, player names, scores
- Secondary text: text-gray-300 for descriptions, labels, helper text
- Tertiary text: text-gray-400 for timestamps, metadata
- Disabled text: text-gray-500 for inactive states
- Success text: text-green-400 for wins, positive actions
- Warning text: text-amber-400 for warnings
- Error text: text-red-400 for errors, disconnections
- Update RoomLobby, MultiplayerRoundResults, MultiplayerGameComplete to use standardized classes

**Gradient Background on Multiplayer Final Summary**
- Apply same gradient background from MainMenu.tsx to MultiplayerGameComplete.tsx
- Pattern: `bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900`
- Include animated orbs (floating background elements) from MainMenu
- Ensure text contrast maintained with white text on dark gradient
- Use semi-transparent card backgrounds: `bg-slate-800/50 backdrop-blur-sm` for readability

**Confetti Animation for Winner**
- Install and use Preline confetti library: https://preline.co/docs/confetti.html
- Auto-play confetti 1 second after final results display
- Only plays on winner's screen (check currentPlayer.id === standings[0].playerId)
- Full-screen effect covering entire viewport
- Duration: 5 seconds
- Configuration: 100 particles, 70-degree spread, origin y 0.6
- Implementation in MultiplayerGameComplete.tsx using useEffect with setTimeout
- High z-index to render above all other content
- Clean up animation on component unmount

**No-Pin Timeout Handling**
- If player doesn't place pin before timer expires, assign 0 points for that round
- Backend GameSessionManager tracks submitted guesses vs total players
- Players without guesses get default result: `{ distance: null, score: 0, timeBonus: 0 }`
- Frontend checks `distance === null` in MultiplayerRoundResults to conditionally render
- Don't render pin marker on map if no guess submitted
- Display "—" or "No guess" in distance column
- Ensure map zoom works with subset of pins (only players who guessed)
- Handle edge case: if NO players submit, show "No guesses submitted this round"

## Existing Code to Leverage

**MultiplayerRoundResults.tsx - Current countdown and table structure**
- Already has auto-advance countdown logic with formatNumber function
- Table structure with player names, distances, scores ready for cumulative display
- Conditional rendering for current player highlighting and winner crown
- Slide-up animation and backdrop-blur styling to replicate for continue button

**MultiplayerGameComplete.tsx - Rematch pattern and player list UI**
- Ready button pattern with green indicator dots shows how to implement continue button readiness
- Player list with inline status display can inform continue button player tracking
- Already has formatNumber for score display consistency
- Confirmation modal pattern for leave room can inform any future dialog needs

**MainMenu.tsx - Gradient background with animated orbs**
- Exact gradient classes: `bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900`
- Three animated orbs with blur-3xl, different sizes, and animation delays
- Enhanced gradient overlay pattern with pointer-events-none
- Copy complete background structure to MultiplayerGameComplete

**GameSessionManager.js - Scoring and round management**
- addGuess method calculates distance and score, ready to extend with time bonus
- Already tracks submittedAt timestamp (line 107) for each guess
- roundStartTime available for time bonus calculation
- calculateRoundResults method aggregates player data, can include timeBonus field
- PlayerRoundResult structure returned to frontend, add timeBonus to response

**MultiplayerTimer.tsx - Server-synchronized countdown logic**
- Pure server timestamp approach using serverStartTime and timerDuration
- Force re-render every 100ms pattern can be used for continue button countdown
- Calculate remaining time using Date.now() - serverStartTime formula
- Color change thresholds (white → amber → red) pattern for visual feedback

## Out of Scope
- Sound effects for confetti or button clicks
- New multiplayer features beyond these 10 UI improvements
- Single-player mode UI fixes
- Changes to game rules or round structure beyond time bonus scoring
- Database or persistence for scores
- Leaderboard or player profile systems
- Custom confetti designs (use Preline defaults only)
- Animation changes to existing components except confetti
- Landscape orientation specific optimizations
- Testing on Android devices (focus on iPhone 14 Pro)
