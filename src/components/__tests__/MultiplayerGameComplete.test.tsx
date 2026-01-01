import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MultiplayerGameComplete from '../MultiplayerGameComplete';
import { PlayerFinalStats, PlayerStanding } from '../../types/game';

describe('MultiplayerGameComplete - 5 Player Support', () => {
  const mockOnPlayAgain = vi.fn();
  const mockOnLeaveRoom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockStandings = (numPlayers: number): PlayerFinalStats[] => {
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
    const scores = [25000, 22000, 19000, 16000, 13000];
    const avgDistances = [50, 75, 100, 125, 150];

    return Array.from({ length: numPlayers }, (_, i) => ({
      playerId: `player-${i + 1}`,
      playerName: names[i],
      totalScore: scores[i],
      averageDistance: avgDistances[i],
    }));
  };

  it('shows medals for top 3 players only in 5-player game', () => {
    const finalStandings = createMockStandings(5);
    const winner: PlayerStanding = {
      playerId: 'player-1',
      playerName: 'Alice',
      totalScore: 25000,
    };

    const allPlayers = finalStandings.map(s => ({
      id: s.playerId,
      name: s.playerName,
    }));

    const { container } = render(
      <MultiplayerGameComplete
        finalStandings={finalStandings}
        winner={winner}
        currentPlayerId="player-1"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onPlayAgain={mockOnPlayAgain}
        onLeaveRoom={mockOnLeaveRoom}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Count total medal emojis (should be exactly 3)
    const bodyText = container.textContent || '';
    const goldMedals = (bodyText.match(/🥇/g) || []).length;
    const silverMedals = (bodyText.match(/🥈/g) || []).length;
    const bronzeMedals = (bodyText.match(/🥉/g) || []).length;

    expect(goldMedals).toBe(1);
    expect(silverMedals).toBe(1);
    expect(bronzeMedals).toBe(1);
  });

  it('displays all 5 players in final standings', () => {
    const finalStandings = createMockStandings(5);
    const winner: PlayerStanding = {
      playerId: 'player-1',
      playerName: 'Alice',
      totalScore: 25000,
    };

    const allPlayers = finalStandings.map(s => ({
      id: s.playerId,
      name: s.playerName,
    }));

    render(
      <MultiplayerGameComplete
        finalStandings={finalStandings}
        winner={winner}
        currentPlayerId="player-3"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onPlayAgain={mockOnPlayAgain}
        onLeaveRoom={mockOnLeaveRoom}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Check all 5 players are displayed (using getAllByText since names appear twice)
    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Diana').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Eve').length).toBeGreaterThan(0);

    // Check scores are displayed
    expect(screen.getByText('25,000')).toBeInTheDocument();
    expect(screen.getByText('22,000')).toBeInTheDocument();
    expect(screen.getByText('19,000')).toBeInTheDocument();
    expect(screen.getByText('16,000')).toBeInTheDocument();
    expect(screen.getByText('13,000')).toBeInTheDocument();
  });

  it('shows all 5 players with ready indicators in rematch section', () => {
    const finalStandings = createMockStandings(5);
    const winner: PlayerStanding = {
      playerId: 'player-1',
      playerName: 'Alice',
      totalScore: 25000,
    };

    const allPlayers = finalStandings.map(s => ({
      id: s.playerId,
      name: s.playerName,
    }));

    // Players 1, 3, and 5 want rematch
    const rematchRequests = new Set(['player-1', 'player-3', 'player-5']);

    render(
      <MultiplayerGameComplete
        finalStandings={finalStandings}
        winner={winner}
        currentPlayerId="player-2"
        rematchRequests={rematchRequests}
        allPlayers={allPlayers}
        onPlayAgain={mockOnPlayAgain}
        onLeaveRoom={mockOnLeaveRoom}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Find the rematch section
    const rematchHeading = screen.getByText('Play Again?');
    expect(rematchHeading).toBeInTheDocument();

    // Check for ready indicators (checkmarks)
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks).toHaveLength(3); // Alice, Charlie, Eve
  });

  it('displays players in correct ranking order (sorted by score)', () => {
    // Create unsorted standings
    const unsortedStandings: PlayerFinalStats[] = [
      { playerId: '3', playerName: 'Charlie', totalScore: 15000, averageDistance: 120 },
      { playerId: '1', playerName: 'Alice', totalScore: 25000, averageDistance: 50 },
      { playerId: '5', playerName: 'Eve', totalScore: 10000, averageDistance: 180 },
      { playerId: '2', playerName: 'Bob', totalScore: 20000, averageDistance: 80 },
      { playerId: '4', playerName: 'Diana', totalScore: 12000, averageDistance: 150 },
    ];

    const winner: PlayerStanding = {
      playerId: '1',
      playerName: 'Alice',
      totalScore: 25000,
    };

    const allPlayers = unsortedStandings.map(s => ({
      id: s.playerId,
      name: s.playerName,
    }));

    const { container } = render(
      <MultiplayerGameComplete
        finalStandings={unsortedStandings}
        winner={winner}
        currentPlayerId="player-1"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onPlayAgain={mockOnPlayAgain}
        onLeaveRoom={mockOnLeaveRoom}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Get all "Total Score" labels to find the podium section
    const totalScoreLabels = screen.getAllByText('Total Score');
    expect(totalScoreLabels.length).toBe(5);

    // Verify correct scores are displayed in order
    expect(screen.getByText('25,000')).toBeInTheDocument(); // Alice - 1st
    expect(screen.getByText('20,000')).toBeInTheDocument(); // Bob - 2nd
    expect(screen.getByText('15,000')).toBeInTheDocument(); // Charlie - 3rd
    expect(screen.getByText('12,000')).toBeInTheDocument(); // Diana - 4th
    expect(screen.getByText('10,000')).toBeInTheDocument(); // Eve - 5th
  });
});
