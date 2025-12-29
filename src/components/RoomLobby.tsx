import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useGame } from '../context/GameContext';
import { SOCKET_EVENTS } from '../types/socket-events';
import { Room } from '../types/socket-events';
import { DifficultyLevel } from '../types/game';
import { City } from '../types/city';

interface RoomLobbyProps {
  onGameStart: () => void;
  onLeave: () => void;
}

/**
 * RoomLobby component - Waiting room for multiplayer game
 * Shows player list, ready status, room code, and host controls
 */
export default function RoomLobby({ onGameStart, onLeave }: RoomLobbyProps) {
  const { state: socketState, socket } = useSocket();
  const { state: gameState, dispatch } = useGame();
  const [isCopied, setIsCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const currentRoom = gameState.currentRoom;
  const currentPlayer = gameState.currentPlayer;
  const isHost = currentPlayer?.isHost || false;

  // Listen for room updates
  useSocketEvent<{ room: Room }>(SOCKET_EVENTS.ROOM_UPDATED, (data) => {
    dispatch({
      type: 'UPDATE_ROOM',
      payload: { room: data.room },
    });
  });

  // Listen for player joined
  useSocketEvent<{ player: any; room: Room }>(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
    dispatch({
      type: 'UPDATE_ROOM',
      payload: { room: data.room },
    });
  });

  // Listen for player left
  useSocketEvent<{ playerId: string; room: Room | null }>(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
    if (!data.room) {
      // Room was destroyed (host left)
      handleRoomDestroyed();
    } else {
      dispatch({
        type: 'UPDATE_ROOM',
        payload: { room: data.room },
      });
    }
  });

  // Listen for ready status changes
  useSocketEvent<{ playerId: string; isReady: boolean; room: Room }>(
    SOCKET_EVENTS.PLAYER_READY_CHANGED,
    (data) => {
      dispatch({
        type: 'UPDATE_ROOM',
        payload: { room: data.room },
      });
    }
  );

  // Listen for game start
  useSocketEvent<{
    roomCode: string;
    difficulty: DifficultyLevel;
    timerDuration: number;
    cities: City[];
    roundNumber: number;
    totalRounds: number;
  }>('game:started', (data) => {
    // Initialize multiplayer game state
    dispatch({
      type: 'MULTIPLAYER_GAME_STARTED',
      payload: {
        cities: data.cities,
        difficulty: data.difficulty,
        timerDuration: data.timerDuration,
        totalRounds: data.totalRounds,
      },
    });

    // Transition to game screen
    onGameStart();
  });

  const handleRoomDestroyed = useCallback(() => {
    dispatch({ type: 'LEAVE_ROOM' });
    alert('Room was closed by the host');
    onLeave();
  }, [dispatch, onLeave]);

  const handleCopyRoomCode = () => {
    if (!currentRoom) return;

    // Copy shareable link
    const shareableLink = `${window.location.origin}${window.location.pathname}?room=${currentRoom.code}`;
    navigator.clipboard.writeText(shareableLink);

    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleReady = () => {
    if (!socket || !currentRoom || !currentPlayer) return;

    const newReadyState = !currentPlayer.isReady;

    // Optimistically update local state immediately
    const updatedPlayer = { ...currentPlayer, isReady: newReadyState };
    const updatedPlayers = currentRoom.players.map(p =>
      p.id === currentPlayer.id ? { ...p, isReady: newReadyState } : p
    );
    const updatedRoom = { ...currentRoom, players: updatedPlayers };

    dispatch({
      type: 'UPDATE_ROOM',
      payload: { room: updatedRoom },
    });

    // Send to server
    socket.emit(
      SOCKET_EVENTS.PLAYER_READY,
      { roomCode: currentRoom.code, isReady: newReadyState },
      (response) => {
        if (!response.success) {
          console.error('Failed to update ready status:', response.error);
          // Revert on error - server will send the correct state via event
        }
      }
    );
  };

  const handleLeaveRoom = () => {
    if (!socket || !currentRoom) return;

    socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomCode: currentRoom.code }, (response) => {
      if (response.success || response.error?.code === 'ROOM_NOT_FOUND') {
        dispatch({ type: 'LEAVE_ROOM' });
        onLeave();
      }
    });
  };

  const handleStartGame = () => {
    if (!canStartGame() || !socket || !currentRoom) return;

    // Emit game start event to server with timerDuration
    socket.emit(
      SOCKET_EVENTS.GAME_START,
      { roomCode: currentRoom.code, difficulty: 'medium', timerDuration: 30 },
      (response) => {
        if (response.success) {
          // Server will broadcast game:started to all players
          // We'll handle the transition in the event listener
        } else {
          console.error('Failed to start game:', response.error);
        }
      }
    );
  };

  const canStartGame = () => {
    if (!currentRoom || !isHost) return false;
    // Need at least 2 players and all players must be ready (including host)
    return currentRoom.players.length >= 2 && currentRoom.players.every((p) => p.isReady);
  };

  if (!currentRoom || !currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <p>Loading room...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 relative overflow-hidden">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-[280px] sm:max-w-sm space-y-3 sm:space-y-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-4 animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-white tracking-tight">Room Lobby</h2>
          <p className="text-gray-400 text-sm sm:text-base">Waiting for players to ready up</p>
        </div>

        {/* Room Code Card */}
        <div className="bg-dark-elevated/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-primary/30 shadow-glow-sm">
          <p className="text-xs sm:text-sm text-gray-400 mb-2 text-center">Room Code</p>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <p className="text-2xl sm:text-3xl font-bold font-mono tracking-widest text-primary">
              {currentRoom.code}
            </p>
            <button
              onClick={handleCopyRoomCode}
              className="px-4 py-2 bg-dark-card hover:bg-dark-bg text-white rounded-lg transition-colors text-sm"
            >
              {isCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Share this link with your friend
          </p>
        </div>

        {/* Players List */}
        <div className="bg-dark-elevated/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-lg font-semibold mb-3 text-white">
            Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
          </h3>
          <div className="space-y-2">
            {currentRoom.players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 bg-dark-card rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      player.isReady ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                  />
                  <span className="font-semibold">
                    {player.name}
                    {player.isHost && (
                      <span className="ml-2 text-xs bg-primary text-dark-bg px-2 py-1 rounded">
                        HOST
                      </span>
                    )}
                    {player.id === currentPlayer.id && (
                      <span className="ml-2 text-xs text-gray-400">(You)</span>
                    )}
                  </span>
                </div>
                <span className={`text-sm ${player.isReady ? 'text-green-400' : 'text-gray-400'}`}>
                  {player.isReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="bg-dark-elevated/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
            <h3 className="text-lg font-semibold mb-3 text-white">Host Controls</h3>
            <div className="space-y-3">
              {/* Host Ready Button */}
              <button
                onClick={handleToggleReady}
                className={`w-full py-3 px-4 font-semibold text-base rounded-lg transition-all duration-200 shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${
                  currentPlayer.isReady
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                {currentPlayer.isReady ? 'Cancel Ready' : 'Ready Up'}
              </button>

              {/* Start Game Button */}
              <button
                onClick={handleStartGame}
                disabled={!canStartGame()}
                className="w-full py-3 px-4 bg-accent hover:bg-accent-dark text-white font-bold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-glow-sm transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* Ready Button (for non-hosts) */}
        {!isHost && (
          <button
            onClick={handleToggleReady}
            className={`w-full py-3 px-4 font-bold text-base rounded-lg transition-all duration-200 shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${
              currentPlayer.isReady
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-primary hover:bg-primary-dark text-white hover:shadow-glow-sm'
            }`}
          >
            {currentPlayer.isReady ? 'Cancel Ready' : 'Ready Up'}
          </button>
        )}

        {/* Leave Room Button */}
        {!showLeaveConfirm ? (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full py-3 px-4 bg-transparent hover:bg-red-900/30 text-red-400 hover:text-red-300 font-semibold text-base rounded-lg transition-all duration-200 border border-red-700/50 hover:border-red-600"
          >
            Leave Room
          </button>
        ) : (
          <div className="space-y-3 p-4 bg-dark-elevated/80 backdrop-blur-sm rounded-xl border border-red-700/50">
            <p className="text-center text-gray-300 text-sm">
              {isHost
                ? 'Leaving will close the room for all players. Are you sure?'
                : 'Are you sure you want to leave?'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleLeaveRoom}
                className="py-3 px-4 bg-error hover:bg-error-dark text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Yes, Leave
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="py-3 px-4 bg-transparent hover:bg-dark-elevated text-gray-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-gray-700 hover:border-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
