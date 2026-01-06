import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameSession, GameSessionManager } from '../services/GameSessionManager.js';

/**
 * Tests for time bonus scoring and no-pin timeout handling
 * Task Group 1: Time-Based Bonus Scoring & No-Pin Timeout
 */
describe('GameSessionManager - Time Bonus Scoring', () => {
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

  describe('Time Bonus Calculation', () => {
    it('should award maximum time bonus (2000 points) when submitting at full time remaining', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      const roundStartTime = session.startRound();

      // Submit immediately (full time remaining)
      const result = session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, roundStartTime);

      expect(result.timeBonus).toBe(2000); // Max bonus for immediate submission
    });

    it('should award zero time bonus when submitting at 0 seconds remaining', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      const roundStartTime = session.startRound();

      // Simulate submission at the very end (30 seconds after round start)
      const mockNow = vi.spyOn(Date, 'now')
        .mockReturnValue(roundStartTime + 30000); // 30s after start

      const result = session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, roundStartTime);

      expect(result.timeBonus).toBe(0); // Zero bonus at end of timer
      mockNow.mockRestore();
    });

    it('should calculate proportional time bonus for mid-round submission', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      const roundStartTime = session.startRound();

      // Simulate submission at 15 seconds (half time remaining)
      const mockNow = vi.spyOn(Date, 'now')
        .mockReturnValue(roundStartTime + 15000); // 15s after start

      const result = session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, roundStartTime);

      // Expected: (15s remaining / 30s total) * 2000 = 1000 points
      expect(result.timeBonus).toBe(1000);
      mockNow.mockRestore();
    });

    it('should handle different round durations (easy: 45s, hard: 20s)', () => {
      // Easy mode: 45s timer
      const easySession = sessionManager.createSession('EASY123', mockCities, 'easy', 45, mockPlayers);
      const easyStartTime = easySession.startRound();

      const mockNow1 = vi.spyOn(Date, 'now')
        .mockReturnValue(easyStartTime + 22500); // 22.5s elapsed, 22.5s remaining

      const easyResult = easySession.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, easyStartTime);
      // Expected: (22.5 / 45) * 2000 = 1000 points
      expect(easyResult.timeBonus).toBe(1000);

      mockNow1.mockRestore();

      // Hard mode: 20s timer
      const hardSession = sessionManager.createSession('HARD123', mockCities, 'hard', 20, mockPlayers);
      const hardStartTime = hardSession.startRound();

      const mockNow2 = vi.spyOn(Date, 'now')
        .mockReturnValue(hardStartTime + 10000); // 10s elapsed, 10s remaining

      const hardResult = hardSession.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, hardStartTime);
      // Expected: (10 / 20) * 2000 = 1000 points
      expect(hardResult.timeBonus).toBe(1000);

      mockNow2.mockRestore();
    });
  });

  describe('No-Pin Timeout Handling', () => {
    it('should assign default result with null distance and 0 points for non-submissions', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      const roundStartTime = session.startRound();

      // Only player1 submits
      session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, roundStartTime);

      // Auto-submit missing guesses (simulates timeout)
      session.autoSubmitMissingGuesses();

      const results = session.calculateRoundResults();
      const player2Result = results.find(r => r.playerId === 'player2');

      // Player who didn't submit should have null distance, 0 score, 0 timeBonus
      expect(player2Result.distance).toBeNull();
      expect(player2Result.score).toBe(0);
      expect(player2Result.timeBonus).toBe(0);
    });

    it('should include time bonus in round results for all players', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      const roundStartTime = session.startRound();

      // Player 1 submits at 5s (25s remaining)
      const mockNow1 = vi.spyOn(Date, 'now')
        .mockReturnValue(roundStartTime + 5000); // 5s after start

      session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, roundStartTime);
      mockNow1.mockRestore();

      // Player 2 submits at 20s (10s remaining)
      const mockNow2 = vi.spyOn(Date, 'now')
        .mockReturnValue(roundStartTime + 20000); // 20s after start

      session.addGuess('player2', { lat: 40.7, lng: -74.0 }, roundStartTime);
      mockNow2.mockRestore();

      const results = session.calculateRoundResults();

      // Player 1: (25s / 30s) * 2000 = 1666.66 -> 1666
      const player1Result = results.find(r => r.playerId === 'player1');
      expect(player1Result.timeBonus).toBe(1666);

      // Player 2: (10s / 30s) * 2000 = 666.66 -> 666
      const player2Result = results.find(r => r.playerId === 'player2');
      expect(player2Result.timeBonus).toBe(666);
    });
  });

  describe('Cumulative Score with Time Bonus', () => {
    it('should include time bonus in cumulative total score', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);
      const roundStartTime = session.startRound();

      // Player 1 submits quickly (5s elapsed, 25s remaining)
      const mockNow = vi.spyOn(Date, 'now')
        .mockReturnValue(roundStartTime + 5000);

      const result = session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, roundStartTime);

      // Expected time bonus: (25 / 30) * 2000 = 1666
      expect(result.timeBonus).toBe(1666);

      // Total score should be distance score + time bonus
      const playerScore = session.playerScores.get('player1');
      const expectedTotal = result.score + result.timeBonus;
      expect(playerScore.totalScore).toBe(expectedTotal);

      mockNow.mockRestore();
    });

    it('should accumulate time bonus across multiple rounds', () => {
      const session = sessionManager.createSession('ABC123', mockCities, 'medium', 30, mockPlayers);

      // Round 1
      const round1StartTime = session.startRound();
      const mockNow1 = vi.spyOn(Date, 'now')
        .mockReturnValue(round1StartTime + 10000); // 10s elapsed, 20s remaining

      const round1Result = session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, round1StartTime);
      const round1TotalScore = session.playerScores.get('player1').totalScore;

      mockNow1.mockRestore();

      // Round 2
      session.advanceRound();
      const round2StartTime = session.startRound();
      const mockNow2 = vi.spyOn(Date, 'now')
        .mockReturnValue(round2StartTime + 5000); // 5s elapsed, 25s remaining

      const round2Result = session.addGuess('player1', { lat: 51.5, lng: -0.1 }, round2StartTime);
      const round2TotalScore = session.playerScores.get('player1').totalScore;

      // Total should accumulate both rounds' scores and time bonuses
      const expectedTotal = round1Result.score + round1Result.timeBonus + round2Result.score + round2Result.timeBonus;
      expect(round2TotalScore).toBe(expectedTotal);

      mockNow2.mockRestore();
    });
  });
});
