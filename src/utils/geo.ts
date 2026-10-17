/**
 * Spherical geometry helpers for drawing results on the map.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Samples points along the great-circle (shortest) path between two points.
 *
 * Straight lines on a Mercator map are not the real shortest route, so long
 * guesses (e.g. Tokyo → Los Angeles) look wrong without this. The path is split
 * into segments wherever it crosses the antimeridian so Leaflet doesn't draw a
 * line across the whole world.
 *
 * @returns One or more segments, each an array of [lat, lng] pairs
 */
export function greatCircleSegments(from: LatLng, to: LatLng, samples = 64): [number, number][][] {
  const φ1 = toRad(from.lat);
  const λ1 = toRad(from.lng);
  const φ2 = toRad(to.lat);
  const λ2 = toRad(to.lng);

  // Angular distance between the points
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
      )
    );

  if (d < 1e-9) {
    return [[[from.lat, from.lng], [to.lat, to.lng]]];
  }

  const points: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const f = i / samples;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    const x = a * Math.cos(φ1) * Math.cos(λ1) + b * Math.cos(φ2) * Math.cos(λ2);
    const y = a * Math.cos(φ1) * Math.sin(λ1) + b * Math.cos(φ2) * Math.sin(λ2);
    const z = a * Math.sin(φ1) + b * Math.sin(φ2);
    points.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }

  // Split at antimeridian crossings
  const segments: [number, number][][] = [[points[0]]];
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i][1] - points[i - 1][1]) > 180) {
      segments.push([]);
    }
    segments[segments.length - 1].push(points[i]);
  }
  return segments;
}

/**
 * Midpoint of the great-circle path, used to anchor the distance label.
 */
export function greatCircleMidpoint(from: LatLng, to: LatLng): LatLng {
  const segments = greatCircleSegments(from, to, 2);
  const mid = segments.flat()[1];
  return { lat: mid[0], lng: mid[1] };
}

/**
 * Ray-casting point-in-ring test. Ring is GeoJSON order: [lng, lat].
 */
function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, rings: number[][][]): boolean {
  if (!rings.length || !pointInRing(lng, lat, rings[0])) return false;
  // Holes
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lng, lat, rings[i])) return false;
  }
  return true;
}

/**
 * Returns true if the point lies inside a Polygon/MultiPolygon feature.
 */
export function featureContains(feature: GeoJSON.Feature, point: LatLng): boolean {
  const g = feature.geometry;
  if (!g) return false;
  if (g.type === 'Polygon') return pointInPolygon(point.lng, point.lat, g.coordinates);
  if (g.type === 'MultiPolygon') {
    return g.coordinates.some(poly => pointInPolygon(point.lng, point.lat, poly));
  }
  return false;
}

/**
 * Finds the country feature containing a point. Coastal cities can fall just
 * outside simplified borders, so fall back to the feature with the nearest vertex.
 */
export function findContainingFeature(
  features: GeoJSON.Feature[],
  point: LatLng,
  maxFallbackDeg = 0.5
): GeoJSON.Feature | null {
  const hit = features.find(f => featureContains(f, point));
  if (hit) return hit;

  let best: GeoJSON.Feature | null = null;
  let bestDist = maxFallbackDeg * maxFallbackDeg;
  const visit = (f: GeoJSON.Feature, coords: unknown): void => {
    if (typeof (coords as number[])[0] === 'number') {
      const [lng, lat] = coords as number[];
      const dd = (lng - point.lng) ** 2 + (lat - point.lat) ** 2;
      if (dd < bestDist) {
        bestDist = dd;
        best = f;
      }
      return;
    }
    (coords as unknown[]).forEach(c => visit(f, c));
  };
  for (const f of features) {
    const g = f.geometry;
    if (g && (g.type === 'Polygon' || g.type === 'MultiPolygon')) visit(f, g.coordinates);
  }
  return best;
}
