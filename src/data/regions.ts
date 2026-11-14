/**
 * "Paint the region" bonus games. Each region lists its countries by ISO 3166 alpha-2
 * code (matching ISO_A2_EH in the bundled Natural Earth GeoJSON) and the map window
 * it is drawn in. A bonus stop unlocks on the journey once `afterLevel` is beaten.
 */
export type RegionId = 'middle-east' | 'europe' | 'americas' | 'africa';

export interface Region {
  id: RegionId;
  name: string;
  /** Unlocks once this level is passed */
  afterLevel: number;
  codes: readonly string[];
  /** Map window in degrees */
  bounds: { west: number; east: number; south: number; north: number };
}

export const REGIONS: readonly Region[] = [
  {
    id: 'middle-east',
    name: 'Middle East',
    afterLevel: 2,
    codes: 'BH EG IR IQ IL JO KW LB OM QA SA SY TR AE YE PS CY'.split(' '),
    bounds: { west: 24, east: 64, south: 11, north: 43 },
  },
  {
    id: 'europe',
    name: 'Europe',
    afterLevel: 4,
    codes: 'AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RS SK SI ES SE CH GB UA SM VA'.split(' '),
    bounds: { west: -25, east: 42, south: 34, north: 71.5 },
  },
  {
    id: 'americas',
    name: 'The Americas',
    afterLevel: 6,
    codes: 'US CA MX GT BZ SV HN NI CR PA CU JM HT DO BS TT CO VE GY SR EC PE BR BO PY CL AR UY PR'.split(' '),
    bounds: { west: -170, east: -32, south: -56, north: 72 },
  },
  {
    id: 'africa',
    name: 'Africa',
    afterLevel: 8,
    codes: 'DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW EH'.split(' '),
    bounds: { west: -26, east: 58, south: -36, north: 38 },
  },
];

export const getRegion = (id: RegionId): Region => REGIONS.find(r => r.id === id)!;

/** Countries painted to win a region game */
export const PAINT_GOAL = 10;
/** Wrong taps allowed; the next one ends the game */
export const MAX_MISTAKES = 2;

/** Stars for a won region game: no mistakes 3, one 2, two 1. */
export function getPaintStars(won: boolean, mistakes: number): number {
  if (!won) return 0;
  return Math.max(1, 3 - mistakes);
}
