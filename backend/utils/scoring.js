/**
 * Round scoring, shared rules for single player and multiplayer.
 * Keep in sync with src/utils/scoring.ts (a parity test checks both).
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
 * It works like GeoGuessr's map-size-scaled scoring.
 *
 * Examples with scaleKm = 450 (a mid-size country like Japan or France):
 *   25 km → 1000, 50 km → 957, 150 km → 801, 300 km → 613, 600 km → 360
 */

export const MAX_ROUND_SCORE = 1000;
export const PERFECT_RADIUS_KM = 25;
export const SCORE_LENIENCY = 1.25;
export const DEFAULT_SCALE_KM = 500;

/**
 * @param {number} distanceKm - Distance between guess and city
 * @param {number} [scaleKm=DEFAULT_SCALE_KM] - The city's score decay distance
 * @returns {number} Score from 0 to 1000
 */
export function calculateScore(distanceKm, scaleKm = DEFAULT_SCALE_KM) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 0;
  if (distanceKm <= PERFECT_RADIUS_KM) return MAX_ROUND_SCORE;
  const scale = (scaleKm > 0 ? scaleKm : DEFAULT_SCALE_KM) * SCORE_LENIENCY;
  return Math.round(MAX_ROUND_SCORE * Math.exp(-(distanceKm - PERFECT_RADIUS_KM) / scale));
}
