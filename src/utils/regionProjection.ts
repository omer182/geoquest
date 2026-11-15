import type { CountryFeature, Ring } from './countryShapes';
import type { Region } from '../data/regions';

/** Region maps are projected into a 1000-unit-wide space; height follows the region's shape. */
export const VIEW_W = 1000;
/** Paint colours, indexed by the map colour (neighbours never share one) */
export const PAINT = ['#F2B790', '#A6CF8E', '#9CC3E0', '#E9C46A', '#C9AEDF', '#F4A6A0', '#8FD3C1'];
export const LAND = '#F4E7C5';

export interface Shape {
  iso: string;
  name: string;
  d: string;
  paint: string;
  /** Centre of the largest piece, for the name label */
  cx: number;
  cy: number;
  /** Diagonal of the largest piece */
  size: number;
}

/** Equirectangular projection of a region's places, corrected for latitude. */
export function projectRegion(region: Region, countries: CountryFeature[]): { shapes: Shape[]; viewH: number } {
  const { west, east, south, north } = region.bounds;
  const kx = Math.cos((((north + south) / 2) * Math.PI) / 180);
  const unit = VIEW_W / ((east - west) * kx);
  const px = (lng: number, lat: number): [number, number] => [(lng - west) * kx * unit, (north - lat) * unit];

  const wanted = new Set(region.codes);
  const shapes: Shape[] = [];
  for (const c of countries) {
    if (!wanted.has(c.iso)) continue;
    let d = '';
    let best = { size: -1, cx: 0, cy: 0 };
    for (const poly of c.polygons as Ring[][]) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      poly.forEach((ring, ri) => {
        let prev: number | null = null;
        ring.forEach(([lng, lat], i) => {
          const [x, y] = px(lng, lat);
          const jump = prev !== null && Math.abs(lng - prev) > 180;
          d += `${i === 0 || jump ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
          prev = lng;
          if (ri === 0) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
          }
        });
        d += 'Z';
      });
      const size = Math.hypot(maxX - minX, maxY - minY);
      if (size > best.size) best = { size, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
    }
    shapes.push({ iso: c.iso, name: c.name, d, paint: PAINT[(c.color - 1 + PAINT.length) % PAINT.length], ...best });
  }
  return { shapes, viewH: (north - south) * unit };
}
