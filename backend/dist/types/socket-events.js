/**
 * Socket.IO Event Type Definitions
 *
 * Shared type definitions for WebSocket events between client and server.
 * These types ensure type safety across the entire real-time communication layer.
 */
/**
 * Error codes for socket events
 */
export var SocketErrorCode;
(function (SocketErrorCode) {
    SocketErrorCode["ROOM_NOT_FOUND"] = "ROOM_NOT_FOUND";
    SocketErrorCode["ROOM_FULL"] = "ROOM_FULL";
    SocketErrorCode["INVALID_ROOM_CODE"] = "INVALID_ROOM_CODE";
    SocketErrorCode["PLAYER_NOT_FOUND"] = "PLAYER_NOT_FOUND";
    SocketErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    SocketErrorCode["GAME_IN_PROGRESS"] = "GAME_IN_PROGRESS";
    SocketErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    SocketErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(SocketErrorCode || (SocketErrorCode = {}));
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
};
