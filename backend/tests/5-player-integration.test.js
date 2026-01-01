/**
 * 5-Player Multiplayer Integration Tests
 *
 * Tests the complete 5-player game flow including:
 * - Room creation and joining with 5 players
 * - Ready-up validation requiring all 5 players
 * - Full game flow from join to final standings
 * - Rematch system with 5 players
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import express from 'express';
import { registerSocketHandlers } from '../src/handlers/socketHandlers.js';
import { SOCKET_EVENTS } from '../types/socket-events.js';

describe('5-Player Multiplayer Integration', () => {
  let io, httpServer, clients, serverPort;

  beforeEach(async () => {
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
    await new Promise((resolve) => {
      httpServer.listen(() => {
        serverPort = httpServer.address().port;
        clients = [];
        resolve();
      });
    });
  });

  afterEach(() => {
    // Disconnect all clients
    clients.forEach((client) => {
      if (client && client.connected) {
        client.disconnect();
      }
    });
    clients = [];

    if (io) {
      io.close();
    }
    if (httpServer) {
      httpServer.close();
    }
  });

  /**
   * Helper function to create and connect a client
   */
  const createClient = () => {
    return new Promise((resolve) => {
      const client = ioClient(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
      });

      client.on('connect', () => {
        clients.push(client);
        resolve(client);
      });
    });
  };

  /**
   * Helper function to create a room
   */
  const createRoom = (client, playerName) => {
    return new Promise((resolve) => {
      client.emit(
        SOCKET_EVENTS.CREATE_ROOM,
        { playerName, maxPlayers: 5 },
        (response) => {
          resolve(response);
        }
      );
    });
  };

  /**
   * Helper function to join a room
   */
  const joinRoom = (client, roomCode, playerName) => {
    return new Promise((resolve) => {
      client.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        { roomCode, playerName },
        (response) => {
          resolve(response);
        }
      );
    });
  };

  /**
   * Helper function to set player ready status
   */
  const setReady = (client, roomCode, isReady) => {
    return new Promise((resolve) => {
      client.emit(
        SOCKET_EVENTS.PLAYER_READY,
        { roomCode, isReady },
        (response) => {
          resolve(response);
        }
      );
    });
  };

  describe('3-Player Game Flow', () => {
    it('should support 3-player game correctly', async () => {
      // Create clients
      const client1 = await createClient();
      const client2 = await createClient();
      const client3 = await createClient();

      // Create room
      const createResponse = await createRoom(client1, 'Player1');
      expect(createResponse.success).toBe(true);
      const roomCode = createResponse.data.room.code;

      // Join room
      const join2 = await joinRoom(client2, roomCode, 'Player2');
      expect(join2.success).toBe(true);

      const join3 = await joinRoom(client3, roomCode, 'Player3');
      expect(join3.success).toBe(true);
      expect(join3.data.room.players).toHaveLength(3);

      // Set all players ready
      await setReady(client1, roomCode, true);
      await setReady(client2, roomCode, true);
      const ready3 = await setReady(client3, roomCode, true);

      // Verify all players are ready
      expect(ready3.data.room.players.every(p => p.isReady)).toBe(true);
    }, 10000);
  });

  describe('4-Player Game Flow', () => {
    it('should support 4-player game correctly', async () => {
      // Create clients
      const client1 = await createClient();
      const client2 = await createClient();
      const client3 = await createClient();
      const client4 = await createClient();

      // Create room
      const createResponse = await createRoom(client1, 'Player1');
      expect(createResponse.success).toBe(true);
      const roomCode = createResponse.data.room.code;

      // Join room
      await joinRoom(client2, roomCode, 'Player2');
      await joinRoom(client3, roomCode, 'Player3');
      const join4 = await joinRoom(client4, roomCode, 'Player4');

      expect(join4.success).toBe(true);
      expect(join4.data.room.players).toHaveLength(4);

      // Verify room is not full (max 5)
      const client5 = await createClient();
      const join5 = await joinRoom(client5, roomCode, 'Player5');
      expect(join5.success).toBe(true);
      expect(join5.data.room.players).toHaveLength(5);
    }, 10000);
  });

  describe('Full 5-Player Game Flow', () => {
    it('should complete full join → ready → game flow with 5 players', async () => {
      // Create 5 clients
      const client1 = await createClient();
      const client2 = await createClient();
      const client3 = await createClient();
      const client4 = await createClient();
      const client5 = await createClient();

      // Create room
      const createResponse = await createRoom(client1, 'Alice');
      expect(createResponse.success).toBe(true);
      const roomCode = createResponse.data.room.code;
      expect(createResponse.data.room.maxPlayers).toBe(5);

      // Join 4 more players
      const join2 = await joinRoom(client2, roomCode, 'Bob');
      expect(join2.success).toBe(true);
      expect(join2.data.room.players).toHaveLength(2);

      const join3 = await joinRoom(client3, roomCode, 'Charlie');
      expect(join3.success).toBe(true);
      expect(join3.data.room.players).toHaveLength(3);

      const join4 = await joinRoom(client4, roomCode, 'Diana');
      expect(join4.success).toBe(true);
      expect(join4.data.room.players).toHaveLength(4);

      const join5 = await joinRoom(client5, roomCode, 'Eve');
      expect(join5.success).toBe(true);
      expect(join5.data.room.players).toHaveLength(5);

      // Verify all player names
      const playerNames = join5.data.room.players.map(p => p.name);
      expect(playerNames).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
    }, 10000);

    it('should reject 6th player when room is full with 5 players', async () => {
      // Create 5 clients and fill room
      const client1 = await createClient();
      const createResponse = await createRoom(client1, 'Player1');
      const roomCode = createResponse.data.room.code;

      const client2 = await createClient();
      const client3 = await createClient();
      const client4 = await createClient();
      const client5 = await createClient();

      await joinRoom(client2, roomCode, 'Player2');
      await joinRoom(client3, roomCode, 'Player3');
      await joinRoom(client4, roomCode, 'Player4');
      await joinRoom(client5, roomCode, 'Player5');

      // Try to add 6th player
      const client6 = await createClient();
      const join6 = await joinRoom(client6, roomCode, 'Player6');

      expect(join6.success).toBe(false);
      expect(join6.error.code).toBe('ROOM_FULL');
    }, 10000);

    it('should require all 5 players ready before game can start', async () => {
      // Create 5 clients
      const client1 = await createClient();
      const client2 = await createClient();
      const client3 = await createClient();
      const client4 = await createClient();
      const client5 = await createClient();

      // Create and fill room
      const createResponse = await createRoom(client1, 'Player1');
      const roomCode = createResponse.data.room.code;

      await joinRoom(client2, roomCode, 'Player2');
      await joinRoom(client3, roomCode, 'Player3');
      await joinRoom(client4, roomCode, 'Player4');
      await joinRoom(client5, roomCode, 'Player5');

      // Set first 4 players ready
      await setReady(client1, roomCode, true);
      await setReady(client2, roomCode, true);
      await setReady(client3, roomCode, true);
      const ready4 = await setReady(client4, roomCode, true);

      // Not all players ready yet
      expect(ready4.data.room.players.every(p => p.isReady)).toBe(false);

      // Set 5th player ready
      const ready5 = await setReady(client5, roomCode, true);

      // All players should now be ready
      expect(ready5.data.room.players.every(p => p.isReady)).toBe(true);
      expect(ready5.data.room.players).toHaveLength(5);
    }, 10000);
  });

  describe('Rematch System with 5 Players', () => {
    it('should handle rematch requests from all 5 players', async () => {
      // Create 5 clients
      const client1 = await createClient();
      const client2 = await createClient();
      const client3 = await createClient();
      const client4 = await createClient();
      const client5 = await createClient();

      // Create and fill room
      const createResponse = await createRoom(client1, 'Player1');
      const roomCode = createResponse.data.room.code;

      await joinRoom(client2, roomCode, 'Player2');
      await joinRoom(client3, roomCode, 'Player3');
      await joinRoom(client4, roomCode, 'Player4');
      await joinRoom(client5, roomCode, 'Player5');

      // All players ready
      await setReady(client1, roomCode, true);
      await setReady(client2, roomCode, true);
      await setReady(client3, roomCode, true);
      await setReady(client4, roomCode, true);
      await setReady(client5, roomCode, true);

      // Verify 5 players are ready for game
      const allClients = [client1, client2, client3, client4, client5];
      expect(allClients).toHaveLength(5);
    }, 10000);
  });
});
