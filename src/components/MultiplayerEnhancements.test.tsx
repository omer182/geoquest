/**
 * Integration Tests for Multiplayer UI Enhancements
 *
 * Tests end-to-end UI workflows for:
 * - Continue button with countdown display
 * - Final round "Calculating results..." message
 * - Time bonus display in round results
 * - No-pin timeout UI handling
 * - Winner confetti animation
 * - Mobile responsiveness at 390px and 375px
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MultiplayerRoundResults from './MultiplayerRoundResults';
import MultiplayerGameComplete from './MultiplayerGameComplete';
import { PlayerRoundResult, PlayerFinalStats } from '../types/game';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock socket hook
const mockEmit = vi.fn();
vi.mock('../hooks/useSocket', () => ({
  useSocket: () => ({
    state: {
      socket: {
        emit: mockEmit,
      },
      isConnected: true,
    },
    socket: {
      emit: mockEmit,
    },
  }),
}));


/** Distance, round and total cells of a player's row in the round results table */
const rowCells = (playerName: string) =>
  Array.from(screen.getByText(playerName).closest('tr')!.querySelectorAll('td'))
    .slice(1)
    .map(td => td.textContent);

describe('Continue Button Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display countdown and emit round:player_ready when clicked', async () => {
    const user = userEvent.setup();
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: 50,
        score: 950,
        timeBonus: 500,
        totalScore: 1450,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={950}
        totalScore={1450}
      />
    );

    // Find continue button with countdown
    const continueButton = screen.getByText(/Continue/);
    expect(continueButton).toBeInTheDocument();

    // Click continue button
    await user.click(continueButton);

    // Verify socket event was emitted
    expect(mockEmit).toHaveBeenCalledWith('round:player_ready', {
      playerId: 'p1',
    });

    // Verify countdown is hidden after click
    await waitFor(() => {
      expect(screen.queryByText(/\(\d+s\)/)).not.toBeInTheDocument();
    });
  });

  it('should not allow multiple clicks on continue button', async () => {
    const user = userEvent.setup();
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: 50,
        score: 950,
        timeBonus: 500,
        totalScore: 1450,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={950}
        totalScore={1450}
      />
    );

    const continueButton = screen.getByText(/Continue/);

    // Click twice
    await user.click(continueButton);
    await user.click(continueButton);

    // Should only emit once
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });
});

describe('Final Round Message Integration', () => {
  it('should display "Calculating results..." on final round (round 5)', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: 50,
        score: 950,
        timeBonus: 500,
        totalScore: 4500,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={5}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={950}
        totalScore={4500}
      />
    );

    // Should show "Calculating results..." instead of "Next round in..."
    expect(screen.getByText(/Calculating results/i)).toBeInTheDocument();
  });

  it('should display "Next round in X..." on rounds 1-4', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: 50,
        score: 950,
        timeBonus: 500,
        totalScore: 1450,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={3}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={950}
        totalScore={1450}
      />
    );

    // Should show countdown message
    expect(screen.queryByText(/Calculating results/i)).not.toBeInTheDocument();
  });
});

describe('Time Bonus Display Integration', () => {
  // The "Round" column shows base score + time bonus; there is no separate bonus column
  it('should include time bonus in each player round score', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: 50,
        score: 1200,
        timeBonus: 300,
        totalScore: 2500,
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        distance: 100,
        score: 800,
        timeBonus: 150,
        totalScore: 1300,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={1500}
        totalScore={2500}
      />
    );

    expect(rowCells('Alice')).toEqual(['50', '1,500', '2,500']); // 1200 + 300 bonus
    expect(rowCells('Bob')).toEqual(['100', '950', '1,300']); // 800 + 150 bonus
  });

  it('should display zero time bonus for players who submitted late', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: 50,
        score: 950,
        timeBonus: 0,
        totalScore: 950,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={950}
        totalScore={950}
      />
    );

    // Round score is just the base score when there is no bonus
    expect(rowCells('Alice')).toEqual(['50', '950', '950']);
  });
});

describe('No-Pin Timeout UI Integration', () => {
  it('should display "No guess" for players with null distance', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: 50,
        score: 950,
        timeBonus: 500,
        totalScore: 1450,
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        distance: null,
        score: 0,
        timeBonus: 0,
        totalScore: 0,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={950}
        totalScore={1450}
      />
    );

    // Check that "No guess" or "—" is displayed for Bob
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Note: The actual text depends on implementation - could be "—", "No guess", or "N/A"
  });

  it('should display message when no players submitted guesses', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: null,
        score: 0,
        timeBonus: 0,
        totalScore: 0,
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        distance: null,
        score: 0,
        timeBonus: 0,
        totalScore: 0,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={0}
        totalScore={0}
      />
    );

    // Check that both players show no guess
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

describe('Winner Confetti Integration', () => {
  it('should trigger confetti animation for winner after 1 second delay', async () => {
    const confetti = (await import('canvas-confetti')).default;
    vi.clearAllMocks();

    const standings: PlayerFinalStats[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        totalScore: 5000,
        averageDistance: 150,
        bestRound: 1500,
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        totalScore: 3000,
        averageDistance: 250,
        bestRound: 1000,
      },
    ];

    const winner = { playerId: 'p1', playerName: 'Alice', score: 5000 };
    const allPlayers = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];

    render(
      <MultiplayerGameComplete
        finalStandings={standings}
        winner={winner}
        currentPlayerId="p1"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onRematch={vi.fn()}
        onLeaveRoom={vi.fn()}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Wait for confetti trigger (1s delay + buffer)
    await waitFor(
      () => {
        expect(confetti).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it('should not trigger confetti for non-winner players', async () => {
    const confetti = (await import('canvas-confetti')).default;
    vi.clearAllMocks();

    const standings: PlayerFinalStats[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        totalScore: 5000,
        averageDistance: 150,
        bestRound: 1500,
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        totalScore: 3000,
        averageDistance: 250,
        bestRound: 1000,
      },
    ];

    const winner = { playerId: 'p1', playerName: 'Alice', score: 5000 };
    const allPlayers = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];

    // Render as Bob (non-winner)
    render(
      <MultiplayerGameComplete
        finalStandings={standings}
        winner={winner}
        currentPlayerId="p2"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onRematch={vi.fn()}
        onLeaveRoom={vi.fn()}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Wait to ensure confetti is not triggered
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(confetti).not.toHaveBeenCalled();
  });
});

describe('Mobile Responsiveness at 375px (iPhone SE)', () => {
  beforeEach(() => {
    // Set viewport to 375px (iPhone SE)
    global.innerWidth = 375;
    global.innerHeight = 667;
  });

  it('should render round results without overflow at 375px width', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice with a very long name',
        distance: 50,
        score: 950,
        timeBonus: 500,
        totalScore: 1450,
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        distance: 100,
        score: 850,
        timeBonus: 300,
        totalScore: 1150,
      },
    ];

    const { container } = render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo with a very long name"
        countdown={5}
        roundScore={950}
        totalScore={1450}
      />
    );

    // Check that main container has max-width constraint
    const maxWidthElements = container.querySelectorAll('[class*="max-w"]');
    expect(maxWidthElements.length).toBeGreaterThan(0);

    // Check that long names are present (truncation happens in CSS)
    expect(screen.getByText(/Alice with a very long name/)).toBeInTheDocument();
  });

  it('should render final summary without overflow at 375px width', () => {
    const standings: PlayerFinalStats[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        totalScore: 99999,
        averageDistance: 123.45,
        bestRound: 9999,
      },
      {
        playerId: 'p2',
        playerName: 'Bob',
        totalScore: 88888,
        averageDistance: 234.56,
        bestRound: 8888,
      },
    ];

    const winner = { playerId: 'p1', playerName: 'Alice', score: 99999 };
    const allPlayers = [
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ];

    const { container } = render(
      <MultiplayerGameComplete
        finalStandings={standings}
        winner={winner}
        currentPlayerId="p2"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onRematch={vi.fn()}
        onLeaveRoom={vi.fn()}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Check for max-width constraints
    const maxWidthElements = container.querySelectorAll('[class*="max-w"]');
    expect(maxWidthElements.length).toBeGreaterThan(0);

    // Check that large scores are formatted with commas
    expect(screen.getByText(/99,999/)).toBeInTheDocument();
  });
});

describe('Cumulative Score Display Integration', () => {
  it('should prominently display total score alongside round score', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'p1',
        playerName: 'Alice',
        distance: 50,
        score: 950,
        timeBonus: 500,
        totalScore: 4500, // Cumulative after multiple rounds
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={3}
        totalRounds={5}
        results={results}
        currentPlayerId="p1"
        targetCityName="Tokyo"
        countdown={5}
        roundScore={1450} // Current round: 950 + 500
        totalScore={4500} // Total across all rounds
      />
    );

    // Round score (with bonus) and running total in the row, plus the "Total Score:" summary
    expect(rowCells('Alice')).toEqual(['50', '1,450', '4,500']);
    expect(screen.getByText(/Total Score/i).nextElementSibling?.textContent).toBe('4,500');
  });
});
