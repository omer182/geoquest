import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MultiplayerGameComplete from '../MultiplayerGameComplete';
import { PlayerFinalStats, PlayerStanding } from '../../types/game';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

import confetti from 'canvas-confetti';

describe('MultiplayerGameComplete - Final Summary Enhancements', () => {
  const mockOnPlayAgain = vi.fn();
  const mockOnLeaveRoom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
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

  it('applies gradient background matching MainMenu aesthetic', () => {
    const finalStandings = createMockStandings(3);
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

    // Check for gradient background classes
    const backgroundElement = container.querySelector('.bg-gradient-to-br');
    expect(backgroundElement).toBeInTheDocument();
    expect(backgroundElement).toHaveClass('from-slate-900');
    expect(backgroundElement).toHaveClass('via-blue-950');
    expect(backgroundElement).toHaveClass('to-slate-900');
  });

  it('triggers confetti for winner only after 1 second delay', () => {
    const finalStandings = createMockStandings(3);
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
        currentPlayerId="player-1" // Current player is winner
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onPlayAgain={mockOnPlayAgain}
        onLeaveRoom={mockOnLeaveRoom}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Confetti should not be called immediately
    expect(confetti).not.toHaveBeenCalled();

    // Fast-forward 1 second
    vi.advanceTimersByTime(1000);

    // Verify confetti was called
    expect(confetti).toHaveBeenCalledTimes(1);

    // Verify confetti configuration
    expect(confetti).toHaveBeenCalledWith(
      expect.objectContaining({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    );
  });

  it('does not trigger confetti for non-winners', () => {
    const finalStandings = createMockStandings(3);
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
        currentPlayerId="player-2" // Current player is NOT winner
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onPlayAgain={mockOnPlayAgain}
        onLeaveRoom={mockOnLeaveRoom}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Fast-forward 2 seconds to ensure confetti would have been called if it were going to
    vi.advanceTimersByTime(2000);

    // Confetti should never be called for non-winners
    expect(confetti).not.toHaveBeenCalled();
  });

  it('uses standardized font colors for player names and scores', () => {
    const finalStandings = createMockStandings(3);
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
        currentPlayerId="player-2"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onPlayAgain={mockOnPlayAgain}
        onLeaveRoom={mockOnLeaveRoom}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Check for primary text color (text-white) on player names
    const playerNames = container.querySelectorAll('.text-white');
    expect(playerNames.length).toBeGreaterThan(0);

    // Check for secondary text color (text-gray-300) on labels
    const secondaryText = container.querySelectorAll('.text-gray-300');
    expect(secondaryText.length).toBeGreaterThan(0);
  });

  it('uses semi-transparent card backgrounds with backdrop blur', () => {
    const finalStandings = createMockStandings(3);
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

    // Check for semi-transparent background and backdrop blur on main card
    const cardElement = container.querySelector('.bg-slate-800\\/50');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement).toHaveClass('backdrop-blur-sm');
  });

  it('includes animated orbs in background', () => {
    const finalStandings = createMockStandings(3);
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

    // Check for animated floating orbs
    const floatingOrbs = container.querySelectorAll('.animate-float');
    expect(floatingOrbs.length).toBeGreaterThanOrEqual(3); // At least 3 orbs
  });

  it('applies success color (text-green-400) to winner text', () => {
    const finalStandings = createMockStandings(3);
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

    // Check for success color on winner-related elements (winner name should be green)
    const successText = container.querySelectorAll('.text-green-400');
    expect(successText.length).toBeGreaterThan(0);
  });

  it('cleans up confetti animation on component unmount', () => {
    const finalStandings = createMockStandings(3);
    const winner: PlayerStanding = {
      playerId: 'player-1',
      playerName: 'Alice',
      totalScore: 25000,
    };

    const allPlayers = finalStandings.map(s => ({
      id: s.playerId,
      name: s.playerName,
    }));

    const { unmount } = render(
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

    // Unmount before confetti timer fires
    unmount();

    // Advance timer
    vi.advanceTimersByTime(1000);

    // Confetti should not be called after unmount
    expect(confetti).not.toHaveBeenCalled();
  });
});
