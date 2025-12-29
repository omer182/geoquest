import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameSession, GameSessionManager } from '../services/GameSessionManager.js';

describe('GameSessionManager', () => {
  let sessionManager;
  let mockCities;
  let mockPlayers;

  beforeEach(() => {
    sessionManager = new GameSessionManager();
    mockCities = [
      { name: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.006 },
      { name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 },
      { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
      { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
      { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
    ];
    mockPlayers = [
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' },
    ];
  });

  afterEach(() => {
    // Clean up all sessions
    sessionManager.sessions.forEach((session) => session.destroy());
    sessionManager.sessions.clear();
  });

  describe('Session Creation', () => {
    it('should create a new game session with correct parameters', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);

      expect(session).toBeInstanceOf(GameSession);
      expect(session.roomCode).toBe('ABC123');
      expect(session.cities).toEqual(mockCities);
      expect(session.difficulty).toBe('medium');
      expect(session.timerDuration).toBe(30);
      expect(session.currentRound).toBe(1);
      expect(session.totalRounds).toBe(5);
    });

    it('should initialize player data correctly', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);

      expect(session.playerData.size).toBe(2);
      expect(session.playerScores.size).toBe(2);

      const player1Score = session.playerScores.get('player1');
      expect(player1Score.playerName).toBe('Alice');
      expect(player1Score.totalScore).toBe(0);
      expect(player1Score.roundScores).toEqual([]);
    });
  });

  describe('Guess Processing', () => {
    it('should calculate distance and score correctly for a guess', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      session.startRound();

      // Guess very close to New York (first city)
      const result = session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now());

      expect(result.distance).toBeLessThan(1);
      expect(result.score).toBe(1000); // Perfect score for < 10km
      expect(result.isRoundComplete).toBe(false); // Only 1 of 2 players submitted
    });

    it('should detect round completion when all players submit', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      session.startRound();

      const result1 = session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now());
      expect(result1.isRoundComplete).toBe(false);

      const result2 = session.addGuess('player2', { lat: 40.7130, lng: -74.0060 }, Date.now());
      expect(result2.isRoundComplete).toBe(true);
    });

    it('should auto-submit missing guesses with zero score', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      session.startRound();

      // Only player1 submits
      session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now());

      // Auto-submit for player2
      session.autoSubmitMissingGuesses();

      const results = session.calculateRoundResults();
      expect(results.length).toBe(2);

      const player2Result = results.find(r => r.playerId === 'player2');
      expect(player2Result.score).toBe(0);
      expect(player2Result.guess).toEqual({ lat: 0, lng: 0 });
    });
  });

  describe('Round Management', () => {
    it('should advance through rounds correctly', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);

      expect(session.currentRound).toBe(1);

      const advanced = session.advanceRound();
      expect(advanced).toBe(true);
      expect(session.currentRound).toBe(2);
    });

    it('should return false when trying to advance beyond final round', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      session.currentRound = 5;

      const advanced = session.advanceRound();
      expect(advanced).toBe(false);
      expect(session.currentRound).toBe(5);
    });

    it('should clear round guesses when advancing to next round', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      session.startRound();

      session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now());
      expect(session.roundGuesses.size).toBe(1);

      session.advanceRound();
      expect(session.roundGuesses.size).toBe(0);
    });
  });

  describe('Scoring and Standings', () => {
    it('should calculate cumulative scores across rounds', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);

      // Round 1
      session.startRound();
      session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now()); // ~1000 points
      session.addGuess('player2', { lat: 40.7, lng: -74.0 }, Date.now()); // ~1000 points

      // Round 2
      session.advanceRound();
      session.startRound();
      session.addGuess('player1', { lat: 51.5, lng: -0.1 }, Date.now()); // ~500 points (London)
      session.addGuess('player2', { lat: 51.6, lng: -0.2 }, Date.now()); // ~500 points

      const standings = session.getStandings();
      expect(standings.length).toBe(2);
      expect(standings[0].totalScore).toBeGreaterThan(1000);
      expect(standings.every(s => s.totalScore > 0)).toBe(true);
    });

    it('should generate final standings with statistics', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);

      // Play 5 rounds
      for (let round = 1; round <= 5; round++) {
        session.startRound();
        session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now());
        session.addGuess('player2', { lat: 40.7, lng: -74.0 }, Date.now());
        if (round < 5) session.advanceRound();
      }

      const { finalStandings, winner } = session.getFinalStandings();

      expect(finalStandings.length).toBe(2);
      expect(finalStandings[0]).toHaveProperty('totalScore');
      expect(finalStandings[0]).toHaveProperty('averageDistance');
      expect(finalStandings[0]).toHaveProperty('roundScores');
      expect(finalStandings[0].roundScores.length).toBe(5);

      expect(winner).toBeTruthy();
      expect(winner.playerId).toBe(finalStandings[0].playerId);
    });
  });

  describe('Timer Management', () => {
    it('should start and clear round timer', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);

      const mockCallback = vi.fn();
      session.startRoundTimer(mockCallback);

      expect(session.roundTimer).toBeTruthy();

      session.clearRoundTimer();
      expect(session.roundTimer).toBeNull();
    });

    it('should use configurable timer duration', () => {
      const session15s = sessionManager.createSession('ABC123', mockCities, 'easy', 15, mockPlayers);
      const session60s = sessionManager.createSession('DEF456', mockCities, 'hard', 60, mockPlayers);

      expect(session15s.timerDuration).toBe(15);
      expect(session60s.timerDuration).toBe(60);
    });
  });
});
