/**
 * City database shared by the server (multiplayer) and the client (single player).
 *
 * The data lives in cities.json so both sides read the exact same list; the
 * frontend imports the JSON directly. Each city has:
 *   - level   (1-10): difficulty bucket, assigned by simulated expected score
 *                     (how obscure the city is and how hard it is to place
 *                     inside its country)
 *   - scaleKm       : score decay distance, proportional to the size of the
 *                     city's country (see utils/scoring.js)
 *
 * @typedef {Object} City
 * @property {string} name
 * @property {string} country
 * @property {number} latitude
 * @property {number} longitude
 * @property {number} level
 * @property {number} scaleKm
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {ReadonlyArray<City>} */
const CITIES = Object.freeze(require('./cities.json'));

export const MAX_LEVEL = 10;

/**
 * Get all cities for a level. Levels past MAX_LEVEL reuse the hardest pool.
 *
 * @param {number} level - Level number (1+)
 * @returns {Array<City>}
 */
function getCitiesForLevel(level) {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error('Level must be a positive integer');
  }
  const bucket = Math.min(level, MAX_LEVEL);
  return CITIES.filter((c) => c.level === bucket);
}

/**
 * Fisher-Yates shuffle (unbiased, unlike sort(() => Math.random() - 0.5)).
 *
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
function shuffle(items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick `count` random cities, at most one per country when the pool allows it,
 * so a round never turns into five towns from the same country.
 *
 * @param {ReadonlyArray<City>} pool
 * @param {number} count
 * @returns {Array<City>}
 */
function pickDiverse(pool, count) {
  const shuffled = shuffle(pool);
  const picked = [];
  const countries = new Set();
  for (const city of shuffled) {
    if (picked.length === count) break;
    if (countries.has(city.country)) continue;
    countries.add(city.country);
    picked.push(city);
  }
  // Fall back to repeats only if the pool has fewer countries than requested
  for (const city of shuffled) {
    if (picked.length === count) break;
    if (!picked.includes(city)) picked.push(city);
  }
  return picked;
}

/**
 * Select random cities for a level (single player).
 *
 * @param {number} level - Level number (1+)
 * @param {number} [count=5] - Number of cities to select
 * @returns {Array<City>}
 */
function selectCitiesForLevel(level, count = 5) {
  return pickDiverse(getCitiesForLevel(level), count);
}

/** Level ranges per multiplayer difficulty */
const DIFFICULTY_LEVELS = {
  easy: [1, 2, 3],
  medium: [4, 5, 6, 7],
  hard: [8, 9, 10],
};

/**
 * Select random cities for a multiplayer game, ordered easiest to hardest so
 * the match builds up over its rounds.
 *
 * @param {'easy'|'medium'|'hard'} difficulty - Game difficulty level
 * @param {number} [count=5] - Number of cities to select
 * @returns {Array<City>}
 */
function selectRandomCities(difficulty, count = 5) {
  const levels = DIFFICULTY_LEVELS[difficulty] || DIFFICULTY_LEVELS.medium;
  const pool = CITIES.filter((c) => levels.includes(c.level));
  return pickDiverse(pool, count).sort((a, b) => a.level - b.level);
}

export { CITIES, DIFFICULTY_LEVELS, getCitiesForLevel, selectCitiesForLevel, selectRandomCities, shuffle };
