import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameStatus } from '../../types/game';
import type { GameState } from '../../types/game';

const mockDispatch = vi.fn();
let mockGameState: GameState;

// Mock the context hook BEFORE importing the component
vi.mock('../../context/GameContext', () => ({
  useGame: () => ({ state: mockGameState, dispatch: mockDispatch }),
}));

// Mock the hooks
vi.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    state: { socket: null, isConnected: false },
    socket: null,
  }),
}));

vi.mock('../../hooks/useSocketEvent', () => ({
  useSocketEvent: () => {},
}));

// Import AFTER mocking
import RoomLobby from '../RoomLobby';

describe('RoomLobby - 5 Player Support', () => {
  const mockOnGameStart = vi.fn();
  const mockOnLeave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockState = (playerCount: number, playerNames: string[]): GameState => {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `player-${i + 1}`,
      name: playerNames[i] || `Player ${i + 1}`,
      isReady: i === 0 || i === 2 || i === 4, // Players 1, 3, 5 are ready
      isHost: i === 0,
    }));

    return {
      currentLevel: 1,
      currentRound: 1,
      selectedCities: [],
      userGuesses: [],
      roundScores: [],
      totalScore: 0,
      gameStatus: GameStatus.READY,
      highestLevel: 1,
      currentDistance: null,
      currentCityLocation: null,
      gameMode: 'multiplayer' as const,
      currentRoom: {
        code: 'TEST123',
        maxPlayers: 5,
        players,
        isActive: false,
        createdAt: Date.now(),
      },
      currentPlayer: players[0],
      difficulty: 'medium' as const,
      multiplayerGameState: null,
    };
  };

  it('displays "Players (5/5)" when room is full with 5 players', () => {
    mockGameState = createMockState(5, ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5']);

    render(<RoomLobby onGameStart={mockOnGameStart} onLeave={mockOnLeave} />);

    // Check that player count shows 5/5
    expect(screen.getByText(/Players \(5\/5\)/i)).toBeInTheDocument();
  });

  it('renders all 5 player cards with ready indicators and labels', () => {
    mockGameState = createMockState(5, ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);

    render(<RoomLobby onGameStart={mockOnGameStart} onLeave={mockOnLeave} />);

    // Check all player names are displayed
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Diana')).toBeInTheDocument();
    expect(screen.getByText('Eve')).toBeInTheDocument();

    // Check host badge is shown
    expect(screen.getByText('HOST')).toBeInTheDocument();

    // Check "You" label for current player
    expect(screen.getByText('(You)')).toBeInTheDocument();

    // Check ready/not ready states
    const readyTexts = screen.getAllByText('Ready');
    const notReadyTexts = screen.getAllByText('Not Ready');
    expect(readyTexts).toHaveLength(3); // Alice, Charlie, Eve
    expect(notReadyTexts).toHaveLength(2); // Bob, Diana
  });
});
