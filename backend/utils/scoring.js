/**
 * Round scoring, shared rules for single player and multiplayer.
 * Keep in sync with src/utils/scoring.ts (a parity test checks both).
 *
 * score = 1000                                   if distance <= 10 km
 *       = round(1000 * e^(-(distance - 10) / scaleKm))  otherwise
 *
 * scaleKm comes from the city and grows with the size of its country
 * (≈1.4 × the country's equivalent radius, clamped to 100-1200 km). Because the
 * prompt always names the country, precision counts about the same everywhere,
 * while the 100 km floor keeps small countries (Israel, Singapore) from being
 * brutal: 50 km off there still scores ~670-690.
 * It works like GeoGuessr's map-size-scaled scoring.
 *
 * Examples with scaleKm = 450 (a mid-size country like Japan or France):
 *   10 km → 1000, 50 km → 915, 150 km → 733, 300 km → 525, 600 km → 270
 */

export const MAX_ROUND_SCORE = 1000;
export const PERFECT_RADIUS_KM = 10;
export const DEFAULT_SCALE_KM = 500;

/**
 * @param {number} distanceKm - Distance between guess and city
 * @param {number} [scaleKm=DEFAULT_SCALE_KM] - The city's score decay distance
 * @returns {number} Score from 0 to 1000
 */
export function calculateScore(distanceKm, scaleKm = DEFAULT_SCALE_KM) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 0;
  if (distanceKm <= PERFECT_RADIUS_KM) return MAX_ROUND_SCORE;
  const scale = scaleKm > 0 ? scaleKm : DEFAULT_SCALE_KM;
  return Math.round(MAX_ROUND_SCORE * Math.exp(-(distanceKm - PERFECT_RADIUS_KM) / scale));
}
