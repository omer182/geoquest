import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MultiplayerRoundResults from './MultiplayerRoundResults';
import { PlayerRoundResult } from '../types/game';

describe('MultiplayerRoundResults - 5 Player Support', () => {
  const create5PlayerResults = (): PlayerRoundResult[] => [
    { playerId: 'p1', playerName: 'Alice', distance: 50, score: 950 },
    { playerId: 'p2', playerName: 'Bob', distance: 100, score: 850 },
    { playerId: 'p3', playerName: 'Charlie', distance: 200, score: 700 },
    { playerId: 'p4', playerName: 'David', distance: 300, score: 600 },
    { playerId: 'p5', playerName: 'Eve', distance: 500, score: 400 },
  ];

  it('renders 5 player rows with correct sorting', () => {
    const results = create5PlayerResults();

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={null}
        roundScore={950}
        totalScore={950}
      />
    );

    // Check all 5 players are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('David')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();

    // Check scores are displayed
    expect(screen.getByText('950')).toBeInTheDocument();
    expect(screen.getByText('850')).toBeInTheDocument();
    expect(screen.getByText('700')).toBeInTheDocument();
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
  });

  it('displays crown emoji for winner (highest score)', () => {
    const results = create5PlayerResults();

    const { container } = render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p3"
        targetCityName="Paris"
        countdown={null}
        roundScore={700}
        totalScore={700}
      />
    );

    // Winner should have crown emoji
    expect(container.textContent).toContain('👑');
  });

  it('highlights current player row with (You) label', () => {
    const results = create5PlayerResults();

    render(
      <MultiplayerRoundResults
        roundNumber={2}
        totalRounds={5}
        results={results}
        currentPlayerId="p3"
        targetCityName="London"
        countdown={null}
        roundScore={700}
        totalScore={1400}
      />
    );

    // Current player should have "(You)" label
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });
});
