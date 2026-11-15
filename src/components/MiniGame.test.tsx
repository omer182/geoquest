import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import MiniGame from './MiniGame';
import { getRegion, REGIONS, getPaintStars, livesFor } from '../data/regions';
import { loadProgress } from '../utils/progress';
import type { CountryFeature } from '../utils/countryShapes';

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
const currentTarget = () => screen.getByText(/^Land [A-Z]{2}$/, { selector: '[aria-live]' }).textContent!;
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

  it('costs a life and names the country on a wrong tap, and ends after three', () => {
    render(<MiniGame region={region} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start painting/i }));

    const target = currentTarget();
    tap(wrongFor(target));
    expect(screen.getByRole('img', { name: '2 of 3 lives left' })).toBeInTheDocument();
    expect(screen.getByText(`That's ${wrongFor(target)}`)).toBeInTheDocument();

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

  it('has a real map to paint in every region, with more lives for the big ones', () => {
    for (const r of REGIONS) expect(r.codes.length, r.id).toBeGreaterThanOrEqual(10);
    expect(livesFor(17)).toBe(3);
    expect(livesFor(48)).toBe(5);
  });

  it('gives stars by mistakes relative to the lives, and none for a loss', () => {
    // 3 lives: 0 / 1 / 2 mistakes
    expect([0, 1, 2].map(m => getPaintStars(true, m, 3))).toEqual([3, 2, 1]);
    // 5 lives: 0 / 1-2 / 3-4 mistakes
    expect([0, 1, 2, 3, 4].map(m => getPaintStars(true, m, 5))).toEqual([3, 2, 2, 1, 1]);
    expect(getPaintStars(false, 0, 3)).toBe(0);
  });
});
