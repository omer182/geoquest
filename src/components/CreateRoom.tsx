import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../context/GameContext';
import { SOCKET_EVENTS } from '../types/socket-events';
import AtlasScreen, { AtlasHeading } from './ui/AtlasScreen';

interface CreateRoomProps {
  onRoomCreated: () => void;
  onBack: () => void;
}

/**
 * CreateRoom component - Create a new multiplayer room
 * Collects player name and creates room via WebSocket
 */
export default function CreateRoom({ onRoomCreated, onBack }: CreateRoomProps) {
  const { state: socketState, socket } = useSocket();
  const { dispatch } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!socket) {
      setError(`Not connected to server. Status: ${socketState.connectionStatus}`);
      return;
    }

    if (socketState.connectionStatus !== 'connected') {
      setError('Connection not ready. Please wait...');
      return;
    }

    setIsCreating(true);
    setError(null);

    socket.emit(
      SOCKET_EVENTS.CREATE_ROOM,
      { playerName: playerName.trim(), maxPlayers: 5 },
      (response) => {
        setIsCreating(false);

        if (response.success && response.data) {
          // Update game context with room and player data
          dispatch({
            type: 'JOIN_ROOM',
            payload: {
              room: response.data.room,
              player: response.data.player,
            },
          });

          // Navigate to lobby
          onRoomCreated();
        } else {
          setError(response.error?.message || 'Failed to create room');
        }
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateRoom();
    }
  };

  return (
    <AtlasScreen>
      <AtlasHeading eyebrow="Online Battle" title="Create Room" subtitle="Start a new multiplayer game" />

      <div className="atlas-card space-y-4 p-5">
        {/* Connection Status */}
        {socketState.connectionStatus !== 'connected' && (
          <div className="atlas-notice atlas-notice-warn">Connecting to server...</div>
        )}

        {/* Error Message */}
        {error && <div className="atlas-notice atlas-notice-error">{error}</div>}

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
            disabled={isCreating}
            autoFocus
            className="atlas-input"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCreateRoom}
            disabled={isCreating || !playerName.trim() || socketState.connectionStatus !== 'connected'}
            className="btn btn-accent btn-block"
          >
            {isCreating ? 'Creating Room...' : 'Create Room'}
          </button>

          <button onClick={onBack} disabled={isCreating} className="btn btn-ghost btn-block text-sm">
            Back
          </button>
        </div>
      </div>
    </AtlasScreen>
  );
}
