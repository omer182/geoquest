import { useEffect, useState } from 'react';
import countriesLowUrl from '@/assets/geo/countries-low.geojson?url';

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

/** React hook: the country list, or null while loading / when unavailable. */
export function useCountries(): CountryFeature[] | null {
  const [countries, setCountries] = useState<CountryFeature[] | null>(null);
  useEffect(() => {
    if (typeof fetch !== 'function') return;
    let alive = true;
    loadCountries()
      .then(c => alive && setCountries(c))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return countries;
}
