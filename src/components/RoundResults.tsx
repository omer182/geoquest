import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { MAX_ROUND_SCORE, STREAK_MIN } from '../utils/scoring';
import { sfx } from '../utils/sound';

/**
 * Props for the RoundResults component
 */
interface RoundResultsProps {
  /**
   * Distance in kilometers between the guess and actual city location
   */
  distance: number;

  /**
   * Points awarded for the round based on distance
   */
  score: number;

  /**
   * Name of the city that was being located
   */
  cityName: string;

  /**
   * Country of the city, shown under the rating
   */
  country?: string;

  /**
   * Callback function triggered when the continue button is clicked
   */
  onContinue: () => void;

  /** Streak bonus earned this round, on top of `score` */
  bonus?: number;

  /** Consecutive excellent guesses including this one */
  streak?: number;
}

/**
 * Formats a number with commas for readability.
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Verdict shown above the score. Based on the score rather than raw distance,
 * because scoring is scaled to the country: 40 km off is great in Russia but
 * poor in Israel.
 */
export function getGuessRating(score: number): { label: string; color: string } {
  if (score >= 950) return { label: 'Bullseye!', color: 'text-moss' };
  if (score >= 800) return { label: 'Excellent!', color: 'text-moss' };
  if (score >= 600) return { label: 'Great guess', color: 'text-sea-deep' };
  if (score >= 300) return { label: 'Not bad', color: 'text-brass' };
  return { label: 'Way off', color: 'text-compass' };
}

/** Small confetti burst above the results card for a close pin. */
function celebrateGuess(bullseye: boolean) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  confetti({
    particleCount: bullseye ? 90 : 45,
    spread: bullseye ? 100 : 70,
    startVelocity: bullseye ? 38 : 28,
    origin: { x: 0.5, y: 0.72 },
    colors: ['#C8553D', '#C9962B', '#4E8B5A', '#2F6F9A'],
    scalar: 0.8,
    zIndex: 45,
  });
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1-3.8 2.2-5 .2 1.6 1 2.8 2.3 3.3C11 8.6 11 5.2 12 2z" />
    </svg>
  );
}

/**
 * Animates a number from 0 to `target`. Skipped when the user prefers reduced motion
 * (and in environments without matchMedia, e.g. tests).
 */
function useCountUp(target: number, durationMs = 700, onTick?: (progress: number) => void, onDone?: () => void): number {
  const animate =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [value, setValue] = useState(animate ? 0 : target);
  const onTickRef = useRef(onTick);
  const onDoneRef = useRef(onDone);
  onTickRef.current = onTick;
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!animate || target === 0) {
      setValue(target);
      onDoneRef.current?.();
      return;
    }
    let frame = 0;
    let lastTick = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3)))); // ease-out cubic
      if (now - lastTick > 55 && t < 1) {
        lastTick = now;
        onTickRef.current?.(t);
      }
      if (t < 1) frame = requestAnimationFrame(tick);
      else onDoneRef.current?.();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, animate]);

  return value;
}

/**
 * RoundResults Component
 *
 * Displays the results after a round is completed in a compact card at the bottom:
 * - Verdict ("Bullseye!", "Great guess", ...) based on distance
 * - City and how far off the guess was
 * - Points awarded, counting up, colour coded by share of the 1000 max
 * - Next Round button (also triggered by Enter / Space, handled in Game)
 *
 * @example
 * ```tsx
 * <RoundResults
 *   distance={2714}
 *   score={50}
 *   cityName="Tokyo"
 *   country="Japan"
 *   onContinue={handleContinue}
 * />
 * ```
 */
export default function RoundResults({ distance, score, cityName, country, onContinue, bonus = 0, streak = 0 }: RoundResultsProps) {
  const rating = getGuessRating(score);
  const onFire = streak >= STREAK_MIN;
  const displayedScore = useCountUp(score, 700, sfx.tick, () => {
    sfx.verdict(score);
    if (score >= 800) celebrateGuess(score >= 950);
    if (onFire) setTimeout(() => sfx.streak(streak), 450);
  });

  // Colour by share of the max points
  let scoreColor: string;
  if (score <= MAX_ROUND_SCORE / 3) {
    scoreColor = 'text-compass';
  } else if (score <= (MAX_ROUND_SCORE * 2) / 3) {
    scoreColor = 'text-brass';
  } else {
    scoreColor = 'text-moss';
  }

  const distanceText = distance < 1 ? 'less than 1 km' : `${formatNumber(distance)} km`;

  return (
    <div
      className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4"
      data-map-overlay="bottom"
      style={{
        animation: 'slide-up-centered 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="atlas-card px-6 py-4 min-w-[280px]">
        <div className="text-center">
          {/* Verdict stamp */}
          <div
            className={`inline-block animate-stamp rounded-md border-2 border-current px-2 py-0.5 text-xs font-extrabold uppercase tracking-[0.15em] ${rating.color}`}
          >
            {rating.label}
          </div>

          {/* City + distance */}
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink mt-2">
            {cityName}
            {country && <span className="font-sans text-base text-ink-soft font-normal">, {country}</span>}
          </h2>
          <p className="text-ink-soft text-sm">You were {distanceText} off</p>

          {/* Points */}
          <div
            className={`font-display text-4xl font-bold tabular-nums ${scoreColor} my-2`}
            aria-label={`${formatNumber(score)} points`}
          >
            {score > 0 ? '+' : ''}
            {formatNumber(displayedScore)} pts
          </div>

          {/* Streak badge */}
          {onFire && (
            <div className="mb-2 flex justify-center">
              <span className="animate-pop inline-flex items-center gap-1.5 rounded-full bg-compass px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-paper shadow-md">
                <FlameIcon />
                On fire ×{streak}
                {bonus > 0 && <span className="tabular-nums text-paper/85">+{formatNumber(bonus)}</span>}
              </span>
            </div>
          )}

          {/* Next Round button */}
          <div className="flex justify-center">
            <button
              onClick={onContinue}
              aria-label="Continue to next round"
              className="btn btn-primary px-6"
            >
              Next Round
              <kbd className="kbd hidden sm:inline">Enter</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
