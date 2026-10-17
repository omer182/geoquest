// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MultiplayerGameComplete from './MultiplayerGameComplete';
import { PlayerFinalStats, PlayerStanding } from '../types/game';

describe('MultiplayerGameComplete - 5 Player Support', () => {
  const create5PlayerStandings = (): PlayerFinalStats[] => [
    {
      playerId: 'p1',
      playerName: 'Alice',
      totalScore: 4500,
      averageDistance: 75,
      bestRound: 1000,
    },
    {
      playerId: 'p2',
      playerName: 'Bob',
      totalScore: 4200,
      averageDistance: 100,
      bestRound: 950,
    },
    {
      playerId: 'p3',
      playerName: 'Charlie',
      totalScore: 3800,
      averageDistance: 150,
      bestRound: 900,
    },
    {
      playerId: 'p4',
      playerName: 'David',
      totalScore: 3400,
      averageDistance: 200,
      bestRound: 850,
    },
    {
      playerId: 'p5',
      playerName: 'Eve',
      totalScore: 3000,
      averageDistance: 250,
      bestRound: 800,
    },
  ];

  const winner: PlayerStanding = {
    playerId: 'p1',
    playerName: 'Alice',
    score: 4500,
  };

  const allPlayers = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Charlie' },
    { id: 'p4', name: 'David' },
    { id: 'p5', name: 'Eve' },
  ];

  it('shows medals for top 3 players only', () => {
    const standings = create5PlayerStandings();

    const { container } = render(
      <MultiplayerGameComplete
        finalStandings={standings}
        winner={winner}
        currentPlayerId="p3"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onRematch={vi.fn()}
        onLeaveRoom={vi.fn()}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Check for medal emojis (gold, silver, bronze)
    const text = container.textContent || '';
    const goldCount = (text.match(/🥇/g) || []).length;
    const silverCount = (text.match(/🥈/g) || []).length;
    const bronzeCount = (text.match(/🥉/g) || []).length;

    expect(goldCount).toBe(1);
    expect(silverCount).toBe(1);
    expect(bronzeCount).toBe(1);
  });

  it('displays all 5 players in final standings', () => {
    const standings = create5PlayerStandings();

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

    // Each name appears twice: once in the final standings, once in the "Play Again?" list
    for (const name of ['Alice', 'Bob', 'Charlie', 'David', 'Eve']) {
      expect(screen.getAllByText(name)).toHaveLength(2);
    }

    // Check scores are displayed
    expect(screen.getByText('4,500')).toBeInTheDocument();
    expect(screen.getByText('4,200')).toBeInTheDocument();
    expect(screen.getByText('3,800')).toBeInTheDocument();
    expect(screen.getByText('3,400')).toBeInTheDocument();
    expect(screen.getByText('3,000')).toBeInTheDocument();
  });

  it('rematch section shows all 5 players with ready indicators', () => {
    const standings = create5PlayerStandings();
    const rematchRequests = new Set(['p1', 'p2', 'p3']);

    render(
      <MultiplayerGameComplete
        finalStandings={standings}
        winner={winner}
        currentPlayerId="p1"
        rematchRequests={rematchRequests}
        allPlayers={allPlayers}
        onRematch={vi.fn()}
        onLeaveRoom={vi.fn()}
        hasRequestedRematch={true}
        rematchCountdown={null}
      />
    );

    // Check "Play Again?" header
    expect(screen.getByText('Play Again?')).toBeInTheDocument();

    // Check all 5 players are in rematch section
    // Note: Players appear in both standings and rematch sections
    const aliceElements = screen.getAllByText('Alice');
    const bobElements = screen.getAllByText('Bob');
    const charlieElements = screen.getAllByText('Charlie');
    const davidElements = screen.getAllByText('David');
    const eveElements = screen.getAllByText('Eve');

    // Each player should appear at least twice (standings + rematch)
    expect(aliceElements.length).toBeGreaterThanOrEqual(2);
    expect(bobElements.length).toBeGreaterThanOrEqual(2);
    expect(charlieElements.length).toBeGreaterThanOrEqual(2);
    expect(davidElements.length).toBeGreaterThanOrEqual(2);
    expect(eveElements.length).toBeGreaterThanOrEqual(2);

    // Check for ready indicators (checkmarks)
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBe(3); // 3 players ready
  });
});

describe('MultiplayerGameComplete - Final Summary Enhancements', () => {
  const mockPlayers = [
    { id: 'player1', name: 'Alice' },
    { id: 'player2', name: 'Bob' },
    { id: 'player3', name: 'Charlie' },
  ];

  const mockFinalStandings: PlayerFinalStats[] = [
    {
      playerId: 'player1',
      playerName: 'Alice',
      totalScore: 5000,
      averageDistance: 150,
      bestRound: 1500,
    },
    {
      playerId: 'player2',
      playerName: 'Bob',
      totalScore: 3000,
      averageDistance: 250,
      bestRound: 1000,
    },
    {
      playerId: 'player3',
      playerName: 'Charlie',
      totalScore: 2000,
      averageDistance: 350,
      bestRound: 800,
    },
  ];

  const mockWinner: PlayerStanding = {
    playerId: 'player1',
    playerName: 'Alice',
    score: 5000,
  };

  const defaultProps = {
    finalStandings: mockFinalStandings,
    winner: mockWinner,
    currentPlayerId: 'player2',
    rematchRequests: new Set<string>(),
    allPlayers: mockPlayers,
    onRematch: vi.fn(),
    onLeaveRoom: vi.fn(),
    hasRequestedRematch: false,
    rematchCountdown: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders on the shared atlas screen like the other menus', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    // Decorative world-map backdrop is hidden from assistive tech
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    // Content sits on the shared paper card
    expect(container.querySelector('.atlas-card')).toBeInTheDocument();
  });

  it('triggers confetti for winner only', async () => {
    const confetti = (await import('canvas-confetti')).default;

    // Render as winner
    render(<MultiplayerGameComplete {...defaultProps} currentPlayerId="player1" />);

    // Wait for confetti to be called (1 second delay + buffer)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Confetti should be called for winner
    expect(confetti).toHaveBeenCalled();
  });

  it('does not trigger confetti for non-winners', async () => {
    const confetti = (await import('canvas-confetti')).default;
    vi.clearAllMocks();

    // Render as non-winner (player2)
    render(<MultiplayerGameComplete {...defaultProps} currentPlayerId="player2" />);

    // Wait for potential confetti call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Confetti should NOT be called for non-winner
    expect(confetti).not.toHaveBeenCalled();
  });

  it('lists standings in score order, then the same players under "Play Again?"', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    // Order of first appearance follows the final standings; the rematch list repeats each name
    const text = container.textContent || '';
    const standingsText = text.slice(0, text.indexOf('Play Again?'));
    const rematchText = text.slice(text.indexOf('Play Again?'));
    expect(standingsText.indexOf('Alice')).toBeLessThan(standingsText.indexOf('Bob'));
    expect(standingsText.indexOf('Bob')).toBeLessThan(standingsText.indexOf('Charlie'));
    for (const name of ['Alice', 'Bob', 'Charlie']) {
      expect(rematchText).toContain(name);
    }
  });

  it('uses the atlas ink colours for primary and secondary text', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    expect(container.querySelectorAll('.text-ink').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.text-ink-soft').length).toBeGreaterThan(0);
  });

  it('highlights the winner in brass', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    expect(container.querySelectorAll('.text-brass, .border-brass').length).toBeGreaterThan(0);
  });
});
