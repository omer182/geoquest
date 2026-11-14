import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import AtlasScreen from './ui/AtlasScreen';
import { Star } from './ui/Star';
import { getStarTargets } from '../utils/scoring';
import { sfx } from '../utils/sound';

interface LevelCompleteProps {
  /** Level that was just played */
  level?: number;
  /** Total score accumulated across all 5 rounds of the level */
  totalScore: number;
  /** Minimum score required to pass the level */
  threshold: number;
  /** Whether the player passed the level (totalScore >= threshold) */
  passed: boolean;
  /** Stars earned (0 when not passed) */
  stars?: number;
  /** Whether this pass unlocked a new level */
  unlocked?: boolean;
  /** Whether the stars beat the player's previous best on this level */
  newBest?: boolean;
  /** Continue after a pass (to the journey map) */
  onNextLevel: () => void;
  /** Play the same level again */
  onRetryLevel?: () => void;
  /** Back to the journey map without replaying */
  onJourneyMap?: () => void;
  /** Back to the main menu */
  onMainMenu?: () => void;
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

function canAnimate(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Phases of the reveal: score counts up, stars land one by one, then the banner. */
type Phase = 'counting' | 'stars' | 'done';

/**
 * Level summary after all 5 rounds, played as a short celebration:
 * the total counts up toward the target, earned stars stamp in with a bell
 * each, then a banner announces the unlock (with confetti) or how close
 * the player came.
 */
export default function LevelComplete({
  level,
  totalScore,
  threshold,
  passed,
  stars = passed ? 1 : 0,
  unlocked = passed,
  newBest = false,
  onNextLevel,
  onRetryLevel,
  onJourneyMap,
  onMainMenu,
}: LevelCompleteProps) {
  const animate = useRef(canAnimate()).current;
  const [phase, setPhase] = useState<Phase>(animate ? 'counting' : 'done');
  const [shownScore, setShownScore] = useState(animate ? 0 : totalScore);
  const [landedStars, setLandedStars] = useState(animate ? 0 : stars);
  const starTargets = getStarTargets(threshold);
  const shortBy = Math.max(0, threshold - totalScore);

  // 1. Count the total up, ticking
  useEffect(() => {
    if (!animate) return;
    const duration = 1100;
    const start = performance.now();
    let frame = 0;
    let lastTick = 0;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setShownScore(Math.round(totalScore * (1 - Math.pow(1 - t, 3))));
      if (now - lastTick > 60 && t < 1) {
        lastTick = now;
        sfx.tick(t);
      }
      if (t < 1) frame = requestAnimationFrame(step);
      else setPhase('stars');
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [animate, totalScore]);

  // 2. Land the earned stars, then 3. the banner
  useEffect(() => {
    if (phase !== 'stars') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < stars; i++) {
      timers.push(
        setTimeout(() => {
          setLandedStars(i + 1);
          sfx.star(i);
        }, 250 + i * 420)
      );
    }
    timers.push(
      setTimeout(() => {
        setPhase('done');
        if (passed) {
          sfx.fanfare();
          confetti({
            particleCount: 140,
            spread: 110,
            startVelocity: 42,
            origin: { x: 0.5, y: 0.35 },
            colors: ['#C8553D', '#C9962B', '#4E8B5A', '#2F6F9A', '#1E2A44'],
            zIndex: 60,
          });
        } else {
          sfx.fail();
        }
      }, 250 + stars * 420 + 150)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, stars, passed]);

  const progress = Math.min((shownScore / threshold) * 100, 100);
  const nextLevel = (level ?? 0) + 1;

  return (
    <div className="fixed inset-0 z-50">
      <AtlasScreen widthClass="max-w-md">
        <div className="atlas-card p-5 sm:p-7 text-center">
          {level !== undefined && <div className="atlas-eyebrow mb-1">Level {level}</div>}
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-3">
            {passed ? 'Level Complete!' : shortBy <= threshold * 0.15 ? 'So close!' : 'Not this time'}
          </h2>

          {/* Stars */}
          <div className="mb-1 flex items-end justify-center gap-2 text-paper-line" aria-label={`${stars} of 3 stars`} role="img">
            {[0, 1, 2].map(i => {
              const landed = i < landedStars;
              return (
                <span
                  key={i}
                  className={`${i === 1 ? 'mb-3' : ''} ${landed ? 'animate-star-land' : ''}`}
                >
                  <Star filled={landed} className={i === 1 ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-12 w-12 sm:h-14 sm:w-14'} />
                </span>
              );
            })}
          </div>
          <div className="mb-4 flex justify-center gap-4 text-[11px] font-medium tabular-nums text-ink-faint">
            {starTargets.map((t, i) => (
              <span key={i} className={totalScore >= t ? 'text-brass' : ''}>
                {i + 1}★ {formatNumber(t)}
              </span>
            ))}
          </div>

          {/* Score */}
          <div className="rounded-xl border border-paper-line bg-paper-deep/60 p-4">
            <div className="flex items-baseline justify-center gap-2 tabular-nums">
              <span className="font-display text-4xl font-bold text-ink" aria-label={`Your score ${formatNumber(totalScore)}`}>
                {formatNumber(shownScore)}
              </span>
              <span className="text-sm font-medium text-ink-faint">/ {formatNumber(threshold)} needed</span>
            </div>
            <div
              className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-paper-line"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full ${shownScore >= threshold ? 'bg-moss' : 'bg-compass'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Banner */}
          <div className="min-h-[3.25rem] pt-4">
            {phase === 'done' && (
              <div className="animate-banner-in">
                {passed && unlocked ? (
                  <div className="inline-block rounded-full bg-moss px-4 py-1.5 text-sm font-bold uppercase tracking-[0.14em] text-paper shadow-md">
                    Level {nextLevel} unlocked!
                  </div>
                ) : passed && newBest ? (
                  <div className="inline-block rounded-full bg-brass px-4 py-1.5 text-sm font-bold uppercase tracking-[0.14em] text-paper shadow-md">
                    New best!
                  </div>
                ) : passed ? (
                  <p className="text-sm text-ink-soft">Nice run! Beat {stars < 3 ? formatNumber(starTargets[stars]) : 'your record'} for {stars < 3 ? `${stars + 1} stars` : 'fun'}.</p>
                ) : (
                  <p className="text-sm text-ink-soft">
                    You needed <span className="font-semibold tabular-nums text-ink">{formatNumber(shortBy)}</span> more points. One more go?
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 space-y-2">
            {passed ? (
              <>
                <button onClick={onNextLevel} className="btn btn-success btn-block text-base">
                  {unlocked ? 'Continue' : 'Journey Map'}
                </button>
                {onRetryLevel && stars < 3 && (
                  <button onClick={onRetryLevel} className="btn btn-secondary btn-block text-sm">
                    Replay for {stars + 1} stars
                  </button>
                )}
              </>
            ) : (
              <>
                {onRetryLevel && (
                  <button onClick={onRetryLevel} className="btn btn-accent btn-block text-base">
                    Try Again
                  </button>
                )}
                {onJourneyMap && (
                  <button onClick={onJourneyMap} className="btn btn-secondary btn-block text-sm">
                    Journey Map
                  </button>
                )}
              </>
            )}
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
