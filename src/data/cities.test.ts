import { describe, it, expect } from 'vitest';
import { CITIES, getCitiesForLevel, selectCitiesForLevel } from './cities';
import * as backendCities from '../../backend/data/cities.js';
import { MAX_LEVEL } from '../utils/scoring';

describe('city database', () => {
  it('every city has valid fields', () => {
    for (const c of CITIES) {
      expect(c.name).toBeTruthy();
      expect(c.country).toBeTruthy();
      expect(c.latitude).toBeGreaterThanOrEqual(-90);
      expect(c.latitude).toBeLessThanOrEqual(90);
      expect(c.longitude).toBeGreaterThanOrEqual(-180);
      expect(c.longitude).toBeLessThanOrEqual(180);
      expect(Number.isInteger(c.level)).toBe(true);
      expect(c.level).toBeGreaterThanOrEqual(1);
      expect(c.level).toBeLessThanOrEqual(MAX_LEVEL);
      expect(c.scaleKm).toBeGreaterThanOrEqual(100);
      expect(c.scaleKm).toBeLessThanOrEqual(1200);
    }
  });

  it('has no duplicate cities', () => {
    const keys = CITIES.map(c => `${c.name}|${c.country}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has balanced levels with broad geographic spread', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const pool = getCitiesForLevel(level);
      expect(pool.length).toBeGreaterThanOrEqual(50);
      expect(new Set(pool.map(c => c.country)).size).toBeGreaterThanOrEqual(15);
    }
  });

  it('uses one score scale per country (the named country, not a border territory)', () => {
    const scales = new Map<string, Set<number>>();
    for (const c of CITIES) {
      if (!scales.has(c.country)) scales.set(c.country, new Set());
      scales.get(c.country)!.add(c.scaleKm);
    }
    for (const [country, set] of scales) {
      expect({ country, scales: [...set] }).toEqual({ country, scales: [[...set][0]] });
    }
  });

  it('keeps levels 1-3 to famous cities', () => {
    const levelOf = (name: string) => CITIES.find(c => c.name === name)?.level;
    for (const name of ['Tokyo', 'London', 'New York', 'Paris', 'Sydney', 'Rio de Janeiro', 'Moscow', 'Beijing']) {
      expect(levelOf(name)).toBe(1);
    }
    for (const name of ['Dimona', 'Arad', 'Luang Prabang', 'Nay Pyi Taw', 'Karlovy Vary']) {
      expect(levelOf(name)).toBeGreaterThanOrEqual(4);
    }
  });

  it('is the same list the multiplayer server uses', () => {
    expect(backendCities.CITIES).toEqual(CITIES);
  });
});

describe('getCitiesForLevel', () => {
  it('returns only cities of that level', () => {
    expect(getCitiesForLevel(3).every(c => c.level === 3)).toBe(true);
  });

  it('reuses the hardest pool for endless levels beyond 10', () => {
    expect(getCitiesForLevel(11)).toEqual(getCitiesForLevel(MAX_LEVEL));
  });

  it('rejects invalid levels', () => {
    expect(() => getCitiesForLevel(0)).toThrow();
    expect(() => getCitiesForLevel(1.5)).toThrow();
  });
});

describe('selectCitiesForLevel', () => {
  it('returns the requested number of cities from the level', () => {
    const picked = selectCitiesForLevel(4);
    expect(picked).toHaveLength(5);
    expect(picked.every(c => c.level === 4)).toBe(true);
  });

  it('never repeats a country within one level run', () => {
    for (let i = 0; i < 50; i++) {
      for (const level of [1, 5, 10]) {
        const countries = selectCitiesForLevel(level).map(c => c.country);
        expect(new Set(countries).size).toBe(countries.length);
      }
    }
  });

  it('works for endless levels beyond 10', () => {
    expect(selectCitiesForLevel(12)).toHaveLength(5);
  });
});

describe('multiplayer city selection', () => {
  it('maps difficulty to level ranges and orders rounds easiest first', () => {
    for (const [difficulty, levels] of Object.entries(backendCities.DIFFICULTY_LEVELS)) {
      const picked = backendCities.selectRandomCities(difficulty as 'easy' | 'medium' | 'hard', 5);
      expect(picked).toHaveLength(5);
      expect(picked.every(c => levels.includes(c.level))).toBe(true);
      for (let i = 1; i < picked.length; i++) {
        expect(picked[i].level).toBeGreaterThanOrEqual(picked[i - 1].level);
      }
      expect(new Set(picked.map(c => c.country)).size).toBe(5);
    }
  });
});
