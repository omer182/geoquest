/**
 * Props for the GameInfoCard component
 */
interface GameInfoCardProps {
  /**
   * Current level number (1-indexed)
   */
  level: number;

  /**
   * Current round number within the level (1-5)
   */
  round: number;

  /**
   * Score for the current round
   */
  currentScore: number;

  /**
   * Total accumulated score for the level
   */
  totalScore: number;

  /**
   * Required score threshold to pass the level
   */
  requiredScore: number;
}

/**
 * Formats a number with commas for readability.
 * Example: 1234567 -> "1,234,567"
 */
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}

/**
 * GameInfoCard Component
 *
 * Consolidated card that displays all game information in the top-left corner:
 * - Current round and level (e.g., "Turn 1/5 🏆 Level 1")
 * - Current score and points needed to advance
 * - Progress bar showing advancement toward next level
 *
 * @example
 * ```tsx
 * <GameInfoCard
 *   level={1}
 *   round={1}
 *   currentScore={0}
 *   totalScore={50}
 *   requiredScore={2000}
 * />
 * ```
 */
export default function GameInfoCard({
  level,
  round,
  totalScore,
  requiredScore,
}: GameInfoCardProps) {
  // Calculate points needed to advance
  const pointsNeeded = Math.max(0, requiredScore - totalScore);

  // Calculate progress percentage (0-100)
  const progressPercentage = Math.min(100, (totalScore / requiredScore) * 100);

  return (
    <div className="bg-dark-elevated/90 backdrop-blur-sm rounded-xl shadow-2xl px-3 py-2 border-2 border-primary min-w-[240px]">
      {/* Header: Round X/5 🏆 Level X */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-gray-300 font-medium text-xs">
          Round {round}/5
        </span>
        <div className="flex items-center gap-1">
          <span className="text-sm">🏆</span>
          <span className="text-white font-semibold text-xs">
            Level {level}
          </span>
        </div>
      </div>

      {/* Score: XX pts | XXXX to advance */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-bold text-lg">
          {formatNumber(totalScore)} pts
        </span>
        <span className="text-gray-400 text-xs">
          {formatNumber(pointsNeeded)} to advance
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-dark-surface rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
