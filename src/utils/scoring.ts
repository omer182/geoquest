/**
 * Round scoring and level targets.
 * Keep calculateScore in sync with backend/utils/scoring.js (a parity test checks both).
 *
 * score = 1000                                                      if distance <= 25 km
 *       = round(1000 * e^(-(distance - 25) / (scaleKm * 1.25)))  otherwise
 *
 * scaleKm comes from the city and grows with the size of its country
 * (≈1.4 × the country's equivalent radius, clamped to 100-1200 km). Because the
 * prompt always names the country, precision counts about the same everywhere,
 * while the 100 km floor keeps small countries (Israel, Singapore) from being
 * brutal: 50 km off there still scores ~820.
 * SCORE_LENIENCY stretches every city's scale so near misses feel rewarding.
 *
 * Examples with scaleKm = 450 (a mid-size country like Japan or France):
 *   25 km → 1000, 50 km → 957, 150 km → 801, 300 km → 613, 600 km → 360
 */

export const MAX_ROUND_SCORE = 1000;
export const PERFECT_RADIUS_KM = 25;
export const SCORE_LENIENCY = 1.25;
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
  const scale = (scaleKm > 0 ? scaleKm : DEFAULT_SCALE_KM) * SCORE_LENIENCY;
  return Math.round(MAX_ROUND_SCORE * Math.exp(-(distanceKm - PERFECT_RADIUS_KM) / scale));
}

/**
 * Points needed over a level's 5 rounds (max 5,000) to advance.
 *
 * Calibrated by simulating players over random 5-city draws, aiming at a
 * gentle curve for newcomers: a first-time player passes level 1 about 9 in
 * 10 times, levels 2-5 about 70%, then sliding to ~30% at levels 9-10.
 * A casual player passes levels 1-3 almost always and level 10 about 1 in 3.
 * Targets never rise as levels go up because the cities get much harder to place.
 */
const LEVEL_THRESHOLDS = [2700, 2500, 2500, 2500, 2500, 2500, 2500, 2450, 2050, 1650];

/**
 * @param level The current level number (1-based). Levels past 10 keep level 10's target.
 * @returns Minimum total score required to pass the level
 */
export function getLevelThreshold(level: number): number {
  const index = Math.min(Math.max(Math.floor(level), 1), MAX_LEVEL) - 1;
  return LEVEL_THRESHOLDS[index];
}

/** A guess this good (or better) counts toward a streak. */
export const STREAK_SCORE = 800;
/** Streak length at which "On fire" kicks in and each further excellent guess earns STREAK_BONUS. */
export const STREAK_MIN = 3;
export const STREAK_BONUS = 100;

/**
 * Stars for a finished level: 0 = not passed, 1 = passed, then 2 and 3 for
 * closing 40% / 75% of the gap between the target and a perfect 5,000.
 */
export function getLevelStars(totalScore: number, threshold: number): number {
  if (totalScore < threshold) return 0;
  const max = MAX_ROUND_SCORE * ROUNDS_PER_LEVEL;
  const gap = max - threshold;
  if (totalScore >= threshold + gap * 0.75) return 3;
  if (totalScore >= threshold + gap * 0.4) return 2;
  return 1;
}

/** Score needed for each star on a level: [1★, 2★, 3★]. */
export function getStarTargets(threshold: number): [number, number, number] {
  const gap = MAX_ROUND_SCORE * ROUNDS_PER_LEVEL - threshold;
  return [threshold, Math.ceil(threshold + gap * 0.4), Math.ceil(threshold + gap * 0.75)];
}
