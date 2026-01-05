# Manual Mobile Testing Checklist

**Spec:** Mobile UX and Multiplayer Enhancements
**Date:** 2026-01-05
**Tester:** QA Engineer / Developer
**Target Devices:**
- iPhone 14 Pro (390x844px) - Primary
- iPhone SE (375x667px) - Minimum support

## Testing Instructions

All tests should be performed using Chrome DevTools Device Emulation:
1. Open Chrome DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select device from dropdown or set custom dimensions
4. Test in both portrait and landscape orientations where applicable

---

## Test Suite 1: RoomLobby.tsx Mobile Responsiveness

### iPhone 14 Pro (390x844px)
- [ ] Room code displays clearly without truncation
- [ ] Player list with 5 players fits without vertical scroll issues
- [ ] Player names with 20+ characters truncate with ellipsis
- [ ] Ready status indicators (green dots) visible next to all players
- [ ] Difficulty selector buttons are tap-friendly (44x44px minimum)
- [ ] Start Game button has adequate padding and is easily tappable
- [ ] No horizontal scrolling required
- [ ] All text is readable (minimum 12px font size)
- [ ] Spacing between UI elements is adequate (no overlap)

### iPhone SE (375x667px)
- [ ] Room code displays without overflow
- [ ] Player list with 5 players displays (may require scroll)
- [ ] Difficulty selector fits width without wrapping
- [ ] Start Game button visible without scrolling
- [ ] All interactive elements remain tappable

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 2: MultiplayerRoundResults.tsx Mobile Display

### iPhone 14 Pro (390x844px)
- [ ] Results table with 5 players fits width (or horizontal scroll works)
- [ ] Player names truncate appropriately if too long
- [ ] Distance, score, time bonus, and total score columns are readable
- [ ] Time bonus breakdown displays clearly (e.g., "1,500 + 1,000")
- [ ] Continue button is visible and properly positioned (bottom-center)
- [ ] Continue button has minimum 44x44px touch target
- [ ] Countdown text updates smoothly every second
- [ ] "Calculating results..." message displays on round 5 with pulse animation
- [ ] Crown emoji (👑) displays next to round winner
- [ ] Current player row is highlighted with "(You)" label
- [ ] No-pin timeout displays "—" or "No guess" in distance column
- [ ] Map with player pins renders without overlap

### iPhone SE (375x667px)
- [ ] Results table fits or scrolls horizontally without breaking layout
- [ ] Continue button remains visible and tappable
- [ ] Text remains readable (no font size below 11px)

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 3: MultiplayerGameComplete.tsx Final Summary

### iPhone 14 Pro (390x844px)
- [ ] Gradient background renders correctly (from-slate-900 via-blue-950 to-slate-900)
- [ ] Animated orbs display in background without blocking content
- [ ] All 5 player cards fit vertically (scroll if needed)
- [ ] Player cards have semi-transparent backgrounds (bg-slate-800/50)
- [ ] Medal emojis (🥇🥈🥉) display for top 3 players
- [ ] Player names, scores, average distance, best round display clearly
- [ ] Large scores (5-digit) format with commas (e.g., "12,345")
- [ ] Rematch section shows all players with ready status indicators
- [ ] Play Again and Leave Room buttons are easily tappable
- [ ] Text contrast is sufficient on gradient background (WCAG AA)
- [ ] Confetti animation triggers for winner (test as winner)
- [ ] Confetti does not lag or impact performance

### iPhone SE (375x667px)
- [ ] Player cards fit width without horizontal scroll
- [ ] All text remains readable
- [ ] Buttons remain tappable

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 4: GameHeader.tsx Mobile Layout

### iPhone 14 Pro (390x844px)
- [ ] Round indicator (e.g., "Round 3/5") displays in header
- [ ] Score display shows current score
- [ ] Timer displays countdown seconds
- [ ] All header elements fit in top bar without overlap
- [ ] Text uses responsive font sizes (text-sm on mobile)
- [ ] Header does not overlap with CityPrompt component

### iPhone SE (375x667px)
- [ ] Header elements remain visible and don't wrap
- [ ] No overlap with other UI components

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 5: CityPrompt.tsx Mobile Display

### iPhone 14 Pro (390x844px)
- [ ] City name displays clearly during animation phases
- [ ] Country name displays below city name
- [ ] Long city names (20+ characters) truncate with ellipsis
- [ ] 4-phase animation works smoothly (center → fade → top-right → stay)
- [ ] No overlap with GameHeader when in top-right position
- [ ] Text remains readable at all animation phases

### iPhone SE (375x667px)
- [ ] City prompt fits width in top-right position
- [ ] Animation does not cause layout shift

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 6: MultiplayerSubmenu Mobile Layout

### iPhone 14 Pro (390x844px)
- [ ] "Create Room" button is centered and tappable
- [ ] "Join Room" button is centered and tappable
- [ ] "Back to Main Menu" button is visible (top-left or bottom)
- [ ] All buttons have minimum 44x44px touch target
- [ ] Button text is readable and properly styled

### iPhone SE (375x667px)
- [ ] All buttons fit width
- [ ] Back button remains accessible

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 7: Font Color Standardization

### Visual Audit
- [ ] Primary text (headings, player names, scores) uses text-white
- [ ] Secondary text (labels, descriptions) uses text-gray-300
- [ ] Tertiary text (timestamps, metadata) uses text-gray-400
- [ ] Disabled text uses text-gray-500
- [ ] Success indicators (ready status, winner) use text-green-400
- [ ] Error messages (disconnections) use text-red-400
- [ ] Color usage is consistent across all multiplayer components

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 8: Continue Button Functionality

### Functional Tests
- [ ] Continue button displays countdown text (e.g., "Continue (5s)", "Continue (4s)")
- [ ] Countdown updates every second
- [ ] Clicking continue hides countdown for current player
- [ ] Game advances when ALL players click continue
- [ ] Game advances when timer reaches 0 (if not all ready)
- [ ] Button cannot be clicked multiple times
- [ ] Button uses teal-to-blue gradient styling
- [ ] Button has slide-up animation on appearance
- [ ] Button positioned at bottom-center with fixed positioning

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 9: Time Bonus Display

### Functional Tests
- [ ] Time bonus displays in round results breakdown
- [ ] Time bonus shows separately from distance score
- [ ] Format displays as: "Distance Score + Time Bonus = Total"
- [ ] Fast submissions show higher time bonus
- [ ] Late submissions show lower or zero time bonus
- [ ] Numbers format with commas for readability
- [ ] Time bonus calculation appears accurate (max 2000 points)

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 10: No-Pin Timeout Handling

### Functional Tests
- [ ] Player who doesn't place pin shows 0 points in results
- [ ] No map marker displayed for player without guess
- [ ] Distance column shows "—" or "No guess" for timeout
- [ ] Player still appears in results table
- [ ] If all players timeout, appropriate message displays
- [ ] Map zoom still works with partial pins

**Issues Found:**
```
[Document any issues here]
```

---

## Test Suite 11: Confetti Animation Performance

### Performance Tests (Mobile)
- [ ] Confetti animation triggers 1 second after final results display
- [ ] Only winner's screen shows confetti
- [ ] Animation runs for 5 seconds
- [ ] Full-screen effect covers entire viewport
- [ ] Animation does not cause noticeable lag on mobile
- [ ] Animation does not block UI interaction
- [ ] Animation cleans up after completion
- [ ] Multiple confetti bursts don't accumulate

**Performance Notes:**
```
[Document frame rate, lag, or visual issues here]
```

---

## Test Suite 12: End-to-End Multiplayer Workflow

### Full Game Flow Test
- [ ] Create room from multiplayer menu
- [ ] Join room with second player (use incognito window)
- [ ] Start game and complete all 5 rounds
- [ ] Verify time bonuses display correctly each round
- [ ] Click continue button on some rounds
- [ ] Let timer expire on other rounds
- [ ] Intentionally timeout on one round (don't place pin)
- [ ] Verify cumulative scores increase each round
- [ ] Complete game and see final summary
- [ ] Verify winner sees confetti (test as winner)
- [ ] Verify gradient background on final summary
- [ ] Test rematch flow (all players ready)
- [ ] Leave room and return to main menu

**Workflow Issues:**
```
[Document any workflow breaks or unexpected behavior]
```

---

## Summary

### Total Tests: ~100+ checkpoints
### Tests Passed: ___
### Tests Failed: ___
### Critical Issues: ___
### Minor Issues: ___

### Overall Assessment:
```
[Provide overall mobile UX assessment here]
- Are all 10 enhancements working correctly?
- Is the mobile experience smooth at 390px and 375px?
- Are there any blocking issues for deployment?
```

### Recommendations:
```
[List any recommended fixes or improvements]
```

---

**Testing Completed By:** _______________
**Date:** _______________
**Sign-off:** _______________
