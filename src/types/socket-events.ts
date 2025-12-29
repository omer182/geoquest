/**
 * Socket.IO Event Type Definitions
 *
 * Shared type definitions for WebSocket events between client and server.
 * These types ensure type safety across the entire real-time communication layer.
 */

/**
 * Player information in a multiplayer room
 */
export interface Player {
  /**
   * Unique socket ID for the player
   */
  id: string;

  /**
   * Display name chosen by the player
   */
  name: string;

  /**
   * Whether the player is ready to start the game
   */
  isReady: boolean;

  /**
   * Whether the player is the room creator/host
   */
  isHost: boolean;

  /**
   * Timestamp when player joined the room
   */
  joinedAt: number;
}

/**
 * Room state information
 */
export interface Room {
  /**
   * Unique 6-character room code
   */
  code: string;

  /**
   * Array of players currently in the room
   */
  players: Player[];

  /**
   * Maximum number of players allowed (default: 2)
   */
  maxPlayers: number;

  /**
   * Timestamp when room was created
   */
  createdAt: number;

  /**
   * Current game status
   */
  status: 'waiting' | 'playing' | 'finished';
}

/**
 * Session data for reconnection persistence
 */
export interface Session {
  /**
   * Socket ID of the player
   */
  socketId: string;

  /**
   * Room code the player was in
   */
  roomCode: string;

  /**
   * Player information
   */
  player: Player;

  /**
   * Timestamp when session was created
   */
  createdAt: number;

  /**
   * Timestamp of last activity
   */
  lastActivityAt: number;
}

/**
 * Connection status types
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

/**
 * Error codes for socket events
 */
export enum SocketErrorCode {
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_FULL = 'ROOM_FULL',
  INVALID_ROOM_CODE = 'INVALID_ROOM_CODE',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  GAME_IN_PROGRESS = 'GAME_IN_PROGRESS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Standardized error response structure
 */
export interface SocketError {
  code: SocketErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// Client -> Server Events (Request Payloads)
// ============================================

/**
 * Payload for creating a new room
 */
export interface CreateRoomRequest {
  /**
   * Player name
   */
  playerName: string;

  /**
   * Optional maximum players (default: 2)
   */
  maxPlayers?: number;
}

/**
 * Payload for joining an existing room
 */
export interface JoinRoomRequest {
  /**
   * 6-character room code
   */
  roomCode: string;

  /**
   * Player name
   */
  playerName: string;
}

/**
 * Payload for leaving a room
 */
export interface LeaveRoomRequest {
  /**
   * Room code to leave
   */
  roomCode: string;
}

/**
 * Payload for toggling ready status
 */
export interface PlayerReadyRequest {
  /**
   * Room code
   */
  roomCode: string;

  /**
   * New ready status
   */
  isReady: boolean;
}

/**
 * Payload for session restoration
 */
export interface RestoreSessionRequest {
  /**
   * Previous socket ID
   */
  previousSocketId: string;

  /**
   * Room code
   */
  roomCode: string;
}

// ============================================
// Server -> Client Events (Response Payloads)
// ============================================

/**
 * Response when room is created successfully
 */
export interface RoomCreatedResponse {
  /**
   * The created room
   */
  room: Room;

  /**
   * Your player info
   */
  player: Player;
}

/**
 * Response when joining room successfully
 */
export interface RoomJoinedResponse {
  /**
   * The room you joined
   */
  room: Room;

  /**
   * Your player info
   */
  player: Player;
}

/**
 * Broadcast when room state updates
 */
export interface RoomUpdatedEvent {
  /**
   * Updated room state
   */
  room: Room;
}

/**
 * Broadcast when a player joins
 */
export interface PlayerJoinedEvent {
  /**
   * The player who joined
   */
  player: Player;

  /**
   * Updated room state
   */
  room: Room;
}

/**
 * Broadcast when a player leaves
 */
export interface PlayerLeftEvent {
  /**
   * ID of the player who left
   */
  playerId: string;

  /**
   * Updated room state
   */
  room: Room;
}

/**
 * Broadcast when player ready status changes
 */
export interface PlayerReadyChangedEvent {
  /**
   * ID of the player
   */
  playerId: string;

  /**
   * New ready status
   */
  isReady: boolean;

  /**
   * Updated room state
   */
  room: Room;
}

/**
 * Response for successful session restoration
 */
export interface SessionRestoredResponse {
  /**
   * Restored room state
   */
  room: Room;

  /**
   * Your restored player info
   */
  player: Player;

  /**
   * Whether you reconnected successfully
   */
  reconnected: boolean;
}

/**
 * Heartbeat ping payload
 */
export interface PingPayload {
  /**
   * Timestamp when ping was sent
   */
  timestamp: number;
}

/**
 * Heartbeat pong response
 */
export interface PongPayload {
  /**
   * Original timestamp from ping
   */
  timestamp: number;

  /**
   * Server timestamp
   */
  serverTime: number;
}

// ============================================
// Event Name Constants
// ============================================

/**
 * All socket event names
 */
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',

  // Health monitoring
  PING: 'ping',
  PONG: 'pong',

  // Room management (Client -> Server)
  CREATE_ROOM: 'room:create',
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  PLAYER_READY: 'player:ready',
  RESTORE_SESSION: 'session:restore',

  // Room management (Server -> Client)
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_UPDATED: 'room:updated',
  ROOM_ERROR: 'room:error',
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_READY_CHANGED: 'player:readyChanged',
  SESSION_RESTORED: 'session:restored',

  // Future game events (placeholders for Phase 4)
  GAME_START: 'game:start',
  GAME_ROUND_START: 'game:roundStart',
  GAME_GUESS_SUBMITTED: 'game:guessSubmitted',
  GAME_ROUND_COMPLETE: 'game:roundComplete',
  GAME_COMPLETE: 'game:complete',
} as const;

/**
 * Type-safe event names
 */
export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
