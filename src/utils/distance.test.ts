import { describe, it, expect } from 'vitest';
import { calculateDistance } from './distance';

describe('Haversine Distance Calculation', () => {
  describe('known city pairs', () => {
    it('should calculate distance between New York and London accurately', () => {
      // New York: 40.7128° N, 74.0060° W
      // London: 51.5074° N, 0.1278° W
      // Expected distance: ~5570 km
      const distance = calculateDistance(40.7128, -74.006, 51.5074, -0.1278);
      expect(distance).toBeGreaterThan(5500);
      expect(distance).toBeLessThan(5600);
    });

    it('should calculate distance between Tokyo and Sydney accurately', () => {
      // Tokyo: 35.6762° N, 139.6503° E
      // Sydney: -33.8688° S, 151.2093° E
      // Expected distance: ~7820 km
      const distance = calculateDistance(35.6762, 139.6503, -33.8688, 151.2093);
      expect(distance).toBeGreaterThan(7700);
      expect(distance).toBeLessThan(7900);
    });

    it('should calculate distance between Paris and Berlin accurately', () => {
      // Paris: 48.8566° N, 2.3522° E
      // Berlin: 52.5200° N, 13.4050° E
      // Expected distance: ~878 km
      const distance = calculateDistance(48.8566, 2.3522, 52.52, 13.405);
      expect(distance).toBeGreaterThan(850);
      expect(distance).toBeLessThan(900);
    });
  });

  describe('edge cases', () => {
    it('should return 0 km for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(distance).toBe(0);
    });

    it('should handle antipodal points (maximum distance)', () => {
      // Antipodal points are roughly ~20,000 km apart (half Earth's circumference)
      // Example: A point and its opposite side on Earth
      const distance = calculateDistance(0, 0, 0, 180);
      expect(distance).toBeGreaterThan(19000);
      expect(distance).toBeLessThan(21000);
    });

    it('should handle coordinates at the equator', () => {
      const distance = calculateDistance(0, 0, 0, 10);
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1200);
    });

    it('should handle coordinates at the poles', () => {
      const distance = calculateDistance(90, 0, -90, 0);
      expect(distance).toBeGreaterThan(19000);
      expect(distance).toBeLessThan(21000);
    });
  });

  describe('return value', () => {
    it('should return distance rounded to nearest whole number', () => {
      const distance = calculateDistance(40.7128, -74.006, 40.7628, -74.006);
      expect(Number.isInteger(distance)).toBe(true);
    });
  });
});
