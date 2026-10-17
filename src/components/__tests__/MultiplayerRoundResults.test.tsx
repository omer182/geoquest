import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MultiplayerRoundResults from '../MultiplayerRoundResults';
import { PlayerRoundResult } from '../../types/game';

// The Continue button emits over the socket, so the component needs useSocket
vi.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    state: { socket: { emit: vi.fn() }, isConnected: true },
  }),
}));

describe('MultiplayerRoundResults - 5 Player Support', () => {
  const createMockResults = (numPlayers: number): PlayerRoundResult[] => {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    const scores = [1500, 1400, 1300, 1200, 1100];
    const distances = [100, 150, 200, 250, 300];

    return Array.from({ length: numPlayers }, (_, i) => ({
      playerId: `player-${i + 1}`,
      playerName: names[i],
      distance: distances[i],
      score: scores[i],
      totalScore: scores[i],
      guess: { lat: 0, lng: 0 },
    }));
  };

  it('renders 5 player rows with correct sorting by score', () => {
    const results = createMockResults(5);

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="New York"
        countdown={5}
        roundScore={1500}
        totalScore={1500}
        roomCode="ABC123"
      />
    );

    // Check all player names are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();

    // Check winner has crown emoji
    const rows = screen.getByText('Alice').closest('td');
    expect(rows?.textContent).toContain('👑');
  });

  it('displays "You" label for current player', () => {
    const results = createMockResults(5);

    render(
      <MultiplayerRoundResults
        roundNumber={2}
        totalRounds={5}
        results={results}
        currentPlayerId="player-3"
        targetCityName="London"
        countdown={null}
        roundScore={1300}
        totalScore={2600}
        roomCode="ABC123"
      />
    );

    // Check "(You)" label appears for Charlie (player-3)
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('sorts players by cumulative total score in descending order', () => {
    // Ranking uses the running total, not this round's score: "Comeback" won the
    // round but is still behind on total.
    const unsortedResults: PlayerRoundResult[] = [
      { playerId: '1', playerName: 'Low Score', distance: 500, score: 700, totalScore: 2000, guess: { lat: 0, lng: 0 } },
      { playerId: '2', playerName: 'High Score', distance: 50, score: 1400, totalScore: 5000, guess: { lat: 0, lng: 0 } },
      { playerId: '3', playerName: 'Mid Score', distance: 200, score: 1000, totalScore: 4000, guess: { lat: 0, lng: 0 } },
      { playerId: '4', playerName: 'Very Low', distance: 800, score: 300, totalScore: 1000, guess: { lat: 0, lng: 0 } },
      { playerId: '5', playerName: 'Comeback', distance: 10, score: 1500, totalScore: 3000, guess: { lat: 0, lng: 0 } },
    ];

    const { container } = render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={unsortedResults}
        currentPlayerId="1"
        targetCityName="Paris"
        countdown={null}
        roundScore={700}
        totalScore={2000}
        roomCode="ABC123"
      />
    );

    // Get all player name cells in order
    const playerCells = container.querySelectorAll('tbody tr td:first-child');
    const playerNames = Array.from(playerCells).map(cell =>
      cell.textContent?.replace('👑', '').replace('(You)', '').trim()
    );

    // Verify they are in total-score-descending order
    expect(playerNames[0]).toBe('High Score');
    expect(playerNames[1]).toBe('Mid Score');
    expect(playerNames[2]).toBe('Comeback');
    expect(playerNames[3]).toBe('Low Score');
    expect(playerNames[4]).toBe('Very Low');
  });

  it('shows abbreviated "D." column header on mobile', () => {
    const results = createMockResults(3);

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="Tokyo"
        countdown={null}
        roundScore={1500}
        totalScore={1500}
        roomCode="ABC123"
      />
    );

    // Check for "D." text (mobile abbreviation)
    expect(screen.getByText('D.')).toBeInTheDocument();
  });
});
