/**
 * Round scoring and level targets.
 * Keep calculateScore in sync with backend/utils/scoring.js (a parity test checks both).
 *
 * score = 1000                                         if distance <= 10 km
 *       = round(1000 * e^(-(distance - 10) / scaleKm))  otherwise
 *
 * scaleKm comes from the city and grows with the size of its country
 * (≈1.4 × the country's equivalent radius, clamped to 100-1200 km). Because the
 * prompt always names the country, precision counts about the same everywhere,
 * while the 100 km floor keeps small countries (Israel, Singapore) from being
 * brutal: 50 km off there still scores ~670-690.
 *
 * Examples with scaleKm = 450 (a mid-size country like Japan or France):
 *   10 km → 1000, 50 km → 915, 150 km → 733, 300 km → 525, 600 km → 270
 */

export const MAX_ROUND_SCORE = 1000;
export const PERFECT_RADIUS_KM = 10;
export const DEFAULT_SCALE_KM = 500;
export const ROUNDS_PER_LEVEL = 5;
export const MAX_LEVEL = 10;

/**
 * @param distanceKm Distance between guess and actual location in kilometers
 * @param scaleKm The city's score decay distance (City.scaleKm)
 * @returns Score from 0 to 1000
 */
export function calculateScore(distanceKm: number, scaleKm: number = DEFAULT_SCALE_KM): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 0;
  if (distanceKm <= PERFECT_RADIUS_KM) return MAX_ROUND_SCORE;
  const scale = scaleKm > 0 ? scaleKm : DEFAULT_SCALE_KM;
  return Math.round(MAX_ROUND_SCORE * Math.exp(-(distanceKm - PERFECT_RADIUS_KM) / scale));
}

/**
 * Points needed over a level's 5 rounds (max 5,000) to advance.
 *
 * Calibrated by simulating a casual player (knows fewer cities, less precisely,
 * otherwise guesses roughly inside the right country) over random 5-city draws:
 * they pass level 1 ~85% of the time, sliding to ~30% at level 10. A player who
 * knows their geography passes level 1 every time and level 10 about 2 in 3.
 * Targets never rise as levels go up because the cities get much harder to place.
 */
const LEVEL_THRESHOLDS = [3150, 2600, 2600, 2600, 2400, 2400, 2400, 2200, 1800, 1400];

/**
 * @param level The current level number (1-based). Levels past 10 keep level 10's target.
 * @returns Minimum total score required to pass the level
 */
export function getLevelThreshold(level: number): number {
  const index = Math.min(Math.max(Math.floor(level), 1), MAX_LEVEL) - 1;
  return LEVEL_THRESHOLDS[index];
}
