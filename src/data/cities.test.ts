import { describe, it, expect } from 'vitest';
import { CITIES, selectCitiesForLevel } from './cities';
import type { City } from '../types/city';

describe('City Data', () => {
  describe('city type structure validation', () => {
    it('should have all cities with required fields', () => {
      CITIES.forEach(city => {
        expect(city).toHaveProperty('name');
        expect(city).toHaveProperty('country');
        expect(city).toHaveProperty('latitude');
        expect(city).toHaveProperty('longitude');
        expect(city).toHaveProperty('tier');

        expect(typeof city.name).toBe('string');
        expect(typeof city.country).toBe('string');
        expect(typeof city.latitude).toBe('number');
        expect(typeof city.longitude).toBe('number');
        expect(typeof city.tier).toBe('number');

        expect(city.name.length).toBeGreaterThan(0);
        expect(city.country.length).toBeGreaterThan(0);
      });
    });

    it('should have valid latitude and longitude ranges', () => {
      CITIES.forEach(city => {
        expect(city.latitude).toBeGreaterThanOrEqual(-90);
        expect(city.latitude).toBeLessThanOrEqual(90);
        expect(city.longitude).toBeGreaterThanOrEqual(-180);
        expect(city.longitude).toBeLessThanOrEqual(180);
      });
    });

    it('should have valid tier values (1, 2, or 3)', () => {
      CITIES.forEach(city => {
        expect([1, 2, 3]).toContain(city.tier);
      });
    });
  });

  describe('city selection returns correct number of unique cities', () => {
    it('should return exactly 5 cities by default', () => {
      const cities = selectCitiesForLevel(1);
      expect(cities).toHaveLength(5);
    });

    it('should return requested number of cities', () => {
      const cities = selectCitiesForLevel(1, 3);
      expect(cities).toHaveLength(3);
    });

    it('should return only unique cities (no duplicates)', () => {
      const cities = selectCitiesForLevel(1, 10);
      const cityNames = cities.map(city => city.name);
      const uniqueNames = new Set(cityNames);
      expect(cityNames.length).toBe(uniqueNames.size);
    });

    it('should return City objects with all required properties', () => {
      const cities = selectCitiesForLevel(1);
      cities.forEach((city: City) => {
        expect(city).toHaveProperty('name');
        expect(city).toHaveProperty('country');
        expect(city).toHaveProperty('latitude');
        expect(city).toHaveProperty('longitude');
        expect(city).toHaveProperty('tier');
      });
    });
  });

  describe('tier-based city filtering for different levels', () => {
    it('should use only Tier 1 cities for levels 1-3', () => {
      for (let level = 1; level <= 3; level++) {
        const cities = selectCitiesForLevel(level, 10);
        cities.forEach(city => {
          expect(city.tier).toBe(1);
        });
      }
    });

    it('should use Tier 1 and Tier 2 cities for levels 4-6', () => {
      for (let level = 4; level <= 6; level++) {
        const cities = selectCitiesForLevel(level, 15);
        cities.forEach(city => {
          expect([1, 2]).toContain(city.tier);
        });
      }
    });

    it('should use all tiers (1, 2, 3) for levels 7 and above', () => {
      const cities = selectCitiesForLevel(7, 20);
      cities.forEach(city => {
        expect([1, 2, 3]).toContain(city.tier);
      });
    });

    it('should have at least 15 Tier 1 cities', () => {
      const tier1Cities = CITIES.filter(city => city.tier === 1);
      expect(tier1Cities.length).toBeGreaterThanOrEqual(15);
    });

    it('should have at least 10 Tier 2 cities', () => {
      const tier2Cities = CITIES.filter(city => city.tier === 2);
      expect(tier2Cities.length).toBeGreaterThanOrEqual(10);
    });

    it('should have at least 10 Tier 3 cities', () => {
      const tier3Cities = CITIES.filter(city => city.tier === 3);
      expect(tier3Cities.length).toBeGreaterThanOrEqual(10);
    });
  });
});
