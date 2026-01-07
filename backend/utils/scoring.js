/**
 * Calculates the score based on distance, city difficulty, and difficulty level.
 *
 * Formula (Geoguessr-style exponential decay):
 * - Base Score: score = 5000 * e^(-10 * distance / size)
 *   - Perfect guess (0 km): 5000 points
 *   - World map size (diagonal): 14,916.862 km
 *   - 5k score requires being within ~149 meters (1/100,000th of map size)
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
  // Return 0 for distances above 1500km
  if (distanceKm > 1500) {
    return 0;
  }

  // World map diagonal size (distance between opposite corners)
  // This is the "size" parameter in Geoguessr's formula
  const WORLD_MAP_SIZE_KM = 14916.862;

  // Base score: Geoguessr-style exponential decay with adjusted coefficient
  // Formula: 1500 * e^(-22 * distance / size)
  // Max score per round is 1500 points (100%)
  // Using -22 for steeper decay (more balanced scoring - prevents finishing level in 1 guess)
  // This provides exponential decay - very close guesses get near-maximum points,
  // while distant guesses get exponentially fewer points
  let baseScore = 1500 * Math.exp(-22 * distanceKm / WORLD_MAP_SIZE_KM);
  
  // Minimum score floor: ensures very far distances still get reasonable points
  // Formula: max(1, 30 - distance/50) gives ~8 points at 1100km
  // This prevents scores from being too low at extreme distances
  const minScore = Math.max(1, 30 - Math.floor(distanceKm / 50));
  baseScore = Math.max(baseScore, minScore);

  // City difficulty multiplier
  // Tier 1 (famous): x1.0, Tier 2 (moderate): x1.5, Tier 3 (obscure): x2.0
  const cityMultiplier = cityTier === 1 ? 1.0 : cityTier === 2 ? 1.5 : 2.0;

  // Level multiplier: increases by 0.2 per level
  // Level 1: x1.0, Level 5: x1.8, Level 10: x2.8
  const levelMultiplier = 1.0 + (level - 1) * 0.2;

  // Calculate final score with both multipliers, then cap at 1500
  let finalScore = Math.round(baseScore * cityMultiplier * levelMultiplier);
  
  // Cap at 1500 points max per round
  finalScore = Math.min(finalScore, 1500);

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
