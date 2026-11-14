import { useEffect, useState } from 'react';
import countriesLowUrl from '@/assets/geo/countries-low.geojson?url';
import usStatesUrl from '@/assets/geo/us-states.geojson?url';

export type Ring = number[][];

export interface CountryFeature {
  name: string;
  iso: string;
  /** Natural Earth map colour index (1-7); neighbours never share one */
  color: number;
  /** Polygons, each a list of rings of [lng, lat] */
  polygons: Ring[][];
}

interface RawGeo {
  features: {
    properties: { NAME: string; ISO_A2_EH: string; MAPCOLOR7: number };
    geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
  }[];
}

let cache: Promise<CountryFeature[]> | null = null;

/** Loads the low-detail country outlines once per page (the game map already fetches the same file). */
export function loadCountries(): Promise<CountryFeature[]> {
  if (!cache) {
    cache = fetch(countriesLowUrl)
      .then(r => r.json() as Promise<RawGeo>)
      .then(geo =>
        geo.features.map(f => ({
          name: f.properties.NAME,
          iso: f.properties.ISO_A2_EH,
          color: f.properties.MAPCOLOR7,
          polygons: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][],
        }))
      )
      .catch(err => {
        cache = null;
        throw err;
      });
  }
  return cache;
}

let statesCache: Promise<CountryFeature[]> | null = null;

/**
 * Loads the US state outlines (keyed by state name). The file has no colour index,
 * so states are greedily coloured so that bordering states never match.
 */
export function loadUsStates(): Promise<CountryFeature[]> {
  if (!statesCache) {
    statesCache = fetch(usStatesUrl)
      .then(r => r.json() as Promise<{ features: { properties: { NAME: string }; geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown } }[] }>)
      .then(geo => {
        const states = geo.features.map(f => ({
          name: f.properties.NAME,
          iso: f.properties.NAME,
          color: 0,
          polygons: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][],
        }));
        // Neighbours share border vertices
        const owners = new Map<string, Set<number>>();
        states.forEach((st, i) =>
          st.polygons.forEach(poly =>
            poly.forEach(ring =>
              ring.forEach(([lng, lat]) => {
                const key = `${lng.toFixed(2)},${lat.toFixed(2)}`;
                if (!owners.has(key)) owners.set(key, new Set());
                owners.get(key)!.add(i);
              })
            )
          )
        );
        const neighbours = states.map(() => new Set<number>());
        owners.forEach(set => set.forEach(a => set.forEach(b => a !== b && neighbours[a].add(b))));
        const order = states.map((_, i) => i).sort((a, b) => neighbours[b].size - neighbours[a].size);
        for (const i of order) {
          const used = new Set([...neighbours[i]].map(n => states[n].color));
          let c = 1;
          while (used.has(c)) c++;
          states[i].color = c;
        }
        return states;
      })
      .catch(err => {
        statesCache = null;
        throw err;
      });
  }
  return statesCache;
}

export type ShapeSource = 'countries' | 'us-states';

/** React hook: the outlines for a source, or null while loading / when unavailable. */
export function useShapes(source: ShapeSource): CountryFeature[] | null {
  const [shapes, setShapes] = useState<CountryFeature[] | null>(null);
  useEffect(() => {
    if (typeof fetch !== 'function') return;
    let alive = true;
    setShapes(null);
    (source === 'us-states' ? loadUsStates() : loadCountries())
      .then(c => alive && setShapes(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [source]);
  return shapes;
}
