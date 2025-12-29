/**
 * RoomManager Service
 *
 * Manages in-memory storage and operations for multiplayer rooms.
 * Handles room creation, joining, leaving, and cleanup.
 */

import { Room, Player, Session, SocketError, SocketErrorCode } from '../types/socket-events.js';

/**
 * RoomManager class for managing multiplayer game rooms
 */
export class RoomManager {
  /**
   * In-memory storage for rooms (roomCode -> Room)
   */
  private rooms: Map<string, Room> = new Map();

  /**
   * In-memory storage for sessions (socketId -> Session)
   */
  private sessions: Map<string, Session> = new Map();

  /**
   * Session persistence window in milliseconds (5 minutes)
   */
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000;

  /**
   * Room cleanup interval in milliseconds (1 minute)
   */
  private readonly CLEANUP_INTERVAL = 60 * 1000;

  /**
   * Room timeout when empty (10 minutes)
   */
  private readonly ROOM_TIMEOUT = 10 * 60 * 1000;

  /**
   * Cleanup interval timer
   */
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupTask();
  }

  /**
   * Generate a unique 5-digit numeric room code
   */
  private generateRoomCode(): string {
    // Generate random 5-digit number (10000-99999)
    const code = (Math.floor(Math.random() * 90000) + 10000).toString();

    // Ensure uniqueness
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }

    return code;
  }

  /**
   * Create a new room
   */
  createRoom(playerName: string, socketId: string, maxPlayers: number = 2): Room {
    const roomCode = this.generateRoomCode();
    const now = Date.now();

    const host: Player = {
      id: socketId,
      name: playerName,
      isReady: false,
      isHost: true,
      joinedAt: now,
    };

    const room: Room = {
      code: roomCode,
      players: [host],
      maxPlayers,
      createdAt: now,
      status: 'waiting',
    };

    this.rooms.set(roomCode, room);

    // Create session for the host
    this.createSession(socketId, roomCode, host);

    return room;
  }

  /**
   * Join an existing room
   */
  joinRoom(roomCode: string, playerName: string, socketId: string): { room: Room; player: Player } {
    const room = this.rooms.get(roomCode);

    if (!room) {
      throw this.createError(SocketErrorCode.ROOM_NOT_FOUND, `Room ${roomCode} not found`);
    }

    if (room.players.length >= room.maxPlayers) {
      throw this.createError(SocketErrorCode.ROOM_FULL, `Room ${roomCode} is full`);
    }

    if (room.status !== 'waiting') {
      throw this.createError(
        SocketErrorCode.GAME_IN_PROGRESS,
        'Cannot join room while game is in progress'
      );
    }

    const now = Date.now();
    const player: Player = {
      id: socketId,
      name: playerName,
      isReady: false,
      isHost: false,
      joinedAt: now,
    };

    room.players.push(player);

    // Create session for the new player
    this.createSession(socketId, roomCode, player);

    return { room, player };
  }

  /**
   * Leave a room
   */
  leaveRoom(roomCode: string, socketId: string): { room: Room | null; wasHost: boolean } {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { room: null, wasHost: false };
    }

    const playerIndex = room.players.findIndex((p) => p.id === socketId);
    if (playerIndex === -1) {
      return { room, wasHost: false };
    }

    const player = room.players[playerIndex];
    const wasHost = player.isHost;

    // Remove player from room
    room.players.splice(playerIndex, 1);

    // Remove session
    this.removeSession(socketId);

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return { room: null, wasHost };
    }

    // If host left, assign new host
    if (wasHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    return { room, wasHost };
  }

  /**
   * Update player ready status
   */
  setPlayerReady(roomCode: string, socketId: string, isReady: boolean): Room {
    const room = this.rooms.get(roomCode);

    if (!room) {
      throw this.createError(SocketErrorCode.ROOM_NOT_FOUND, `Room ${roomCode} not found`);
    }

    const player = room.players.find((p) => p.id === socketId);
    if (!player) {
      throw this.createError(SocketErrorCode.PLAYER_NOT_FOUND, 'Player not found in room');
    }

    player.isReady = isReady;

    // Update session
    const session = this.sessions.get(socketId);
    if (session) {
      session.player.isReady = isReady;
      session.lastActivityAt = Date.now();
    }

    return room;
  }

  /**
   * Get room by code
   */
  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode);
  }

  /**
   * Get all rooms (for debugging)
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Create or update a session
   */
  private createSession(socketId: string, roomCode: string, player: Player): void {
    const now = Date.now();
    const session: Session = {
      socketId,
      roomCode,
      player,
      createdAt: now,
      lastActivityAt: now,
    };

    this.sessions.set(socketId, session);
  }

  /**
   * Get session by socket ID
   */
  getSession(socketId: string): Session | undefined {
    return this.sessions.get(socketId);
  }

  /**
   * Update session activity timestamp
   */
  updateSessionActivity(socketId: string): void {
    const session = this.sessions.get(socketId);
    if (session) {
      session.lastActivityAt = Date.now();
    }
  }

  /**
   * Remove session
   */
  removeSession(socketId: string): void {
    this.sessions.delete(socketId);
  }

  /**
   * Restore session for reconnection
   */
  restoreSession(
    previousSocketId: string,
    newSocketId: string,
    roomCode: string
  ): { room: Room; player: Player } | null {
    const session = this.sessions.get(previousSocketId);

    if (!session) {
      return null;
    }

    // Check if session has expired
    const now = Date.now();
    if (now - session.lastActivityAt > this.SESSION_TIMEOUT) {
      this.removeSession(previousSocketId);
      return null;
    }

    // Verify room code matches
    if (session.roomCode !== roomCode) {
      return null;
    }

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.removeSession(previousSocketId);
      return null;
    }

    // Find and update player in room
    const player = room.players.find((p) => p.id === previousSocketId);
    if (!player) {
      this.removeSession(previousSocketId);
      return null;
    }

    // Update player socket ID
    player.id = newSocketId;

    // Update session with new socket ID
    this.sessions.delete(previousSocketId);
    session.socketId = newSocketId;
    session.lastActivityAt = now;
    session.player.id = newSocketId;
    this.sessions.set(newSocketId, session);

    return { room, player };
  }

  /**
   * Start periodic cleanup task
   */
  private startCleanupTask(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredSessions();
      this.cleanupEmptyRooms();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [socketId, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt > this.SESSION_TIMEOUT) {
        expiredSessions.push(socketId);
      }
    }

    expiredSessions.forEach((socketId) => {
      const session = this.sessions.get(socketId);
      if (session) {
        // Remove player from room if still there
        this.leaveRoom(session.roomCode, socketId);
      }
    });

    if (expiredSessions.length > 0) {
      console.log(`[RoomManager] Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Clean up old empty rooms
   */
  private cleanupEmptyRooms(): void {
    const now = Date.now();
    const emptyRooms: string[] = [];

    for (const [code, room] of this.rooms.entries()) {
      if (room.players.length === 0 && now - room.createdAt > this.ROOM_TIMEOUT) {
        emptyRooms.push(code);
      }
    }

    emptyRooms.forEach((code) => this.rooms.delete(code));

    if (emptyRooms.length > 0) {
      console.log(`[RoomManager] Cleaned up ${emptyRooms.length} empty rooms`);
    }
  }

  /**
   * Stop cleanup task
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Create a standardized error
   */
  private createError(code: SocketErrorCode, message: string): SocketError {
    return { code, message };
  }

  /**
   * Get statistics (for monitoring)
   */
  getStats(): {
    rooms: number;
    sessions: number;
    totalPlayers: number;
  } {
    const totalPlayers = Array.from(this.rooms.values()).reduce(
      (sum, room) => sum + room.players.length,
      0
    );

    return {
      rooms: this.rooms.size,
      sessions: this.sessions.size,
      totalPlayers,
    };
  }
}

// Export singleton instance
export const roomManager = new RoomManager();
