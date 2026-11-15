import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Star } from './ui/Star';
import { Flag } from './ui/Flag';
import { FLAG_CHECKS, countryName, getFlagStars } from '../utils/roadTrip';
import { sfx } from '../utils/sound';

interface FlagMatchProps {
  /** The route, start to end */
  route: string[];
  onDone: (stars: number) => void;
  onClose: () => void;
}

/** Shuffle so that no flag starts next to its own stop. */
function derange(arr: string[]): string[] {
  if (arr.length < 2) return [...arr];
  for (;;) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.every((x, i) => x !== arr[i])) return a;
  }
}

type Phase = 'playing' | 'won' | 'lost';

/**
 * Bonus round after a Road Trip: the route's stops are listed in order with the
 * flags beside them, all in the wrong places. Swap flags around (drag one onto
 * another, or tap two), then Apply. Right flags lock in; three checks to get them all.
 */
export default function FlagMatch({ route, onDone, onClose }: FlagMatchProps) {
  const [order, setOrder] = useState<string[]>(() => derange(route));
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [checks, setChecks] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [flash, setFlash] = useState<{ rows: Set<number>; ok: boolean } | null>(null);
  const [phase, setPhase] = useState<Phase>('playing');
  const [stars, setStars] = useState(0);
  const [landed, setLanded] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const swap = (a: number, b: number) => {
    if (a === b || locked.has(a) || locked.has(b)) return;
    setOrder(o => {
      const n = [...o];
      [n[a], n[b]] = [n[b], n[a]];
      return n;
    });
    sfx.click();
  };

  const tapFlag = (row: number) => {
    if (phase !== 'playing' || locked.has(row)) return;
    if (picked === null) setPicked(row);
    else {
      swap(picked, row);
      setPicked(null);
    }
  };

  // ----- Drag a flag onto another row to swap them -----
  const drag = useRef<{ row: number; id: number; x: number; y: number; moved: boolean } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ row: number; dx: number; dy: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);

  /** The row under the finger, looking past the flag being dragged (it sits right under it) */
  const rowAt = (x: number, y: number, dragged: number) => {
    for (const el of document.elementsFromPoint?.(x, y) ?? []) {
      const row = el.closest('[data-row]');
      if (row && Number(row.getAttribute('data-row')) !== dragged) return Number(row.getAttribute('data-row'));
    }
    return null;
  };

  const onPointerDown = (row: number) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (phase !== 'playing' || locked.has(row)) return;
    drag.current = { row, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not supported */
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    setPicked(null);
    setDragOffset({ row: d.row, dx, dy });
    setOver(rowAt(e.clientX, e.clientY, d.row));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    setDragOffset(null);
    setOver(null);
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      tapFlag(d.row);
      return;
    }
    const target = rowAt(e.clientX, e.clientY, d.row);
    if (target !== null) swap(d.row, target);
  };

  const apply = () => {
    if (phase !== 'playing') return;
    setPicked(null);
    const check = checks + 1;
    setChecks(check);
    const right = new Set(order.map((iso, i) => (iso === route[i] ? i : -1)).filter(i => i >= 0));
    const newlyRight = [...right].filter(i => !locked.has(i));
    const wrong = new Set(order.map((_, i) => i).filter(i => !right.has(i)));
    setLocked(right);

    if (wrong.size === 0) {
      const s = getFlagStars(check);
      sfx.paint(newlyRight.length);
      later(() => {
        setStars(s);
        setPhase('won');
        onDone(s);
        sfx.fanfare();
        confetti({ particleCount: 120, spread: 100, startVelocity: 38, origin: { x: 0.5, y: 0.4 }, zIndex: 80 });
        for (let i = 0; i < s; i++) later(() => { setLanded(i + 1); sfx.star(i); }, 450 + i * 400);
      }, 600);
      return;
    }

    sfx.wrong();
    setFlash({ rows: wrong, ok: false });
    later(() => setFlash(null), 700);
    if (check >= FLAG_CHECKS) {
      // Out of checks: put every flag where it belongs
      later(() => {
        setOrder([...route]);
        setLocked(new Set(route.map((_, i) => i)));
        sfx.fail();
      }, 900);
      later(() => {
        setPhase('lost');
        onDone(0);
      }, 2200);
    }
  };

  const checksLeft = FLAG_CHECKS - checks;

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
            <div className="font-semibold tabular-nums text-ink">{locked.size}/{route.length} right</div>
            <div>
              {checksLeft} {checksLeft === 1 ? 'check' : 'checks'} left
            </div>
          </div>
        </div>
      </div>
      <p className="mx-4 mt-2 text-center text-xs text-ink-soft">Drag a flag onto another to swap them (or tap two). Then Apply.</p>

      {/* The route, in order, each with a flag that can be swapped */}
      <ol className="mx-3 mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto pb-2 sm:mx-4" aria-label="Today's route">
        {route.map((stop, i) => {
          const isLocked = locked.has(i);
          const bad = flash?.rows.has(i);
          const dragging = dragOffset?.row === i;
          return (
            <li
              key={stop}
              data-row={i}
              className={`flex items-center gap-3 rounded-xl border px-3 py-1.5 transition-colors ${
                bad
                  ? 'animate-shake border-compass bg-compass/10'
                  : isLocked
                    ? 'border-moss/50 bg-moss/10'
                    : over === i && dragOffset && dragOffset.row !== i
                      ? 'border-sea-deep bg-sea-deep/10'
                      : 'border-paper-line bg-paper'
              }`}
            >
              <span className="w-5 text-right text-xs font-semibold tabular-nums text-ink-faint">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{countryName(stop)}</span>
              {isLocked && (
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-moss" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-label="right">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
              <button
                onPointerDown={onPointerDown(i)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), tapFlag(i))}
                disabled={isLocked || phase !== 'playing'}
                aria-label={`Flag at stop ${i + 1}`}
                aria-pressed={picked === i}
                className={`relative flex h-11 w-[3.6rem] shrink-0 touch-none items-center justify-center rounded-lg border-2 bg-paper-deep ${
                  dragging ? 'z-20 border-sea-deep shadow-xl' : picked === i ? 'scale-110 border-sea-deep shadow-md' : isLocked ? 'border-transparent' : 'border-paper-line'
                } ${dragging ? '' : 'transition-transform'}`}
                style={dragging ? { transform: `translate(${dragOffset.dx}px, ${dragOffset.dy}px) scale(1.1)` } : undefined}
              >
                <Flag iso={order[i]} className="pointer-events-none h-8 w-[2.75rem]" />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-paper-line bg-paper px-3 py-2.5 sm:px-4">
        <button onClick={apply} disabled={phase !== 'playing'} className="btn btn-sea btn-block text-base">
          Apply ({checksLeft} {checksLeft === 1 ? 'check' : 'checks'} left)
        </button>
      </div>

      {phase !== 'playing' && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/20 p-4 sm:items-center">
          <div className="atlas-card w-full max-w-sm animate-pop p-6 text-center">
            <div className="atlas-eyebrow mb-1">Flag Match</div>
            <h2 className="font-display text-3xl font-bold text-ink">{phase === 'won' ? 'All flags right!' : 'Out of checks'}</h2>
            {phase === 'won' ? (
              <>
                <div className="my-3 flex items-end justify-center gap-2 text-paper-line" role="img" aria-label={`${stars} of 3 stars`}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`${i === 1 ? 'mb-2' : ''} ${i < landed ? 'animate-star-land' : ''}`}>
                      <Star filled={i < landed} className={i === 1 ? 'h-14 w-14' : 'h-11 w-11'} />
                    </span>
                  ))}
                </div>
                <p className="text-sm text-ink-soft">{checks === 1 ? 'First try!' : `Solved on check ${checks}.`}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">Every flag is now on its stop, have a look.</p>
            )}
            <button onClick={onClose} className="btn btn-sea btn-block mt-4 text-base">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
