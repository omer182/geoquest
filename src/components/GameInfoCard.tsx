import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Star } from './ui/Star';
import { getStarTargets } from '../utils/scoring';
import { sfx } from '../utils/sound';

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
  // Star targets: 1 star = the pass mark, then 2 and 3 stars further up.
  // The bar runs from 0 to the 3-star score so all three markers sit on it.
  const targets = getStarTargets(requiredScore);
  const barMax = targets[2];
  const starsReached = targets.filter(t => totalScore >= t).length;
  const passed = starsReached > 0;
  const progressPercentage = Math.min(100, (totalScore / barMax) * 100);
  const nextTarget = targets[starsReached];

  // Track if confetti has been triggered for this threshold pass
  const confettiTriggeredRef = useRef(false);

  const triggerConfetti = () => {
    // Small confetti over the score card
    confetti({
      particleCount: 100,
      spread: 100,
      startVelocity: 20,
      origin: { x: 0.1, y: 0.15 },
      colors: ['#C8553D', '#C9962B', '#4E8B5A', '#2F6F9A', '#1E2A44'], // Atlas palette
      scalar: 0.8,
      gravity: 1,
    });
  };

  // Celebrate each star as it is reached: a bell per star, confetti on passing
  const prevStars = useRef(starsReached);
  useEffect(() => {
    if (starsReached > prevStars.current) {
      sfx.star(starsReached - 1);
      if (!confettiTriggeredRef.current) {
        confettiTriggeredRef.current = true;
        triggerConfetti();
      }
    } else if (starsReached === 0) {
      confettiTriggeredRef.current = false; // new level / retry
    }
    prevStars.current = starsReached;
  }, [starsReached]);

  // Tap the card to celebrate again once the level is passed
  const handleClick = () => {
    if (passed) triggerConfetti();
  };

  const barColor = starsReached >= 3 ? 'bg-brass' : passed ? 'bg-moss' : 'bg-compass';

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

      {/* Score against the pass mark, on one baseline */}
      <div className="mt-1 flex items-baseline gap-1.5 tabular-nums">
        <span className="font-display text-2xl font-bold leading-none text-ink">{formatNumber(totalScore)}</span>
        <span className="text-sm font-medium text-ink-faint">/ {formatNumber(requiredScore)}</span>
      </div>

      {/* Progress bar with a star marker at each star target (the first is the pass mark) */}
      <div className="relative mt-2.5 h-4">
        <div
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-paper-line"
          role="progressbar"
          aria-valuenow={Math.round(progressPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${starsReached} of 3 stars`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {targets.map((t, i) => {
          const reached = totalScore >= t;
          return (
            <span
              key={`${i}-${reached}`}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper p-px text-ink-faint shadow-sm ${
                reached ? 'animate-pop' : ''
              }`}
              style={{ left: `${Math.min((t / barMax) * 100, 100)}%` }}
              title={`${i + 1} star${i ? 's' : ''} at ${formatNumber(t)}${i === 0 ? ' (pass)' : ''}`}
            >
              <Star filled={reached} className="h-4 w-4" />
            </span>
          );
        })}
      </div>

      {/* What's next */}
      <div className="mt-1.5 text-xs">
        {!passed ? (
          <span className="text-ink-soft">
            <span className="font-semibold tabular-nums text-ink">{formatNumber(requiredScore - totalScore)}</span> to pass
          </span>
        ) : nextTarget !== undefined ? (
          <span className="text-ink-soft">
            <span className="font-semibold text-moss">Passed!</span>{' '}
            <span className="font-semibold tabular-nums text-ink">{formatNumber(nextTarget - totalScore)}</span> to {starsReached + 1} stars
          </span>
        ) : (
          <span className="font-semibold text-brass">All 3 stars!</span>
        )}
      </div>
    </div>
  );
}
