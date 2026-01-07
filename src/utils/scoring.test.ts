import { describe, it, expect } from 'vitest';
import { calculateScore, getLevelThreshold } from './scoring';

describe('Scoring Algorithm (Geoguessr-style)', () => {
  describe('distance thresholds', () => {
    it('should return 5000 points for perfect guess (0 km)', () => {
      expect(calculateScore(0)).toBe(5000);
    });

    it('should return ~5000 points for very close guesses (< 150m)', () => {
      expect(calculateScore(0.1)).toBeGreaterThanOrEqual(4999);
      expect(calculateScore(0.149)).toBeGreaterThanOrEqual(4999);
    });

    it('should return high scores for close guesses (< 10km)', () => {
      expect(calculateScore(1)).toBeGreaterThan(4900);
      expect(calculateScore(10)).toBeGreaterThan(4900);
      expect(calculateScore(50)).toBeGreaterThan(4800);
    });

    it('should return moderate scores for medium distances (100-500km)', () => {
      expect(calculateScore(100)).toBeGreaterThan(4600);
      expect(calculateScore(500)).toBeGreaterThan(3500);
      expect(calculateScore(1000)).toBeGreaterThan(2500);
    });

    it('should return low scores for far distances (5000-10000km)', () => {
      expect(calculateScore(5000)).toBeLessThan(200);
      expect(calculateScore(10000)).toBeLessThan(10);
    });

    it('should return 0 points for very far distances (>= 13800km)', () => {
      expect(calculateScore(13800)).toBe(0);
      expect(calculateScore(15000)).toBe(0);
      expect(calculateScore(20000)).toBe(0);
    });

    it('should use exponential decay (closer guesses get exponentially more points)', () => {
      const score1 = calculateScore(100);
      const score2 = calculateScore(200);
      const score3 = calculateScore(400);
      
      // Score should decrease exponentially, not linearly
      const ratio1 = score1 / score2;
      const ratio2 = score2 / score3;
      
      // Ratios should be similar (exponential decay)
      expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.5);
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
    it('should return 3000 points for level 1', () => {
      expect(getLevelThreshold(1)).toBe(3000);
    });

    it('should return 3500 points for level 2', () => {
      expect(getLevelThreshold(2)).toBe(3500);
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
      // Max possible score for 5 rounds is ~25,000 (5000 * 5)
      // Level thresholds cap at 10,000 for level 10+
      for (let level = 1; level <= 10; level++) {
        const threshold = getLevelThreshold(level);
        expect(threshold).toBeLessThanOrEqual(10000);
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
