import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreDisplay from './ScoreDisplay';

describe('ScoreDisplay', () => {
  it('displays current score and total score', () => {
    render(<ScoreDisplay currentScore={750} totalScore={2500} />);
    expect(screen.getByText(/750/)).toBeInTheDocument();
    expect(screen.getByText(/2,500/)).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    render(<ScoreDisplay currentScore={1000} totalScore={15750} />);
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
    expect(screen.getByText(/15,750/)).toBeInTheDocument();
  });

  it('displays zero scores correctly', () => {
    render(<ScoreDisplay currentScore={0} totalScore={0} />);
    const scores = screen.getAllByText(/^0$/);
    expect(scores).toHaveLength(2); // Both current and total score should show 0
  });
});
