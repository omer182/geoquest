import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Star } from './ui/Star';
import { Flag } from './ui/Flag';
import { countryName, getFlagStars } from '../utils/roadTrip';
import { sfx } from '../utils/sound';

interface FlagMatchProps {
  /** The route, start to end */
  route: string[];
  onDone: (stars: number) => void;
  onClose: () => void;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Never hand the flags over in route order
  if (a.length > 2 && a.every((x, i) => x === arr[i])) return shuffled(arr);
  return a;
}

/**
 * Bonus round after a Road Trip: the route's stops are listed in order, and the
 * flags are mixed up below. Pick a flag and a stop (either order) to match them.
 */
export default function FlagMatch({ route, onDone, onClose }: FlagMatchProps) {
  const tray = useMemo(() => shuffled(route), [route]);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [pickedFlag, setPickedFlag] = useState<string | null>(null);
  const [pickedStop, setPickedStop] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [stars, setStars] = useState<number | null>(null);
  const [landed, setLanded] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const tryMatch = (flag: string, stop: string) => {
    setPickedFlag(null);
    setPickedStop(null);
    if (flag === stop) {
      const next = new Set(placed).add(stop);
      setPlaced(next);
      sfx.paint(next.size - 1);
      if (next.size === route.length) {
        const s = getFlagStars(mistakes);
        later(() => {
          setStars(s);
          onDone(s);
          sfx.fanfare();
          confetti({ particleCount: 120, spread: 100, startVelocity: 38, origin: { x: 0.5, y: 0.4 }, zIndex: 80 });
          for (let i = 0; i < s; i++) later(() => { setLanded(i + 1); sfx.star(i); }, 450 + i * 400);
        }, 500);
      }
    } else {
      setMistakes(m => m + 1);
      sfx.wrong();
      setWrong(stop);
      later(() => setWrong(w => (w === stop ? null : w)), 600);
    }
  };

  const pickFlag = (iso: string) => {
    if (placed.has(iso)) return;
    sfx.click();
    if (pickedStop) tryMatch(iso, pickedStop);
    else setPickedFlag(f => (f === iso ? null : iso));
  };

  const pickStop = (iso: string) => {
    if (placed.has(iso)) return;
    if (pickedFlag) tryMatch(pickedFlag, iso);
    else {
      sfx.click();
      setPickedStop(s => (s === iso ? null : iso));
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-paper-deep">
      <div className="flex items-center gap-2 px-3 pt-3 sm:px-4">
        <button onClick={onClose} className="hud-card btn min-h-[40px] min-w-[40px] px-2.5 py-2" aria-label="Back to the map">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="hud-card flex min-w-0 flex-1 items-center justify-between px-3 py-1.5">
          <div>
            <div className="atlas-eyebrow leading-tight">Bonus round</div>
            <div className="font-display text-lg font-bold leading-tight text-ink">Flag Match</div>
          </div>
          <div className="text-right text-xs text-ink-soft">
            <div className="font-semibold tabular-nums text-ink">{placed.size}/{route.length}</div>
            <div>{mistakes} {mistakes === 1 ? 'miss' : 'misses'}</div>
          </div>
        </div>
      </div>
      <p className="mx-4 mt-2 text-center text-xs text-ink-soft">Pick a flag, then the stop it belongs to.</p>

      {/* The route, in order */}
      <ol className="mx-3 mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-2 sm:mx-4" aria-label="Today's route">
        {route.map((iso, i) => {
          const done = placed.has(iso);
          const picked = pickedStop === iso;
          return (
            <li key={iso}>
              <button
                onClick={() => pickStop(iso)}
                disabled={done}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-1.5 text-left transition-colors ${
                  wrong === iso
                    ? 'animate-shake border-compass bg-compass/10'
                    : done
                      ? 'border-moss/40 bg-moss/10'
                      : picked
                        ? 'border-sea-deep bg-sea-deep/10'
                        : 'border-paper-line bg-paper'
                }`}
              >
                <span className="w-5 text-right text-xs font-semibold tabular-nums text-ink-faint">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{countryName(iso)}</span>
                <span
                  className={`flex h-9 w-12 items-center justify-center rounded-md ${done ? '' : 'border-2 border-dashed border-paper-edge/70'}`}
                >
                  {done && <Flag iso={iso} className="animate-pop text-3xl" />}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Flags to place */}
      <div className="border-t border-paper-line bg-paper px-3 py-2.5 sm:px-4" aria-label="Flags">
        <div className="flex flex-wrap justify-center gap-2">
          {tray.map((iso, i) =>
            placed.has(iso) ? null : (
              <button
                key={iso}
                onClick={() => pickFlag(iso)}
                aria-label={`Flag ${i + 1}`}
                aria-pressed={pickedFlag === iso}
                className={`flex h-12 w-14 items-center justify-center rounded-lg border-2 bg-paper-deep transition-transform ${
                  pickedFlag === iso ? 'scale-110 border-sea-deep shadow-md' : 'border-paper-line'
                }`}
              >
                <Flag iso={iso} className="text-4xl" />
              </button>
            )
          )}
        </div>
      </div>

      {stars !== null && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/25 p-4">
          <div className="atlas-card w-full max-w-sm animate-pop p-6 text-center">
            <div className="atlas-eyebrow mb-1">Flag Match</div>
            <h2 className="font-display text-3xl font-bold text-ink">All flags placed!</h2>
            <div className="my-3 flex items-end justify-center gap-2 text-paper-line" role="img" aria-label={`${stars} of 3 stars`}>
              {[0, 1, 2].map(i => (
                <span key={i} className={`${i === 1 ? 'mb-2' : ''} ${i < landed ? 'animate-star-land' : ''}`}>
                  <Star filled={i < landed} className={i === 1 ? 'h-14 w-14' : 'h-11 w-11'} />
                </span>
              ))}
            </div>
            <p className="text-sm text-ink-soft">{mistakes === 0 ? 'Not a single miss!' : `${mistakes} ${mistakes === 1 ? 'miss' : 'misses'}.`}</p>
            <button onClick={onClose} className="btn btn-sea btn-block mt-4 text-base">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
