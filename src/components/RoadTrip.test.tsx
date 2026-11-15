import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import RoadTrip from './RoadTrip';
import { loadDay, saveDay } from '../utils/roadTrip';
import type { CountryFeature } from '../utils/countryShapes';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// Square stand-ins for the countries around Spain and Germany
const ISO = 'PT ES FR DE CH IT AT JP'.split(' ');
const FAKE: CountryFeature[] = ISO.map((iso, i) => {
  const lng = -10 + (i % 4) * 8;
  const lat = 36 + Math.floor(i / 4) * 8;
  return { iso, name: `Land ${iso}`, color: (i % 7) + 1, polygons: [[[[lng, lat], [lng + 6, lat], [lng + 6, lat + 6], [lng, lat + 6], [lng, lat]]]] };
});
vi.mock('../utils/countryShapes', () => ({ useShapes: () => FAKE }));

const puzzle = { date: '2026-11-15', start: 'ES', end: 'DE' };

const type = (text: string) => {
  const input = screen.getByRole('combobox', { name: /type a country/i });
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

describe('RoadTrip', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('introduces the trip, then lets you type countries with suggestions', () => {
    render(<RoadTrip puzzle={puzzle} onExit={vi.fn()} />);
    expect(screen.getByText(/you need at least/i)).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: /start the trip/i }));

    const input = screen.getByRole('combobox', { name: /type a country/i });
    fireEvent.change(input, { target: { value: 'fra' } });
    expect(screen.getByRole('option', { name: 'France' })).toBeInTheDocument();
    // Start and end are never suggested
    fireEvent.change(input, { target: { value: 'spa' } });
    expect(screen.queryByRole('option', { name: 'Spain' })).not.toBeInTheDocument();
  });

  it('wins once start and end are joined, with stars for the stops, and saves the day', () => {
    render(<RoadTrip puzzle={puzzle} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start the trip/i }));
    type('Switzerland'); // close, not shortest
    expect(within(screen.getByLabelText('Your stops')).getByText('Switzerland')).toBeInTheDocument();
    expect(screen.queryByText(/you made it/i)).not.toBeInTheDocument();
    type('France');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(/you made it/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '2 of 3 stars' })).toBeInTheDocument(); // one extra stop
    expect(loadDay('2026-11-15')).toMatchObject({ status: 'won', stars: 2, guesses: ['CH', 'FR'] });
    // The shortest way is shown, with the flag round after it
    expect(screen.getByText('Spain → France → Germany')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /flag match/i }));
    expect(screen.getByRole('list', { name: "Today's route" })).toBeInTheDocument();
  });

  it('ends the trip on the third country off the route and shows a shortest way', () => {
    render(<RoadTrip puzzle={puzzle} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /start the trip/i }));
    type('Japan');
    expect(screen.getByRole('img', { name: '2 of 3 lives left' })).toBeInTheDocument();
    type('Russia');
    type('China');
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(/out of fuel!/i)).toBeInTheDocument();
    expect(screen.getByText('Spain → France → Germany')).toBeInTheDocument();
    expect(loadDay('2026-11-15')?.status).toBe('lost');
  });

  it('picks up a trip in progress and shows a finished day as done', () => {
    saveDay('2026-11-15', { guesses: ['CH'], status: 'playing', stars: 0 });
    const { unmount } = render(<RoadTrip puzzle={puzzle} onExit={vi.fn()} />);
    expect(screen.getByRole('combobox', { name: /type a country/i })).toBeInTheDocument();
    expect(within(screen.getByLabelText('Your stops')).getByText('Switzerland')).toBeInTheDocument();
    unmount();

    saveDay('2026-11-15', { guesses: ['FR'], status: 'won', stars: 3 });
    render(<RoadTrip puzzle={puzzle} onExit={vi.fn()} />);
    expect(screen.getByText(/you made it/i)).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
