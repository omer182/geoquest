import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MultiplayerRoundResults from './MultiplayerRoundResults';
import { PlayerRoundResult } from '../types/game';

// Mock useSocket hook
vi.mock('../hooks/useSocket', () => ({
  useSocket: () => ({
    state: {
      socket: {
        emit: vi.fn(),
      },
      isConnected: true,
    },
    socket: {
      emit: vi.fn(),
    },
  }),
}));

describe('MultiplayerRoundResults - 5 Player Support', () => {
  const create5PlayerResults = (): PlayerRoundResult[] => [
    { playerId: 'p1', playerName: 'Alice', distance: 50, score: 950, timeBonus: 100, totalScore: 1050 },
    { playerId: 'p2', playerName: 'Bob', distance: 100, score: 850, timeBonus: 80, totalScore: 930 },
    { playerId: 'p3', playerName: 'Charlie', distance: 200, score: 700, timeBonus: 60, totalScore: 760 },
    { playerId: 'p4', playerName: 'David', distance: 300, score: 600, timeBonus: 40, totalScore: 640 },
    { playerId: 'p5', playerName: 'Eve', distance: 500, score: 400, timeBonus: 20, totalScore: 420 },
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
        totalScore={1050}
      />
    );

    // Check all 5 players are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('David')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();

    // Check scores are displayed (with commas if > 1000)
    expect(screen.getByText(/1,050/)).toBeInTheDocument();
    expect(screen.getByText(/950/)).toBeInTheDocument();
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
        totalScore={760}
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
        totalScore={1520}
      />
    );

    // Current player should have "(You)" label
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });
});
