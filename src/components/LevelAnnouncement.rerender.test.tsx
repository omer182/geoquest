import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import LevelAnnouncement from './LevelAnnouncement';

describe('LevelAnnouncement', () => {
  it('still finishes when the parent re-renders with a new callback (e.g. socket reconnects)', () => {
    vi.useFakeTimers();
    const calls: number[] = [];
    const { rerender } = render(<LevelAnnouncement level={1} round={1} onComplete={() => calls.push(0)} />);
    // Re-render every 500 ms with a fresh callback, as Game does on unrelated state changes
    for (let i = 1; i <= 4; i++) {
      act(() => vi.advanceTimersByTime(500));
      rerender(<LevelAnnouncement level={1} round={1} onComplete={() => calls.push(i)} />);
    }
    // 2,000 ms have passed: it completed once, via the latest callback it had at the time
    expect(calls).toHaveLength(1);
    vi.useRealTimers();
  });
});
