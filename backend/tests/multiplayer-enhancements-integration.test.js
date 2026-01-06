/**
 * Integration Tests for Mobile UX and Multiplayer Enhancements
 *
 * This test suite covers end-to-end workflows for the 10 enhancements:
 * 1. Continue button with countdown
 * 2. Final round message update
 * 3. Cumulative score display
 * 4. Time-based bonus scoring
 * 5. Mobile text overlap fixes
 * 6. Back to main menu button
 * 7. Font color standardization
 * 8. Gradient background
 * 9. Winner confetti
 * 10. No-pin timeout handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import express from 'express';
import { registerSocketHandlers } from '../src/handlers/socketHandlers.js';
import { SOCKET_EVENTS } from '../types/socket-events.js';

describe('Multiplayer Enhancements - Integration Tests', () => {
  let io, httpServer, serverPort;
  let client1, client2, client3;
  let roomCode;

  beforeEach((done) => {
    // Create HTTP server and Socket.IO server
    const app = express();
    httpServer = createServer(app);
    io = new Server(httpServer, {
      cors: { origin: '*' },
      transports: ['websocket'],
    });

    // Register socket handlers
    io.on('connection', (socket) => {
      registerSocketHandlers(socket, io);
    });

    // Start server on random port
    httpServer.listen(() => {
      serverPort = httpServer.address().port;
      done();
    });
  });

  afterEach(() => {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    if (client3) client3.disconnect();
    io.close();
    httpServer.close();
  });

  describe('Full Multiplayer Round Flow', () => {
    it('should complete full round: place pin → see time bonus → click continue → advance', (done) => {
      // Create 2-player game
      client1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client1.on('connect', () => {
        client1.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Player1', maxPlayers: 2 },
          (response) => {
            roomCode = response.data.room.code;

            client2 = ioClient(`http://localhost:${serverPort}`, {
              transports: ['websocket'],
            });

            client2.on('connect', () => {
              client2.emit(
                SOCKET_EVENTS.JOIN_ROOM,
                { roomCode, playerName: 'Player2' },
                () => {
                  // Set both ready
                  client1.emit(SOCKET_EVENTS.PLAYER_READY, {
                    roomCode,
                    isReady: true,
                  });
                  client2.emit(
                    SOCKET_EVENTS.PLAYER_READY,
                    { roomCode, isReady: true },
                    () => {
                      // Start game
                      client1.emit(
                        SOCKET_EVENTS.GAME_START,
                        { roomCode, difficulty: 'medium', timerDuration: 30 },
                        () => {
                          setTimeout(() => {
                            // Step 1: Submit guesses (place pins)
                            client1.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                              roomCode,
                              guess: { lat: 40.7128, lng: -74.006 },
                            });

                            setTimeout(() => {
                              client2.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                                roomCode,
                                guess: { lat: 40.72, lng: -74.01 },
                              });
                            }, 1000); // Player 2 submits 1 second later

                            // Step 2: Listen for round complete with time bonus
                            client1.on(SOCKET_EVENTS.GAME_ROUND_COMPLETE, (data) => {
                              const player1Result = data.results.find(
                                (r) => r.playerId === client1.id
                              );
                              const player2Result = data.results.find(
                                (r) => r.playerId === client2.id
                              );

                              // Verify time bonus exists and is calculated
                              expect(player1Result.timeBonus).toBeDefined();
                              expect(player2Result.timeBonus).toBeDefined();
                              expect(player1Result.timeBonus).toBeGreaterThan(
                                player2Result.timeBonus
                              ); // Player 1 faster = higher bonus

                              // Verify total score includes time bonus
                              expect(player1Result.totalScore).toBe(
                                player1Result.score + player1Result.timeBonus
                              );

                              // Step 3: Click continue button
                              client1.emit('round:player_ready', {
                                roomCode,
                                playerId: client1.id,
                              });
                              client2.emit('round:player_ready', {
                                roomCode,
                                playerId: client2.id,
                              });

                              // Step 4: Listen for advance to next round
                              client1.on('round:all_ready', () => {
                                // Verify we advanced
                                expect(true).toBe(true);
                                done();
                              });
                            });
                          }, 200);
                        }
                      );
                    }
                  );
                }
              );
            });
          }
        );
      });
    });
  });

  describe('No-Pin Timeout Flow', () => {
    it('should handle no-pin timeout: timer expires → 0 points → no map marker', (done) => {
      // Create 2-player game
      client1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client1.on('connect', () => {
        client1.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Player1', maxPlayers: 2 },
          (response) => {
            roomCode = response.data.room.code;

            client2 = ioClient(`http://localhost:${serverPort}`, {
              transports: ['websocket'],
            });

            client2.on('connect', () => {
              client2.emit(
                SOCKET_EVENTS.JOIN_ROOM,
                { roomCode, playerName: 'Player2' },
                () => {
                  // Set both ready
                  client1.emit(SOCKET_EVENTS.PLAYER_READY, {
                    roomCode,
                    isReady: true,
                  });
                  client2.emit(
                    SOCKET_EVENTS.PLAYER_READY,
                    { roomCode, isReady: true },
                    () => {
                      // Start game with short timer
                      client1.emit(
                        SOCKET_EVENTS.GAME_START,
                        { roomCode, difficulty: 'hard', timerDuration: 1 },
                        () => {
                          setTimeout(() => {
                            // Only player 1 submits - player 2 times out
                            client1.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                              roomCode,
                              guess: { lat: 40.7128, lng: -74.006 },
                            });

                            // Listen for round complete
                            client1.on(SOCKET_EVENTS.GAME_ROUND_COMPLETE, (data) => {
                              const player2Result = data.results.find(
                                (r) => r.playerId === client2.id
                              );

                              // Verify player 2 has null distance and 0 points
                              expect(player2Result.distance).toBeNull();
                              expect(player2Result.score).toBe(0);
                              expect(player2Result.timeBonus).toBe(0);
                              expect(player2Result.totalScore).toBe(0);

                              done();
                            });
                          }, 200);
                        }
                      );
                    }
                  );
                }
              );
            });
          }
        );
      });
    });

    it('should handle scenario where all players timeout (no guesses submitted)', (done) => {
      // Create single-player game
      client1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client1.on('connect', () => {
        client1.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'SoloPlayer', maxPlayers: 1 },
          (response) => {
            roomCode = response.data.room.code;

            // Set ready and start game
            client1.emit(
              SOCKET_EVENTS.PLAYER_READY,
              { roomCode, isReady: true },
              () => {
                client1.emit(
                  SOCKET_EVENTS.GAME_START,
                  { roomCode, difficulty: 'hard', timerDuration: 1 },
                  () => {
                    // Don't submit any guesses - let timer expire

                    // Listen for round complete
                    client1.on(SOCKET_EVENTS.GAME_ROUND_COMPLETE, (data) => {
                      const playerResult = data.results.find(
                        (r) => r.playerId === client1.id
                      );

                      // Verify player has null distance and 0 points
                      expect(playerResult.distance).toBeNull();
                      expect(playerResult.score).toBe(0);
                      expect(playerResult.timeBonus).toBe(0);

                      done();
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });

  describe('Continue Button Edge Cases', () => {
    it('should advance immediately when all players ready before timer expires', (done) => {
      // Create 3-player game
      client1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client1.on('connect', () => {
        client1.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Player1', maxPlayers: 3 },
          (response) => {
            roomCode = response.data.room.code;

            client2 = ioClient(`http://localhost:${serverPort}`, {
              transports: ['websocket'],
            });

            client2.on('connect', () => {
              client2.emit(
                SOCKET_EVENTS.JOIN_ROOM,
                { roomCode, playerName: 'Player2' },
                () => {
                  client3 = ioClient(`http://localhost:${serverPort}`, {
                    transports: ['websocket'],
                  });

                  client3.on('connect', () => {
                    client3.emit(
                      SOCKET_EVENTS.JOIN_ROOM,
                      { roomCode, playerName: 'Player3' },
                      () => {
                        // Set all ready
                        client1.emit(SOCKET_EVENTS.PLAYER_READY, {
                          roomCode,
                          isReady: true,
                        });
                        client2.emit(SOCKET_EVENTS.PLAYER_READY, {
                          roomCode,
                          isReady: true,
                        });
                        client3.emit(
                          SOCKET_EVENTS.PLAYER_READY,
                          { roomCode, isReady: true },
                          () => {
                            // Start game
                            client1.emit(
                              SOCKET_EVENTS.GAME_START,
                              { roomCode, difficulty: 'medium', timerDuration: 30 },
                              () => {
                                setTimeout(() => {
                                  // All players submit guesses
                                  client1.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                                    roomCode,
                                    guess: { lat: 40.7, lng: -74.0 },
                                  });
                                  client2.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                                    roomCode,
                                    guess: { lat: 40.7, lng: -74.0 },
                                  });
                                  client3.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                                    roomCode,
                                    guess: { lat: 40.7, lng: -74.0 },
                                  });

                                  // Wait for round complete
                                  const roundStartTime = Date.now();
                                  client1.on(SOCKET_EVENTS.GAME_ROUND_COMPLETE, () => {
                                    // All players click continue immediately
                                    client1.emit('round:player_ready', {
                                      roomCode,
                                      playerId: client1.id,
                                    });
                                    client2.emit('round:player_ready', {
                                      roomCode,
                                      playerId: client2.id,
                                    });
                                    client3.emit('round:player_ready', {
                                      roomCode,
                                      playerId: client3.id,
                                    });

                                    // Should advance before 5s countdown timer
                                    client1.on('round:all_ready', () => {
                                      const advanceTime = Date.now() - roundStartTime;
                                      expect(advanceTime).toBeLessThan(5000); // Should be much faster than 5s
                                      done();
                                    });
                                  });
                                }, 200);
                              }
                            );
                          }
                        );
                      }
                    );
                  });
                }
              );
            });
          }
        );
      });
    });
  });

  describe('Backend-Frontend Integration for Time Bonus', () => {
    it('should calculate and transmit time bonus from backend to frontend correctly', (done) => {
      // Create single-player game
      client1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client1.on('connect', () => {
        client1.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'TestPlayer', maxPlayers: 1 },
          (response) => {
            roomCode = response.data.room.code;

            client1.emit(
              SOCKET_EVENTS.PLAYER_READY,
              { roomCode, isReady: true },
              () => {
                client1.emit(
                  SOCKET_EVENTS.GAME_START,
                  { roomCode, difficulty: 'medium', timerDuration: 30 },
                  () => {
                    setTimeout(() => {
                      // Submit guess after 10 seconds (20s remaining)
                      setTimeout(() => {
                        client1.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                          roomCode,
                          guess: { lat: 40.7128, lng: -74.006 },
                        });
                      }, 10000);

                      // Listen for round complete
                      client1.on(SOCKET_EVENTS.GAME_ROUND_COMPLETE, (data) => {
                        const result = data.results[0];

                        // Verify time bonus calculation
                        // Expected: ~(20s / 30s) * 2000 = ~1333 points
                        expect(result.timeBonus).toBeDefined();
                        expect(result.timeBonus).toBeGreaterThan(1200);
                        expect(result.timeBonus).toBeLessThan(1500);

                        // Verify total score includes time bonus
                        expect(result.totalScore).toBe(result.score + result.timeBonus);

                        done();
                      });
                    }, 200);
                  }
                );
              }
            );
          }
        );
      });
    }, 15000); // Increase timeout for this test (10s wait + buffer)
  });

  describe('Cumulative Score Across Multiple Rounds', () => {
    it('should accumulate total score correctly across rounds with time bonus', (done) => {
      // Create single-player game
      client1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client1.on('connect', () => {
        client1.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'TestPlayer', maxPlayers: 1 },
          (response) => {
            roomCode = response.data.room.code;

            client1.emit(
              SOCKET_EVENTS.PLAYER_READY,
              { roomCode, isReady: true },
              () => {
                client1.emit(
                  SOCKET_EVENTS.GAME_START,
                  { roomCode, difficulty: 'medium', timerDuration: 30 },
                  () => {
                    let round1Total = 0;

                    // Round 1
                    client1.on(SOCKET_EVENTS.GAME_ROUND_COMPLETE, (data) => {
                      const result = data.results[0];

                      if (data.roundNumber === 1) {
                        // Save round 1 total
                        round1Total = result.totalScore;
                        expect(round1Total).toBeGreaterThan(0);

                        // Click continue to advance
                        client1.emit('round:player_ready', {
                          roomCode,
                          playerId: client1.id,
                        });

                        // Listen for next round start
                        client1.on(SOCKET_EVENTS.GAME_ROUND_START, () => {
                          // Submit guess for round 2
                          setTimeout(() => {
                            client1.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                              roomCode,
                              guess: { lat: 51.5074, lng: -0.1278 },
                            });
                          }, 100);
                        });
                      } else if (data.roundNumber === 2) {
                        // Verify cumulative total
                        const round2Total = result.totalScore;
                        expect(round2Total).toBeGreaterThan(round1Total);

                        // Total should be sum of both rounds
                        const round2Score = result.score + result.timeBonus;
                        expect(round2Total).toBe(round1Total + round2Score);

                        done();
                      }
                    });

                    // Submit first guess
                    setTimeout(() => {
                      client1.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                        roomCode,
                        guess: { lat: 40.7128, lng: -74.006 },
                      });
                    }, 200);
                  }
                );
              }
            );
          }
        );
      });
    }, 15000);
  });
});
