import { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../context/GameContext';
import { SOCKET_EVENTS } from '../types/socket-events';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 relative overflow-hidden">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-[280px] sm:max-w-[320px] space-y-3 sm:space-y-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-primary">Create Room</h2>
          <p className="text-gray-400 text-sm sm:text-base">Start a new multiplayer game</p>
        </div>

        {/* Connection Status */}
        {socketState.connectionStatus !== 'connected' && (
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-3 text-center">
            <p className="text-yellow-400 text-sm">Connecting to server...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Player Name Input */}
        <div className="space-y-2">
          <label htmlFor="playerName" className="block text-sm font-semibold text-gray-300">
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
            className="w-full px-4 py-3 bg-dark-elevated text-white rounded-lg border-2 border-dark-card focus:border-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mt-4">
          <button
            onClick={handleCreateRoom}
            disabled={isCreating || !playerName.trim() || socketState.connectionStatus !== 'connected'}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-lg transition-colors duration-200 shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            {isCreating ? 'Creating Room...' : 'Create Room'}
          </button>

          <button
            onClick={onBack}
            disabled={isCreating}
            className="w-full py-2.5 px-4 bg-dark-card hover:bg-dark-elevated text-gray-300 font-semibold text-sm rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
