import { PlayerRoundResult } from '../types/game';

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
 * Shows a table with player names, distances, and scores.
 * Highlights the current player's row and marks the winner with a crown.
 * Displays auto-advance countdown at the bottom.
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
  // Sort results by score (descending)
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  // Find winner (highest score)
  const winnerId = sortedResults[0]?.playerId;

  return (
    <div className="absolute inset-x-4 bottom-4 z-40 flex items-end justify-center pointer-events-none">
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
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, index) => {
                const isCurrentPlayer = result.playerId === currentPlayerId;
                const isWinner = result.playerId === winnerId;

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
                        <span className="font-semibold text-white text-[11px] sm:text-xs">
                          {result.playerName}
                          {isCurrentPlayer && (
                            <span className="ml-1 text-[10px] text-gray-400">(You)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="text-primary font-semibold text-[11px] sm:text-xs">
                        {formatNumber(Math.round(result.distance))}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span className="text-green-400 font-bold text-xs sm:text-sm">
                        {formatNumber(result.score)}
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
            <span className="text-gray-400">Round Points:</span>
            <span className="font-bold text-green-400">+{formatNumber(roundScore)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs mt-0.5 sm:mt-1">
            <span className="text-gray-400">Total Score:</span>
            <span className="font-bold text-white">{formatNumber(totalScore)}</span>
          </div>
        </div>

        {/* Countdown */}
        {countdown !== null && (
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-400">
              Next round in <span className="font-bold text-primary">{countdown}</span>...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
