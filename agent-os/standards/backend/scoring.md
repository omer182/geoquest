# Scoring Logic Standards

## Time Bonus Calculation

**Formula:**
- Time bonus is **25% of the base score** (not a fixed amount)
- Maximum bonus: `baseScore * 0.25` (for immediate submission)
- Minimum bonus: `0` (at timer expiration)
- Formula: `(remainingSeconds / timerDuration) * (baseScore * 0.25)`

**Important Rules:**
- If `baseScore === 0`, time bonus is also `0` (no time bonus without distance score)
- Time bonus is calculated based on submission speed within the round timer duration
- Time bonus is added to base score for total round score

**Implementation:**
```javascript
calculateTimeBonus(submittedAt, baseScore) {
  if (!this.roundStartTime || baseScore === 0) {
    return 0;
  }

  const elapsedSeconds = (submittedAt - this.roundStartTime) / 1000;
  const remainingSeconds = Math.max(0, this.timerDuration - elapsedSeconds);

  const maxTimeBonus = baseScore * 0.25;
  const timeBonus = Math.floor((remainingSeconds / this.timerDuration) * maxTimeBonus);

  return timeBonus;
}
```

## Round Results Sorting

- Results are sorted by **total score** (highest first)
- Total score = cumulative score across all rounds
- Crown icon is always assigned to the player with highest total score

## Score Validation

- Validate that distance and score values are not swapped
- Recalculate score if values seem inconsistent
- Ensure time bonus is only applied when base score > 0

