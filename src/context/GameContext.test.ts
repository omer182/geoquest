import { describe, it, expect } from 'vitest';
import { gameReducer } from './GameContext';
import { GameState, GameStatus, GameAction } from '../types/game';
import { City } from '../types/city';

/**
 * Test helper: Creates a mock city for testing
 */
function createMockCity(name: string, lat: number, lng: number, tier: number = 1): City {
  return {
    name,
    country: 'Test Country',
    latitude: lat,
    longitude: lng,
    tier,
  };
}

/**
 * Test helper: Creates an array of 5 mock cities
 */
function createMockCities(): City[] {
  return [
    createMockCity('City 1', 40.7128, -74.006),
    createMockCity('City 2', 51.5074, -0.1278),
    createMockCity('City 3', 35.6762, 139.6503),
    createMockCity('City 4', 48.8566, 2.3522),
    createMockCity('City 5', -33.8688, 151.2093),
  ];
}

/**
 * Test helper: Creates initial game state
 */
function createInitialState(): GameState {
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
  };
}

describe('Game State Reducer', () => {
  describe('START_GAME action', () => {
    it('should initialize state correctly with provided cities', () => {
      const initialState = createInitialState();
      const mockCities = createMockCities();

      const action: GameAction = {
        type: 'START_GAME',
        payload: { cities: mockCities },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.currentLevel).toBe(1);
      expect(newState.currentRound).toBe(1);
      expect(newState.selectedCities).toEqual(mockCities);
      expect(newState.gameStatus).toBe(GameStatus.GUESSING);
      expect(newState.userGuesses).toEqual([]);
      expect(newState.roundScores).toEqual([]);
      expect(newState.totalScore).toBe(0);
      expect(newState.highestLevel).toBe(1);
      expect(newState.currentDistance).toBeNull();
      expect(newState.currentCityLocation).toBeNull();
    });

    it('should reset all state when starting a new game', () => {
      const stateWithProgress: GameState = {
        currentLevel: 3,
        currentRound: 4,
        selectedCities: createMockCities(),
        userGuesses: [
          { lat: 40, lng: -74 },
          { lat: 51, lng: -0.1 },
        ],
        roundScores: [750, 500],
        totalScore: 1250,
        gameStatus: GameStatus.GUESSING,
        highestLevel: 3,
        currentDistance: 50,
        currentCityLocation: { lat: 40.7128, lng: -74.006 },
      };

      const newCities = createMockCities();
      const action: GameAction = {
        type: 'START_GAME',
        payload: { cities: newCities },
      };

      const newState = gameReducer(stateWithProgress, action);

      expect(newState.currentLevel).toBe(1);
      expect(newState.currentRound).toBe(1);
      expect(newState.totalScore).toBe(0);
      expect(newState.userGuesses).toEqual([]);
      expect(newState.roundScores).toEqual([]);
    });
  });

  describe('SUBMIT_GUESS action', () => {
    it('should update state with guess, distance, and score', () => {
      const cities = createMockCities();
      const initialState: GameState = {
        ...createInitialState(),
        selectedCities: cities,
        gameStatus: GameStatus.GUESSING,
        currentRound: 1,
      };

      const guess = { lat: 40.5, lng: -74.0 };
      const action: GameAction = {
        type: 'SUBMIT_GUESS',
        payload: {
          guess,
          distance: 25,
          score: 750,
        },
      };

      const newState = gameReducer(initialState, action);

      expect(newState.userGuesses).toEqual([guess]);
      expect(newState.roundScores).toEqual([750]);
      expect(newState.totalScore).toBe(750);
      expect(newState.currentDistance).toBe(25);
      expect(newState.gameStatus).toBe(GameStatus.ROUND_COMPLETE);
      expect(newState.currentCityLocation).toEqual({
        lat: cities[0].latitude,
        lng: cities[0].longitude,
      });
    });

    it('should accumulate scores across multiple rounds', () => {
      const cities = createMockCities();
      const stateAfterFirstGuess: GameState = {
        ...createInitialState(),
        selectedCities: cities,
        currentRound: 2,
        userGuesses: [{ lat: 40.5, lng: -74.0 }],
        roundScores: [750],
        totalScore: 750,
        gameStatus: GameStatus.GUESSING,
      };

      const secondGuess = { lat: 51.5, lng: -0.2 };
      const action: GameAction = {
        type: 'SUBMIT_GUESS',
        payload: {
          guess: secondGuess,
          distance: 5,
          score: 1000,
        },
      };

      const newState = gameReducer(stateAfterFirstGuess, action);

      expect(newState.userGuesses).toHaveLength(2);
      expect(newState.roundScores).toEqual([750, 1000]);
      expect(newState.totalScore).toBe(1750);
    });

    it('should not mutate the original state', () => {
      const initialState: GameState = {
        ...createInitialState(),
        selectedCities: createMockCities(),
        gameStatus: GameStatus.GUESSING,
      };

      const originalGuesses = [...initialState.userGuesses];
      const originalScores = [...initialState.roundScores];
      const originalTotalScore = initialState.totalScore;

      const action: GameAction = {
        type: 'SUBMIT_GUESS',
        payload: {
          guess: { lat: 40.5, lng: -74.0 },
          distance: 25,
          score: 750,
        },
      };

      gameReducer(initialState, action);

      expect(initialState.userGuesses).toEqual(originalGuesses);
      expect(initialState.roundScores).toEqual(originalScores);
      expect(initialState.totalScore).toBe(originalTotalScore);
    });
  });

  describe('ADVANCE_LEVEL action', () => {
    it('should increment level and reset round state', () => {
      const completedLevelState: GameState = {
        ...createInitialState(),
        currentLevel: 2,
        currentRound: 5,
        selectedCities: createMockCities(),
        userGuesses: Array(5).fill({ lat: 40, lng: -74 }),
        roundScores: [1000, 750, 500, 750, 1000],
        totalScore: 4000,
        gameStatus: GameStatus.LEVEL_COMPLETE,
        highestLevel: 2,
      };

      const newCities = createMockCities();
      const action: GameAction = {
        type: 'ADVANCE_LEVEL',
        payload: { cities: newCities },
      };

      const newState = gameReducer(completedLevelState, action);

      expect(newState.currentLevel).toBe(3);
      expect(newState.currentRound).toBe(1);
      expect(newState.selectedCities).toEqual(newCities);
      expect(newState.userGuesses).toEqual([]);
      expect(newState.roundScores).toEqual([]);
      expect(newState.totalScore).toBe(0);
      expect(newState.gameStatus).toBe(GameStatus.GUESSING);
      expect(newState.highestLevel).toBe(3);
      expect(newState.currentDistance).toBeNull();
      expect(newState.currentCityLocation).toBeNull();
    });

    it('should update highest level when advancing beyond previous record', () => {
      const state: GameState = {
        ...createInitialState(),
        currentLevel: 5,
        highestLevel: 5,
        gameStatus: GameStatus.LEVEL_COMPLETE,
      };

      const action: GameAction = {
        type: 'ADVANCE_LEVEL',
        payload: { cities: createMockCities() },
      };

      const newState = gameReducer(state, action);

      expect(newState.currentLevel).toBe(6);
      expect(newState.highestLevel).toBe(6);
    });
  });

  describe('RETRY_LEVEL action', () => {
    it('should reset round but maintain current level', () => {
      const failedLevelState: GameState = {
        ...createInitialState(),
        currentLevel: 3,
        currentRound: 5,
        selectedCities: createMockCities(),
        userGuesses: Array(5).fill({ lat: 40, lng: -74 }),
        roundScores: [100, 0, 100, 250, 100],
        totalScore: 550,
        gameStatus: GameStatus.LEVEL_FAILED,
        highestLevel: 3,
      };

      const newCities = createMockCities();
      const action: GameAction = {
        type: 'RETRY_LEVEL',
        payload: { cities: newCities },
      };

      const newState = gameReducer(failedLevelState, action);

      expect(newState.currentLevel).toBe(3); // Level unchanged
      expect(newState.currentRound).toBe(1);
      expect(newState.selectedCities).toEqual(newCities);
      expect(newState.userGuesses).toEqual([]);
      expect(newState.roundScores).toEqual([]);
      expect(newState.totalScore).toBe(0);
      expect(newState.gameStatus).toBe(GameStatus.GUESSING);
      expect(newState.highestLevel).toBe(3); // Highest level preserved
    });
  });

  describe('NEXT_ROUND action', () => {
    it('should advance to next round when under 5 rounds', () => {
      const state: GameState = {
        ...createInitialState(),
        currentRound: 3,
        gameStatus: GameStatus.ROUND_COMPLETE,
        currentDistance: 50,
        currentCityLocation: { lat: 40, lng: -74 },
      };

      const action: GameAction = {
        type: 'NEXT_ROUND',
      };

      const newState = gameReducer(state, action);

      expect(newState.currentRound).toBe(4);
      expect(newState.gameStatus).toBe(GameStatus.GUESSING);
      expect(newState.currentDistance).toBeNull();
      expect(newState.currentCityLocation).toBeNull();
    });

    it('should transition to LEVEL_COMPLETE after round 5', () => {
      const state: GameState = {
        ...createInitialState(),
        currentRound: 5,
        gameStatus: GameStatus.ROUND_COMPLETE,
      };

      const action: GameAction = {
        type: 'NEXT_ROUND',
      };

      const newState = gameReducer(state, action);

      expect(newState.currentRound).toBe(5); // Stays at 5
      expect(newState.gameStatus).toBe(GameStatus.LEVEL_COMPLETE);
    });
  });

  describe('RESTART_GAME action', () => {
    it('should reset to initial state but preserve highest level', () => {
      const state: GameState = {
        currentLevel: 5,
        currentRound: 3,
        selectedCities: createMockCities(),
        userGuesses: [{ lat: 40, lng: -74 }],
        roundScores: [1000],
        totalScore: 1000,
        gameStatus: GameStatus.GUESSING,
        highestLevel: 5,
        currentDistance: 25,
        currentCityLocation: { lat: 40, lng: -74 },
      };

      const newCities = createMockCities();
      const action: GameAction = {
        type: 'RESTART_GAME',
        payload: { cities: newCities },
      };

      const newState = gameReducer(state, action);

      expect(newState.currentLevel).toBe(1);
      expect(newState.currentRound).toBe(1);
      expect(newState.totalScore).toBe(0);
      expect(newState.userGuesses).toEqual([]);
      expect(newState.roundScores).toEqual([]);
      expect(newState.gameStatus).toBe(GameStatus.GUESSING);
      expect(newState.highestLevel).toBe(5); // Preserved
    });
  });

  describe('immutability', () => {
    it('should return new state objects without mutating original', () => {
      const originalState = createInitialState();
      const cities = createMockCities();

      const action: GameAction = {
        type: 'START_GAME',
        payload: { cities },
      };

      const newState = gameReducer(originalState, action);

      // Verify objects are different references
      expect(newState).not.toBe(originalState);
      expect(newState.selectedCities).not.toBe(originalState.selectedCities);
      expect(newState.userGuesses).not.toBe(originalState.userGuesses);
      expect(newState.roundScores).not.toBe(originalState.roundScores);

      // Verify original state unchanged
      expect(originalState.gameStatus).toBe(GameStatus.READY);
      expect(originalState.selectedCities).toEqual([]);
    });
  });
});
