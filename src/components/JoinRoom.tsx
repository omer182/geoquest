import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../context/GameContext';
import { SOCKET_EVENTS } from '../types/socket-events';
import AtlasScreen, { AtlasHeading } from './ui/AtlasScreen';

interface JoinRoomProps {
  onRoomJoined: () => void;
  onBack: () => void;
}

/**
 * JoinRoom component - Join an existing multiplayer room
 * Accepts room code via URL parameter or manual input
 */
export default function JoinRoom({ onRoomJoined, onBack }: JoinRoomProps) {
  const { state: socketState, socket } = useSocket();
  const { dispatch } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for room code in URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code);
    }
  }, []);

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    // Validate room code format (5 digits)
    if (!/^\d{5}$/.test(roomCode.trim())) {
      setError('Room code must be 5 digits');
      return;
    }

    if (!socket) {
      setError('Not connected to server');
      return;
    }

    if (socketState.connectionStatus !== 'connected') {
      setError('Connection not ready. Please wait...');
      return;
    }

    setIsJoining(true);
    setError(null);

    socket.emit(
      SOCKET_EVENTS.JOIN_ROOM,
      { roomCode: roomCode.trim(), playerName: playerName.trim() },
      (response) => {
        setIsJoining(false);

        if (response.success && response.data) {
          // Update game context with room and player data
          dispatch({
            type: 'JOIN_ROOM',
            payload: {
              room: response.data.room,
              player: response.data.player,
            },
          });

          // Clear URL parameter if present
          if (window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
          }

          // Navigate to lobby
          onRoomJoined();
        } else {
          const errorMessage = response.error?.message || 'Failed to join room';
          setError(errorMessage);
        }
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  const handleRoomCodeChange = (value: string) => {
    // Only allow digits, max 5 characters
    const digits = value.replace(/\D/g, '').slice(0, 5);
    setRoomCode(digits);
  };

  return (
    <AtlasScreen>
      <AtlasHeading eyebrow="Online Battle" title="Join Room" subtitle="Enter a room code to join a game" />

      <div className="atlas-card space-y-4 p-5">
        {/* Connection Status */}
        {socketState.connectionStatus !== 'connected' && (
          <div className="atlas-notice atlas-notice-warn">Connecting to server...</div>
        )}

        {/* Error Message */}
        {error && <div className="atlas-notice atlas-notice-error">{error}</div>}

        {/* Room Code Input - styled like a ticket stub */}
        <div>
          <label htmlFor="roomCode" className="atlas-label">
            Room Code
          </label>
          <input
            id="roomCode"
            type="text"
            inputMode="numeric"
            value={roomCode}
            onChange={(e) => handleRoomCodeChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="12345"
            maxLength={5}
            disabled={isJoining}
            className="atlas-input border-dashed text-center font-mono text-3xl font-bold tracking-[0.4em]"
          />
          <p className="mt-1 text-center text-xs text-ink-faint">5-digit code</p>
        </div>

        {/* Player Name Input */}
        <div>
          <label htmlFor="playerName" className="atlas-label">
            Your Name
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your name"
            maxLength={20}
            disabled={isJoining}
            className="atlas-input"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleJoinRoom}
            disabled={
              isJoining ||
              !playerName.trim() ||
              !roomCode.trim() ||
              socketState.connectionStatus !== 'connected'
            }
            className="btn btn-primary btn-block"
          >
            {isJoining ? 'Joining Room...' : 'Join Room'}
          </button>

          <button onClick={onBack} disabled={isJoining} className="btn btn-ghost btn-block text-sm">
            Back
          </button>
        </div>
      </div>
    </AtlasScreen>
  );
}
