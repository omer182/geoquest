import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FlagMatch from './FlagMatch';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const route = ['ES', 'FR', 'DE'];
const EMOJI: Record<string, string> = { ES: '🇪🇸', FR: '🇫🇷', DE: '🇩🇪' };

/** The tray button showing a country's flag */
const flagButton = (iso: string) => screen.getAllByRole('button', { name: /^Flag \d+$/ }).find(b => b.textContent === EMOJI[iso])!;
const stop = (name: string) => screen.getByRole('button', { name: new RegExp(name) });

describe('FlagMatch', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('lists the route in order and places a flag on its stop', () => {
    render(<FlagMatch route={route} onDone={vi.fn()} onClose={vi.fn()} />);
    const stops = screen.getAllByRole('listitem').map(li => li.textContent);
    expect(stops[0]).toContain('Spain');
    expect(stops[2]).toContain('Germany');

    fireEvent.click(flagButton('FR'));
    fireEvent.click(stop('France'));
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(stop('France')).toBeDisabled();
  });

  it('counts a miss for a wrong match, and either order works', () => {
    render(<FlagMatch route={route} onDone={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(stop('Germany'));
    fireEvent.click(flagButton('ES'));
    expect(screen.getByText('1 miss')).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('awards stars by misses once every flag is placed', () => {
    const onDone = vi.fn();
    render(<FlagMatch route={route} onDone={onDone} onClose={vi.fn()} />);
    fireEvent.click(flagButton('DE'));
    fireEvent.click(stop('Spain')); // miss
    for (const [iso, name] of [['ES', 'Spain'], ['FR', 'France'], ['DE', 'Germany']]) {
      fireEvent.click(flagButton(iso));
      fireEvent.click(stop(name));
    }
    act(() => vi.advanceTimersByTime(3000));
    expect(onDone).toHaveBeenCalledWith(2);
    expect(screen.getByText(/all flags placed/i)).toBeInTheDocument();
  });
});
