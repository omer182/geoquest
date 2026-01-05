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
        onPlayAgain={vi.fn()}
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
        onPlayAgain={vi.fn()}
        onLeaveRoom={vi.fn()}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Check all 5 players are displayed in standings
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('David')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();

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
        onPlayAgain={vi.fn()}
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
    onPlayAgain: vi.fn(),
    onLeaveRoom: vi.fn(),
    hasRequestedRematch: false,
    rematchCountdown: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gradient background matching MainMenu aesthetic', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    // Check for gradient background class on main container
    const mainContainer = container.querySelector('.bg-gradient-to-br');
    expect(mainContainer).toBeInTheDocument();

    // Check for gradient colors from MainMenu pattern
    expect(mainContainer?.className).toMatch(/from-slate-900/);
    expect(mainContainer?.className).toMatch(/via-blue-950/);
    expect(mainContainer?.className).toMatch(/to-slate-900/);
  });

  it('renders animated orbs for background decoration', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    // Check for animated orbs (floating background elements)
    const orbs = container.querySelectorAll('.animate-float');
    expect(orbs.length).toBeGreaterThan(0);

    // Check for blur effect on orbs
    const blurredOrbs = container.querySelectorAll('.blur-3xl');
    expect(blurredOrbs.length).toBeGreaterThan(0);
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

  it('uses standardized font colors - text-white for primary text', () => {
    render(<MultiplayerGameComplete {...defaultProps} />);

    // Check that player names use text-white
    const aliceElement = screen.getByText(/Alice/);
    expect(aliceElement.className).toMatch(/text-white/);
  });

  it('uses standardized font colors - text-gray-300 for secondary text', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    // Check for secondary text colors (labels, descriptions)
    const secondaryElements = container.querySelectorAll('.text-gray-300');
    expect(secondaryElements.length).toBeGreaterThan(0);
  });

  it('uses success color (text-green-400) for winner and ready status', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    // Check for success/green color in winner's card or ready status
    const successElements = container.querySelectorAll('.text-green-400, .bg-green-500, .border-green-500');
    expect(successElements.length).toBeGreaterThan(0);
  });

  it('uses semi-transparent card backgrounds with backdrop blur', () => {
    const { container } = render(<MultiplayerGameComplete {...defaultProps} />);

    // Check for semi-transparent backgrounds on inner card
    const transparentBgs = container.querySelectorAll('[class*="bg-slate-800/50"], [class*="backdrop-blur"]');
    expect(transparentBgs.length).toBeGreaterThan(0);
  });
});
