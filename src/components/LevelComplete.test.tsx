import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LevelComplete from './LevelComplete';

describe('LevelComplete', () => {
  it('displays total score and threshold correctly', () => {
    render(
      <LevelComplete
        totalScore={3500}
        threshold={2000}
        passed={true}
        onNextLevel={vi.fn()}
        onRetryLevel={vi.fn()}
      />
    );

    expect(screen.getByText('3,500')).toBeInTheDocument();
    expect(screen.getByText(/2,000 needed/)).toBeInTheDocument();
  });

  it('shows Continue button when player passed', () => {
    render(
      <LevelComplete
        totalScore={3000}
        threshold={2000}
        passed={true}
        onNextLevel={vi.fn()}
        onRetryLevel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /^continue$/i })).toBeInTheDocument();
  });

  it('does not show Continue button when player failed', () => {
    render(
      <LevelComplete
        totalScore={1500}
        threshold={2000}
        passed={false}
        onNextLevel={vi.fn()}
        onRetryLevel={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /^continue$/i })).not.toBeInTheDocument();
  });

  it('calls onNextLevel when Continue is clicked', async () => {
    const user = userEvent.setup();
    const handleNextLevel = vi.fn();
    render(
      <LevelComplete
        totalScore={3000}
        threshold={2000}
        passed={true}
        onNextLevel={handleNextLevel}
        onRetryLevel={vi.fn()}
      />
    );

    const nextLevelButton = screen.getByRole('button', { name: /^continue$/i });
    await user.click(nextLevelButton);

    expect(handleNextLevel).toHaveBeenCalledTimes(1);
  });

  it('calls onRetryLevel when Try Again is clicked', async () => {
    const user = userEvent.setup();
    const handleRetryLevel = vi.fn();
    render(
      <LevelComplete
        totalScore={1500}
        threshold={2000}
        passed={false}
        onNextLevel={vi.fn()}
        onRetryLevel={handleRetryLevel}
      />
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(handleRetryLevel).toHaveBeenCalledTimes(1);
  });

  it('shows threshold progress bar visual', () => {
    const { container } = render(
      <LevelComplete
        totalScore={3000}
        threshold={2000}
        passed={true}
        onNextLevel={vi.fn()}
        onRetryLevel={vi.fn()}
      />
    );

    // Progress bar should be present in the rendered output
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });

  it('shows earned stars, the unlock banner, and the star targets', () => {
    render(
      <LevelComplete level={4} totalScore={4600} threshold={2500} passed stars={3} unlocked onNextLevel={vi.fn()} />
    );
    expect(screen.getAllByRole('img', { name: '3 of 3 stars' }).length).toBe(1);
    expect(screen.getByText(/level 5 unlocked!/i)).toBeInTheDocument();
    // 2 stars at 40% of the gap to 5,000, 3 stars at 75%
    expect(screen.getByText('2★ 3,500')).toBeInTheDocument();
    expect(screen.getByText('3★ 4,375')).toBeInTheDocument();
  });

  it('offers a replay for more stars after a pass below 3 stars', () => {
    render(<LevelComplete totalScore={2600} threshold={2500} passed stars={1} unlocked={false} onNextLevel={vi.fn()} onRetryLevel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /replay for 2 stars/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /journey map/i })).toBeInTheDocument();
  });

  it('tells a failed player how many points they were short', () => {
    render(<LevelComplete totalScore={2200} threshold={2500} passed={false} onNextLevel={vi.fn()} onRetryLevel={vi.fn()} />);
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText(/so close!/i)).toBeInTheDocument();
  });
});
