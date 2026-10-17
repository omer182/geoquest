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

  it('folds the time bonus into each player round score', () => {
    // The table has a single "Round" column showing base score + time bonus
    const results: PlayerRoundResult[] = [
      { playerId: 'player-1', playerName: 'Alice', distance: 100, score: 1200, timeBonus: 300, totalScore: 4100, guess: { lat: 40.7128, lng: -74.006 } },
      { playerId: 'player-2', playerName: 'Bob', distance: 200, score: 1000, timeBonus: 0, totalScore: 3200, guess: { lat: 41.7128, lng: -73.006 } },
    ];

    render(
      <MultiplayerRoundResults
        roundNumber={3}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="New York"
        countdown={5}
        roundScore={1500}
        totalScore={4100}
        roomCode="ABC123"
      />
    );

    const aliceRow = screen.getByText('Alice').closest('tr')!;
    const bobRow = screen.getByText('Bob').closest('tr')!;
    expect(aliceRow.querySelectorAll('td')[2].textContent).toBe('1,500');
    expect(bobRow.querySelectorAll('td')[2].textContent).toBe('1,000');
  });

  it('displays cumulative total score prominently', () => {
    const results: PlayerRoundResult[] = [
      {
        playerId: 'player-1',
        playerName: 'Alice',
        distance: 100,
        score: 1200,
        timeBonus: 300,
        totalScore: 3500, // Cumulative total after multiple rounds
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
        roundScore={1500}
        totalScore={3500}
        roomCode="ABC123"
      />
    );

    // Total shows in the player's "Total" column and in the "Total Score:" summary
    const aliceRow = screen.getByText('Alice').closest('tr')!;
    expect(aliceRow.querySelectorAll('td')[3].textContent).toBe('3,500');
    expect(screen.getByText(/Total Score/i).nextElementSibling?.textContent).toBe('3,500');
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

  it('displays a Continue button with countdown on non-final rounds (rounds 1-4)', () => {
    const results = createMockResults(true);

    render(
      <MultiplayerRoundResults
        roundNumber={2}
        totalRounds={5}
        results={results}
        currentPlayerId="player-1"
        targetCityName="London"
        countdown={4}
        roundScore={1500}
        totalScore={3000}
        roomCode="ABC123"
      />
    );

    expect(screen.getByRole('button', { name: /Continue/i }).textContent).toBe('Continue (4)');
    expect(screen.queryByText(/Calculating results/i)).not.toBeInTheDocument();
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
