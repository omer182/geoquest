/**
 * GameSessionManager - Manages multiplayer game session state
 *
 * Handles:
 * - Round state tracking
 * - Player guess collection
 * - Score calculation and aggregation
 * - Time bonus scoring
 * - Round completion detection
 * - Timer management
 * - No-pin timeout handling
 * - Ready player tracking for continue button
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
    this.roundGuesses = new Map(); // Map<socketId, {guess, distance, score, timeBonus, timestamp, submittedAt}>
    this.roundStartTime = null;
    this.roundTimer = null; // setTimeout handle
    this.countdownInterval = null; // setInterval handle for auto-advance countdown

    // Game-wide state
    this.playerScores = new Map(); // Map<socketId, {playerName, totalScore, roundScores: [], roundDistances: []}>
    this.playerData = new Map(); // Map<socketId, {id, name}>

    // Continue button ready tracking
    this.readyPlayers = new Set(); // Set<socketId> - Players who clicked continue
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
    this.readyPlayers.clear(); // Reset ready players for new round
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
   * Calculate time bonus based on submission speed
   * @param {number} submittedAt - Timestamp when guess was submitted
   * @returns {number} Time bonus points (0-2000)
   */
  calculateTimeBonus(submittedAt) {
    if (!this.roundStartTime) {
      return 0;
    }

    const elapsedSeconds = (submittedAt - this.roundStartTime) / 1000;
    const remainingSeconds = Math.max(0, this.timerDuration - elapsedSeconds);

    // Formula: (remainingSeconds / totalRoundSeconds) * 2000
    // Maximum bonus: 2000 points for immediate submission
    // Minimum bonus: 0 points at timer expiration
    const timeBonus = Math.floor((remainingSeconds / this.timerDuration) * 2000);

    return timeBonus;
  }

  /**
   * Add a guess for a player
   * @param {string} socketId - Player's socket ID
   * @param {{lat: number, lng: number}} guess - Player's guess coordinates
   * @param {number} timestamp - Client timestamp (for latency tracking)
   * @returns {{distance: number, score: number, timeBonus: number, isRoundComplete: boolean}} Guess result and completion status
   */
  addGuess(socketId, guess, timestamp) {
    const currentCity = this.getCurrentCity();
    const submittedAt = Date.now();

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

    // Calculate time bonus based on submission speed
    const timeBonus = this.calculateTimeBonus(submittedAt);

    // Store guess data
    this.roundGuesses.set(socketId, {
      guess,
      distance,
      score,
      timeBonus,
      timestamp,
      submittedAt,
    });

    // Update player's total score and history (includes time bonus)
    const playerScore = this.playerScores.get(socketId);
    if (playerScore) {
      playerScore.totalScore += (score + timeBonus);
      playerScore.roundScores.push(score);
      playerScore.roundDistances.push(distance);
    }

    // Check if round is complete
    const isRoundComplete = this.isRoundComplete();

    return {
      distance,
      score,
      timeBonus,
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
   * Auto-submit default results for players who didn't submit in time
   * Assigns null distance, 0 score, and 0 time bonus for no-pin timeouts
   */
  autoSubmitMissingGuesses() {
    this.playerData.forEach((player, socketId) => {
      if (!this.roundGuesses.has(socketId)) {
        // Store default result for players who didn't submit
        this.roundGuesses.set(socketId, {
          guess: null,
          distance: null,
          score: 0,
          timeBonus: 0,
          timestamp: Date.now(),
          submittedAt: null,
        });

        // Update player scores with 0 points for this round
        const playerScore = this.playerScores.get(socketId);
        if (playerScore) {
          playerScore.roundScores.push(0);
          playerScore.roundDistances.push(null);
          // No change to totalScore (0 + 0 = 0)
        }
      }
    });
  }

  /**
   * Calculate results for the current round
   * @returns {Array<{playerId: string, playerName: string, guess: {lat: number, lng: number}|null, distance: number|null, score: number, timeBonus: number, totalScore: number}>}
   */
  calculateRoundResults() {
    const results = [];

    this.roundGuesses.forEach((guessData, socketId) => {
      const player = this.playerData.get(socketId);
      const playerScore = this.playerScores.get(socketId);
      if (player) {
        results.push({
          playerId: socketId,
          playerName: player.name,
          guess: guessData.guess,
          distance: guessData.distance,
          score: guessData.score,
          timeBonus: guessData.timeBonus,
          totalScore: playerScore?.totalScore || 0, // Include cumulative total score with time bonus
        });
      }
    });

    // Sort by round score + time bonus (descending)
    results.sort((a, b) => (b.score + b.timeBonus) - (a.score + a.timeBonus));

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
    this.readyPlayers.clear(); // Reset ready players for new round

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

      // Calculate average distance (excluding null values from no-pin timeouts)
      const validDistances = roundDistances.filter(d => d !== null);
      const averageDistance = validDistances.length > 0
        ? Math.round(validDistances.reduce((sum, d) => sum + d, 0) / validDistances.length)
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
   * Mark a player as ready for the next round (continue button)
   * @param {string} socketId - Player's socket ID
   * @returns {boolean} True if player was added, false if already ready
   */
  markPlayerReady(socketId) {
    if (this.readyPlayers.has(socketId)) {
      return false; // Already ready
    }
    this.readyPlayers.add(socketId);
    return true;
  }

  /**
   * Check if all players are ready to advance
   * @returns {boolean} True if all players clicked continue
   */
  areAllPlayersReady() {
    const totalPlayers = this.playerData.size;
    const readyCount = this.readyPlayers.size;
    return readyCount >= totalPlayers && totalPlayers > 0;
  }

  /**
   * Get the number of ready players
   * @returns {{readyCount: number, totalPlayers: number}}
   */
  getReadyStatus() {
    return {
      readyCount: this.readyPlayers.size,
      totalPlayers: this.playerData.size,
    };
  }

  /**
   * Reset ready players (called when advancing to next round)
   */
  resetReadyPlayers() {
    this.readyPlayers.clear();
  }

  /**
   * Start the round timer
   * @param {Function} onTimerExpire - Callback when timer expires
   * @param {number} [customDuration] - Optional custom duration in seconds (overrides default)
   */
  startRoundTimer(onTimerExpire, customDuration) {
    // Clear any existing timer
    this.clearRoundTimer();

    // Use custom duration if provided, otherwise use default timerDuration
    const duration = customDuration !== undefined ? customDuration : this.timerDuration;

    this.roundTimer = setTimeout(() => {
      onTimerExpire();
    }, duration * 1000);
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
   * Clear the countdown interval
   */
  clearCountdownInterval() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Clean up session resources
   */
  destroy() {
    this.clearRoundTimer();
    this.clearCountdownInterval();
    this.roundGuesses.clear();
    this.playerScores.clear();
    this.playerData.clear();
    this.readyPlayers.clear();
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
