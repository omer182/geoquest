/**
 * GameSessionManager - 5 Player Tests
 *
 * Tests game session management with 5 players including:
 * - Session creation with 5 players
 * - Round completion with all 5 players submitting
 * - Score calculation and standings for 5 players
 * - Auto-submit for missing guesses in 5-player game
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameSessionManager } from '../services/GameSessionManager.js';

describe('GameSessionManager - 5 Player Support', () => {
  let sessionManager;
  let mockCities;
  let mockPlayers5;

  beforeEach(() => {
    sessionManager = new GameSessionManager();
    mockCities = [
      { name: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.006 },
      { name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 },
      { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
      { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
      { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093 },
    ];
    mockPlayers5 = [
      { id: 'player1', name: 'Alice' },
      { id: 'player2', name: 'Bob' },
      { id: 'player3', name: 'Charlie' },
      { id: 'player4', name: 'Diana' },
      { id: 'player5', name: 'Eve' },
    ];
  });

  afterEach(() => {
    // Clean up all sessions
    sessionManager.sessions.forEach((session) => session.destroy());
    sessionManager.sessions.clear();
  });

  describe('5-Player Session Creation', () => {
    it('should create session with 5 players and initialize all player data', () => {
      const session = sessionManager.createSession('TEST123', mockCities, 'medium', 30, mockPlayers5);

      expect(session.playerData.size).toBe(5);
      expect(session.playerScores.size).toBe(5);

      // Verify all 5 players are initialized
      mockPlayers5.forEach((player) => {
        const playerScore = session.playerScores.get(player.id);
        expect(playerScore).toBeDefined();
        expect(playerScore.playerName).toBe(player.name);
        expect(playerScore.totalScore).toBe(0);
        expect(playerScore.roundScores).toEqual([]);
      });
    });
  });

  describe('5-Player Round Completion', () => {
    it('should detect round complete only when all 5 players submit', () => {
      const session = sessionManager.createSession('TEST123', mockCities, 'medium', 30, mockPlayers5);
      session.startRound();

      // Submit guesses for first 4 players
      const result1 = session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now());
      expect(result1.isRoundComplete).toBe(false);

      const result2 = session.addGuess('player2', { lat: 40.7130, lng: -74.0060 }, Date.now());
      expect(result2.isRoundComplete).toBe(false);

      const result3 = session.addGuess('player3', { lat: 40.7130, lng: -74.0060 }, Date.now());
      expect(result3.isRoundComplete).toBe(false);

      const result4 = session.addGuess('player4', { lat: 40.7130, lng: -74.0060 }, Date.now());
      expect(result4.isRoundComplete).toBe(false);

      // Submit 5th player guess - should complete round
      const result5 = session.addGuess('player5', { lat: 40.7130, lng: -74.0060 }, Date.now());
      expect(result5.isRoundComplete).toBe(true);
    });

    it('should calculate correct round results for all 5 players', () => {
      const session = sessionManager.createSession('TEST123', mockCities, 'medium', 30, mockPlayers5);
      session.startRound();

      // Submit different guesses for each player
      session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now()); // Very close
      session.addGuess('player2', { lat: 40.8, lng: -74.1 }, Date.now()); // Close
      session.addGuess('player3', { lat: 41.0, lng: -74.5 }, Date.now()); // Medium
      session.addGuess('player4', { lat: 42.0, lng: -75.0 }, Date.now()); // Far
      session.addGuess('player5', { lat: 45.0, lng: -80.0 }, Date.now()); // Very far

      const results = session.calculateRoundResults();
      expect(results).toHaveLength(5);

      // Verify results are sorted by score (descending)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }

      // Verify all player IDs are present
      const playerIds = results.map(r => r.playerId);
      expect(playerIds).toContain('player1');
      expect(playerIds).toContain('player2');
      expect(playerIds).toContain('player3');
      expect(playerIds).toContain('player4');
      expect(playerIds).toContain('player5');
    });
  });

  describe('5-Player Auto-Submit', () => {
    it('should auto-submit missing guesses for players who did not submit', () => {
      const session = sessionManager.createSession('TEST123', mockCities, 'medium', 30, mockPlayers5);
      session.startRound();

      // Only 3 players submit
      session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now());
      session.addGuess('player2', { lat: 40.7130, lng: -74.0060 }, Date.now());
      session.addGuess('player3', { lat: 40.7130, lng: -74.0060 }, Date.now());

      // Auto-submit for players 4 and 5
      session.autoSubmitMissingGuesses();

      const results = session.calculateRoundResults();
      expect(results).toHaveLength(5);

      // Find results for non-submitting players
      const player4Result = results.find(r => r.playerId === 'player4');
      const player5Result = results.find(r => r.playerId === 'player5');

      // Auto-submitted guesses should have {0,0} coordinates
      expect(player4Result.guess).toEqual({ lat: 0, lng: 0 });
      expect(player5Result.guess).toEqual({ lat: 0, lng: 0 });

      // Auto-submitted guesses will have low scores based on distance from {0,0} to target
      // Just verify they have lower scores than the players who actually guessed
      const player1Result = results.find(r => r.playerId === 'player1');
      expect(player4Result.score).toBeLessThan(player1Result.score);
      expect(player5Result.score).toBeLessThan(player1Result.score);
    });
  });

  describe('5-Player Final Standings', () => {
    it('should generate final standings for all 5 players after 5 rounds', () => {
      const session = sessionManager.createSession('TEST123', mockCities, 'medium', 30, mockPlayers5);

      // Play 5 rounds with different scores for each player
      for (let round = 1; round <= 5; round++) {
        session.startRound();

        // Player 1 gets best scores
        session.addGuess('player1', { lat: 40.7130, lng: -74.0060 }, Date.now());
        // Player 2 gets second best
        session.addGuess('player2', { lat: 40.8, lng: -74.1 }, Date.now());
        // Player 3 gets medium scores
        session.addGuess('player3', { lat: 41.0, lng: -74.5 }, Date.now());
        // Player 4 gets lower scores
        session.addGuess('player4', { lat: 42.0, lng: -75.0 }, Date.now());
        // Player 5 gets lowest scores
        session.addGuess('player5', { lat: 45.0, lng: -80.0 }, Date.now());

        if (round < 5) session.advanceRound();
      }

      const { finalStandings, winner } = session.getFinalStandings();

      expect(finalStandings).toHaveLength(5);

      // Verify standings are sorted by total score
      for (let i = 0; i < finalStandings.length - 1; i++) {
        expect(finalStandings[i].totalScore).toBeGreaterThanOrEqual(finalStandings[i + 1].totalScore);
      }

      // Verify winner is the player with highest score
      expect(winner.playerId).toBe(finalStandings[0].playerId);
      expect(winner.totalScore).toBe(finalStandings[0].totalScore);

      // Verify all players have complete statistics
      finalStandings.forEach((standing) => {
        expect(standing).toHaveProperty('playerName');
        expect(standing).toHaveProperty('totalScore');
        expect(standing).toHaveProperty('averageDistance');
        expect(standing).toHaveProperty('roundScores');
        expect(standing.roundScores).toHaveLength(5);
      });
    });

    it('should correctly rank all 5 players by total score', () => {
      const session = sessionManager.createSession('TEST123', mockCities, 'medium', 30, mockPlayers5);

      // Play 5 rounds
      for (let round = 1; round <= 5; round++) {
        session.startRound();
        mockPlayers5.forEach((player) => {
          session.addGuess(player.id, { lat: 40.7130, lng: -74.0060 }, Date.now());
        });
        if (round < 5) session.advanceRound();
      }

      const { finalStandings } = session.getFinalStandings();

      // Verify all 5 players are in standings
      expect(finalStandings).toHaveLength(5);

      // Verify player names match
      const playerNames = finalStandings.map(s => s.playerName);
      expect(playerNames).toContain('Alice');
      expect(playerNames).toContain('Bob');
      expect(playerNames).toContain('Charlie');
      expect(playerNames).toContain('Diana');
      expect(playerNames).toContain('Eve');
    });
  });

  describe('5-Player Score Tracking', () => {
    it('should track cumulative scores for all 5 players across multiple rounds', () => {
      const session = sessionManager.createSession('TEST123', mockCities, 'medium', 30, mockPlayers5);

      // Round 1
      session.startRound();
      mockPlayers5.forEach((player) => {
        session.addGuess(player.id, { lat: 40.7130, lng: -74.0060 }, Date.now());
      });

      // Round 2
      session.advanceRound();
      session.startRound();
      mockPlayers5.forEach((player) => {
        session.addGuess(player.id, { lat: 51.5, lng: -0.1 }, Date.now());
      });

      // Round 3
      session.advanceRound();
      session.startRound();
      mockPlayers5.forEach((player) => {
        session.addGuess(player.id, { lat: 35.7, lng: 139.7 }, Date.now());
      });

      const standings = session.getStandings();
      expect(standings).toHaveLength(5);

      // All players should have positive cumulative scores
      standings.forEach((standing) => {
        expect(standing.totalScore).toBeGreaterThan(0);
        expect(standing.playerName).toBeTruthy();
      });
    });
  });
});
