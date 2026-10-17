import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  getLevelThreshold,
  MAX_ROUND_SCORE,
  MAX_LEVEL,
  ROUNDS_PER_LEVEL,
  PERFECT_RADIUS_KM,
} from './scoring';
import * as backendScoring from '../../backend/utils/scoring.js';

describe('calculateScore', () => {
  it('awards the maximum within the perfect radius', () => {
    expect(calculateScore(0, 300)).toBe(MAX_ROUND_SCORE);
    expect(calculateScore(PERFECT_RADIUS_KM, 300)).toBe(MAX_ROUND_SCORE);
  });

  it('decays smoothly with distance, with no cliff', () => {
    const distances = [11, 50, 100, 300, 600, 1000, 1500, 1501, 3000];
    const scores = distances.map(d => calculateScore(d, 300));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
    // No jump to 0 at 1500 km like the old formula
    expect(scores[distances.indexOf(1500)] - scores[distances.indexOf(1501)]).toBeLessThanOrEqual(1);
  });

  it('matches the documented examples for a mid-size country', () => {
    expect(calculateScore(50, 450)).toBe(915);
    expect(calculateScore(150, 450)).toBe(733);
    expect(calculateScore(300, 450)).toBe(525);
    expect(calculateScore(600, 450)).toBe(270);
  });

  it('scales with the size of the country', () => {
    // The same 100 km miss is forgiving in a huge country, harsh in a small one
    const big = calculateScore(100, 1000);
    const small = calculateScore(100, 50);
    expect(big).toBeGreaterThan(900);
    expect(small).toBeLessThan(200);
  });

  it('never goes below 0 or above the maximum', () => {
    for (const d of [-5, 0, 5, 20000, Infinity, NaN]) {
      const s = calculateScore(d, 300);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(MAX_ROUND_SCORE);
    }
  });

  it('falls back to a default scale for missing or invalid scales', () => {
    expect(calculateScore(200)).toBe(calculateScore(200, 500));
    expect(calculateScore(200, 0)).toBe(calculateScore(200, 500));
  });

  it('is identical to the multiplayer server implementation', () => {
    for (const scale of [40, 120, 300, 700, 1000]) {
      for (const d of [0, 10, 11, 25, 80, 250, 900, 2500, 12000]) {
        expect(backendScoring.calculateScore(d, scale)).toBe(calculateScore(d, scale));
      }
    }
    expect(backendScoring.MAX_ROUND_SCORE).toBe(MAX_ROUND_SCORE);
  });
});

describe('getLevelThreshold', () => {
  it('is reachable on every level (below the 5-round maximum)', () => {
    for (let level = 1; level <= MAX_LEVEL; level++) {
      const t = getLevelThreshold(level);
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(MAX_ROUND_SCORE * ROUNDS_PER_LEVEL);
    }
  });

  it('never rises as levels get harder (cities get much harder to place)', () => {
    for (let level = 2; level <= MAX_LEVEL; level++) {
      expect(getLevelThreshold(level)).toBeLessThanOrEqual(getLevelThreshold(level - 1));
    }
  });

  it('keeps the level 10 target for endless levels beyond 10', () => {
    expect(getLevelThreshold(11)).toBe(getLevelThreshold(10));
    expect(getLevelThreshold(25)).toBe(getLevelThreshold(10));
  });

  it('treats out-of-range input as level 1', () => {
    expect(getLevelThreshold(0)).toBe(getLevelThreshold(1));
  });
});
