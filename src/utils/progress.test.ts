import { describe, it, expect, beforeEach } from 'vitest';
import { loadProgress, recordLevelPassed, saveReachedLevel, clearProgress } from './progress';
import { getLevelStars } from './scoring';

describe('solo progress', () => {
  beforeEach(() => localStorage.clear());

  it('starts at level 1 with no stars', () => {
    expect(loadProgress()).toEqual({ level: 1, stars: {} });
  });

  it('reads saves from before stars existed', () => {
    localStorage.setItem('geoquest:solo-progress', JSON.stringify({ level: 4 }));
    expect(loadProgress()).toEqual({ level: 4, stars: {} });
  });

  it('unlocks the next level once and keeps the best stars', () => {
    expect(recordLevelPassed(1, 2)).toEqual({ unlocked: true, newBest: true });
    expect(recordLevelPassed(1, 1)).toEqual({ unlocked: false, newBest: false });
    expect(recordLevelPassed(1, 3)).toEqual({ unlocked: false, newBest: true });
    expect(loadProgress()).toEqual({ level: 2, stars: { 1: 3 } });
  });

  it('never moves the resume level backwards when replaying an old level', () => {
    saveReachedLevel(5);
    recordLevelPassed(2, 1);
    expect(loadProgress().level).toBe(5);
  });

  it('ignores corrupt data and can be cleared', () => {
    localStorage.setItem('geoquest:solo-progress', '{nope');
    expect(loadProgress()).toEqual({ level: 1, stars: {} });
    recordLevelPassed(1, 1);
    clearProgress();
    expect(loadProgress().level).toBe(1);
  });
});

describe('getLevelStars', () => {
  it('gives 0 below the target and 1-3 by how much of the gap to 5,000 was closed', () => {
    expect(getLevelStars(2499, 2500)).toBe(0);
    expect(getLevelStars(2500, 2500)).toBe(1);
    expect(getLevelStars(3499, 2500)).toBe(1);
    expect(getLevelStars(3500, 2500)).toBe(2);
    expect(getLevelStars(4375, 2500)).toBe(3);
  });
});
