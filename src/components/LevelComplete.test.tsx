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
        onRestartGame={vi.fn()}
      />
    );

    expect(screen.getByText(/3,500/)).toBeInTheDocument();
    expect(screen.getByText(/2,000/)).toBeInTheDocument();
  });

  it('shows Next Level button when player passed', () => {
    render(
      <LevelComplete
        totalScore={3000}
        threshold={2000}
        passed={true}
        onNextLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onRestartGame={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /next level/i })).toBeInTheDocument();
  });

  it('does not show Next Level button when player failed', () => {
    render(
      <LevelComplete
        totalScore={1500}
        threshold={2000}
        passed={false}
        onNextLevel={vi.fn()}
        onRetryLevel={vi.fn()}
        onRestartGame={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /next level/i })).not.toBeInTheDocument();
  });

  it('calls onNextLevel when Next Level button is clicked', async () => {
    const user = userEvent.setup();
    const handleNextLevel = vi.fn();
    render(
      <LevelComplete
        totalScore={3000}
        threshold={2000}
        passed={true}
        onNextLevel={handleNextLevel}
        onRetryLevel={vi.fn()}
        onRestartGame={vi.fn()}
      />
    );

    const nextLevelButton = screen.getByRole('button', { name: /next level/i });
    await user.click(nextLevelButton);

    expect(handleNextLevel).toHaveBeenCalledTimes(1);
  });

  it('calls onRetryLevel when Retry Level button is clicked', async () => {
    const user = userEvent.setup();
    const handleRetryLevel = vi.fn();
    render(
      <LevelComplete
        totalScore={1500}
        threshold={2000}
        passed={false}
        onNextLevel={vi.fn()}
        onRetryLevel={handleRetryLevel}
        onRestartGame={vi.fn()}
      />
    );

    const retryButton = screen.getByRole('button', { name: /retry level/i });
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
        onRestartGame={vi.fn()}
      />
    );

    // Progress bar should be present in the rendered output
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });
});
