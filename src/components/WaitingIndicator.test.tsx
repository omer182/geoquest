import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WaitingIndicator from './WaitingIndicator';

describe('WaitingIndicator - Generic Message', () => {
  it('shows generic message "Waiting for other players to submit..."', () => {
    render(<WaitingIndicator />);

    expect(screen.getByText(/Waiting for other players to submit.../i)).toBeInTheDocument();
  });

  it('renders loading spinner', () => {
    const { container } = render(<WaitingIndicator />);

    // Check for the spinner element (has animate-spin class)
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
