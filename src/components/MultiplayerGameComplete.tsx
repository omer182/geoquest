import { useState } from 'react';
import { PlayerFinalStats, PlayerStanding } from '../types/game';

interface MultiplayerGameCompleteProps {
  /** Final standings with statistics */
  finalStandings: PlayerFinalStats[];
  /** Winner information */
  winner: PlayerStanding;
  /** Current player's ID */
  currentPlayerId: string;
  /** Set of player IDs who want rematch */
  rematchRequests: Set<string>;
  /** All players in the room */
  allPlayers: { id: string; name: string }[];
  /** Callback when Play Again is clicked */
  onPlayAgain: () => void;
  /** Callback when Leave Room is clicked */
  onLeaveRoom: () => void;
  /** Whether current player has already requested rematch */
  hasRequestedRematch: boolean;
  /** Rematch countdown (null if not started) */
  rematchCountdown: number | null;
}

/**
 * Formats a number with commas for readability.
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * MultiplayerGameComplete component displays final results after 5 rounds.
 * Shows podium-style ranking with medals, player statistics, and rematch functionality.
 */
export default function MultiplayerGameComplete({
  finalStandings,
  winner,
  currentPlayerId,
  rematchRequests,
  allPlayers,
  onPlayAgain,
  onLeaveRoom,
  hasRequestedRematch,
  rematchCountdown,
}: MultiplayerGameCompleteProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Debug logging
  console.log('[MultiplayerGameComplete] Render:', {
    currentPlayerId,
    rematchRequests: Array.from(rematchRequests),
    allPlayers,
    hasRequestedRematch,
    rematchCountdown,
  });

  // Sort standings by total score (descending)
  const sortedStandings = [...finalStandings].sort((a, b) => b.totalScore - a.totalScore);

  // Get medals for top 3
  const medals = ['🥇', '🥈', '🥉'];

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeave = () => {
    onLeaveRoom();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-dark-elevated rounded-2xl shadow-2xl max-w-[290px] sm:max-w-sm w-full p-3 sm:p-4 lg:p-6 animate-slide-up my-3 sm:my-6">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-2 sm:mb-3">🎉</div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">Game Complete!</h2>
        </div>

        {/* Podium Rankings */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="space-y-3">
            {sortedStandings.map((player, index) => {
              const isCurrentPlayer = player.playerId === currentPlayerId;
              const medal = medals[index] || '';

              return (
                <div
                  key={player.playerId}
                  className={`rounded-xl p-4 sm:p-6 ${
                    index === 0
                      ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500'
                      : isCurrentPlayer
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-dark-card border border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {medal && <span className="text-4xl">{medal}</span>}
                      <div>
                        <p className="text-xl font-bold text-white">
                          {player.playerName}
                          {isCurrentPlayer && (
                            <span className="ml-2 text-sm text-gray-400">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400">
                          Avg: {Math.round(player.averageDistance)} km
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">
                        {formatNumber(player.totalScore)}
                      </p>
                      <p className="text-xs text-gray-400">Total Score</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rematch Section */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Play Again?</h3>

          {/* Player list with inline ready buttons (RoomLobby pattern) */}
          <div className="space-y-3">
            {allPlayers.map((player) => {
              const wantsRematch = rematchRequests.has(player.id);
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 bg-dark-card rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        wantsRematch ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                    <span className="font-semibold text-white">
                      {player.name}
                      {wantsRematch && <span className="ml-2 text-green-400">✓</span>}
                      {isCurrentPlayer && (
                        <span className="ml-2 text-xs text-gray-400">(You)</span>
                      )}
                    </span>
                  </div>

                  {/* Ready button/status */}
                  {isCurrentPlayer ? (
                    <button
                      onClick={onPlayAgain}
                      disabled={hasRequestedRematch}
                      className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                        hasRequestedRematch
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-primary hover:bg-primary-dark text-white hover:shadow-lg'
                      }`}
                    >
                      Ready
                    </button>
                  ) : (
                    <span className={`text-sm font-medium ${wantsRematch ? 'text-green-400' : 'text-gray-400'}`}>
                      {wantsRematch ? 'Ready' : 'Not Ready'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Countdown Display */}
          {rematchCountdown !== null && (
            <div className="mt-4 bg-gradient-to-r from-green-600/20 to-green-500/20 border-2 border-green-500 rounded-lg p-4 text-center animate-pulse">
              <p className="text-2xl font-bold text-green-400 mb-1">
                {rematchCountdown}
              </p>
              <p className="text-sm text-gray-300">
                Starting new game...
              </p>
            </div>
          )}
        </div>

        {/* Leave Room Button */}
        {!showLeaveConfirm ? (
          <button
            onClick={handleLeaveClick}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            Leave Room
          </button>
        ) : (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-white mb-3 text-center">
              Are you sure? Other players won't be able to rematch.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmLeave}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
              >
                Yes, Leave
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
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
