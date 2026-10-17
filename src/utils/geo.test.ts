import { describe, it, expect } from 'vitest';
import { greatCircleSegments, greatCircleMidpoint, featureContains, findContainingFeature } from './geo';

const square = (name: string, x0: number, y0: number, x1: number, y1: number): GeoJSON.Feature => ({
  type: 'Feature',
  properties: { NAME: name },
  geometry: {
    type: 'Polygon',
    coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
  },
});

describe('greatCircleSegments', () => {
  it('starts and ends at the given points', () => {
    const [seg] = greatCircleSegments({ lat: 51.5, lng: -0.1 }, { lat: 40.7, lng: -74 });
    expect(seg[0][0]).toBeCloseTo(51.5);
    expect(seg[0][1]).toBeCloseTo(-0.1);
    expect(seg[seg.length - 1][0]).toBeCloseTo(40.7);
    expect(seg[seg.length - 1][1]).toBeCloseTo(-74);
  });

  it('bows toward the pole on long east-west routes', () => {
    const segments = greatCircleSegments({ lat: 51.5, lng: -0.1 }, { lat: 40.7, lng: -74 });
    const maxLat = Math.max(...segments.flat().map(p => p[0]));
    expect(maxLat).toBeGreaterThan(51.5);
  });

  it('splits at the antimeridian', () => {
    // Tokyo -> Los Angeles crosses 180°
    const segments = greatCircleSegments({ lat: 35.7, lng: 139.7 }, { lat: 34.05, lng: -118.24 });
    expect(segments.length).toBe(2);
    for (const seg of segments) {
      for (let i = 1; i < seg.length; i++) {
        expect(Math.abs(seg[i][1] - seg[i - 1][1])).toBeLessThan(180);
      }
    }
  });

  it('handles identical points', () => {
    expect(greatCircleSegments({ lat: 1, lng: 2 }, { lat: 1, lng: 2 })).toHaveLength(1);
  });
});

describe('greatCircleMidpoint', () => {
  it('is the equator midpoint for two equator points', () => {
    const mid = greatCircleMidpoint({ lat: 0, lng: 0 }, { lat: 0, lng: 90 });
    expect(mid.lat).toBeCloseTo(0);
    expect(mid.lng).toBeCloseTo(45);
  });
});

describe('featureContains / findContainingFeature', () => {
  const a = square('A', 0, 0, 10, 10);
  const b = square('B', 10, 0, 20, 10);

  it('detects containment', () => {
    expect(featureContains(a, { lat: 5, lng: 5 })).toBe(true);
    expect(featureContains(a, { lat: 5, lng: 15 })).toBe(false);
  });

  it('finds the containing feature', () => {
    expect(findContainingFeature([a, b], { lat: 5, lng: 15 })?.properties?.NAME).toBe('B');
  });

  it('falls back to the nearest feature for points just offshore', () => {
    expect(findContainingFeature([a, b], { lat: -0.2, lng: 19.9 })?.properties?.NAME).toBe('B');
    expect(findContainingFeature([a, b], { lat: 50, lng: 50 })).toBeNull();
  });
});
