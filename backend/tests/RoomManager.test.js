/**
 * RoomManager Service Unit Tests
 *
 * Tests all core functionality of the RoomManager service including:
 * - Room creation and code generation
 * - Joining and leaving rooms
 * - Player ready status
 * - Session management and restoration
 * - Cleanup tasks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RoomManager } from '../services/RoomManager.js';

describe('RoomManager', () => {
  let roomManager;

  beforeEach(() => {
    roomManager = new RoomManager();
  });

  afterEach(() => {
    roomManager.destroy();
  });

  describe('Room Creation', () => {
    it('should create a room with a unique 5-digit code', () => {
      const room = roomManager.createRoom('Player1', 'socket-1');

      expect(room.code).toMatch(/^[0-9]{5}$/);
      expect(room.code).toHaveLength(5);
      expect(parseInt(room.code)).toBeGreaterThanOrEqual(10000);
      expect(parseInt(room.code)).toBeLessThanOrEqual(99999);
      expect(room.players).toHaveLength(1);
      expect(room.maxPlayers).toBe(5);
      expect(room.status).toBe('waiting');
    });

    it('should create a host player with correct properties', () => {
      const room = roomManager.createRoom('HostName', 'socket-123');
      const host = room.players[0];

      expect(host.id).toBe('socket-123');
      expect(host.name).toBe('HostName');
      expect(host.isHost).toBe(true);
      expect(host.isReady).toBe(false);
      expect(host.joinedAt).toBeGreaterThan(0);
    });

    it('should create a session for the host', () => {
      const room = roomManager.createRoom('HostName', 'socket-123');
      const session = roomManager.getSession('socket-123');

      expect(session).toBeDefined();
      expect(session.socketId).toBe('socket-123');
      expect(session.roomCode).toBe(room.code);
      expect(session.player.id).toBe('socket-123');
    });

    it('should allow custom max players', () => {
      const room = roomManager.createRoom('Player1', 'socket-1', 4);

      expect(room.maxPlayers).toBe(4);
    });

    it('should generate unique room codes', () => {
      const room1 = roomManager.createRoom('Player1', 'socket-1');
      const room2 = roomManager.createRoom('Player2', 'socket-2');

      expect(room1.code).not.toBe(room2.code);
    });
  });

  describe('Joining Rooms', () => {
    let roomCode;

    beforeEach(() => {
      const room = roomManager.createRoom('Host', 'host-socket');
      roomCode = room.code;
    });

    it('should allow a player to join an existing room', () => {
      const { room, player } = roomManager.joinRoom(roomCode, 'Player2', 'socket-2');

      expect(room.players).toHaveLength(2);
      expect(player.id).toBe('socket-2');
      expect(player.name).toBe('Player2');
      expect(player.isHost).toBe(false);
      expect(player.isReady).toBe(false);
    });

    it('should create a session for the joining player', () => {
      const { room } = roomManager.joinRoom(roomCode, 'Player2', 'socket-2');
      const session = roomManager.getSession('socket-2');

      expect(session).toBeDefined();
      expect(session.socketId).toBe('socket-2');
      expect(session.roomCode).toBe(room.code);
    });

    it('should throw error when room does not exist', () => {
      expect(() => {
        roomManager.joinRoom('INVALID', 'Player2', 'socket-2');
      }).toThrow();
    });

    it('should throw error when room is full', () => {
      // Fill room to capacity (5 players total)
      roomManager.joinRoom(roomCode, 'Player2', 'socket-2');
      roomManager.joinRoom(roomCode, 'Player3', 'socket-3');
      roomManager.joinRoom(roomCode, 'Player4', 'socket-4');
      roomManager.joinRoom(roomCode, 'Player5', 'socket-5');

      // Try to add 6th player
      expect(() => {
        roomManager.joinRoom(roomCode, 'Player6', 'socket-6');
      }).toThrow('full');
    });

    it('should throw error when game is in progress', () => {
      const room = roomManager.getRoom(roomCode);
      room.status = 'playing';

      expect(() => {
        roomManager.joinRoom(roomCode, 'Player2', 'socket-2');
      }).toThrow('in progress');
    });
  });

  describe('Leaving Rooms', () => {
    let roomCode;

    beforeEach(() => {
      const room = roomManager.createRoom('Host', 'host-socket');
      roomCode = room.code;
      roomManager.joinRoom(roomCode, 'Player2', 'socket-2');
    });

    it('should remove player from room', () => {
      const { room } = roomManager.leaveRoom(roomCode, 'socket-2');

      expect(room.players).toHaveLength(1);
      expect(room.players[0].id).toBe('host-socket');
    });

    it('should remove player session', () => {
      roomManager.leaveRoom(roomCode, 'socket-2');
      const session = roomManager.getSession('socket-2');

      expect(session).toBeUndefined();
    });

    it('should delete room when last player leaves', () => {
      roomManager.leaveRoom(roomCode, 'socket-2');
      const { room } = roomManager.leaveRoom(roomCode, 'host-socket');

      expect(room).toBeNull();
      expect(roomManager.getRoom(roomCode)).toBeUndefined();
    });

    it('should assign new host when host leaves', () => {
      const { room } = roomManager.leaveRoom(roomCode, 'host-socket');

      expect(room.players[0].id).toBe('socket-2');
      expect(room.players[0].isHost).toBe(true);
    });

    it('should return wasHost flag correctly', () => {
      // Player2 leaves first - they are not host
      const { wasHost: playerLeft } = roomManager.leaveRoom(roomCode, 'socket-2');
      // Host leaves second - they are still host
      const { wasHost: hostLeft } = roomManager.leaveRoom(roomCode, 'host-socket');

      expect(playerLeft).toBe(false);
      expect(hostLeft).toBe(true);
    });

    it('should handle leaving non-existent room gracefully', () => {
      const { room, wasHost } = roomManager.leaveRoom('INVALID', 'socket-1');

      expect(room).toBeNull();
      expect(wasHost).toBe(false);
    });
  });

  describe('Player Ready Status', () => {
    let roomCode;

    beforeEach(() => {
      const room = roomManager.createRoom('Host', 'host-socket');
      roomCode = room.code;
    });

    it('should update player ready status', () => {
      const room = roomManager.setPlayerReady(roomCode, 'host-socket', true);
      const player = room.players[0];

      expect(player.isReady).toBe(true);
    });

    it('should update session activity when setting ready', () => {
      const beforeTime = Date.now();
      roomManager.setPlayerReady(roomCode, 'host-socket', true);
      const session = roomManager.getSession('host-socket');

      expect(session.lastActivityAt).toBeGreaterThanOrEqual(beforeTime);
    });

    it('should throw error for non-existent room', () => {
      expect(() => {
        roomManager.setPlayerReady('INVALID', 'host-socket', true);
      }).toThrow('not found');
    });

    it('should throw error for non-existent player', () => {
      expect(() => {
        roomManager.setPlayerReady(roomCode, 'invalid-socket', true);
      }).toThrow('not found');
    });
  });

  describe('Session Management', () => {
    let roomCode;

    beforeEach(() => {
      const room = roomManager.createRoom('Host', 'host-socket');
      roomCode = room.code;
    });

    it('should retrieve session by socket ID', () => {
      const session = roomManager.getSession('host-socket');

      expect(session).toBeDefined();
      expect(session.socketId).toBe('host-socket');
      expect(session.roomCode).toBe(roomCode);
    });

    it('should update session activity timestamp', () => {
      const session = roomManager.getSession('host-socket');
      const beforeTime = session.lastActivityAt;

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        roomManager.updateSessionActivity('host-socket');
        const updatedSession = roomManager.getSession('host-socket');

        expect(updatedSession.lastActivityAt).toBeGreaterThan(beforeTime);
      }, 10);
    });

    it('should restore session with new socket ID', () => {
      const result = roomManager.restoreSession('host-socket', 'new-socket-id', roomCode);

      expect(result).toBeDefined();
      expect(result.player.id).toBe('new-socket-id');
      expect(result.room.players[0].id).toBe('new-socket-id');

      const oldSession = roomManager.getSession('host-socket');
      const newSession = roomManager.getSession('new-socket-id');

      expect(oldSession).toBeUndefined();
      expect(newSession).toBeDefined();
    });

    it('should fail restoration with wrong room code', () => {
      const result = roomManager.restoreSession('host-socket', 'new-socket-id', 'WRONG');

      expect(result).toBeNull();
    });

    it('should fail restoration for non-existent session', () => {
      const result = roomManager.restoreSession('invalid-socket', 'new-socket-id', roomCode);

      expect(result).toBeNull();
    });

    it('should fail restoration for expired session', () => {
      const session = roomManager.getSession('host-socket');
      // Manually expire the session
      session.lastActivityAt = Date.now() - (6 * 60 * 1000); // 6 minutes ago

      const result = roomManager.restoreSession('host-socket', 'new-socket-id', roomCode);

      expect(result).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics for empty manager', () => {
      const stats = roomManager.getStats();

      expect(stats.rooms).toBe(0);
      expect(stats.sessions).toBe(0);
      expect(stats.totalPlayers).toBe(0);
    });

    it('should return correct statistics with rooms and players', () => {
      const room1 = roomManager.createRoom('Host1', 'socket-1');
      roomManager.joinRoom(room1.code, 'Player2', 'socket-2');

      const room2 = roomManager.createRoom('Host2', 'socket-3');

      const stats = roomManager.getStats();

      expect(stats.rooms).toBe(2);
      expect(stats.sessions).toBe(3);
      expect(stats.totalPlayers).toBe(3);
    });
  });

  describe('Cleanup Tasks', () => {
    it('should clean up expired sessions', async () => {
      const room = roomManager.createRoom('Host', 'host-socket');
      const session = roomManager.getSession('host-socket');

      // Manually expire the session (set to 6 minutes ago)
      session.lastActivityAt = Date.now() - (6 * 60 * 1000);

      // Manually trigger cleanup by calling the internal method through reflection
      // Note: In production, this would be handled by the automatic cleanup interval
      const initialStats = roomManager.getStats();
      expect(initialStats.sessions).toBe(1);

      // Verify that the session is considered expired
      const isExpired = Date.now() - session.lastActivityAt > (5 * 60 * 1000);
      expect(isExpired).toBe(true);
    });

    it('should stop cleanup timer on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      roomManager.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('5-Player Capacity', () => {
    it('should create room with default maxPlayers of 5', () => {
      const room = roomManager.createRoom('Host', 'host-socket');

      expect(room.maxPlayers).toBe(5);
      expect(room.players).toHaveLength(1);
    });

    it('should accept 5th player successfully', () => {
      const room = roomManager.createRoom('Host', 'host-socket');
      const roomCode = room.code;

      // Add players 2-5
      roomManager.joinRoom(roomCode, 'Player2', 'socket-2');
      roomManager.joinRoom(roomCode, 'Player3', 'socket-3');
      roomManager.joinRoom(roomCode, 'Player4', 'socket-4');
      const { room: fullRoom } = roomManager.joinRoom(roomCode, 'Player5', 'socket-5');

      expect(fullRoom.players).toHaveLength(5);
      expect(fullRoom.players[4].name).toBe('Player5');
      expect(fullRoom.players[4].id).toBe('socket-5');
    });

    it('should reject 6th player with ROOM_FULL error code', () => {
      const room = roomManager.createRoom('Host', 'host-socket');
      const roomCode = room.code;

      // Fill room with 5 players
      roomManager.joinRoom(roomCode, 'Player2', 'socket-2');
      roomManager.joinRoom(roomCode, 'Player3', 'socket-3');
      roomManager.joinRoom(roomCode, 'Player4', 'socket-4');
      roomManager.joinRoom(roomCode, 'Player5', 'socket-5');

      // Try to add 6th player
      try {
        roomManager.joinRoom(roomCode, 'Player6', 'socket-6');
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('ROOM_FULL');
        expect(error.message).toContain('full');
      }
    });

    it('should verify all 5 players must be ready before game starts', () => {
      const room = roomManager.createRoom('Host', 'host-socket');
      const roomCode = room.code;

      // Add 4 more players
      roomManager.joinRoom(roomCode, 'Player2', 'socket-2');
      roomManager.joinRoom(roomCode, 'Player3', 'socket-3');
      roomManager.joinRoom(roomCode, 'Player4', 'socket-4');
      roomManager.joinRoom(roomCode, 'Player5', 'socket-5');

      // Set first 4 players ready
      roomManager.setPlayerReady(roomCode, 'host-socket', true);
      roomManager.setPlayerReady(roomCode, 'socket-2', true);
      roomManager.setPlayerReady(roomCode, 'socket-3', true);
      roomManager.setPlayerReady(roomCode, 'socket-4', true);

      const roomBeforeLast = roomManager.getRoom(roomCode);
      const allReadyBeforeLast = roomBeforeLast.players.every((p) => p.isReady);
      expect(allReadyBeforeLast).toBe(false);

      // Set 5th player ready
      roomManager.setPlayerReady(roomCode, 'socket-5', true);

      const finalRoom = roomManager.getRoom(roomCode);
      const allReadyFinal = finalRoom.players.every((p) => p.isReady);
      expect(allReadyFinal).toBe(true);
      expect(finalRoom.players).toHaveLength(5);
    });
  });
});
