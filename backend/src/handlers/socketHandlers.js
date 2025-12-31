/**
 * Socket.IO Event Handlers
 *
 * Handles all WebSocket events for multiplayer functionality.
 */

import { roomManager } from '../../services/RoomManager.js';
import { SOCKET_EVENTS } from '../../types/socket-events.js';
import { gameSessionManager } from '../../services/GameSessionManager.js';
import { selectRandomCities } from '../../data/cities.js';

/**
 * Register all socket event handlers for a socket connection
 * @param {import('socket.io').Socket} socket - Socket.IO socket instance
 * @param {import('socket.io').Server} io - Socket.IO server instance
 */
export function registerSocketHandlers(socket, io) {
  const isDev = process.env.NODE_ENV !== 'production';

  // ============================================
  // Connection Health Monitoring
  // ============================================

  /**
   * Handle heartbeat ping
   */
  socket.on(SOCKET_EVENTS.PING, (payload) => {
    if (isDev) {
      console.log(`[Socket] Received ping from ${socket.id}`);
    }

    // Update session activity
    roomManager.updateSessionActivity(socket.id);

    // Send pong response
    socket.emit(SOCKET_EVENTS.PONG, {
      timestamp: payload?.timestamp || Date.now(),
      serverTime: Date.now(),
    });
  });

  // ============================================
  // Room Management
  // ============================================

  /**
   * Handle room creation
   */
  socket.on(SOCKET_EVENTS.CREATE_ROOM, (request, callback) => {
    try {
      if (!request?.playerName) {
        throw { code: 'VALIDATION_ERROR', message: 'Player name is required' };
      }

      const room = roomManager.createRoom(
        request.playerName,
        socket.id,
        request.maxPlayers || 2
      );

      const player = room.players[0];

      // Join Socket.IO room
      socket.join(room.code);

      console.log(`[Socket] Room created: ${room.code} by ${socket.id} (${player.name})`);

      // Send response to creator
      const response = { room, player };
      if (callback) {
        callback({ success: true, data: response });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_CREATED, response);
      }
    } catch (error) {
      console.error(`[Socket] Error creating room:`, error);
      const errorResponse = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to create room',
      };

      if (callback) {
        callback({ success: false, error: errorResponse });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, errorResponse);
      }
    }
  });

  /**
   * Handle joining a room
   */
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (request, callback) => {
    try {
      if (!request?.roomCode || !request?.playerName) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Room code and player name are required',
        };
      }

      const { room, player } = roomManager.joinRoom(
        request.roomCode,
        request.playerName,
        socket.id
      );

      // Join Socket.IO room
      socket.join(room.code);

      console.log(
        `[Socket] Player ${socket.id} (${player.name}) joined room ${room.code}`
      );

      // Notify existing players
      socket.to(room.code).emit(SOCKET_EVENTS.PLAYER_JOINED, {
        player,
        room,
      });

      // Send response to joiner
      const response = { room, player };
      if (callback) {
        callback({ success: true, data: response });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_JOINED, response);
      }

      // Broadcast updated room state
      io.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
    } catch (error) {
      console.error(`[Socket] Error joining room:`, error);
      const errorResponse = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to join room',
      };

      if (callback) {
        callback({ success: false, error: errorResponse });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, errorResponse);
      }
    }
  });

  /**
   * Handle leaving a room
   */
  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (request, callback) => {
    try {
      if (!request?.roomCode) {
        throw { code: 'VALIDATION_ERROR', message: 'Room code is required' };
      }

      const { room, wasHost } = roomManager.leaveRoom(request.roomCode, socket.id);

      // Clean up game session if exists
      if (gameSessionManager.hasSession(request.roomCode)) {
        gameSessionManager.deleteSession(request.roomCode);
      }

      // Leave Socket.IO room
      socket.leave(request.roomCode);

      console.log(`[Socket] Player ${socket.id} left room ${request.roomCode}`);

      // Notify remaining players
      if (room) {
        socket.to(request.roomCode).emit(SOCKET_EVENTS.PLAYER_LEFT, {
          playerId: socket.id,
          room,
        });

        io.to(request.roomCode).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
      }

      if (callback) {
        callback({ success: true, data: { wasHost, room } });
      }
    } catch (error) {
      console.error(`[Socket] Error leaving room:`, error);
      const errorResponse = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to leave room',
      };

      if (callback) {
        callback({ success: false, error: errorResponse });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, errorResponse);
      }
    }
  });

  /**
   * Handle player ready status change
   */
  socket.on(SOCKET_EVENTS.PLAYER_READY, (request, callback) => {
    try {
      if (!request?.roomCode || typeof request?.isReady !== 'boolean') {
        throw { code: 'VALIDATION_ERROR', message: 'Invalid ready request' };
      }

      const room = roomManager.setPlayerReady(request.roomCode, socket.id, request.isReady);

      console.log(
        `[Socket] Player ${socket.id} ready status: ${request.isReady} in room ${request.roomCode}`
      );

      // Broadcast to all players in room
      io.to(request.roomCode).emit(SOCKET_EVENTS.PLAYER_READY_CHANGED, {
        playerId: socket.id,
        isReady: request.isReady,
        room,
      });

      io.to(request.roomCode).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });

      if (callback) {
        callback({ success: true, data: { room } });
      }
    } catch (error) {
      console.error(`[Socket] Error updating ready status:`, error);
      const errorResponse = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to update ready status',
      };

      if (callback) {
        callback({ success: false, error: errorResponse });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, errorResponse);
      }
    }
  });

  // ============================================
  // Game Logic
  // ============================================

  /**
   * Handle game start
   */
  socket.on(SOCKET_EVENTS.GAME_START, (request, callback) => {
    try {
      if (!request?.roomCode) {
        throw { code: 'VALIDATION_ERROR', message: 'Room code is required' };
      }

      const room = roomManager.getRoom(request.roomCode);

      if (!room) {
        throw { code: 'ROOM_NOT_FOUND', message: 'Room not found' };
      }

      // Verify the requester is the host
      const player = room.players.find((p) => p.id === socket.id);
      if (!player || !player.isHost) {
        throw { code: 'UNAUTHORIZED', message: 'Only the host can start the game' };
      }

      // Verify all players are ready
      const allReady = room.players.every((p) => p.isReady);
      if (!allReady) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'All players must be ready before starting',
        };
      }

      // Validate timer duration
      const timerDuration = request.timerDuration || 30;
      if (![15, 30, 45, 60].includes(timerDuration)) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Timer duration must be 15, 30, 45, or 60 seconds',
        };
      }

      // Select cities based on difficulty
      const difficulty = request.difficulty || 'medium';
      const cities = selectRandomCities(difficulty, 5);

      if (cities.length < 5) {
        throw {
          code: 'INTERNAL_ERROR',
          message: 'Failed to select sufficient cities for game',
        };
      }

      // Create game session
      const gameSession = gameSessionManager.createSession(
        request.roomCode,
        cities,
        difficulty,
        timerDuration,
        room.players
      );

      // Update room status to 'playing'
      room.status = 'playing';

      // Store game settings for rematch
      room.lastDifficulty = difficulty;
      room.lastTimerDuration = timerDuration;

      console.log(
        `[Socket] Game starting in room ${request.roomCode} with difficulty: ${difficulty}, timer: ${timerDuration}s`
      );

      // Broadcast game start to all players in the room with cities
      io.to(request.roomCode).emit('game:started', {
        roomCode: request.roomCode,
        difficulty,
        timerDuration,
        cities: cities.map(c => ({
          name: c.name,
          country: c.country,
          latitude: c.latitude,
          longitude: c.longitude,
        })),
        roundNumber: 1,
        totalRounds: 5,
      });

      // Start first round immediately
      const startTime = gameSession.startRound();

      // Emit round:started after a short delay to ensure clients are ready
      setTimeout(() => {
        const currentCity = gameSession.getCurrentCity();
        const currentRound = 1;

        io.to(request.roomCode).emit('round:started', {
          roomCode: request.roomCode,
          roundNumber: currentRound,
          cityTarget: {
            name: currentCity.name,
            country: currentCity.country,
          },
          startTime,
          timerDuration: timerDuration,
        });

        // Start server-side timer for auto-completion
        gameSession.startRoundTimer(() => {
          handleRoundTimerExpiration(io, request.roomCode, gameSession);
        }, timerDuration);
      }, 100);

      if (callback) {
        callback({ success: true, data: { room } });
      }
    } catch (error) {
      console.error(`[Socket] Error starting game:`, error);
      const errorResponse = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to start game',
      };

      if (callback) {
        callback({ success: false, error: errorResponse });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, errorResponse);
      }
    }
  });

  /**
   * Handle guess submission
   */
  socket.on(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, (request, callback) => {
    try {
      if (!request?.roomCode || !request?.guess) {
        throw { code: 'VALIDATION_ERROR', message: 'Room code and guess are required' };
      }

      const gameSession = gameSessionManager.getSession(request.roomCode);

      if (!gameSession) {
        throw { code: 'GAME_NOT_FOUND', message: 'Game session not found' };
      }

      // Add guess to session
      const result = gameSession.addGuess(
        socket.id,
        request.guess,
        request.timestamp || Date.now()
      );

      console.log(
        `[Socket] Player ${socket.id} submitted guess in room ${request.roomCode}: ${result.distance}km, ${result.score} points`
      );

      // Broadcast that player has guessed (without revealing guess location)
      const playerData = gameSession.playerData.get(socket.id);
      io.to(request.roomCode).emit('player:guessed', {
        playerId: socket.id,
        playerName: playerData?.name || 'Unknown',
        hasGuessed: true,
      });

      // Check if round is complete (all players guessed)
      if (result.isRoundComplete) {
        console.log(`[Socket] All players guessed in room ${request.roomCode}, showing results immediately`);

        // Clear the timer since all players submitted
        gameSession.clearRoundTimer();

        // Emit round complete immediately
        emitRoundComplete(io, request.roomCode, gameSession);
      }

      if (callback) {
        callback({
          success: true,
          data: {
            distance: result.distance,
            score: result.score,
          },
        });
      }
    } catch (error) {
      console.error(`[Socket] Error submitting guess:`, error);
      const errorResponse = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to submit guess',
      };

      if (callback) {
        callback({ success: false, error: errorResponse });
      }
    }
  });

  /**
   * Handle rematch request
   */
  socket.on('game:rematchRequest', (request, callback) => {
    try {
      if (!request?.roomCode) {
        throw { code: 'VALIDATION_ERROR', message: 'Room code is required' };
      }

      const room = roomManager.getRoom(request.roomCode);

      if (!room) {
        throw { code: 'ROOM_NOT_FOUND', message: 'Room not found' };
      }

      // Track rematch requests in room metadata
      if (!room.rematchRequests) {
        room.rematchRequests = new Set();
      }

      room.rematchRequests.add(socket.id);

      console.log(
        `[Socket] Player ${socket.id} requested rematch in room ${request.roomCode} (${room.rematchRequests.size}/${room.players.length})`
      );

      // Broadcast updated rematch status
      io.to(request.roomCode).emit('rematch:statusUpdated', {
        playersReady: Array.from(room.rematchRequests),
        totalPlayers: room.players.length,
      });

      // Check if all players want rematch
      if (room.rematchRequests.size >= room.players.length) {
        // Prevent duplicate countdowns
        if (room.rematchCountdownActive) {
          console.log(`[Socket] Countdown already active for room ${request.roomCode}, ignoring duplicate request`);
          return;
        }

        console.log(`[Socket] All players want rematch in room ${request.roomCode}, starting 10-second countdown...`);

        // Mark countdown as active
        room.rematchCountdownActive = true;

        // Clear any existing interval
        if (room.rematchInterval) {
          clearInterval(room.rematchInterval);
        }

        // Start 10-second countdown
        let countdown = 10;

        // Emit initial countdown
        io.to(request.roomCode).emit('rematch:countdownStarted', {
          countdown,
        });
        console.log(`[Socket] Countdown tick: ${countdown}s`);

        room.rematchInterval = setInterval(() => {
          countdown--;
          console.log(`[Socket] Countdown tick: ${countdown}s`);

          if (countdown > 0) {
            io.to(request.roomCode).emit('rematch:countdownTick', {
              countdown,
            });
          } else {
            clearInterval(room.rematchInterval);
            room.rematchInterval = null;
            room.rematchCountdownActive = false;

            console.log(`[Socket] Countdown finished, auto-starting new game in room ${request.roomCode}`);

            // Clean up old game session
            if (gameSessionManager.hasSession(request.roomCode)) {
              gameSessionManager.deleteSession(request.roomCode);
            }

            // Reset room state
            room.status = 'playing';
            room.rematchRequests.clear();
            room.players.forEach((p) => {
              p.isReady = true; // Mark all as ready for auto-start
            });

            // Get game settings from room metadata (or use defaults)
            const difficulty = room.lastDifficulty || 'medium';
            const timerDuration = room.lastTimerDuration || 30;

            // Select new cities
            const cities = selectRandomCities(difficulty, 5);

            // Create new game session
            const gameSession = gameSessionManager.createSession(
              request.roomCode,
              cities,
              difficulty,
              timerDuration,
              room.players
            );

            console.log(
              `[Socket] Auto-starting game in room ${request.roomCode} with difficulty: ${difficulty}, timer: ${timerDuration}s`
            );

            // Broadcast game start to all players
            io.to(request.roomCode).emit('game:started', {
              roomCode: request.roomCode,
              difficulty,
              timerDuration,
              cities: cities.map(c => ({
                name: c.name,
                country: c.country,
                latitude: c.latitude,
                longitude: c.longitude,
              })),
              roundNumber: 1,
              totalRounds: 5,
            });

            // Start first round immediately
            const startTime = gameSession.startRound();

            const currentRound = 1;

            // Broadcast round start with timer
            io.to(request.roomCode).emit('game:roundStarted', {
              roundNumber: currentRound,
              totalRounds: 5,
              city: {
                name: cities[currentRound - 1].name,
                country: cities[currentRound - 1].country,
              },
              startTime,
              timerDuration: timerDuration,
            });
          }
        }, 1000);
      }

      if (callback) {
        callback({ success: true });
      }
    } catch (error) {
      console.error(`[Socket] Error handling rematch request:`, error);
      if (callback) {
        callback({
          success: false,
          error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'Failed to process rematch request',
          },
        });
      }
    }
  });

  /**
   * Handle session restoration for reconnection
   */
  socket.on(SOCKET_EVENTS.RESTORE_SESSION, (request, callback) => {
    try {
      if (!request?.previousSocketId || !request?.roomCode) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Previous socket ID and room code are required',
        };
      }

      const result = roomManager.restoreSession(
        request.previousSocketId,
        socket.id,
        request.roomCode
      );

      if (!result) {
        throw {
          code: 'UNAUTHORIZED',
          message: 'Session not found or expired',
        };
      }

      const { room, player } = result;

      // Join Socket.IO room
      socket.join(room.code);

      console.log(
        `[Socket] Session restored for ${socket.id} (was ${request.previousSocketId}) in room ${room.code}`
      );

      // Broadcast to other players that player reconnected
      socket.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });

      // Send response to reconnected player
      const response = { room, player, reconnected: true };
      if (callback) {
        callback({ success: true, data: response });
      } else {
        socket.emit(SOCKET_EVENTS.SESSION_RESTORED, response);
      }
    } catch (error) {
      console.error(`[Socket] Error restoring session:`, error);
      const errorResponse = {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to restore session',
      };

      if (callback) {
        callback({ success: false, error: errorResponse });
      } else {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, errorResponse);
      }
    }
  });

  // ============================================
  // Disconnection Handling
  // ============================================

  /**
   * Handle disconnection
   */
  socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);

    // Get session to find room
    const session = roomManager.getSession(socket.id);

    if (session) {
      const room = roomManager.getRoom(session.roomCode);

      // Don't immediately remove player - keep session for potential reconnection
      console.log(
        `[Socket] Player ${socket.id} disconnected from room ${session.roomCode}, session preserved for reconnection`
      );

      // Notify other players about disconnection (but player stays in room)
      if (room) {
        // Check if game is in progress
        const gameSession = gameSessionManager.getSession(session.roomCode);
        if (gameSession && room.status === 'playing') {
          // Notify with toast during active game
          socket.to(session.roomCode).emit('player:disconnected', {
            playerId: socket.id,
            playerName: session.player.name,
          });
        } else if (room.status === 'finished') {
          // Notify with modal during final results
          socket.to(session.roomCode).emit('game:playerLeftResults', {
            playerId: socket.id,
            playerName: session.player.name,
          });
        }

        socket.to(session.roomCode).emit(SOCKET_EVENTS.ROOM_UPDATED, { room });
      }
    }
  });
}

/**
 * Helper: Emit round complete event
 */
function emitRoundComplete(io, roomCode, gameSession) {
  // Auto-submit any missing guesses
  gameSession.autoSubmitMissingGuesses();

  // Calculate results
  const roundResults = gameSession.calculateRoundResults();
  const standings = gameSession.getStandings();
  const currentCity = gameSession.getCurrentCity();

  // Emit round complete
  io.to(roomCode).emit(SOCKET_EVENTS.GAME_ROUND_COMPLETE, {
    roundNumber: gameSession.currentRound,
    targetCity: {
      name: currentCity.name,
      country: currentCity.country,
      lat: currentCity.latitude,
      lng: currentCity.longitude,
    },
    results: roundResults,
    standings,
  });

  // Start 10-second countdown before next round
  startAutoAdvanceCountdown(io, roomCode, gameSession);
}

/**
 * Helper: Start countdown for auto-advance
 */
function startAutoAdvanceCountdown(io, roomCode, gameSession) {
  // Use 5 seconds for final round, 10 seconds for other rounds
  let countdown = gameSession.currentRound >= gameSession.totalRounds ? 5 : 10;

  const countdownInterval = setInterval(() => {
    io.to(roomCode).emit('countdown:tick', {
      roundNumber: gameSession.currentRound,
      remainingSeconds: countdown,
    });

    countdown--;

    if (countdown < 0) {
      clearInterval(countdownInterval);

      // Check if game is complete
      if (gameSession.currentRound >= gameSession.totalRounds) {
        // Game complete
        const { finalStandings, winner } = gameSession.getFinalStandings();

        io.to(roomCode).emit(SOCKET_EVENTS.GAME_COMPLETE, {
          roomCode,
          finalStandings,
          winner,
        });

        // Update room status
        const room = roomManager.getRoom(roomCode);
        if (room) {
          room.status = 'finished';
        }
      } else {
        // Advance to next round
        gameSession.advanceRound();
        const startTime = gameSession.startRound();
        const currentCity = gameSession.getCurrentCity();

        io.to(roomCode).emit('round:started', {
          roomCode,
          roundNumber: gameSession.currentRound,
          cityTarget: {
            name: currentCity.name,
            country: currentCity.country,
          },
          startTime,
          timerDuration: gameSession.timerDuration,
        });

        // Start round timer - all rounds use the configured timer duration
        gameSession.startRoundTimer(() => {
          handleRoundTimerExpiration(io, roomCode, gameSession);
        }, gameSession.timerDuration);
      }
    }
  }, 1000);
}

/**
 * Helper: Handle round timer expiration
 */
function handleRoundTimerExpiration(io, roomCode, gameSession) {
  console.log(`[Socket] Round timer expired in room ${roomCode}`);

  // Auto-submit missing guesses and emit round complete
  emitRoundComplete(io, roomCode, gameSession);
}

/**
 * Get room manager statistics (for monitoring)
 * @returns {Object} Statistics object
 */
export function getRoomStats() {
  return roomManager.getStats();
}

/**
 * Get game session manager statistics (for monitoring)
 * @returns {Object} Statistics object
 */
export function getGameStats() {
  return gameSessionManager.getStats();
}
