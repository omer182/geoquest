import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CityPrompt from './CityPrompt';

describe('CityPrompt', () => {
  it('displays city name and country in correct format', () => {
    const { container } = render(<CityPrompt cityName="Paris" country="France" />);
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText(/France/)).toBeInTheDocument();
    // Static (compact) prompt reads "City, Country"
    expect(container.textContent).toBe('Paris, France');
  });

  it('handles city names with special characters', () => {
    const { container } = render(<CityPrompt cityName="São Paulo" country="Brazil" />);
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
    expect(container.textContent).toBe('São Paulo, Brazil');
  });
});
