import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaitingIndicator from '../WaitingIndicator';

describe('WaitingIndicator - Generic Message', () => {
  it('shows generic message "Waiting for other players to submit..."', () => {
    render(<WaitingIndicator />);

    // Check for generic waiting message
    expect(screen.getByText(/Waiting for other players to submit\.\.\./i)).toBeInTheDocument();
  });

  it('displays loading spinner', () => {
    const { container } = render(<WaitingIndicator />);

    // Check for spinner element (element with animate-spin class)
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
