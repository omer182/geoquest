import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGame } from '../context/GameContext';
import { SOCKET_EVENTS } from '../types/socket-events';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 relative overflow-hidden">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-[280px] sm:max-w-[320px] space-y-3 sm:space-y-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 text-primary">Join Room</h2>
          <p className="text-gray-400 text-sm sm:text-base">Enter a room code to join a game</p>
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

        {/* Room Code Input */}
        <div className="space-y-2">
          <label htmlFor="roomCode" className="block text-sm font-semibold text-gray-300">
            Room Code
          </label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(e) => handleRoomCodeChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="12345"
            maxLength={5}
            disabled={isJoining}
            className="w-full px-4 py-3 bg-dark-elevated text-white text-2xl text-center tracking-widest rounded-lg border-2 border-dark-card focus:border-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
          />
          <p className="text-xs text-gray-500 text-center">5-digit code</p>
        </div>

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
            disabled={isJoining}
            className="w-full px-4 py-3 bg-dark-elevated text-white rounded-lg border-2 border-dark-card focus:border-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mt-4">
          <button
            onClick={handleJoinRoom}
            disabled={
              isJoining ||
              !playerName.trim() ||
              !roomCode.trim() ||
              socketState.connectionStatus !== 'connected'
            }
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-base rounded-lg transition-colors duration-200 shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            {isJoining ? 'Joining Room...' : 'Join Room'}
          </button>

          <button
            onClick={onBack}
            disabled={isJoining}
            className="w-full py-2.5 px-4 bg-dark-card hover:bg-dark-elevated text-gray-300 font-semibold text-sm rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
