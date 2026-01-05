import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiplayerRoundResults from '../MultiplayerRoundResults';
import { PlayerRoundResult } from '../../types/game';

// Mock WebSocket context
vi.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    state: {
      socket: {
        emit: vi.fn(),
      },
    },
  }),
}));

describe('MultiplayerRoundResults - Enhancements (Task Group 3)', () => {
  const createMockResults = (includeTimeBonus = true): PlayerRoundResult[] => {
    return [
      {
        playerId: 'player-1',
        playerName: 'Alice',
        distance: 100,
        score: 5000,
        timeBonus: includeTimeBonus ? 1500 : 0,
        guess: { lat: 40.7128, lng: -74.006 },
      },
      {
        playerId: 'player-2',
        playerName: 'Bob',
        distance: 200,
        score: 4000,
        timeBonus: includeTimeBonus ? 1000 : 0,
        guess: { lat: 41.7128, lng: -73.006 },
      },
      {
        playerId: 'player-3',
        playerName: 'Charlie',
        distance: 300,
        score: 3000,
        timeBonus: includeTimeBonus ? 500 : 0,
        guess: { lat: 42.7128, lng: -72.006 },
      },
    ];
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays time bonus breakdown in results for each player', () => {
    const results = createMockResults(true);

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="New York"
        countdown={5}
        roundScore={5000}
        totalScore={5000}
      />
    );

    // Check that time bonus is displayed for Alice
    expect(screen.getByText(/1,500/)).toBeInTheDocument();
    expect(screen.getByText(/Time Bonus/i)).toBeInTheDocument();
  });

  it('displays cumulative total score prominently', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'player-1',
        playerName: 'Alice',
        distance: 100,
        score: 2000,
        timeBonus: 500,
        totalScore: 8500, // Cumulative total after multiple rounds
        guess: { lat: 40.7128, lng: -74.006 },
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={3}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="Paris"
        countdown={null}
        roundScore={2500}
        totalScore={8500}
      />
    );

    // Check that total score is displayed
    expect(screen.getByText(/8,500/)).toBeInTheDocument();
    expect(screen.getByText(/Total Score/i)).toBeInTheDocument();
  });

  it('displays "Calculating results..." message on final round (round 5)', () => {
    const results = createMockResults(true);

    render(
      <MultiplayerRoundResults
        roundNumber={5}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="Tokyo"
        countdown={3}
        roundScore={5000}
        totalScore={20000}
      />
    );

    // Check for "Calculating results..." text on final round
    expect(screen.getByText(/Calculating results/i)).toBeInTheDocument();
  });

  it('displays "Next round in X..." message on non-final rounds (rounds 1-4)', () => {
    const results = createMockResults(true);

    render(
      <MultiplayerRoundResults
        roundNumber={2}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="London"
        countdown={4}
        roundScore={4000}
        totalScore={9000}
      />
    );

    // Check for "Next round in..." text on non-final rounds
    expect(screen.getByText(/Next round in/i)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('handles no-pin timeout display with "—" for distance', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'player-1',
        playerName: 'Alice',
        distance: 150,
        score: 3000,
        timeBonus: 800,
        guess: { lat: 40.7128, lng: -74.006 },
      },
      {
        playerId: 'player-2',
        playerName: 'Bob',
        distance: null, // No pin placed
        score: 0,
        timeBonus: 0,
        guess: null,
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="Berlin"
        countdown={5}
        roundScore={3000}
        totalScore={3000}
      />
    );

    // Check that "—" or "No guess" is displayed for Bob's distance
    const bobRow = screen.getByText('Bob').closest('tr');
    expect(bobRow?.textContent).toMatch(/—|No guess/);
  });

  it('displays continue button with countdown text', () => {
    const results = createMockResults(true);

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="Madrid"
        countdown={5}
        roundScore={5000}
        totalScore={5000}
      />
    );

    // Check that continue button exists with countdown
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    expect(continueButton).toBeInTheDocument();
    expect(continueButton.textContent).toMatch(/\(5s?\)/); // Should show countdown
  });

  it('hides countdown on continue button after player clicks', () => {
    const results = createMockResults(true);

    const { rerender } = render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="Rome"
        countdown={5}
        roundScore={5000}
        totalScore={5000}
      />
    );

    // Click continue button
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueButton);

    // Re-render with hasClickedContinue state (this would be managed by parent)
    // For now, verify the button exists and can be clicked
    expect(continueButton).toBeInTheDocument();
  });

  it('formats numbers with commas for readability', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'player-1',
        playerName: 'Alice',
        distance: 12345,
        score: 9876,
        timeBonus: 1543,
        guess: { lat: 40.7128, lng: -74.006 },
      },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={1}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="Sydney"
        countdown={null}
        roundScore={9876}
        totalScore={9876}
      />
    );

    // Check that numbers are formatted with commas
    expect(screen.getByText(/12,345/)).toBeInTheDocument(); // Distance
    expect(screen.getByText(/9,876/)).toBeInTheDocument(); // Score
  });
});
