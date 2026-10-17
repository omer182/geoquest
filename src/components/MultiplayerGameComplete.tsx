import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerFinalStats, PlayerStanding } from '../types/game';
import AtlasScreen from './ui/AtlasScreen';

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
    <div className="fixed inset-0 z-50">
      <AtlasScreen widthClass="max-w-[360px] sm:max-w-sm">
        <div className="atlas-card p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-4xl sm:text-5xl mb-1">🏆</div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink">Game Complete!</h2>
          </div>

          {/* Podium Rankings */}
          <div className="mb-5 space-y-2">
            {sortedStandings.map((player, index) => {
              const isCurrentPlayer = player.playerId === currentPlayerId;
              const medal = medals[index] || '';
              const isFirstPlace = index === 0;

              return (
                <div
                  key={player.playerId}
                  className={`rounded-xl border p-3 sm:p-4 ${
                    isFirstPlace
                      ? 'border-brass bg-brass-light/25 shadow-[inset_0_0_0_1px_rgba(201,150,43,0.4)]'
                      : isCurrentPlayer
                      ? 'border-sea-deep/30 bg-sea/15'
                      : 'border-paper-line bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      {medal && <span className="text-3xl flex-shrink-0">{medal}</span>}
                      <div className="min-w-0">
                        <p className="text-base sm:text-lg font-semibold truncate text-ink">
                          {player.playerName}
                          {isCurrentPlayer && (
                            <span className="ml-1.5 text-xs font-normal text-ink-faint">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-soft">
                          Avg: {Math.round(player.averageDistance)} km
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${isFirstPlace ? 'text-brass' : 'text-ink'}`}>
                        {formatNumber(player.totalScore)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-ink-faint">Total Score</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rematch Section */}
          <div className="mb-4 border-t border-paper-line pt-4">
            <h3 className="font-display text-xl font-semibold text-ink mb-3 text-center">Play Again?</h3>

            {/* Player list with inline ready buttons (RoomLobby pattern) */}
            <div className="space-y-1.5">
              {allPlayers.map((player) => {
                const wantsRematch = rematchRequests.has(player.id);
                const isCurrentPlayer = player.id === currentPlayerId;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl border border-paper-line bg-white/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`status-dot ${wantsRematch ? 'bg-moss' : 'bg-ink-faint/50'}`} />
                      <span className="font-semibold text-ink text-sm truncate">
                        {player.name}
                        {wantsRematch && <span className="ml-1.5 text-moss">✓</span>}
                        {isCurrentPlayer && (
                          <span className="ml-1.5 text-xs font-normal text-ink-faint">(You)</span>
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
                        className={`btn px-4 py-1.5 text-sm flex-shrink-0 ${
                          hasRequestedRematch ? 'btn-success disabled:opacity-100 cursor-default' : 'btn-primary'
                        }`}
                      >
                        Ready
                      </button>
                    ) : (
                      <span className={`text-xs font-semibold flex-shrink-0 ${wantsRematch ? 'text-moss' : 'text-ink-faint'}`}>
                        {wantsRematch ? 'Ready' : 'Not Ready'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Countdown Display */}
            {rematchCountdown !== null && (
              <div className="mt-3 rounded-xl border-2 border-moss bg-moss/10 p-3 text-center">
                <p className="font-display text-3xl font-bold text-moss">{rematchCountdown}</p>
                <p className="text-sm text-ink-soft">Starting new game...</p>
              </div>
            )}
          </div>

          {/* Leave Room Button */}
          {!showLeaveConfirm ? (
            <button onClick={handleLeaveClick} className="btn btn-danger btn-block text-sm">
              Leave Room
            </button>
          ) : (
            <div className="rounded-xl border border-compass/30 bg-compass/5 p-3">
              <p className="mb-2 text-center text-sm text-ink-soft">
                Are you sure? Other players won't be able to rematch.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={confirmLeave} className="btn btn-accent text-sm">
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
    </div>
  );
}
