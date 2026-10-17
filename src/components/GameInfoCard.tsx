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
      colors: ['#C8553D', '#C9962B', '#4E8B5A', '#2F6F9A', '#1E2A44'], // Atlas palette
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

  const passed = pointsNeeded === 0;

  return (
    <div
      className={`hud-card w-[208px] px-3.5 pt-2.5 pb-3 sm:w-[244px] ${
        passed ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : ''
      }`}
      onClick={handleClick}
      role={passed ? 'button' : undefined}
      aria-label={passed ? 'Click to celebrate!' : undefined}
    >
      {/* Header: Round X/5 · Level pill */}
      <div className="flex items-center justify-between">
        <span className="atlas-eyebrow">Round {round}/5</span>
        <span className="flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-xs font-semibold text-paper">
          <span aria-hidden="true">🏆</span>
          Level {level}
        </span>
      </div>

      {/* Score against the level target, on one baseline */}
      <div className="mt-1 flex items-baseline gap-1.5 tabular-nums">
        <span className="font-display text-2xl font-bold leading-none text-ink">{formatNumber(totalScore)}</span>
        <span className="text-sm font-medium text-ink-faint">/ {formatNumber(requiredScore)}</span>
      </div>

      {/* Progress toward the target */}
      <div
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-paper-line"
        role="progressbar"
        aria-valuenow={Math.round(progressPercentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress to the level target"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${passed ? 'bg-moss' : 'bg-compass'}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* What's left */}
      <div className="mt-1.5 text-xs">
        {passed ? (
          <span className="font-semibold text-moss">✓ Target reached</span>
        ) : (
          <span className="text-ink-soft">
            <span className="font-semibold tabular-nums text-ink">{formatNumber(pointsNeeded)}</span> to advance
          </span>
        )}
      </div>
    </div>
  );
}
