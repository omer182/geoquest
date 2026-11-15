import { describe, it, expect, beforeEach } from 'vitest';
import { BORDERS, COUNTRY_NAMES } from '../data/borders';
import {
  analyseRoute,
  judge,
  isConnected,
  minGuesses,
  oneShortestRoute,
  getRoadTripStars,
  dailyPuzzle,
  puzzlePairs,
  suggestCountries,
  saveDay,
  loadDay,
  roadTripStreak,
} from './roadTrip';

describe('land borders', () => {
  it('are two-way', () => {
    for (const [a, ns] of Object.entries(BORDERS)) for (const b of ns) expect(BORDERS[b], `${a}-${b}`).toContain(a);
  });

  it('include the short borders the low-detail outlines miss', () => {
    for (const [a, b] of [['HU', 'RO'], ['HU', 'RS'], ['RS', 'ME'], ['PL', 'LT'], ['AM', 'IR'], ['TZ', 'UG'], ['CH', 'LI'], ['FR', 'LU'], ['AF', 'CN'], ['BW', 'ZM']])
      expect(BORDERS[a], `${a}-${b}`).toContain(b);
    expect(BORDERS.NA).not.toContain('ZW');
  });

  it('never cross an ocean', () => {
    expect(analyseRoute('US', 'FR')).toBeNull();
    expect(analyseRoute('BR', 'ZA')).toBeNull();
    expect(BORDERS.GB).toEqual(['IE']);
    expect(BORDERS.JP).toBeUndefined();
  });

  it('keep Palestine out (drawn as part of Israel)', () => {
    expect(BORDERS.PS).toBeUndefined();
    expect(COUNTRY_NAMES.PS).toBeUndefined();
    expect(BORDERS.IL).toEqual(expect.arrayContaining(['EG', 'JO']));
  });
});

describe('routes', () => {
  // Spain -> Germany: Spain, France, Germany
  const r = analyseRoute('ES', 'DE')!;

  it('measures the shortest route', () => {
    expect(r.steps).toBe(2);
    expect(minGuesses(r)).toBe(1);
    expect(oneShortestRoute(r)).toEqual(['ES', 'FR', 'DE']);
  });

  it('colours guesses green on a shortest route, yellow when close, gray otherwise', () => {
    expect(judge(r, 'FR')).toBe('green');
    expect(judge(r, 'CH')).toBe('yellow'); // ES-FR-CH-DE: one longer
    expect(judge(r, 'PT')).toBe('yellow'); // PT-ES... two longer
    expect(judge(r, 'RU')).toBe('gray');
    expect(judge(r, 'JP')).toBe('gray');
  });

  it('is complete once the guesses join start and end over land', () => {
    expect(isConnected(r, [])).toBe(false);
    expect(isConnected(r, ['CH'])).toBe(false);
    expect(isConnected(r, ['FR'])).toBe(true);
    expect(isConnected(r, ['IT', 'CH', 'AT'])).toBe(false); // Italy never touches Spain
  });

  it('gives stars by guesses over the minimum', () => {
    expect(getRoadTripStars(true, 3, 3)).toBe(3);
    expect(getRoadTripStars(true, 5, 3)).toBe(2);
    expect(getRoadTripStars(true, 6, 3)).toBe(1);
    expect(getRoadTripStars(false, 3, 3)).toBe(0);
  });
});

describe('daily puzzle', () => {
  it('is the same all day and changes the next day', () => {
    expect(dailyPuzzle('2026-11-15')).toEqual(dailyPuzzle('2026-11-15'));
    expect(dailyPuzzle('2026-11-16')).not.toEqual(dailyPuzzle('2026-11-15'));
  });

  it('always has a land route with 8 to 12 countries in between', () => {
    expect(puzzlePairs().length).toBeGreaterThan(1000);
    for (let i = 0; i < 400; i++) {
      const d = new Date(Date.UTC(2026, 10, 15 + i));
      const p = dailyPuzzle(d.toISOString().slice(0, 10));
      const r = analyseRoute(p.start, p.end)!;
      expect(r).not.toBeNull();
      expect(minGuesses(r)).toBeGreaterThanOrEqual(8);
      expect(minGuesses(r)).toBeLessThanOrEqual(12);
    }
  });

  it('does not repeat within a year', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 365; i++) {
      const p = dailyPuzzle(new Date(Date.UTC(2026, 10, 15 + i)).toISOString().slice(0, 10));
      seen.add([p.start, p.end].sort().join('-'));
    }
    expect(seen.size).toBe(365);
  });
});

describe('typing a country', () => {
  it('suggests by name start, word start and common aliases', () => {
    expect(suggestCountries('ger')[0].name).toBe('Germany');
    expect(suggestCountries('usa')[0].iso).toBe('US');
    expect(suggestCountries('uk')[0].iso).toBe('GB');
    expect(suggestCountries('ivory')[0].iso).toBe('CI');
    expect(suggestCountries('cote')[0].iso).toBe('CI'); // accents ignored
    expect(suggestCountries('korea').map(s => s.iso)).toEqual(expect.arrayContaining(['KR', 'KP']));
  });

  it('leaves out countries already guessed', () => {
    expect(suggestCountries('fra', new Set(['FR'])).map(s => s.iso)).not.toContain('FR');
  });
});

describe('saved days', () => {
  beforeEach(() => localStorage.clear());

  it('remembers each day and counts a winning streak', () => {
    saveDay('2026-11-13', { guesses: ['FR'], status: 'won', stars: 3 });
    saveDay('2026-11-14', { guesses: ['FR'], status: 'won', stars: 2 });
    expect(loadDay('2026-11-14')?.stars).toBe(2);
    expect(roadTripStreak('2026-11-15')).toBe(2); // today still open
    saveDay('2026-11-15', { guesses: [], status: 'lost', stars: 0 });
    expect(roadTripStreak('2026-11-15')).toBe(0);
  });
});
