import { useState, useEffect } from 'react';
import { PlayerRoundResult } from '../types/game';
import { useSocket } from '../hooks/useSocket';

interface MultiplayerRoundResultsProps {
  /** Current round number */
  roundNumber: number;
  /** Total rounds in game */
  totalRounds: number;
  /** Results for all players */
  results: PlayerRoundResult[];
  /** Current player's ID */
  currentPlayerId: string;
  /** Target city name */
  targetCityName: string;
  /** Auto-advance countdown (5, 4, 3, 2, 1) or null */
  countdown: number | null;
  /** Current player's round score */
  roundScore: number;
  /** Current player's total score across all rounds */
  totalScore: number;
}

/**
 * Formats a number with commas for readability.
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * MultiplayerRoundResults component displays results for all players after a round.
 * Shows a table with player names, distances, scores, and time bonuses.
 * Highlights the current player's row and marks the winner with a crown.
 * Displays auto-advance countdown or continue button at the bottom.
 */
export default function MultiplayerRoundResults({
  roundNumber,
  totalRounds,
  results,
  currentPlayerId,
  targetCityName,
  countdown,
  roundScore,
  totalScore,
}: MultiplayerRoundResultsProps) {
  const { state: socketState } = useSocket();
  const socket = socketState.socket;

  const [hasClickedContinue, setHasClickedContinue] = useState(false);
  const [, setTick] = useState(0);

  // Force re-render every 100ms to update countdown display
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Reset continue state when countdown changes (new round)
  useEffect(() => {
    if (countdown !== null) {
      setHasClickedContinue(false);
    }
  }, [countdown]);

  // Handle continue button click
  const handleContinue = () => {
    if (!socket || hasClickedContinue) return;

    // Emit round:player_ready event to server
    socket.emit('round:player_ready', {
      playerId: currentPlayerId,
    });

    // Hide countdown for current player
    setHasClickedContinue(true);
  };

  // Sort results by round score + time bonus (descending)
  const sortedResults = [...results].sort((a, b) => {
    const scoreA = a.score + (a.timeBonus || 0);
    const scoreB = b.score + (b.timeBonus || 0);
    return scoreB - scoreA;
  });

  // Find winner (highest round score + time bonus)
  const winnerId = sortedResults[0]?.playerId;

  // Check if this is the final round
  const isFinalRound = roundNumber === totalRounds;

  return (
    <div className="absolute inset-x-4 bottom-4 z-40 flex flex-col items-center justify-end pointer-events-none gap-3">
      {/* Results Card */}
      <div className="bg-dark-elevated/95 backdrop-blur-sm rounded-lg shadow-2xl p-2 sm:p-3 animate-slide-up border border-primary/30 w-full max-w-[280px] sm:max-w-sm pointer-events-auto">
        {/* Header */}
        <div className="text-center mb-2">
          <h3 className="text-sm sm:text-base font-bold text-white">
            Round {roundNumber}/{totalRounds} • {targetCityName}
          </h3>
        </div>

        {/* Results Table */}
        <div className="bg-dark-card rounded-lg overflow-hidden mb-2">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-surface border-b border-gray-700">
                <th className="px-2 py-1 text-left text-[10px] sm:text-xs font-semibold text-gray-400 uppercase">
                  Player
                </th>
                <th className="px-2 py-1 text-right text-[10px] sm:text-xs font-semibold text-gray-400 uppercase">
                  <span className="hidden sm:inline">Dist.</span>
                  <span className="sm:hidden">D.</span>
                </th>
                <th className="px-2 py-1 text-right text-[10px] sm:text-xs font-semibold text-gray-400 uppercase">
                  Round
                </th>
                <th className="px-2 py-1 text-right text-[10px] sm:text-xs font-semibold text-gray-400 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, index) => {
                const isCurrentPlayer = result.playerId === currentPlayerId;
                const isWinner = result.playerId === winnerId;
                const timeBonus = result.timeBonus || 0;
                const roundTotal = result.score + timeBonus;
                const cumulativeTotal = result.totalScore || 0;

                return (
                  <tr
                    key={result.playerId}
                    className={`border-b border-gray-700/50 last:border-b-0 ${
                      isCurrentPlayer ? 'bg-primary/20' : index % 2 === 0 ? 'bg-dark-elevated' : 'bg-dark-card'
                    }`}
                  >
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        {isWinner && <span className="text-xs">👑</span>}
                        <span className="font-semibold text-white text-[11px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                          {result.playerName}
                          {isCurrentPlayer && (
                            <span className="ml-1 text-[10px] text-gray-400">(You)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="text-primary font-semibold text-[11px] sm:text-xs">
                        {result.distance !== null && result.distance !== undefined
                          ? formatNumber(Math.round(result.distance))
                          : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-green-400 font-bold text-xs sm:text-sm">
                          {formatNumber(roundTotal)}
                        </span>
                        {timeBonus > 0 && (
                          <span className="text-[9px] sm:text-[10px] text-amber-400">
                            +{formatNumber(timeBonus)} time
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {formatNumber(cumulativeTotal)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Your Score Summary */}
        <div className="bg-dark-surface rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 mb-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs">
            <span className="text-gray-300">Round Points:</span>
            <span className="font-bold text-green-400">+{formatNumber(roundScore)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs mt-0.5 sm:mt-1">
            <span className="text-gray-300">Total Score:</span>
            <span className="font-bold text-white text-sm sm:text-base">{formatNumber(totalScore)}</span>
          </div>
        </div>

        {/* Countdown or Calculating Message */}
        {countdown !== null && (
          <div className="text-center">
            {isFinalRound ? (
              <p className="text-xs sm:text-sm text-primary animate-pulse">
                Calculating results...
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-gray-400">
                Next round in <span className="font-bold text-primary">{countdown}</span>...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Continue Button */}
      {countdown !== null && !hasClickedContinue && (
        <button
          onClick={handleContinue}
          className="bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[44px] text-base sm:text-lg animate-slide-up pointer-events-auto"
          aria-label="Continue to next round"
        >
          Continue {countdown !== null && `(${countdown}s)`}
        </button>
      )}

      {/* Waiting message after clicking continue */}
      {hasClickedContinue && countdown !== null && (
        <div className="text-center text-xs sm:text-sm text-gray-400 pointer-events-auto">
          <p>Waiting for other players...</p>
        </div>
      )}
    </div>
  );
}
