/**
 * Road Trip: a daily puzzle. Get from one country to another overland by naming
 * the countries in between. Routes follow real land borders (src/data/borders.ts).
 */
import { BORDERS, COUNTRY_NAMES } from '../data/borders';

/** Wrong (gray) guesses allowed; the third ends the day */
export const ROAD_TRIP_STRIKES = 3;
/** A country is "close" (yellow) when a route through it is at most this many countries longer */
export const NEAR_SLACK = 2;
/** Countries between start and end on the shortest route */
const MIN_BETWEEN = 2;
const MAX_BETWEEN = 5;
/** Never a start or end: too small to see, or disputed */
const NOT_ENDPOINTS = new Set(['VA', 'SM', 'MC', 'LI', 'AD', 'LU', 'XK', 'EH']);

export type Verdict = 'green' | 'yellow' | 'gray';

export interface Puzzle {
  /** Local date, YYYY-MM-DD */
  date: string;
  start: string;
  end: string;
}

/** Steps (borders crossed) from a country to every country reachable by land. */
export function distancesFrom(iso: string): Map<string, number> {
  const dist = new Map<string, number>([[iso, 0]]);
  const queue = [iso];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    for (const n of BORDERS[cur] ?? []) {
      if (!dist.has(n)) {
        dist.set(n, dist.get(cur)! + 1);
        queue.push(n);
      }
    }
  }
  return dist;
}

export interface Route {
  start: string;
  end: string;
  /** Borders crossed on the shortest route (countries between = steps - 1) */
  steps: number;
  fromStart: Map<string, number>;
  fromEnd: Map<string, number>;
}

export function analyseRoute(start: string, end: string): Route | null {
  const fromStart = distancesFrom(start);
  const steps = fromStart.get(end);
  if (steps === undefined) return null;
  return { start, end, steps, fromStart, fromEnd: distancesFrom(end) };
}

/** The fewest countries you must name to connect start and end */
export const minGuesses = (r: Route) => r.steps - 1;

/** How a guessed country relates to the route. */
export function judge(r: Route, iso: string): Verdict {
  const a = r.fromStart.get(iso);
  const b = r.fromEnd.get(iso);
  if (a === undefined || b === undefined) return 'gray';
  if (a + b === r.steps) return 'green';
  if (a + b <= r.steps + NEAR_SLACK) return 'yellow';
  return 'gray';
}

/** Every country on at least one shortest route, start and end excluded */
export function shortestRouteCountries(r: Route): string[] {
  return [...r.fromStart.keys()].filter(k => k !== r.start && k !== r.end && judge(r, k) === 'green');
}

/** One shortest route, start to end (for the reveal when the day is lost). */
export function oneShortestRoute(r: Route): string[] {
  const path = [r.start];
  let cur = r.start;
  while (cur !== r.end) {
    const d = r.fromStart.get(cur)!;
    cur = [...(BORDERS[cur] ?? [])].sort().find(n => r.fromStart.get(n) === d + 1 && r.fromEnd.get(n) === r.steps - d - 1)!;
    path.push(cur);
  }
  return path;
}

/** Are start and end joined over land through the given countries? */
export function isConnected(r: Route, countries: Iterable<string>): boolean {
  const allowed = new Set(countries);
  allowed.add(r.end);
  const seen = new Set([r.start]);
  const queue = [r.start];
  for (let i = 0; i < queue.length; i++) {
    for (const n of BORDERS[queue[i]] ?? []) {
      if (n === r.end) return true;
      if (allowed.has(n) && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  return false;
}

/** 3 stars for the shortest possible trip, 2 for one or two extra guesses, else 1 (0 for a loss). */
export function getRoadTripStars(won: boolean, guesses: number, min: number): number {
  if (!won) return 0;
  const extra = guesses - min;
  return extra <= 0 ? 3 : extra <= 2 ? 2 : 1;
}

// ----- The daily puzzle -----

/** Small seeded PRNG, so everyone gets the same puzzle on the same day */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let pairCache: [string, string][] | null = null;
/** Every start/end pair with a good route length, in a fixed shuffled order */
export function puzzlePairs(): [string, string][] {
  if (pairCache) return pairCache;
  const ends = Object.keys(BORDERS).filter(k => !NOT_ENDPOINTS.has(k) && COUNTRY_NAMES[k]).sort();
  const pairs: [string, string][] = [];
  for (const a of ends) {
    const dist = distancesFrom(a);
    for (const b of ends) {
      if (b <= a) continue;
      const d = dist.get(b);
      if (d !== undefined && d - 1 >= MIN_BETWEEN && d - 1 <= MAX_BETWEEN) pairs.push([a, b]);
    }
  }
  const rand = mulberry32(20261115);
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  // Travel either way round
  pairCache = pairs.map((p, i) => (i % 2 ? [p[1], p[0]] : p));
  return pairCache;
}

/** Local calendar date as YYYY-MM-DD */
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const EPOCH = Date.UTC(2026, 10, 15);

/** The puzzle for a date: a new pair every day, in a cycle that lasts years. */
export function dailyPuzzle(date = localDate()): Puzzle {
  const [y, m, d] = date.split('-').map(Number);
  const day = Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000);
  const pairs = puzzlePairs();
  const [start, end] = pairs[((day % pairs.length) + pairs.length) % pairs.length];
  return { date, start, end };
}

// ----- Typing a country -----

const normalise = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Other names people type */
const ALIASES: Record<string, string[]> = {
  US: ['USA', 'America', 'United States of America', 'US'],
  GB: ['UK', 'Britain', 'Great Britain', 'England', 'Scotland', 'Wales'],
  CZ: ['Czech Republic'],
  CD: ['Democratic Republic of the Congo', 'DRC', 'Congo Kinshasa'],
  CG: ['Congo', 'Congo Brazzaville'],
  CI: ['Ivory Coast'],
  SZ: ['Swaziland'],
  MK: ['Macedonia'],
  MM: ['Burma'],
  AE: ['UAE', 'Emirates'],
  NL: ['Holland'],
  TL: ['East Timor'],
  CV: ['Cape Verde'],
  VA: ['Holy See', 'Vatican City'],
  BA: ['Bosnia'],
  TR: ['Turkiye'],
  KR: ['Korea'],
  CF: ['CAR'],
  DO: ['Dominican'],
};

interface NameEntry { iso: string; name: string; keys: string[] }
const ENTRIES: NameEntry[] = Object.entries(COUNTRY_NAMES).map(([iso, name]) => ({
  iso,
  name,
  keys: [name, ...(ALIASES[iso] ?? [])].map(normalise),
}));

/** Countries matching what has been typed so far, best first. */
export function suggestCountries(query: string, exclude: ReadonlySet<string> = new Set(), limit = 6): { iso: string; name: string }[] {
  const q = normalise(query);
  if (!q) return [];
  const scored: { e: NameEntry; score: number }[] = [];
  for (const e of ENTRIES) {
    if (exclude.has(e.iso)) continue;
    let score = 0;
    for (const k of e.keys) {
      if (k === q) score = Math.max(score, 4);
      else if (k.startsWith(q)) score = Math.max(score, 3);
      else if (k.split(' ').some(w => w.startsWith(q))) score = Math.max(score, 2);
      else if (q.length >= 3 && k.includes(q)) score = Math.max(score, 1);
    }
    if (score) scored.push({ e, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name))
    .slice(0, limit)
    .map(({ e }) => ({ iso: e.iso, name: e.name }));
}

export const countryName = (iso: string) => COUNTRY_NAMES[iso] ?? iso;

// ----- Saved days -----

const KEY = 'geoquest:road-trip';

export interface DayRecord {
  guesses: string[];
  status: 'playing' | 'won' | 'lost';
  stars: number;
}

interface Saved { days: Record<string, DayRecord> }

function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { days: raw && typeof raw.days === 'object' && raw.days ? raw.days : {} };
  } catch {
    return { days: {} };
  }
}

export function loadDay(date: string): DayRecord | null {
  return load().days[date] ?? null;
}

export function saveDay(date: string, rec: DayRecord): void {
  const s = load();
  s.days[date] = rec;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}

/** Days in a row won, counting back from today (or yesterday, while today is still open). */
export function roadTripStreak(today = localDate()): number {
  const { days } = load();
  if (days[today]?.status === 'lost') return 0;
  const d = new Date(`${today}T12:00:00`);
  if (days[today]?.status !== 'won') d.setDate(d.getDate() - 1);
  let n = 0;
  while (days[localDate(d)]?.status === 'won') {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
