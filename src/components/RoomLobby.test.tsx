import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomLobby from './RoomLobby';
import { GameProvider } from '../context/GameContext';
import { SocketProvider } from '../hooks/useSocket';

// Mock socket hooks
vi.mock('../hooks/useSocket', () => ({
  useSocket: () => ({
    state: { socket: null, isConnected: false },
    socket: null,
  }),
  SocketProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../hooks/useSocketEvent', () => ({
  useSocketEvent: vi.fn(),
}));

// Helper to create mock room data
const createMockRoom = (playerCount: number, maxPlayers: number = 5) => {
  const players = Array.from({ length: playerCount }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    isHost: i === 0,
    isReady: false,
  }));

  return {
    code: 'ABCD',
    players,
    maxPlayers,
    isActive: true,
    createdAt: Date.now(),
  };
};

// Helper to render with providers
const renderWithProviders = (
  component: React.ReactElement,
  initialState?: any
) => {
  const defaultState = {
    gameMode: 'multiplayer' as const,
    currentRoom: createMockRoom(5, 5),
    currentPlayer: {
      id: 'player-1',
      name: 'Player 1',
      isHost: true,
      isReady: false,
    },
    gameStatus: 'menu' as const,
    currentLevel: 1,
    currentRound: 1,
    totalScore: 0,
    roundScores: [],
    selectedCities: [],
    currentDistance: null,
    currentGuess: null,
    currentTarget: null,
    multiplayerGameState: null,
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <SocketProvider>
      <GameProvider initialState={initialState || defaultState}>
        {children}
      </GameProvider>
    </SocketProvider>
  );

  return render(component, { wrapper: TestWrapper });
};

describe('RoomLobby - 5 Player Support', () => {
  it('displays "Players (5/5)" when room is full', () => {
    const fullRoom = createMockRoom(5, 5);
    const state = {
      gameMode: 'multiplayer' as const,
      currentRoom: fullRoom,
      currentPlayer: fullRoom.players[0],
      gameStatus: 'menu' as const,
      currentLevel: 1,
      currentRound: 1,
      totalScore: 0,
      roundScores: [],
      selectedCities: [],
      currentDistance: null,
      currentGuess: null,
      currentTarget: null,
      multiplayerGameState: null,
    };

    renderWithProviders(<RoomLobby onGameStart={vi.fn()} onLeave={vi.fn()} />, state);

    expect(screen.getByText(/Players \(5\/5\)/i)).toBeInTheDocument();
  });

  it('renders all 5 player cards with correct indicators', () => {
    const fullRoom = createMockRoom(5, 5);
    const state = {
      gameMode: 'multiplayer' as const,
      currentRoom: fullRoom,
      currentPlayer: fullRoom.players[0],
      gameStatus: 'menu' as const,
      currentLevel: 1,
      currentRound: 1,
      totalScore: 0,
      roundScores: [],
      selectedCities: [],
      currentDistance: null,
      currentGuess: null,
      currentTarget: null,
      multiplayerGameState: null,
    };

    renderWithProviders(<RoomLobby onGameStart={vi.fn()} onLeave={vi.fn()} />, state);

    // Check all 5 players are rendered
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
    expect(screen.getByText('Player 4')).toBeInTheDocument();
    expect(screen.getByText('Player 5')).toBeInTheDocument();

    // Check HOST badge is present
    expect(screen.getByText('HOST')).toBeInTheDocument();

    // Check "You" label is present
    expect(screen.getByText('(You)')).toBeInTheDocument();
  });
});
