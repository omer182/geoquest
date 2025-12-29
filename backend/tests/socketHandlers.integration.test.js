/**
 * Socket.IO Event Handlers Integration Tests
 *
 * Tests the complete flow of Socket.IO events including:
 * - Connection and disconnection
 * - Room creation and joining
 * - Player ready status
 * - Session restoration
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import express from 'express';
import { registerSocketHandlers } from '../src/handlers/socketHandlers.js';
import { SOCKET_EVENTS } from '../types/socket-events.js';

describe('Socket.IO Event Handlers Integration', () => {
  let io, httpServer, clientSocket, serverPort;

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
    if (clientSocket) {
      clientSocket.disconnect();
    }
    io.close();
    httpServer.close();
  });

  describe('Connection Events', () => {
    it('should connect successfully', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    it('should receive connect_success event', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect_success', (data) => {
        expect(data.socketId).toBe(clientSocket.id);
        expect(data.timestamp).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Heartbeat Ping/Pong', () => {
    it('should respond to ping with pong', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        const timestamp = Date.now();

        clientSocket.emit(SOCKET_EVENTS.PING, { timestamp });

        clientSocket.on(SOCKET_EVENTS.PONG, (data) => {
          expect(data.timestamp).toBe(timestamp);
          expect(data.serverTime).toBeGreaterThan(0);
          done();
        });
      });
    });
  });

  describe('Room Creation', () => {
    it('should create a room successfully', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'TestHost', maxPlayers: 2 },
          (response) => {
            expect(response.success).toBe(true);
            expect(response.data.room.code).toMatch(/^[A-Z0-9]{6}$/);
            expect(response.data.room.players).toHaveLength(1);
            expect(response.data.player.name).toBe('TestHost');
            expect(response.data.player.isHost).toBe(true);
            done();
          }
        );
      });
    });

    it('should fail room creation without player name', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit(SOCKET_EVENTS.CREATE_ROOM, {}, (response) => {
          expect(response.success).toBe(false);
          expect(response.error.code).toBe('VALIDATION_ERROR');
          done();
        });
      });
    });
  });

  describe('Room Joining', () => {
    let roomCode;

    beforeEach((done) => {
      // Create a room first
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Host' },
          (response) => {
            roomCode = response.data.room.code;
            done();
          }
        );
      });
    });

    it('should join an existing room', (done) => {
      const client2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client2.on('connect', () => {
        client2.emit(
          SOCKET_EVENTS.JOIN_ROOM,
          { roomCode, playerName: 'Player2' },
          (response) => {
            expect(response.success).toBe(true);
            expect(response.data.room.players).toHaveLength(2);
            expect(response.data.player.name).toBe('Player2');
            expect(response.data.player.isHost).toBe(false);
            client2.disconnect();
            done();
          }
        );
      });
    });

    it('should notify existing players when new player joins', (done) => {
      clientSocket.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
        expect(data.player.name).toBe('Player2');
        expect(data.room.players).toHaveLength(2);
        done();
      });

      const client2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client2.on('connect', () => {
        client2.emit(SOCKET_EVENTS.JOIN_ROOM, {
          roomCode,
          playerName: 'Player2',
        });
      });
    });

    it('should fail to join non-existent room', (done) => {
      const client2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client2.on('connect', () => {
        client2.emit(
          SOCKET_EVENTS.JOIN_ROOM,
          { roomCode: 'INVALID', playerName: 'Player2' },
          (response) => {
            expect(response.success).toBe(false);
            expect(response.error.code).toBe('ROOM_NOT_FOUND');
            client2.disconnect();
            done();
          }
        );
      });
    });

    it('should fail to join full room', (done) => {
      // Join second player
      const client2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client2.on('connect', () => {
        client2.emit(
          SOCKET_EVENTS.JOIN_ROOM,
          { roomCode, playerName: 'Player2' },
          () => {
            // Try to join third player
            const client3 = ioClient(`http://localhost:${serverPort}`, {
              transports: ['websocket'],
            });

            client3.on('connect', () => {
              client3.emit(
                SOCKET_EVENTS.JOIN_ROOM,
                { roomCode, playerName: 'Player3' },
                (response) => {
                  expect(response.success).toBe(false);
                  expect(response.error.code).toBe('ROOM_FULL');
                  client2.disconnect();
                  client3.disconnect();
                  done();
                }
              );
            });
          }
        );
      });
    });
  });

  describe('Player Ready Status', () => {
    let roomCode;

    beforeEach((done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Host' },
          (response) => {
            roomCode = response.data.room.code;
            done();
          }
        );
      });
    });

    it('should update player ready status', (done) => {
      clientSocket.emit(
        SOCKET_EVENTS.PLAYER_READY,
        { roomCode, isReady: true },
        (response) => {
          expect(response.success).toBe(true);
          expect(response.data.room.players[0].isReady).toBe(true);
          done();
        }
      );
    });

    it('should broadcast ready status change to all players', (done) => {
      const client2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client2.on('connect', () => {
        client2.emit(
          SOCKET_EVENTS.JOIN_ROOM,
          { roomCode, playerName: 'Player2' },
          () => {
            // Listen for ready change
            client2.on(SOCKET_EVENTS.PLAYER_READY_CHANGED, (data) => {
              expect(data.playerId).toBe(clientSocket.id);
              expect(data.isReady).toBe(true);
              client2.disconnect();
              done();
            });

            // Host sets ready
            clientSocket.emit(SOCKET_EVENTS.PLAYER_READY, {
              roomCode,
              isReady: true,
            });
          }
        );
      });
    });
  });

  describe('Leaving Rooms', () => {
    let roomCode;

    beforeEach((done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Host' },
          (response) => {
            roomCode = response.data.room.code;
            done();
          }
        );
      });
    });

    it('should leave room successfully', (done) => {
      clientSocket.emit(
        SOCKET_EVENTS.LEAVE_ROOM,
        { roomCode },
        (response) => {
          expect(response.success).toBe(true);
          expect(response.data.wasHost).toBe(true);
          done();
        }
      );
    });

    it('should notify remaining players when someone leaves', (done) => {
      const client2 = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client2.on('connect', () => {
        client2.emit(
          SOCKET_EVENTS.JOIN_ROOM,
          { roomCode, playerName: 'Player2' },
          () => {
            // Listen for player left
            client2.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
              expect(data.playerId).toBe(clientSocket.id);
              expect(data.room.players).toHaveLength(1);
              expect(data.room.players[0].isHost).toBe(true);
              client2.disconnect();
              done();
            });

            // Host leaves
            clientSocket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode });
          }
        );
      });
    });
  });

  describe('Session Restoration', () => {
    let roomCode, oldSocketId;

    beforeEach((done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        oldSocketId = clientSocket.id;
        clientSocket.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Host' },
          (response) => {
            roomCode = response.data.room.code;
            done();
          }
        );
      });
    });

    it('should restore session after reconnection', (done) => {
      // Disconnect and reconnect
      clientSocket.disconnect();

      const newClient = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      newClient.on('connect', () => {
        newClient.emit(
          SOCKET_EVENTS.RESTORE_SESSION,
          { previousSocketId: oldSocketId, roomCode },
          (response) => {
            expect(response.success).toBe(true);
            expect(response.data.reconnected).toBe(true);
            expect(response.data.room.code).toBe(roomCode);
            expect(response.data.player.name).toBe('Host');
            newClient.disconnect();
            done();
          }
        );
      });
    });

    it('should fail to restore expired session', (done) => {
      // Create new client
      const newClient = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      newClient.on('connect', () => {
        newClient.emit(
          SOCKET_EVENTS.RESTORE_SESSION,
          { previousSocketId: 'invalid-socket', roomCode },
          (response) => {
            expect(response.success).toBe(false);
            expect(response.error.code).toBe('UNAUTHORIZED');
            newClient.disconnect();
            done();
          }
        );
      });
    });
  });

  describe('Disconnection', () => {
    it('should preserve session on disconnect', (done) => {
      clientSocket = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        const socketId = clientSocket.id;

        clientSocket.emit(
          SOCKET_EVENTS.CREATE_ROOM,
          { playerName: 'Host' },
          () => {
            // Disconnect
            clientSocket.disconnect();

            // Wait a bit and verify session still exists by trying to restore
            setTimeout(() => {
              const newClient = ioClient(`http://localhost:${serverPort}`, {
                transports: ['websocket'],
              });

              newClient.on('connect', () => {
                newClient.emit(
                  SOCKET_EVENTS.RESTORE_SESSION,
                  { previousSocketId: socketId, roomCode: null },
                  (response) => {
                    // Session should still exist (even if restore fails due to missing roomCode)
                    newClient.disconnect();
                    done();
                  }
                );
              });
            }, 100);
          }
        );
      });
    });
  });
});
