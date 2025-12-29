import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, GameAction, GameStatus } from '../types/game';

/**
 * Initial game state before any game has started.
 */
const initialState: GameState = {
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
  gameMode: 'single-player',
  currentRoom: null,
  currentPlayer: null,
  difficulty: 'medium',
  multiplayerGameState: null,
};

/**
 * Pure reducer function to handle all game state transitions.
 * Returns a new state object for each action, never mutating the original state.
 *
 * @param state - Current game state
 * @param action - Action to perform
 * @returns New game state after action is applied
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return {
        ...initialState,
        selectedCities: action.payload.cities,
        gameStatus: GameStatus.GUESSING,
        currentLevel: 1,
        currentRound: 1,
        highestLevel: 1,
        // Preserve multiplayer state
        gameMode: state.gameMode,
        currentRoom: state.currentRoom,
        currentPlayer: state.currentPlayer,
        difficulty: state.difficulty,
        multiplayerGameState: state.multiplayerGameState,
      };
    }

    case 'SUBMIT_GUESS': {
      const { guess, distance, score } = action.payload;
      const currentCity = state.selectedCities[state.currentRound - 1];

      return {
        ...state,
        userGuesses: [...state.userGuesses, guess],
        roundScores: [...state.roundScores, score],
        totalScore: state.totalScore + score,
        gameStatus: GameStatus.ROUND_COMPLETE,
        currentDistance: distance,
        currentCityLocation: currentCity
          ? { lat: currentCity.latitude, lng: currentCity.longitude }
          : null,
      };
    }

    case 'NEXT_ROUND': {
      // Check if we've completed all 5 rounds
      if (state.currentRound >= 5) {
        return {
          ...state,
          gameStatus: GameStatus.LEVEL_COMPLETE,
          currentDistance: null,
          currentCityLocation: null,
        };
      }

      // Move to next round
      return {
        ...state,
        currentRound: state.currentRound + 1,
        gameStatus: GameStatus.GUESSING,
        currentDistance: null,
        currentCityLocation: null,
      };
    }

    case 'ADVANCE_LEVEL': {
      const newLevel = state.currentLevel + 1;
      const newHighestLevel = Math.max(newLevel, state.highestLevel);

      return {
        ...state,
        currentLevel: newLevel,
        currentRound: 1,
        selectedCities: action.payload.cities,
        userGuesses: [],
        roundScores: [],
        totalScore: 0,
        gameStatus: GameStatus.GUESSING,
        highestLevel: newHighestLevel,
        currentDistance: null,
        currentCityLocation: null,
      };
    }

    case 'RETRY_LEVEL': {
      return {
        ...state,
        currentRound: 1,
        selectedCities: action.payload.cities,
        userGuesses: [],
        roundScores: [],
        totalScore: 0,
        gameStatus: GameStatus.GUESSING,
        currentDistance: null,
        currentCityLocation: null,
      };
    }

    case 'RESTART_GAME': {
      return {
        ...initialState,
        selectedCities: action.payload.cities,
        gameStatus: GameStatus.GUESSING,
        highestLevel: state.highestLevel, // Preserve highest level achieved
      };
    }

    case 'SET_GAME_MODE': {
      return {
        ...state,
        gameMode: action.payload.mode,
      };
    }

    case 'JOIN_ROOM': {
      return {
        ...state,
        gameMode: 'multiplayer',
        currentRoom: action.payload.room,
        currentPlayer: action.payload.player,
      };
    }

    case 'UPDATE_ROOM': {
      return {
        ...state,
        currentRoom: action.payload.room,
      };
    }

    case 'LEAVE_ROOM': {
      return {
        ...state,
        gameMode: 'single-player',
        currentRoom: null,
        currentPlayer: null,
        multiplayerGameState: null,
      };
    }

    case 'SET_DIFFICULTY': {
      return {
        ...state,
        difficulty: action.payload.difficulty,
      };
    }

    case 'MULTIPLAYER_GAME_STARTED': {
      return {
        ...state,
        selectedCities: action.payload.cities,
        difficulty: action.payload.difficulty,
        gameStatus: GameStatus.GUESSING,
        currentRound: 1,
        multiplayerGameState: {
          currentRound: 1,
          totalRounds: action.payload.totalRounds,
          timerDuration: action.payload.timerDuration,
          roundStartTime: null,
          currentGuess: null,
          hasGuessed: false,
          otherPlayersGuessed: new Map(),
          roundResults: null,
          standings: [],
          isWaitingForNextRound: false,
          autoAdvanceCountdown: null,
          rematchRequests: new Set(),
          finalStats: null,
          winner: null,
        },
      };
    }

    case 'MULTIPLAYER_ROUND_START': {
      if (!state.multiplayerGameState) return state;

      return {
        ...state,
        currentRound: action.payload.roundNumber,
        gameStatus: GameStatus.GUESSING,
        currentDistance: null,
        currentCityLocation: null,
        multiplayerGameState: {
          ...state.multiplayerGameState,
          currentRound: action.payload.roundNumber,
          roundStartTime: action.payload.startTime,
          timerDuration: action.payload.timerDuration,
          currentGuess: null,
          hasGuessed: false,
          otherPlayersGuessed: new Map(),
          roundResults: null,
          isWaitingForNextRound: false,
          autoAdvanceCountdown: null,
        },
      };
    }

    case 'MULTIPLAYER_GUESS_SUBMITTED': {
      if (!state.multiplayerGameState) return state;

      return {
        ...state,
        multiplayerGameState: {
          ...state.multiplayerGameState,
          currentGuess: action.payload.guess,
          hasGuessed: true,
        },
      };
    }

    case 'MULTIPLAYER_PLAYER_GUESSED': {
      if (!state.multiplayerGameState) return state;

      const updatedPlayersGuessed = new Map(state.multiplayerGameState.otherPlayersGuessed);
      updatedPlayersGuessed.set(action.payload.playerId, action.payload.hasGuessed);

      return {
        ...state,
        multiplayerGameState: {
          ...state.multiplayerGameState,
          otherPlayersGuessed: updatedPlayersGuessed,
        },
      };
    }

    case 'MULTIPLAYER_ROUND_COMPLETE': {
      if (!state.multiplayerGameState) return state;

      const { targetCity } = action.payload;

      return {
        ...state,
        gameStatus: GameStatus.ROUND_COMPLETE,
        currentCityLocation: {
          lat: targetCity.lat,
          lng: targetCity.lng,
        },
        multiplayerGameState: {
          ...state.multiplayerGameState,
          roundResults: action.payload.results,
          standings: action.payload.standings,
          isWaitingForNextRound: true,
          autoAdvanceCountdown: 5, // Start at 5 seconds
        },
      };
    }

    case 'MULTIPLAYER_COUNTDOWN_TICK': {
      if (!state.multiplayerGameState) return state;

      return {
        ...state,
        multiplayerGameState: {
          ...state.multiplayerGameState,
          autoAdvanceCountdown: action.payload.remainingSeconds,
        },
      };
    }

    case 'MULTIPLAYER_GAME_COMPLETE': {
      if (!state.multiplayerGameState) return state;

      return {
        ...state,
        gameStatus: GameStatus.GAME_COMPLETE,
        multiplayerGameState: {
          ...state.multiplayerGameState,
          finalStats: action.payload.finalStandings,
          winner: action.payload.winner,
          isWaitingForNextRound: false,
          autoAdvanceCountdown: null,
        },
      };
    }

    case 'MULTIPLAYER_REMATCH_REQUESTED': {
      if (!state.multiplayerGameState) return state;

      const updatedRematchRequests = new Set(state.multiplayerGameState.rematchRequests);
      updatedRematchRequests.add(action.payload.playerId);

      return {
        ...state,
        multiplayerGameState: {
          ...state.multiplayerGameState,
          rematchRequests: updatedRematchRequests,
        },
      };
    }

    case 'MULTIPLAYER_REMATCH_STATUS_UPDATED': {
      if (!state.multiplayerGameState) return state;

      return {
        ...state,
        multiplayerGameState: {
          ...state.multiplayerGameState,
          rematchRequests: new Set(action.payload.rematchRequests),
        },
      };
    }

    case 'MULTIPLAYER_REMATCH': {
      // Reset game state but keep room/player info
      return {
        ...initialState,
        gameMode: 'multiplayer',
        currentRoom: state.currentRoom,
        currentPlayer: state.currentPlayer,
        difficulty: state.difficulty,
        multiplayerGameState: null,
      };
    }

    default:
      return state;
  }
}

/**
 * Context value shape providing game state and dispatch function.
 */
interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

/**
 * React Context for game state management.
 * Provides game state and dispatch function to all child components.
 */
const GameContext = createContext<GameContextValue | undefined>(undefined);

/**
 * Props for GameProvider component.
 */
interface GameProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the game UI and provides game state via Context.
 * Uses useReducer to manage state transitions in a predictable way.
 *
 * @param props - Component props
 * @returns Provider component wrapping children
 */
export function GameProvider({ children }: GameProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const value: GameContextValue = {
    state,
    dispatch,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Custom hook to access game state and dispatch function.
 * Must be used within a GameProvider component.
 *
 * @returns Game state and dispatch function
 * @throws Error if used outside of GameProvider
 */
export function useGame(): GameContextValue {
  const context = useContext(GameContext);

  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }

  return context;
}
