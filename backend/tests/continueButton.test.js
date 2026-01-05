/**
 * Continue Button Socket Events Tests
 *
 * Tests for the continue button feature that allows players to advance
 * to the next round when all players are ready OR when timer expires.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import express from 'express';
import { registerSocketHandlers } from '../src/handlers/socketHandlers.js';
import { SOCKET_EVENTS } from '../types/socket-events.js';

describe('Continue Button Socket Events', () => {
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

  describe('round:player_ready event handling', () => {
    beforeEach((done) => {
      // Create a room with 2 players and start a game
      client1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client1.on('connect', () => {
        client1.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Player1', maxPlayers: 3 },
          (response) => {
            roomCode = response.data.room.code;

            // Join second player
            client2 = ioClient(`http://localhost:${serverPort}`, {
              transports: ['websocket'],
            });

            client2.on('connect', () => {
              client2.emit(
                SOCKET_EVENTS.JOIN_ROOM,
                { roomCode, playerName: 'Player2' },
                () => {
                  // Set both players ready
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
                        {
                          roomCode,
                          difficulty: 'medium',
                          timerDuration: 30,
                        },
                        () => {
                          // Wait for game to start before tests
                          setTimeout(done, 200);
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

    it('should accept round:player_ready event from client', (done) => {
      client1.emit(
        'round:player_ready',
        { roomCode, playerId: client1.id },
        (response) => {
          expect(response.success).toBe(true);
          done();
        }
      );
    });

    it('should track ready players in game session', (done) => {
      client1.emit(
        'round:player_ready',
        { roomCode, playerId: client1.id },
        (response) => {
          expect(response.success).toBe(true);
          expect(response.data.readyCount).toBe(1);
          expect(response.data.totalPlayers).toBe(2);
          done();
        }
      );
    });

    it('should validate player is in the room before marking ready', (done) => {
      client1.emit(
        'round:player_ready',
        { roomCode, playerId: 'invalid-player-id' },
        (response) => {
          expect(response.success).toBe(false);
          expect(response.error.code).toBe('PLAYER_NOT_FOUND');
          done();
        }
      );
    });

    it('should reset ready players at start of each round', (done) => {
      // Mark player1 ready
      client1.emit(
        'round:player_ready',
        { roomCode, playerId: client1.id },
        () => {
          // Listen for round:all_ready
          client1.on('round:all_ready', () => {
            // After advancing to next round, check that ready state is reset
            setTimeout(() => {
              client1.emit(
                'round:player_ready',
                { roomCode, playerId: client1.id },
                (response) => {
                  expect(response.success).toBe(true);
                  // Should be first ready player in new round
                  expect(response.data.readyCount).toBe(1);
                  done();
                }
              );
            }, 100);
          });

          // Mark player2 ready to trigger advance
          client2.emit('round:player_ready', {
            roomCode,
            playerId: client2.id,
          });
        }
      );
    });
  });

  describe('round:all_ready emission', () => {
    it('should emit round:all_ready when all players are ready', (done) => {
      // Create a 2-player game
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
                            // Wait for round results
                            client1.on(SOCKET_EVENTS.GAME_ROUND_COMPLETE, () => {
                              let readyCount = 0;

                              // Listen for round:all_ready on both clients
                              const checkAllReady = () => {
                                readyCount++;
                                if (readyCount === 2) {
                                  done();
                                }
                              };

                              client1.on('round:all_ready', checkAllReady);
                              client2.on('round:all_ready', checkAllReady);

                              // Mark both players ready
                              client1.emit('round:player_ready', {
                                roomCode,
                                playerId: client1.id,
                              });
                              setTimeout(() => {
                                client2.emit('round:player_ready', {
                                  roomCode,
                                  playerId: client2.id,
                                });
                              }, 100);
                            });

                            // Submit guesses to trigger round complete
                            client1.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                              roomCode,
                              guess: { lat: 40.7, lng: -74.0 },
                            });
                            client2.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                              roomCode,
                              guess: { lat: 40.7, lng: -74.0 },
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

    it('should not emit round:all_ready with partial readiness', (done) => {
      // Create a 3-player game
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
                              {
                                roomCode,
                                difficulty: 'medium',
                                timerDuration: 30,
                              },
                              () => {
                                setTimeout(() => {
                                  // Wait for round results
                                  client1.on(
                                    SOCKET_EVENTS.GAME_ROUND_COMPLETE,
                                    () => {
                                      let allReadyReceived = false;

                                      client1.on('round:all_ready', () => {
                                        allReadyReceived = true;
                                      });

                                      // Mark only 2 of 3 players ready
                                      client1.emit('round:player_ready', {
                                        roomCode,
                                        playerId: client1.id,
                                      });
                                      client2.emit('round:player_ready', {
                                        roomCode,
                                        playerId: client2.id,
                                      });

                                      // Wait and verify round:all_ready was NOT emitted
                                      setTimeout(() => {
                                        expect(allReadyReceived).toBe(false);
                                        done();
                                      }, 500);
                                    }
                                  );

                                  // Submit all guesses to trigger round complete
                                  client1.emit(
                                    SOCKET_EVENTS.GAME_GUESS_SUBMITTED,
                                    {
                                      roomCode,
                                      guess: { lat: 40.7, lng: -74.0 },
                                    }
                                  );
                                  client2.emit(
                                    SOCKET_EVENTS.GAME_GUESS_SUBMITTED,
                                    {
                                      roomCode,
                                      guess: { lat: 40.7, lng: -74.0 },
                                    }
                                  );
                                  client3.emit(
                                    SOCKET_EVENTS.GAME_GUESS_SUBMITTED,
                                    {
                                      roomCode,
                                      guess: { lat: 40.7, lng: -74.0 },
                                    }
                                  );
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

  describe('edge cases', () => {
    it('should auto-advance for single player in room', (done) => {
      // Create single-player room
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
                  {
                    roomCode,
                    difficulty: 'medium',
                    timerDuration: 30,
                  },
                  () => {
                    // Wait for game to start
                    setTimeout(() => {
                      // Wait for round results
                      client1.on(SOCKET_EVENTS.GAME_ROUND_COMPLETE, () => {
                        // Listen for round:all_ready
                        client1.on('round:all_ready', () => {
                          // Single player should auto-advance
                          done();
                        });

                        // Mark ready
                        client1.emit('round:player_ready', {
                          roomCode,
                          playerId: client1.id,
                        });
                      });

                      // Submit guess to trigger round complete
                      client1.emit(SOCKET_EVENTS.GAME_GUESS_SUBMITTED, {
                        roomCode,
                        guess: { lat: 40.7, lng: -74.0 },
                      });
                    }, 200);
                  }
                );
              }
            );
          }
        );
      });
    });

    it('should handle invalid room code gracefully', (done) => {
      client1 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client1.on('connect', () => {
        client1.emit(
          'round:player_ready',
          { roomCode: 'INVALID', playerId: client1.id },
          (response) => {
            expect(response.success).toBe(false);
            expect(response.error.code).toBe('GAME_NOT_FOUND');
            done();
          }
        );
      });
    });
  });
});
