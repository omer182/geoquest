/**
 * Props for the ScoreDisplay component
 */
interface ScoreDisplayProps {
  /**
   * Score for the current round
   */
  currentScore: number;

  /**
   * Total accumulated score for the level
   */
  totalScore: number;
}

/**
 * Formats a number with commas for readability.
 * Example: 1234567 -> "1,234,567"
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * ScoreDisplay Component
 *
 * Shows the current round score and total level score.
 * Numbers are formatted with commas for better readability.
 *
 * @example
 * ```tsx
 * <ScoreDisplay currentScore={750} totalScore={2500} />
 * // Renders current score: 750, total score: 2,500
 * ```
 */
export default function ScoreDisplay({ currentScore, totalScore }: ScoreDisplayProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg px-6 py-4 mb-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Current Round Score */}
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">
            Round Score
          </p>
          <p className="text-2xl font-bold text-teal-600">{formatNumber(currentScore)}</p>
        </div>

        {/* Total Level Score */}
        <div className="text-center border-l border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">
            Total Score
          </p>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(totalScore)}</p>
        </div>
      </div>
    </div>
  );
}
