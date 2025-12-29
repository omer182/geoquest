/**
 * Calculates the score based on distance, city difficulty, and difficulty level.
 *
 * Formula:
 * - Base Score: Uses exponential decay based on distance
 *   - Perfect guess (0 km): 5000 points
 *   - 100 km away: ~2500 points
 *   - 500 km away: ~833 points
 *   - 1000+ km away: ~455 points
 *
 * - City Difficulty Multiplier (tier):
 *   - Tier 1 (famous cities like New York, Paris): x1.0
 *   - Tier 2 (moderately known cities): x1.5
 *   - Tier 3 (obscure/lesser-known cities): x2.0
 *
 * - Level Multiplier:
 *   - Level 1: x1.0
 *   - Level 5: x1.8
 *   - Level 10: x2.8
 *   - Scales linearly: 1.0 + (level - 1) * 0.2
 *
 * @param {number} distanceKm - Distance between guess and actual location in kilometers
 * @param {number} cityTier - Difficulty tier of the city (1 = easy, 2 = medium, 3 = hard)
 * @param {number} level - Current game level or difficulty equivalent (1-based)
 * @returns {number} Final score with all multipliers applied
 */
export function calculateScore(distanceKm, cityTier = 1, level = 1) {
  // Base score: exponential decay based on distance
  // Formula: 5000 / (1 + distance / 100)
  // This rewards accuracy - closer guesses get exponentially more points
  const baseScore = 5000 / (1 + distanceKm / 100);

  // City difficulty multiplier
  // Tier 1 (famous): x1.0, Tier 2 (moderate): x1.5, Tier 3 (obscure): x2.0
  const cityMultiplier = cityTier === 1 ? 1.0 : cityTier === 2 ? 1.5 : 2.0;

  // Level multiplier: increases by 0.2 per level
  // Level 1: x1.0, Level 5: x1.8, Level 10: x2.8
  const levelMultiplier = 1.0 + (level - 1) * 0.2;

  // Calculate final score with both multipliers
  const finalScore = Math.round(baseScore * cityMultiplier * levelMultiplier);

  return finalScore;
}

/**
 * Gets the minimum score threshold required to pass a given level.
 * The threshold increases progressively with each level to provide
 * increasing difficulty.
 *
 * With max score of ~5000 per round and 5 rounds per level:
 * - Theoretical max per level: ~25,000 points
 * - Good guess (500km): ~833 points
 * - Average guess (1500km): ~285 points
 *
 * Level progression requires averaging:
 * - Level 1: 600 points/round (3,000 total) - ~500km average accuracy
 * - Level 5: 1,000 points/round (5,000 total) - ~300km average accuracy
 * - Level 10: 1,800 points/round (9,000 total) - ~150km average accuracy
 *
 * @param {number} level - The current level number (1-based)
 * @returns {number} Minimum score required to pass the level (total for 5 rounds)
 */
export function getLevelThreshold(level) {
  if (level === 1) {
    return 3000; // ~600 points per round
  } else if (level === 2) {
    return 3500; // ~700 points per round
  } else if (level === 3) {
    return 4000; // ~800 points per round
  } else if (level === 4) {
    return 4500; // ~900 points per round
  } else if (level === 5) {
    return 5000; // ~1000 points per round
  } else if (level === 6) {
    return 6000; // ~1200 points per round
  } else if (level === 7) {
    return 7000; // ~1400 points per round
  } else if (level === 8) {
    return 8000; // ~1600 points per round
  } else if (level === 9) {
    return 9000; // ~1800 points per round
  } else {
    // Level 10+: Cap at 10,000 (~2000 points per round, ~40% of theoretical max)
    return 10000;
  }
}
