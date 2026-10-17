import { useEffect, useState } from 'react';
import { MAX_ROUND_SCORE } from '../utils/scoring';

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
export function getGuessRating(score: number): { label: string; emoji: string; color: string } {
  if (score >= 950) return { label: 'Bullseye!', emoji: '🎯', color: 'text-moss' };
  if (score >= 800) return { label: 'Excellent!', emoji: '🔥', color: 'text-moss' };
  if (score >= 600) return { label: 'Great guess', emoji: '👏', color: 'text-sea-deep' };
  if (score >= 300) return { label: 'Not bad', emoji: '🙂', color: 'text-brass' };
  return { label: 'Way off', emoji: '🧭', color: 'text-compass' };
}

/**
 * Animates a number from 0 to `target`. Skipped when the user prefers reduced motion
 * (and in environments without matchMedia, e.g. tests).
 */
function useCountUp(target: number, durationMs = 700): number {
  const animate =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [value, setValue] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate || target === 0) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3)))); // ease-out cubic
      if (t < 1) frame = requestAnimationFrame(tick);
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
export default function RoundResults({ distance, score, cityName, country, onContinue }: RoundResultsProps) {
  const rating = getGuessRating(score);
  const displayedScore = useCountUp(score);

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
            <span aria-hidden="true">{rating.emoji} </span>
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
