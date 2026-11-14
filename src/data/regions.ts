/**
 * "Paint the region" bonus games. Each region lists its countries by ISO 3166 alpha-2
 * code (matching ISO_A2_EH in the bundled Natural Earth GeoJSON) and the map window
 * it is drawn in. A bonus stop unlocks on the journey once `afterLevel` is beaten.
 */
import type { ShapeSource } from '../utils/countryShapes';

export type RegionId = 'middle-east' | 'europe' | 'usa' | 'central-america' | 'south-america' | 'africa';

export interface Region {
  id: RegionId;
  /** Short name for the journey-map label */
  name: string;
  /** Game title */
  title: string;
  /** Unlocks once this level is passed */
  afterLevel: number;
  /** Which outlines to draw: countries (codes are ISO alpha-2) or US states (codes are state names) */
  source: ShapeSource;
  codes: readonly string[];
  /** Map window in degrees */
  bounds: { west: number; east: number; south: number; north: number };
}

const LOWER_48 =
  'Alabama,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,Florida,Georgia,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming'.split(',');

export const REGIONS: readonly Region[] = [
  {
    id: 'middle-east',
    name: 'Middle East',
    title: 'Paint the Middle East',
    afterLevel: 2,
    source: 'countries',
    codes: 'BH EG IR IQ IL JO KW LB OM QA SA SY TR AE YE PS CY'.split(' '),
    bounds: { west: 24, east: 64, south: 11, north: 43 },
  },
  {
    id: 'europe',
    name: 'Europe',
    title: 'Paint Europe',
    afterLevel: 3,
    source: 'countries',
    codes: 'AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RS SK SI ES SE CH GB UA SM VA'.split(' '),
    bounds: { west: -25, east: 42, south: 34, north: 71.5 },
  },
  {
    id: 'usa',
    name: 'USA',
    title: 'Paint the USA',
    afterLevel: 5,
    source: 'us-states',
    codes: LOWER_48,
    bounds: { west: -125, east: -66.5, south: 24, north: 49.8 },
  },
  {
    id: 'central-america',
    name: 'Central America',
    title: 'Paint Central America',
    afterLevel: 6,
    source: 'countries',
    // Mexico to Panama plus the Caribbean, so there are enough to paint
    codes: 'MX GT BZ SV HN NI CR PA CU JM HT DO BS PR TT'.split(' '),
    bounds: { west: -118, east: -59, south: 6.5, north: 33 },
  },
  {
    id: 'south-america',
    name: 'South America',
    title: 'Paint South America',
    afterLevel: 7,
    source: 'countries',
    codes: 'CO VE GY SR EC PE BR BO PY CL AR UY'.split(' '),
    bounds: { west: -82, east: -34, south: -56, north: 13 },
  },
  {
    id: 'africa',
    name: 'Africa',
    title: 'Paint Africa',
    afterLevel: 8,
    source: 'countries',
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
