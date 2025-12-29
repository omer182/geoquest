/**
 * Props for the LevelComplete component
 */
interface LevelCompleteProps {
  /**
   * Total score accumulated across all 5 rounds of the level
   */
  totalScore: number;

  /**
   * Minimum score required to pass the level
   */
  threshold: number;

  /**
   * Whether the player passed the level (totalScore >= threshold)
   */
  passed: boolean;

  /**
   * Callback function triggered when Next Level button is clicked
   */
  onNextLevel: () => void;

  /**
   * Callback function triggered when Retry Level button is clicked
   */
  onRetryLevel: () => void;

  /**
   * Callback function triggered when Restart Game button is clicked
   */
  onRestartGame: () => void;
}

/**
 * Formats a number with commas for readability.
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * LevelComplete Component
 *
 * Displays the level summary screen after completing all 5 rounds.
 * Shows:
 * - Total score for the level
 * - Required threshold
 * - Visual progress bar comparing score to threshold
 * - Pass/fail status
 * - Action buttons: Next Level (if passed), Retry Level, Restart Game
 *
 * @example
 * ```tsx
 * <LevelComplete
 *   totalScore={3500}
 *   threshold={2000}
 *   passed={true}
 *   onNextLevel={handleNextLevel}
 *   onRetryLevel={handleRetryLevel}
 *   onRestartGame={handleRestart}
 * />
 * ```
 */
export default function LevelComplete({
  totalScore,
  threshold,
  passed,
  onNextLevel,
  onRetryLevel,
  onRestartGame,
}: LevelCompleteProps) {
  // Calculate progress percentage (capped at 100%)
  const progressPercentage = Math.min((totalScore / threshold) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 lg:p-8 animate-slide-up">
        {/* Header - 40% smaller on mobile */}
        <div className="text-center mb-3 sm:mb-4 lg:mb-6">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-2 sm:mb-3">{passed ? '🎉' : '😔'}</div>
          <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {passed ? 'Level Complete!' : 'Level Failed'}
          </h2>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
            {passed
              ? 'Great job! Ready for the next challenge?'
              : "Don't give up! Try again to improve your score."}
          </p>
        </div>

        {/* Score Summary - 40% smaller on mobile */}
        <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6 space-y-2 sm:space-y-3 lg:space-y-4">
          {/* Total Score */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">Your Score:</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-teal-600">{formatNumber(totalScore)}</span>
          </div>

          {/* Threshold */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium text-xs sm:text-sm lg:text-base">Required:</span>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatNumber(threshold)}</span>
          </div>

          {/* Progress Bar */}
          <div className="pt-2 sm:pt-3 lg:pt-4">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div
              className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full transition-all duration-500 ${
                  passed
                    ? 'bg-gradient-to-r from-green-500 to-teal-500'
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - 40% smaller on mobile */}
        <div className="space-y-2 sm:space-y-3">
          {/* Next Level Button (only shown if passed) */}
          {passed && (
            <button
              onClick={onNextLevel}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[44px] text-sm sm:text-base lg:text-lg"
            >
              Next Level
            </button>
          )}

          {/* Retry Level Button */}
          <button
            onClick={onRetryLevel}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[44px] text-sm sm:text-base lg:text-lg"
          >
            Retry Level
          </button>

          {/* Restart Game Button */}
          <button
            onClick={onRestartGame}
            className="w-full bg-gray-200 text-gray-700 font-bold py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl hover:bg-gray-300 transition-all duration-200 min-h-[44px] text-sm sm:text-base lg:text-lg"
          >
            Restart Game
          </button>
        </div>
      </div>
    </div>
  );
}
