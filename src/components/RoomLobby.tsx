import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useGame } from '../context/GameContext';
import { SOCKET_EVENTS } from '../types/socket-events';
import { Room } from '../types/socket-events';
import { DifficultyLevel } from '../types/game';
import { City } from '../types/city';
import AtlasScreen, { AtlasHeading } from './ui/AtlasScreen';

interface RoomLobbyProps {
  onGameStart: () => void;
  onLeave: () => void;
}

/**
 * RoomLobby component - Waiting room for multiplayer game
 * Shows player list, ready status, room code, and host controls
 * Optimized for mobile (390px width minimum)
 */
export default function RoomLobby({ onGameStart, onLeave }: RoomLobbyProps) {
  const { state: socketState, socket } = useSocket();
  const { state: gameState, dispatch } = useGame();
  const [isCopied, setIsCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [timerDuration, setTimerDuration] = useState<number>(30);

  const currentRoom = gameState.currentRoom;
  const currentPlayer = gameState.currentPlayer;
  const isHost = currentPlayer?.isHost || false;

  // Handle automatic room rejoin on reconnection
  useEffect(() => {
    if (!socket || !currentRoom || !currentPlayer) return;

    // Check if we just reconnected (socket is connected but we have a previous socket ID stored)
    const previousSocketId = sessionStorage.getItem('previous_socket_id');
    if (!previousSocketId || socketState.connectionStatus !== 'connected') return;

    // Consume the stored ID up front so this effect can't fire the rejoin twice
    sessionStorage.removeItem('previous_socket_id');

    // Stale ID (e.g. from an earlier connection): we're already in this room
    // under the current socket, so there is nothing to restore
    if (previousSocketId === socket.id || currentPlayer.id === socket.id) return;

    console.log('[RoomLobby] Detected reconnection, attempting to rejoin room', {
      roomCode: currentRoom.code,
      previousSocketId,
      newSocketId: socket.id
    });

    // Rejoin the room with previous socket ID for session restoration
    socket.emit(
      SOCKET_EVENTS.JOIN_ROOM,
      {
        roomCode: currentRoom.code,
        playerName: currentPlayer.name,
        previousSocketId: previousSocketId,
      },
      (response: any) => {
        if (response.success) {
          console.log('[RoomLobby] Successfully rejoined room after reconnection', response.data);

          // Update local state with rejoined room
          dispatch({
            type: 'UPDATE_ROOM',
            payload: { room: response.data.room },
          });
        } else {
          console.error('[RoomLobby] Failed to rejoin room:', response.error);
        }
      }
    );
  }, [socketState.connectionStatus, socket, currentRoom, currentPlayer, dispatch]);

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

  const handleCopyRoomCode = async () => {
    if (!currentRoom) return;

    // Copy shareable link
    const shareableLink = `${window.location.origin}${window.location.pathname}?room=${currentRoom.code}`;

    try {
      // Try modern Clipboard API first (requires HTTPS)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareableLink);
      } else {
        // Fallback for HTTP or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareableLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback copy failed:', err);
          // Show link in a prompt as last resort
          prompt('Copy this link:', shareableLink);
          return;
        } finally {
          document.body.removeChild(textArea);
        }
      }

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Show link in a prompt as fallback
      prompt('Copy this link:', shareableLink);
    }
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
      { roomCode: currentRoom.code, difficulty, timerDuration },
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
      <AtlasScreen>
        <p className="text-center text-sm text-ink-soft">Loading room...</p>
      </AtlasScreen>
    );
  }

  return (
    <AtlasScreen widthClass="max-w-[380px]">
      <AtlasHeading eyebrow="Base camp" title="Room Lobby" subtitle="Waiting for players to ready up" />

      <div className="atlas-card space-y-4 p-4 sm:p-5">
        {/* Room Code - ticket stub */}
        <div className="rounded-xl border border-dashed border-paper-edge bg-paper-deep/60 p-3 text-center">
          <p className="atlas-eyebrow">Room Code</p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <p className="font-mono text-3xl font-bold tracking-[0.3em] text-ink">{currentRoom.code}</p>
            <button onClick={handleCopyRoomCode} className="btn btn-secondary px-3 py-1.5 text-sm">
              {isCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-faint">Share this link with your friend</p>
        </div>

        {/* Players List */}
        <div>
          <h3 className="mb-2 flex items-baseline justify-between font-display text-lg font-semibold text-ink">
            Players ({currentRoom.players.length}/{currentRoom.maxPlayers})
          </h3>
          <ul className="max-h-[240px] space-y-1.5 overflow-y-auto">
            {currentRoom.players.map((player) => (
              <li
                key={player.id}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                  player.id === currentPlayer.id ? 'border-sea-deep/30 bg-sea/15' : 'border-paper-line bg-white/50'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className={`status-dot ${player.isReady ? 'bg-moss' : 'bg-ink-faint/50'}`} />
                  <span className="truncate text-sm font-semibold text-ink">
                    {player.name}
                    {player.isHost && (
                      <span className="ml-1.5 rounded bg-brass px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                        HOST
                      </span>
                    )}
                    {player.id === currentPlayer.id && (
                      <span className="ml-1.5 text-xs font-normal text-ink-faint">(You)</span>
                    )}
                  </span>
                </div>
                <span
                  className={`ml-2 flex-shrink-0 text-xs font-semibold ${player.isReady ? 'text-moss' : 'text-ink-faint'}`}
                >
                  {player.isReady ? 'Ready' : 'Not Ready'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="space-y-2 border-t border-paper-line pt-4">
            <h3 className="atlas-eyebrow">Host Controls</h3>

            {/* Game settings */}
            <SegmentedControl<DifficultyLevel>
              label="Difficulty"
              value={difficulty}
              onChange={setDifficulty}
              options={[
                { value: 'easy', label: 'Easy', hint: 'Famous cities (levels 1-3)' },
                { value: 'medium', label: 'Medium', hint: 'Well-known cities (levels 4-7)' },
                { value: 'hard', label: 'Hard', hint: 'Obscure cities (levels 8-10)' },
              ]}
            />
            <SegmentedControl<number>
              label="Time per round"
              value={timerDuration}
              onChange={setTimerDuration}
              options={[15, 30, 45, 60].map((s) => ({ value: s, label: `${s}s` }))}
            />

            {/* Host Ready Button */}
            <button
              onClick={handleToggleReady}
              className={`btn btn-block ${currentPlayer.isReady ? 'btn-secondary' : 'btn-primary'}`}
            >
              {currentPlayer.isReady ? 'Cancel Ready' : 'Ready Up'}
            </button>

            {/* Start Game Button */}
            <button onClick={handleStartGame} disabled={!canStartGame()} className="btn btn-accent btn-block">
              Start Game
            </button>
          </div>
        )}

        {/* Ready Button (for non-hosts) */}
        {!isHost && (
          <button
            onClick={handleToggleReady}
            className={`btn btn-block ${currentPlayer.isReady ? 'btn-secondary' : 'btn-success'}`}
          >
            {currentPlayer.isReady ? 'Cancel Ready' : 'Ready Up'}
          </button>
        )}

        {/* Leave Room Button */}
        {!showLeaveConfirm ? (
          <button onClick={() => setShowLeaveConfirm(true)} className="btn btn-danger btn-block text-sm">
            Leave Room
          </button>
        ) : (
          <div className="space-y-2 rounded-xl border border-compass/30 bg-compass/5 p-3">
            <p className="text-center text-sm text-ink-soft">
              {isHost
                ? 'Leaving will close the room for all players. Are you sure?'
                : 'Are you sure you want to leave?'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleLeaveRoom} className="btn btn-accent text-sm">
                Yes, Leave
              </button>
              <button onClick={() => setShowLeaveConfirm(false)} className="btn btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AtlasScreen>
  );
}

interface SegmentedOption<T> {
  value: T;
  label: string;
  hint?: string;
}

/**
 * Small pill selector for host game settings.
 */
function SegmentedControl<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink-soft">{label}</span>
        {selected?.hint && <span className="text-[11px] text-ink-faint">{selected.hint}</span>}
      </div>
      <div className="flex gap-1 rounded-xl border border-paper-line bg-paper-deep/60 p-1">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onChange(o.value)}
            className={`min-h-[36px] flex-1 rounded-lg text-sm font-semibold transition-colors ${
              o.value === value ? 'bg-ink text-paper shadow-sm' : 'text-ink-soft hover:bg-white/70'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
