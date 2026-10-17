import AtlasScreen from './ui/AtlasScreen';

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
  onRetryLevel?: () => void;

  /**
   * Callback function triggered when Main Menu button is clicked
   */
  onMainMenu?: () => void;
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
  onMainMenu,
}: LevelCompleteProps) {
  // Calculate progress percentage (capped at 100%)
  const progressPercentage = Math.min((totalScore / threshold) * 100, 100);

  return (
    <div className="fixed inset-0 z-50">
      <AtlasScreen widthClass="max-w-md">
        <div className="atlas-card p-5 sm:p-7 text-center">
          {/* Header */}
          <div
            className={`mx-auto mb-3 inline-block animate-stamp rounded-lg border-[3px] px-3 py-1 font-display text-sm font-bold uppercase tracking-[0.18em] ${
              passed ? 'border-moss text-moss' : 'border-compass text-compass'
            }`}
          >
            <span aria-hidden="true">{passed ? '🎉 ' : '😔 '}</span>
            {passed ? 'Passed' : 'Not yet'}
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-1">
            {passed ? 'Level Complete!' : 'Level Failed'}
          </h2>
          <p className="text-ink-soft text-sm sm:text-base">
            {passed
              ? 'Great job! Ready for the next challenge?'
              : "Don't give up! Try again to improve your score."}
          </p>

          {/* Score Summary */}
          <div className="my-5 rounded-xl border border-paper-line bg-paper-deep/60 p-4 text-left">
            <div className="grid grid-cols-2 divide-x divide-paper-line">
              <div className="pr-3">
                <div className="atlas-eyebrow">Your Score:</div>
                <div className="font-display text-3xl font-bold tabular-nums text-ink">{formatNumber(totalScore)}</div>
              </div>
              <div className="pl-3">
                <div className="atlas-eyebrow">Required:</div>
                <div className="font-display text-3xl font-bold tabular-nums text-ink-soft">{formatNumber(threshold)}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-ink-faint">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-paper-line"
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-moss' : 'bg-compass'}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Next Level Button (only shown if passed) */}
            {passed && (
              <button onClick={onNextLevel} className="btn btn-success btn-block text-base">
                Next Level
              </button>
            )}

            {/* Retry Level Button (only shown if failed) */}
            {!passed && onRetryLevel && (
              <button onClick={onRetryLevel} className="btn btn-accent btn-block text-base">
                Retry Level
              </button>
            )}

            {/* Main Menu Button */}
            {onMainMenu && (
              <button onClick={onMainMenu} className="btn btn-ghost btn-block text-sm">
                Main Menu
              </button>
            )}
          </div>
        </div>
      </AtlasScreen>
    </div>
  );
}
