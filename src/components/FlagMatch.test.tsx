import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FlagMatch from './FlagMatch';
import { getFlagStars } from '../utils/roadTrip';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const route = ['ES', 'FR', 'DE', 'AT'];

const flagButtons = () => screen.getAllByRole('button', { name: /^Flag at stop \d+$/ });
/** Which country's flag is at each stop right now (from the image file) */
const shown = () => flagButtons().map(b => b.querySelector('img')!.getAttribute('src')!.match(/\/(\w\w)\.svg/)![1].toUpperCase());
const tap = (row: number) => {
  const b = flagButtons()[row];
  fireEvent.pointerDown(b, { pointerId: 1, clientX: 5, clientY: 5 });
  fireEvent.pointerUp(b, { pointerId: 1, clientX: 5, clientY: 5 });
};
/** Swap flags until every one is on its stop */
const solve = () => {
  for (let i = 0; i < route.length; i++) {
    const j = shown().indexOf(route[i]);
    if (j !== i) {
      tap(i);
      tap(j);
    }
  }
};
const apply = () => fireEvent.click(screen.getByRole('button', { name: /^apply/i }));

describe('FlagMatch', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts with every flag on the wrong stop', () => {
    for (let n = 0; n < 10; n++) {
      const { unmount } = render(<FlagMatch route={route} onDone={vi.fn()} onClose={vi.fn()} />);
      shown().forEach((iso, i) => expect(iso).not.toBe(route[i]));
      unmount();
    }
  });

  it('swaps two flags when you tap one and then another', () => {
    render(<FlagMatch route={route} onDone={vi.fn()} onClose={vi.fn()} />);
    const before = shown();
    tap(0);
    tap(2);
    expect(shown()).toEqual([before[2], before[1], before[0], before[3]]);
  });

  it('gives 3 stars when the first Apply is all right', () => {
    const onDone = vi.fn();
    render(<FlagMatch route={route} onDone={onDone} onClose={vi.fn()} />);
    solve();
    apply();
    act(() => vi.advanceTimersByTime(3000));
    expect(onDone).toHaveBeenCalledWith(3);
    expect(screen.getByText(/all flags right/i)).toBeInTheDocument();
  });

  it('locks the right flags on a check, and ends after three wrong checks', () => {
    const onDone = vi.fn();
    render(<FlagMatch route={route} onDone={onDone} onClose={vi.fn()} />);
    // Put Spain's flag right, leave the rest wrong
    const j = shown().indexOf('ES');
    tap(0);
    tap(j);
    if (shown().slice(1).some((iso, i) => iso === route[i + 1])) return; // rare: the swap fixed others too
    apply();
    expect(screen.getByText('1/4 right')).toBeInTheDocument();
    expect(flagButtons()[0]).toBeDisabled();
    expect(screen.getByRole('button', { name: /apply \(2 checks left\)/i })).toBeInTheDocument();
    apply();
    apply();
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText(/out of checks/i)).toBeInTheDocument();
    expect(shown()).toEqual(route);
    expect(onDone).toHaveBeenCalledWith(0);
  });

  it('scores 3, 2, 1 stars for solving on check 1, 2, 3', () => {
    expect([1, 2, 3].map(getFlagStars)).toEqual([3, 2, 1]);
    expect(getFlagStars(null)).toBe(0);
  });
});
