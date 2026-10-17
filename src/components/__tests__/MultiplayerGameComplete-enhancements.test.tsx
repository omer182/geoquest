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

  it('renders on the shared atlas screen like the other menus', () => {
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

    // Shared atlas screen: decorative world backdrop + paper card
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(container.querySelector('.atlas-card')).toBeInTheDocument();
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

    // Primary ink on player names and scores, softer ink on labels
    expect(container.querySelectorAll('.text-ink').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.text-ink-soft').length).toBeGreaterThan(0);
  });

  it('renders standings inside the paper card', () => {
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

    const card = container.querySelector('.atlas-card');
    expect(card).toBeInTheDocument();
    expect(card?.textContent).toContain('Alice');
  });

  it('includes the drifting world map backdrop', () => {
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

    // Backdrop is purely decorative
    const backdrop = container.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();
  });

  it('highlights the winner in brass', () => {
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

    // Winner's card and score use the brass (gold) accent
    expect(container.querySelectorAll('.text-brass, .border-brass').length).toBeGreaterThan(0);
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
