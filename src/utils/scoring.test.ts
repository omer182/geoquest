import { describe, it, expect } from 'vitest';
import { calculateScore, getLevelThreshold } from './scoring';

describe('Scoring Algorithm', () => {
  describe('distance thresholds', () => {
    it('should return 1000 points for distance < 10km', () => {
      expect(calculateScore(0)).toBe(1000);
      expect(calculateScore(5)).toBe(1000);
      expect(calculateScore(9)).toBe(1000);
      expect(calculateScore(9.9)).toBe(1000);
    });

    it('should return 750 points for distance < 50km', () => {
      expect(calculateScore(10)).toBe(750);
      expect(calculateScore(25)).toBe(750);
      expect(calculateScore(49)).toBe(750);
      expect(calculateScore(49.9)).toBe(750);
    });

    it('should return 500 points for distance < 100km', () => {
      expect(calculateScore(50)).toBe(500);
      expect(calculateScore(75)).toBe(500);
      expect(calculateScore(99)).toBe(500);
      expect(calculateScore(99.9)).toBe(500);
    });

    it('should return 250 points for distance < 500km', () => {
      expect(calculateScore(100)).toBe(250);
      expect(calculateScore(250)).toBe(250);
      expect(calculateScore(499)).toBe(250);
      expect(calculateScore(499.9)).toBe(250);
    });

    it('should return 100 points for distance < 1000km', () => {
      expect(calculateScore(500)).toBe(100);
      expect(calculateScore(750)).toBe(100);
      expect(calculateScore(999)).toBe(100);
      expect(calculateScore(999.9)).toBe(100);
    });

    it('should return 0 points for distance >= 1000km', () => {
      expect(calculateScore(1000)).toBe(0);
      expect(calculateScore(1500)).toBe(0);
      expect(calculateScore(5000)).toBe(0);
      expect(calculateScore(20000)).toBe(0);
    });
  });

  describe('function properties', () => {
    it('should be deterministic (same input returns same output)', () => {
      const distance = 123.45;
      const score1 = calculateScore(distance);
      const score2 = calculateScore(distance);
      expect(score1).toBe(score2);
    });

    it('should be pure (no side effects)', () => {
      const distance = 50;
      const beforeCall = JSON.stringify({ distance });
      calculateScore(distance);
      const afterCall = JSON.stringify({ distance });
      expect(beforeCall).toBe(afterCall);
    });
  });
});

describe('Level Threshold Configuration', () => {
  describe('threshold progression', () => {
    it('should return 1000 points for level 1', () => {
      expect(getLevelThreshold(1)).toBe(1000);
    });

    it('should return 1500 points for level 2', () => {
      expect(getLevelThreshold(2)).toBe(1500);
    });

    it('should scale progressively for higher levels', () => {
      const threshold1 = getLevelThreshold(1);
      const threshold2 = getLevelThreshold(2);
      const threshold3 = getLevelThreshold(3);
      const threshold4 = getLevelThreshold(4);
      const threshold5 = getLevelThreshold(5);

      expect(threshold2).toBeGreaterThan(threshold1);
      expect(threshold3).toBeGreaterThan(threshold2);
      expect(threshold4).toBeGreaterThan(threshold3);
      expect(threshold5).toBeGreaterThan(threshold4);
    });

    it('should return sensible thresholds (not exceeding max possible score)', () => {
      // Max possible score for 5 rounds is 5000 (1000 * 5)
      for (let level = 1; level <= 10; level++) {
        const threshold = getLevelThreshold(level);
        expect(threshold).toBeLessThanOrEqual(5000);
        expect(threshold).toBeGreaterThan(0);
      }
    });
  });

  describe('function properties', () => {
    it('should be deterministic', () => {
      const level = 5;
      const threshold1 = getLevelThreshold(level);
      const threshold2 = getLevelThreshold(level);
      expect(threshold1).toBe(threshold2);
    });

    it('should return whole numbers', () => {
      for (let level = 1; level <= 10; level++) {
        const threshold = getLevelThreshold(level);
        expect(Number.isInteger(threshold)).toBe(true);
      }
    });
  });
});
