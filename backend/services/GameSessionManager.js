/**
 * GameSessionManager - Manages multiplayer game session state
 *
 * Handles:
 * - Round state tracking
 * - Player guess collection
 * - Score calculation and aggregation
 * - Round completion detection
 * - Timer management
 */

import { calculateDistance } from '../utils/distance.js';
import { calculateScore } from '../utils/scoring.js';

/**
 * Represents a single multiplayer game session
 */
export class GameSession {
  /**
   * @param {string} roomCode - Room code for this session
   * @param {Array<{name: string, country: string, latitude: number, longitude: number}>} cities - Array of 5 cities for this game
   * @param {'easy'|'medium'|'hard'} difficulty - Game difficulty level
   * @param {number} timerDuration - Round timer duration in seconds (15, 30, 45, or 60)
   */
  constructor(roomCode, cities, difficulty, timerDuration = 30) {
    this.roomCode = roomCode;
    this.cities = cities; // Array of 5 cities
    this.difficulty = difficulty;
    this.timerDuration = timerDuration; // Configurable timer duration
    this.currentRound = 1;
    this.totalRounds = 5;

    // Round-specific state
    this.roundGuesses = new Map(); // Map<socketId, {guess, distance, score, timestamp}>
    this.roundStartTime = null;
    this.roundTimer = null; // setTimeout handle

    // Game-wide state
    this.playerScores = new Map(); // Map<socketId, {playerName, totalScore, roundScores: [], roundDistances: []}>
    this.playerData = new Map(); // Map<socketId, {id, name}>
  }

  /**
   * Initialize player data for the session
   * @param {Array<{id: string, name: string}>} players - Players in the room
   */
  initializePlayers(players) {
    players.forEach(player => {
      this.playerData.set(player.id, { id: player.id, name: player.name });
      this.playerScores.set(player.id, {
        playerName: player.name,
        totalScore: 0,
        roundScores: [],
        roundDistances: [],
      });
    });
  }

  /**
   * Start a new round
   * @returns {number} Server timestamp for round start
   */
  startRound() {
    this.roundStartTime = Date.now();
    this.roundGuesses.clear();
    return this.roundStartTime;
  }

  /**
   * Get the current target city
   * @returns {{name: string, country: string, latitude: number, longitude: number}}
   */
  getCurrentCity() {
    return this.cities[this.currentRound - 1];
  }

  /**
   * Add a guess for a player
   * @param {string} socketId - Player's socket ID
   * @param {{lat: number, lng: number}} guess - Player's guess coordinates
   * @param {number} timestamp - Client timestamp (for latency tracking)
   * @returns {{distance: number, score: number, isRoundComplete: boolean}} Guess result and completion status
   */
  addGuess(socketId, guess, timestamp) {
    const currentCity = this.getCurrentCity();

    // Calculate distance and score
    const distance = calculateDistance(
      guess.lat,
      guess.lng,
      currentCity.latitude,
      currentCity.longitude
    );

    // Map difficulty to level equivalent for scoring
    // easy = level 1, medium = level 5, hard = level 10
    const levelEquivalent = this.difficulty === 'easy' ? 1 : this.difficulty === 'hard' ? 10 : 5;

    const score = calculateScore(distance, currentCity.tier || 1, levelEquivalent);

    // Store guess data
    this.roundGuesses.set(socketId, {
      guess,
      distance,
      score,
      timestamp,
      submittedAt: Date.now(),
    });

    // Update player's total score and history
    const playerScore = this.playerScores.get(socketId);
    if (playerScore) {
      playerScore.totalScore += score;
      playerScore.roundScores.push(score);
      playerScore.roundDistances.push(distance);
    }

    // Check if round is complete
    const isRoundComplete = this.isRoundComplete();

    return {
      distance,
      score,
      isRoundComplete,
    };
  }

  /**
   * Check if all players have submitted guesses
   * @returns {boolean} True if round is complete
   */
  isRoundComplete() {
    const totalPlayers = this.playerData.size;
    const guessesSubmitted = this.roundGuesses.size;
    return guessesSubmitted >= totalPlayers;
  }

  /**
   * Auto-submit guesses for players who didn't submit in time
   */
  autoSubmitMissingGuesses() {
    this.playerData.forEach((player, socketId) => {
      if (!this.roundGuesses.has(socketId)) {
        // Auto-submit at (0, 0) with 0 score
        this.addGuess(socketId, { lat: 0, lng: 0 }, Date.now());
      }
    });
  }

  /**
   * Calculate results for the current round
   * @returns {Array<{playerId: string, playerName: string, guess: {lat: number, lng: number}, distance: number, score: number}>}
   */
  calculateRoundResults() {
    const results = [];

    this.roundGuesses.forEach((guessData, socketId) => {
      const player = this.playerData.get(socketId);
      if (player) {
        results.push({
          playerId: socketId,
          playerName: player.name,
          guess: guessData.guess,
          distance: guessData.distance,
          score: guessData.score,
        });
      }
    });

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Get current standings (cumulative scores)
   * @returns {Array<{playerId: string, playerName: string, totalScore: number}>}
   */
  getStandings() {
    const standings = [];

    this.playerScores.forEach((scoreData, socketId) => {
      standings.push({
        playerId: socketId,
        playerName: scoreData.playerName,
        totalScore: scoreData.totalScore,
      });
    });

    // Sort by total score (descending)
    standings.sort((a, b) => b.totalScore - a.totalScore);

    return standings;
  }

  /**
   * Advance to the next round
   * @returns {boolean} True if advanced, false if game is complete
   */
  advanceRound() {
    if (this.currentRound >= this.totalRounds) {
      return false; // Game complete
    }

    this.currentRound++;
    this.roundGuesses.clear();
    this.roundStartTime = null;

    return true;
  }

  /**
   * Get final standings with comprehensive statistics
   * @returns {{finalStandings: Array, winner: {playerId: string, playerName: string, totalScore: number}}}
   */
  getFinalStandings() {
    const finalStandings = [];

    this.playerScores.forEach((scoreData, socketId) => {
      const roundScores = scoreData.roundScores;
      const roundDistances = scoreData.roundDistances;

      // Calculate average distance
      const averageDistance = roundDistances.length > 0
        ? Math.round(roundDistances.reduce((sum, d) => sum + d, 0) / roundDistances.length)
        : 0;

      // Find best and worst rounds
      const bestRound = roundScores.length > 0
        ? Math.max(...roundScores)
        : 0;
      const worstRound = roundScores.length > 0
        ? Math.min(...roundScores)
        : 0;

      finalStandings.push({
        playerId: socketId,
        playerName: scoreData.playerName,
        totalScore: scoreData.totalScore,
        averageDistance,
        roundScores,
        bestRound,
        worstRound,
      });
    });

    // Sort by total score (descending)
    finalStandings.sort((a, b) => b.totalScore - a.totalScore);

    // Determine winner
    const winner = finalStandings.length > 0
      ? {
          playerId: finalStandings[0].playerId,
          playerName: finalStandings[0].playerName,
          totalScore: finalStandings[0].totalScore,
        }
      : null;

    return {
      finalStandings,
      winner,
    };
  }

  /**
   * Start the round timer
   * @param {Function} onTimerExpire - Callback when timer expires
   */
  startRoundTimer(onTimerExpire) {
    // Clear any existing timer
    this.clearRoundTimer();

    // Use configurable timerDuration instead of hardcoded 30 seconds
    this.roundTimer = setTimeout(() => {
      onTimerExpire();
    }, this.timerDuration * 1000);
  }

  /**
   * Clear the round timer
   */
  clearRoundTimer() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
  }

  /**
   * Clean up session resources
   */
  destroy() {
    this.clearRoundTimer();
    this.roundGuesses.clear();
    this.playerScores.clear();
    this.playerData.clear();
  }
}

/**
 * Manages all active game sessions
 */
export class GameSessionManager {
  constructor() {
    /**
     * Map of roomCode -> GameSession
     * @type {Map<string, GameSession>}
     */
    this.sessions = new Map();
  }

  /**
   * Create a new game session
   * @param {string} roomCode - Room code
   * @param {Array} cities - Array of 5 cities
   * @param {'easy'|'medium'|'hard'} difficulty - Difficulty level
   * @param {number} timerDuration - Timer duration in seconds
   * @param {Array<{id: string, name: string}>} players - Players in the room
   * @returns {GameSession} Created game session
   */
  createSession(roomCode, cities, difficulty, timerDuration, players) {
    const session = new GameSession(roomCode, cities, difficulty, timerDuration);
    session.initializePlayers(players);
    this.sessions.set(roomCode, session);
    return session;
  }

  /**
   * Get an existing game session
   * @param {string} roomCode - Room code
   * @returns {GameSession|null} Game session or null if not found
   */
  getSession(roomCode) {
    return this.sessions.get(roomCode) || null;
  }

  /**
   * Delete a game session
   * @param {string} roomCode - Room code
   */
  deleteSession(roomCode) {
    const session = this.sessions.get(roomCode);
    if (session) {
      session.destroy();
      this.sessions.delete(roomCode);
    }
  }

  /**
   * Check if a session exists
   * @param {string} roomCode - Room code
   * @returns {boolean}
   */
  hasSession(roomCode) {
    return this.sessions.has(roomCode);
  }

  /**
   * Get session statistics (for monitoring)
   * @returns {{totalSessions: number, activeSessions: Array<string>}}
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.keys()),
    };
  }
}

// Export singleton instance
export const gameSessionManager = new GameSessionManager();
