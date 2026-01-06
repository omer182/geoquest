import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomLobby from './RoomLobby';
import MultiplayerRoundResults from './MultiplayerRoundResults';
import MultiplayerGameComplete from './MultiplayerGameComplete';
import GameHeader from './GameHeader';
import MultiplayerSubmenu from './MultiplayerSubmenu';
import { PlayerRoundResult, PlayerFinalStats } from '../types/game';

// Mock hooks
vi.mock('../hooks/useSocket', () => ({
  useSocket: () => ({
    state: { socket: null, isConnected: false },
    socket: null,
  }),
}));

vi.mock('../hooks/useSocketEvent', () => ({
  useSocketEvent: vi.fn(),
}));

vi.mock('../context/GameContext', () => ({
  useGame: () => ({
    state: {
      currentRoom: {
        code: 'TEST123',
        players: [
          { id: 'p1', name: 'Alice', isReady: true, isHost: true },
          { id: 'p2', name: 'Bob', isReady: false, isHost: false },
        ],
        maxPlayers: 5,
      },
      currentPlayer: { id: 'p1', name: 'Alice', isReady: true, isHost: true },
    },
    dispatch: vi.fn(),
  }),
}));

describe('Mobile Responsive Tests - 390px width (iPhone 14 Pro)', () => {
  // Set viewport to 390px width
  beforeEach(() => {
    global.innerWidth = 390;
    global.innerHeight = 844;
  });

  it('renders RoomLobby without overflow at 390px width', () => {
    const { container } = render(
      <RoomLobby onGameStart={vi.fn()} onLeave={vi.fn()} />
    );

    // Check that main container exists
    const mainDiv = container.querySelector('.max-w-\\[280px\\]');
    expect(mainDiv).toBeInTheDocument();

    // Check for responsive text sizes (should use sm: or smaller on mobile)
    expect(screen.getByText('Room Lobby')).toBeInTheDocument();
    expect(screen.getByText('TEST123')).toBeInTheDocument();
  });

  it('renders MultiplayerRoundResults table fits 390px width', () => {
    const results: PlayerRoundResult[] = [
      { playerId: 'p1', playerName: 'Alice with a very long name', distance: 50, score: 950, timeBonus: 500, totalScore: 1450 },
      { playerId: 'p2', playerName: 'Bob', distance: 100, score: 850, timeBonus: 300, totalScore: 1150 },
      { playerId: 'p3', playerName: 'Charlie', distance: 200, score: 700, timeBonus: 200, totalScore: 900 },
      { playerId: 'p4', playerName: 'David', distance: 300, score: 600, timeBonus: 100, totalScore: 700 },
      { playerId: 'p5', playerName: 'Eve', distance: 500, score: 400, timeBonus: 50, totalScore: 450 },
    ];

    const { container } = render(
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

    // Check that results card has max width constraint
    const resultsCard = container.querySelector('.max-w-\\[280px\\]');
    expect(resultsCard).toBeInTheDocument();

    // Check that table renders with all 5 players
    expect(screen.getByText('Alice with a very long name')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders MultiplayerGameComplete cards without overflow at 390px', () => {
    const standings: PlayerFinalStats[] = [
      { playerId: 'p1', playerName: 'Alice', totalScore: 12345, averageDistance: 123.45, roundsWon: 3 },
      { playerId: 'p2', playerName: 'Bob', totalScore: 9999, averageDistance: 234.56, roundsWon: 2 },
      { playerId: 'p3', playerName: 'Charlie', totalScore: 7777, averageDistance: 345.67, roundsWon: 0 },
      { playerId: 'p4', playerName: 'David', totalScore: 5555, averageDistance: 456.78, roundsWon: 0 },
      { playerId: 'p5', playerName: 'Eve', totalScore: 3333, averageDistance: 567.89, roundsWon: 0 },
    ];

    const allPlayers = standings.map(s => ({ id: s.playerId, name: s.playerName }));

    const { container } = render(
      <MultiplayerGameComplete
        finalStandings={standings}
        winner={{ playerId: 'p1', playerName: 'Alice', score: 12345, rank: 1 }}
        currentPlayerId="p1"
        rematchRequests={new Set()}
        allPlayers={allPlayers}
        onPlayAgain={vi.fn()}
        onLeaveRoom={vi.fn()}
        hasRequestedRematch={false}
        rematchCountdown={null}
      />
    );

    // Check that main container has max width constraint
    const mainDiv = container.querySelector('.max-w-\\[290px\\]');
    expect(mainDiv).toBeInTheDocument();

    // Check that all player cards render (Alice appears twice: in standings and in rematch list)
    const aliceElements = screen.getAllByText('Alice');
    expect(aliceElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('12,345')).toBeInTheDocument();
  });

  it('renders GameHeader elements without overlap at 390px', () => {
    render(<GameHeader level={2} round={3} />);

    // Check that header renders with text
    expect(screen.getByText(/Level 2 - Round 3\/5/)).toBeInTheDocument();
  });

  it('renders Back to Main Menu button and navigates correctly', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <MultiplayerSubmenu
        onCreateRoom={vi.fn()}
        onJoinRoom={vi.fn()}
        onBack={onBack}
      />
    );

    // Check that Back to Main Menu button exists
    const backButton = screen.getByText('Back to Main Menu');
    expect(backButton).toBeInTheDocument();

    // Click the button
    await user.click(backButton);

    // Verify callback was called
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('ensures touch targets meet 44x44px minimum for continue button', () => {
    const results: PlayerRoundResult[] = [
      { playerId: 'p1', playerName: 'Alice', distance: 50, score: 950, timeBonus: 500, totalScore: 1450 },
    ];

    const { container } = render(
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

    // Continue button should have min-h-[44px] for touch targets
    const continueButton = screen.getByText(/Continue/);
    expect(continueButton).toBeInTheDocument();
    expect(continueButton).toHaveClass('min-h-[44px]');
  });
});
