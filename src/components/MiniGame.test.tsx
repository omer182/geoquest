import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import MiniGame from './MiniGame';
import { getRegion, REGIONS, getPaintStars, PAINT_LIVES } from '../data/regions';
import { loadProgress } from '../utils/progress';
import type { CountryFeature } from '../utils/countryShapes';
import { projectRegion } from '../utils/regionProjection';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// Twelve square "countries" in a 4x3 grid inside the Middle East window
const ISO = 'BH EG IR IQ IL JO KW LB OM QA SA SY'.split(' ');
const FAKE: CountryFeature[] = ISO.map((iso, i) => {
  const lng = 28 + (i % 4) * 8;
  const lat = 16 + Math.floor(i / 4) * 8;
  return {
    iso,
    name: `Land ${iso}`,
    color: (i % 7) + 1,
    polygons: [[[[lng, lat], [lng + 6, lat], [lng + 6, lat + 6], [lng, lat + 6], [lng, lat]]]],
  };
});
vi.mock('../utils/countryShapes', () => ({ useShapes: () => FAKE }));

const region = getRegion('middle-east');
const ALL = FAKE.length; // every place must be painted

const tap = (name: string) => {
  const el = screen.getByRole('button', { name });
  fireEvent.pointerDown(el, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: 10, clientY: 10 });
};
const currentTarget = () => screen.getByText(/^Land [A-Z]{2}$/, { selector: '[aria-live] span' }).textContent!;
const wrongFor = (target: string) => FAKE.map(f => f.name).find(n => n !== target)!;

describe('MiniGame', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  it('paints the called country and moves on to the next one', () => {
    render(<MiniGame region={region} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start painting/i }));
    expect(screen.getByText(`Paint 1 of ${ALL}`)).toBeInTheDocument();

    const first = currentTarget();
    tap(first);
    expect(screen.getByText(`Paint 2 of ${ALL}`)).toBeInTheDocument();
    expect(currentTarget()).not.toBe(first);
  });

  it('calls each place out big first, then moves it up into the top bar', () => {
    render(<MiniGame region={region} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start painting/i }));
    const name = currentTarget();
    // Callout in the middle of the map; the bar copy is still hidden
    expect(screen.getAllByText(name)).toHaveLength(2);
    expect(screen.getByText(name, { selector: '[aria-live] span' })).toHaveClass('opacity-0');

    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getAllByText(name)).toHaveLength(1);
    expect(screen.getByText(name, { selector: '[aria-live] span' })).not.toHaveClass('opacity-0');
  });

  it('costs a life on a wrong tap without naming it, and ends after three', () => {
    render(<MiniGame region={region} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start painting/i }));

    const target = currentTarget();
    tap(wrongFor(target));
    expect(screen.getByRole('img', { name: '2 of 3 lives left' })).toBeInTheDocument();
    expect(screen.getByText('Wrong, try again')).toBeInTheDocument();
    // The country tapped by mistake is not named
    expect(screen.queryByText(new RegExp(wrongFor(target)), { selector: '.animate-pop' })).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2000));
    tap(wrongFor(target));
    act(() => vi.advanceTimersByTime(2000));
    tap(wrongFor(target));
    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByText(/out of paint!/i)).toBeInTheDocument();
    expect(loadProgress().mini).toEqual({});
  });

  it('never paints anything for you: the game goes on until the last place is tapped', () => {
    render(<MiniGame region={region} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start painting/i }));
    for (let i = 0; i < ALL - 1; i++) tap(currentTarget());
    act(() => vi.advanceTimersByTime(5000));

    const last = currentTarget();
    expect(screen.getByText(`Paint ${ALL} of ${ALL}`)).toBeInTheDocument();
    expect(screen.queryByText(/region painted!/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: last })).toHaveAttribute('fill', '#F4E7C5'); // still unpainted

    tap(last);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(/region painted!/i)).toBeInTheDocument();
  });

  it('wins after painting every place, awarding stars by mistakes and saving them', () => {
    render(<MiniGame region={region} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start painting/i }));

    tap(wrongFor(currentTarget())); // one mistake -> 2 stars
    act(() => vi.advanceTimersByTime(2000));
    for (let i = 0; i < ALL; i++) tap(currentTarget());
    act(() => vi.advanceTimersByTime(5000));

    expect(screen.getByText(/region painted!/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '2 of 3 stars' })).toBeInTheDocument();
    expect(loadProgress().mini).toEqual({ 'middle-east': 2 });
  });
});

describe('regions', () => {
  it('only lists codes that exist in the bundled map data', () => {
    const read = (f: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '../assets/geo', f), 'utf8'));
    const countries = new Set(read('countries-low.geojson').features.map((f: { properties: { ISO_A2_EH: string } }) => f.properties.ISO_A2_EH));
    const states = new Set(read('us-states.geojson').features.map((f: { properties: { NAME: string } }) => f.properties.NAME));
    for (const r of REGIONS) {
      const known = r.source === 'us-states' ? states : countries;
      for (const c of r.codes) expect(known.has(c), `${r.id}: ${c}`).toBe(true);
    }
  });

  it('has a real map to paint in every region, with three strikes on each', () => {
    for (const r of REGIONS) expect(r.codes.length, r.id).toBeGreaterThanOrEqual(10);
    expect(PAINT_LIVES).toBe(3); // three strikes on every map, big or small
  });

  it('draws the West Bank and Gaza as part of Israel, with no separate Palestine', () => {
    const geo = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../assets/geo/countries-low.geojson'), 'utf8'));
    const features: CountryFeature[] = geo.features.map(
      (f: { properties: { NAME: string; ISO_A2_EH: string; MAPCOLOR7: number }; geometry: { type: string; coordinates: unknown } }) => ({
        name: f.properties.NAME,
        iso: f.properties.ISO_A2_EH,
        color: f.properties.MAPCOLOR7,
        polygons: f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates,
      })
    );
    const merged = projectRegion(region, features).shapes;
    const plain = projectRegion({ ...region, merge: undefined }, features).shapes;
    expect(merged.some(s => s.iso === 'PS')).toBe(false);
    // Israel carries the merged area and is drawn first, so neighbours' borders go over it
    expect(merged[0].iso).toBe('IL');
    expect(merged[0].mergedD).toMatch(/^M/);
    expect(plain.find(s => s.iso === 'IL')!.mergedD).toBeUndefined();
  });

  it('gives 3/2/1 stars for 0/1/2 mistakes and none for a loss', () => {
    expect([0, 1, 2].map(m => getPaintStars(true, m))).toEqual([3, 2, 1]);
    expect(getPaintStars(false, 0)).toBe(0);
  });
});
