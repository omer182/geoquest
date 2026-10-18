import type { City } from '../types/city';
// Single source of truth shared with the multiplayer server (see backend/data/cities.js)
import cityData from '../../backend/data/cities.json';
import { MAX_LEVEL } from '../utils/scoring';

/**
 * All cities, each tagged with a difficulty level (1-10) and a score scale.
 * Levels 1-3 are hand-picked famous cities; levels 4-10 were assigned by
 * simulated expected score: how obscure a city is and how hard it is to place
 * inside its (always shown) country.
 */
export const CITIES: readonly City[] = cityData as City[];

/**
 * Get all cities for a level. Levels past 10 reuse the hardest pool (endless mode).
 */
export function getCitiesForLevel(level: number): readonly City[] {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error('Level must be a positive integer');
  }
  const bucket = Math.min(level, MAX_LEVEL);
  return CITIES.filter(c => c.level === bucket);
}

/**
 * Fisher-Yates shuffle (unbiased, unlike sort(() => Math.random() - 0.5)).
 */
function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Select random cities for a level (single player), at most one per country
 * when the pool allows it so a level never turns into five towns from one country.
 * @param level Level number (1+)
 * @param count Number of cities to select (default: 5)
 */
export function selectCitiesForLevel(level: number, count: number = 5): City[] {
  const shuffled = shuffle(getCitiesForLevel(level));
  const picked: City[] = [];
  const countries = new Set<string>();
  for (const city of shuffled) {
    if (picked.length === count) break;
    if (countries.has(city.country)) continue;
    countries.add(city.country);
    picked.push(city);
  }
  for (const city of shuffled) {
    if (picked.length === count) break;
    if (!picked.includes(city)) picked.push(city);
  }
  return picked;
}
