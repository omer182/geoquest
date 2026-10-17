import { useState, useEffect } from 'react';
import { PlayerRoundResult } from '../types/game';
import { useSocket } from '../hooks/useSocket';
import { SOCKET_EVENTS } from '../types/socket-events';

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
  /** Room code for multiplayer session */
  roomCode: string;
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
  roomCode,
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

  // Reset continue state only when round number changes (new round)
  useEffect(() => {
    setHasClickedContinue(false);
  }, [roundNumber]);

  // Handle continue button click
  const handleContinue = () => {
    if (!socket || hasClickedContinue) return;

    console.log('[MultiplayerRoundResults] Continue clicked, emitting round:player_ready', {
      roomCode,
      playerId: currentPlayerId,
    });

    // Emit round:player_ready event to server
    socket.emit(SOCKET_EVENTS.ROUND_PLAYER_READY, {
      roomCode,
      playerId: currentPlayerId,
    });

    // Hide countdown for current player
    setHasClickedContinue(true);
  };

  // Sort results by total score (cumulative, descending - highest first).
  // Ties: this round's points, then the closer guess (no pin counts as furthest).
  const distanceOf = (r: PlayerRoundResult) =>
    r.distance === null || r.distance === undefined ? Infinity : r.distance;
  const sortedResults = [...results].sort(
    (a, b) =>
      (b.totalScore || 0) - (a.totalScore || 0) ||
      b.score + (b.timeBonus || 0) - (a.score + (a.timeBonus || 0)) ||
      distanceOf(a) - distanceOf(b)
  );

  // Crown always goes to the top player (first in sorted list)
  const winnerId = sortedResults.length > 0 ? sortedResults[0].playerId : null;

  // Check if this is the final round
  const isFinalRound = roundNumber === totalRounds;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-end pointer-events-none gap-3 px-4 pb-4 sm:pb-6"
      style={{ maxHeight: '90vh', overflowY: 'auto' }}
      data-map-overlay="bottom"
    >
      {/* Results Card */}
      <div className="atlas-card p-3 sm:p-4 animate-slide-up w-full max-w-[calc(100vw-2rem)] sm:max-w-sm pointer-events-auto">
        {/* Header */}
        <div className="text-center mb-2">
          <h3 className="font-display text-lg sm:text-xl font-semibold text-ink">
            Round {roundNumber}/{totalRounds} • {targetCityName}
          </h3>
        </div>

        {/* Results Table */}
        <div className="rounded-xl border border-paper-line overflow-hidden mb-2">
          <table className="w-full">
            <thead>
              <tr className="bg-paper-deep border-b border-paper-line">
                <th className="px-2 py-1.5 text-left text-[10px] sm:text-xs font-semibold text-ink-faint uppercase tracking-wider">
                  Player
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] sm:text-xs font-semibold text-ink-faint uppercase tracking-wider">
                  <span className="hidden sm:inline">Dist.</span>
                  <span className="sm:hidden">D.</span>
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] sm:text-xs font-semibold text-ink-faint uppercase tracking-wider">
                  Round
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] sm:text-xs font-semibold text-ink-faint uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result) => {
                const isCurrentPlayer = result.playerId === currentPlayerId;
                const isWinner = result.playerId === winnerId;
                const timeBonus = result.timeBonus || 0;
                const roundTotal = result.score + timeBonus;
                const cumulativeTotal = result.totalScore || 0;

                return (
                  <tr
                    key={result.playerId}
                    className={`border-b border-paper-line/70 last:border-b-0 ${
                      isCurrentPlayer ? 'bg-sea/20' : 'bg-white/40'
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        {isWinner && <span className="text-xs">👑</span>}
                        <span className="font-semibold text-ink text-[11px] sm:text-sm truncate max-w-[80px] sm:max-w-none">
                          {result.playerName}
                          {isCurrentPlayer && (
                            <span className="ml-1 text-[10px] font-normal text-ink-faint">(You)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className="text-sea-deep font-semibold text-[11px] sm:text-xs tabular-nums">
                        {result.distance !== null && result.distance !== undefined
                          ? formatNumber(Math.round(result.distance))
                          : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className="text-moss font-bold text-xs sm:text-sm tabular-nums">
                        {formatNumber(roundTotal)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className="text-ink font-bold text-xs sm:text-sm tabular-nums">
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
        <div className="flex items-center justify-between rounded-xl bg-ink px-3 py-2 text-paper">
          <span className="text-xs font-medium text-paper/80">Total Score:</span>
          <span className="font-display font-bold text-base sm:text-lg tabular-nums">{formatNumber(totalScore)}</span>
        </div>

        {/* Calculating Message (final round only) */}
        {countdown !== null && isFinalRound && (
          <div className="text-center mt-2">
            <p className="text-xs sm:text-sm text-compass animate-pulse">
              Calculating results...
            </p>
          </div>
        )}
      </div>

      {/* Continue Button */}
      {countdown !== null && !isFinalRound && (
        <button
          onClick={handleContinue}
          disabled={hasClickedContinue}
          className={`btn min-h-[44px] rounded-full px-6 sm:px-8 animate-slide-up pointer-events-auto ${
            hasClickedContinue ? 'hud-card cursor-wait text-ink-soft' : 'btn-primary'
          }`}
          aria-label="Continue to next round"
        >
          {hasClickedContinue
            ? `Waiting... (${countdown})`
            : `Continue (${countdown})`}
        </button>
      )}
    </div>
  );
}
