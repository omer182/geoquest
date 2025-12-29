import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoundResults from './RoundResults';

describe('RoundResults', () => {
  it('displays distance and score correctly', () => {
    render(<RoundResults distance={42} score={750} cityName="Tokyo" onContinue={vi.fn()} />);

    expect(screen.getByText(/42.*km/i)).toBeInTheDocument();
    expect(screen.getByText(/750/)).toBeInTheDocument();
    expect(screen.getByText(/Tokyo/i)).toBeInTheDocument();
  });

  it('shows success indicator for high score', () => {
    render(<RoundResults distance={5} score={1000} cityName="Paris" onContinue={vi.fn()} />);

    // High score should show success indicators with formatted number
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
  });

  it('calls onContinue when continue button is clicked', async () => {
    const user = userEvent.setup();
    const handleContinue = vi.fn();
    render(
      <RoundResults distance={100} score={500} cityName="London" onContinue={handleContinue} />
    );

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);

    expect(handleContinue).toHaveBeenCalledTimes(1);
  });
});
