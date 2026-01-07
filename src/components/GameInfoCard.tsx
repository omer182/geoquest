import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

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

  // Track if confetti has been triggered for this threshold pass
  const confettiTriggeredRef = useRef(false);

  // Function to trigger confetti
  const triggerConfetti = () => {
    // Small confetti positioned over the progress bar (top-left area)
    // Using smaller scale and more particles for visibility
    confetti({
      particleCount: 100,
      spread: 100,
      startVelocity: 20,
      origin: { x: 0.1, y: 0.15 }, // Positioned over progress bar area
      colors: ['#10b981', '#22d3ee', '#3b82f6', '#a855f7', '#f59e0b'], // Green, teal, blue, purple, amber
      scalar: 0.8, // Smaller scale
      gravity: 1, // Less gravity for more visible particles
    });
  };

  // Trigger small confetti when threshold is reached
  useEffect(() => {
    if (pointsNeeded === 0 && !confettiTriggeredRef.current) {
      confettiTriggeredRef.current = true;
      triggerConfetti();
    } else if (pointsNeeded > 0) {
      // Reset when points needed increases (new level started)
      confettiTriggeredRef.current = false;
    }
  }, [pointsNeeded]);

  // Handle click to retrigger confetti when threshold is passed
  const handleClick = () => {
    if (pointsNeeded === 0) {
      triggerConfetti();
    }
  };

  return (
    <div
      className={`bg-gradient-to-r from-teal-600 to-blue-600 rounded-3xl shadow-2xl border-2 border-black/30 px-3 py-2 min-w-[240px] ${
        pointsNeeded === 0 ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : ''
      }`}
      onClick={handleClick}
      role={pointsNeeded === 0 ? 'button' : undefined}
      aria-label={pointsNeeded === 0 ? 'Click to celebrate!' : undefined}
    >
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
        {pointsNeeded > 0 && (
          <span className="text-gray-400 text-xs">
            {formatNumber(pointsNeeded)} to advance
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-dark-surface rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            pointsNeeded === 0 ? 'bg-green-500' : 'bg-primary'
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
