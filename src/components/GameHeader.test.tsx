import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameHeader from './GameHeader';

describe('GameHeader', () => {
  it('displays correct level and round numbers', () => {
    render(<GameHeader level={2} round={3} />);
    expect(screen.getByText(/Level 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Round 3\/5/i)).toBeInTheDocument();
  });

  it('formats level 1 round 1 correctly', () => {
    render(<GameHeader level={1} round={1} />);
    expect(screen.getByText(/Level 1.*Round 1\/5/i)).toBeInTheDocument();
  });

  it('displays final round correctly', () => {
    render(<GameHeader level={5} round={5} />);
    expect(screen.getByText(/Level 5/i)).toBeInTheDocument();
    expect(screen.getByText(/Round 5\/5/i)).toBeInTheDocument();
  });
});
