import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
  onRematch: () => void;
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
 * Features gradient background, animated orbs, and winner confetti animation.
 * Optimized for mobile (390px width) with standardized font colors.
 */
export default function MultiplayerGameComplete({
  finalStandings,
  winner,
  currentPlayerId,
  rematchRequests,
  allPlayers,
  onRematch,
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

  // Check if current player is the winner
  const isWinner = sortedStandings.length > 0 && currentPlayerId === sortedStandings[0].playerId;

  // Confetti animation for winner
  useEffect(() => {
    if (!isWinner) return;

    // Auto-play confetti 1 second after final results display
    const confettiTimer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 1000);

    // Clean up animation on component unmount
    return () => {
      clearTimeout(confettiTimer);
    };
  }, [isWinner]);

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeave = () => {
    onLeaveRoom();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl max-w-[290px] sm:max-w-sm w-full p-3 sm:p-4 lg:p-6 animate-slide-up my-3 sm:my-6 relative z-10">
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
              const isFirstPlace = index === 0;

              return (
                <div
                  key={player.playerId}
                  className={`rounded-xl p-3 sm:p-4 md:p-6 ${
                    isFirstPlace
                      ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500'
                      : isCurrentPlayer
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-slate-700/50 border border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {medal && <span className="text-3xl sm:text-4xl flex-shrink-0">{medal}</span>}
                      <div className="min-w-0">
                        <p className={`text-base sm:text-xl font-bold truncate ${isFirstPlace ? 'text-green-400' : 'text-white'}`}>
                          {player.playerName}
                          {isCurrentPlayer && (
                            <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-300">(You)</span>
                          )}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-300">
                          Avg: {Math.round(player.averageDistance)} km
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${isFirstPlace ? 'text-green-400' : 'text-white'}`}>
                        {formatNumber(player.totalScore)}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400">Total Score</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rematch Section */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 text-center">Play Again?</h3>

          {/* Player list with inline ready buttons (RoomLobby pattern) */}
          <div className="space-y-2 sm:space-y-3">
            {allPlayers.map((player) => {
              const wantsRematch = rematchRequests.has(player.id);
              const isCurrentPlayer = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                        wantsRematch ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                    <span className="font-semibold text-white text-sm sm:text-base truncate">
                      {player.name}
                      {wantsRematch && <span className="ml-1.5 sm:ml-2 text-green-400">✓</span>}
                      {isCurrentPlayer && (
                        <span className="ml-1.5 sm:ml-2 text-xs text-gray-400">(You)</span>
                      )}
                    </span>
                  </div>

                  {/* Ready button/status */}
                  {isCurrentPlayer ? (
                    <button
                      onClick={() => {
                        console.log('[MultiplayerGameComplete] Ready button clicked', {
                          hasRequestedRematch,
                          currentPlayerId,
                        });
                        onRematch();
                      }}
                      disabled={hasRequestedRematch}
                      className={`px-3 sm:px-4 py-1.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 min-h-[44px] flex-shrink-0 ${
                        hasRequestedRematch
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-primary hover:bg-primary-dark text-white hover:shadow-lg'
                      }`}
                    >
                      Ready
                    </button>
                  ) : (
                    <span className={`text-xs sm:text-sm font-medium flex-shrink-0 ${wantsRematch ? 'text-green-400' : 'text-gray-400'}`}>
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
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200 min-h-[44px]"
          >
            Leave Room
          </button>
        ) : (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-white mb-3 text-center text-sm sm:text-base">
              Are you sure? Other players won't be able to rematch.
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={confirmLeave}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors duration-200 text-sm sm:text-base min-h-[44px]"
              >
                Yes, Leave
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors duration-200 text-sm sm:text-base min-h-[44px]"
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
