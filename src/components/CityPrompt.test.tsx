import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CityPrompt from './CityPrompt';

describe('CityPrompt', () => {
  it('displays city name and country in correct format', () => {
    render(<CityPrompt cityName="Paris" country="France" />);
    expect(screen.getByText(/Find:/i)).toBeInTheDocument();
    expect(screen.getByText(/Paris, France/i)).toBeInTheDocument();
  });

  it('handles city names with special characters', () => {
    render(<CityPrompt cityName="São Paulo" country="Brazil" />);
    expect(screen.getByText(/São Paulo, Brazil/i)).toBeInTheDocument();
  });
});
