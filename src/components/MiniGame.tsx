import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Star } from './ui/Star';
import MuteButton from './MuteButton';
import { useShapes } from '../utils/countryShapes';
import { projectRegion, VIEW_W, PAINT, LAND, type Shape } from '../utils/regionProjection';
import { getPaintStars, MAX_MISTAKES, PAINT_GOAL, type Region } from '../data/regions';
import { recordMiniGame } from '../utils/progress';
import { sfx } from '../utils/sound';

interface MiniGameProps {
  region: Region;
  /** Best stars already earned on this region */
  bestStars?: number;
  /** Back to the Paint the Map menu */
  onExit: () => void;
}

/** Countries whose largest piece is smaller than this (map units) are drawn but never asked */
const MIN_TARGET_SIZE = 13;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'intro' | 'playing' | 'won' | 'lost';
/** Zoom level and the map point at the centre of the screen */
interface View { s: number; cx: number; cy: number }

function Heart({ full }: { full: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 transition-transform ${full ? '' : 'scale-90 opacity-35'}`} aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.2 1.7-2 3.2-3.2 5.3-3.2 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"
        fill={full ? '#C8553D' : 'none'}
        stroke="#C8553D"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/**
 * "Paint the region" bonus game: only the region's countries are on the map.
 * A country name is called; tap it to paint it in. Paint PAINT_GOAL to win
 * (the rest of the region then fills with colour); the (MAX_MISTAKES+1)th
 * wrong tap ends the game. Stars depend on mistakes.
 */
export default function MiniGame({ region, bestStars = 0, onExit }: MiniGameProps) {
  const countries = useShapes(region.source);
  const projected = useMemo(() => (countries ? projectRegion(region, countries) : null), [countries, region]);
  const viewH = projected?.viewH ?? 700;

  const [phase, setPhase] = useState<Phase>('intro');
  const [targets, setTargets] = useState<Shape[]>([]);
  const [step, setStep] = useState(0);
  const [painted, setPainted] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [flash, setFlash] = useState<{ iso: string; kind: 'wrong' | 'reveal' } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [result, setResult] = useState<{ stars: number; newBest: boolean } | null>(null);
  const [landed, setLanded] = useState(0);
  const [view, setView] = useState<View>({ s: 1, cx: VIEW_W / 2, cy: 350 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const target = targets[step];
  const goal = Math.min(PAINT_GOAL, targets.length || PAINT_GOAL);

  const start = () => {
    if (!projected) return;
    sfx.click();
    const eligible = projected.shapes.filter(s => s.size >= MIN_TARGET_SIZE);
    setTargets(shuffle(eligible).slice(0, PAINT_GOAL));
    setStep(0);
    setPainted(new Set());
    setMistakes(0);
    setFlash(null);
    setToast(null);
    setResult(null);
    setLanded(0);
    userMoved.current = false;
    setView(initialView());
    setPhase('playing');
  };

  const finishWon = (finalMistakes: number) => {
    // Cascade-paint the rest of the region
    const rest = shuffle((projected?.shapes ?? []).map(s => s.iso));
    rest.forEach((iso, i) =>
      later(() => setPainted(prev => (prev.has(iso) ? prev : new Set(prev).add(iso))), 250 + i * Math.max(18, 900 / rest.length))
    );
    const stars = getPaintStars(true, finalMistakes);
    const newBest = recordMiniGame(region.id, stars);
    later(() => {
      setResult({ stars, newBest });
      setPhase('won');
      sfx.fanfare();
      confetti({ particleCount: 150, spread: 110, startVelocity: 42, origin: { x: 0.5, y: 0.4 }, colors: PAINT, zIndex: 70 });
      for (let i = 0; i < stars; i++) later(() => { setLanded(i + 1); sfx.star(i); }, 500 + i * 420);
    }, 1300);
  };

  const tapCountry = (iso: string) => {
    if (phase !== 'playing' || !target || flash?.kind === 'reveal') return;
    if (painted.has(iso)) return;
    if (iso === target.iso) {
      const next = new Set(painted).add(iso);
      setPainted(next);
      sfx.paint(step);
      setToast(null);
      if (step + 1 >= goal) {
        setStep(step + 1);
        finishWon(mistakes);
      } else {
        setStep(step + 1);
      }
      return;
    }
    // Wrong country
    const name = projected?.shapes.find(s => s.iso === iso)?.name ?? 'somewhere else';
    const m = mistakes + 1;
    setMistakes(m);
    sfx.wrong();
    setFlash({ iso, kind: 'wrong' });
    setToast(`That's ${name}`);
    later(() => setFlash(f => (f?.iso === iso && f.kind === 'wrong' ? null : f)), 700);
    if (m > MAX_MISTAKES) {
      later(() => {
        setFlash({ iso: target.iso, kind: 'reveal' });
        setToast(`${target.name} was here`);
      }, 750);
      later(() => {
        setPhase('lost');
        sfx.fail();
      }, 2600);
    } else {
      later(() => setToast(t => (t === `That's ${name}` ? null : t)), 1600);
    }
  };

  // ----- Pan & zoom (drag, pinch, wheel, buttons) -----
  // The SVG viewBox always has the container's aspect ratio, so the map fills the
  // screen; zooming and panning just move/resize that window over the map.
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ w: 360, h: 640 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [projected]);

  /** Window size at zoom 1: the whole map, padded out to the container's shape. */
  const aspect = box.h / box.w;
  const base = aspect * VIEW_W >= viewH ? { w: VIEW_W, h: VIEW_W * aspect } : { w: viewH / aspect, h: viewH };
  const MAX_ZOOM = 8;

  const clampView = (v: View): View => {
    const s = Math.min(Math.max(v.s, 1), MAX_ZOOM);
    const w = base.w / s;
    const h = base.h / s;
    const cx = w >= VIEW_W ? VIEW_W / 2 : Math.min(Math.max(v.cx, w / 2), VIEW_W - w / 2);
    const cy = h >= viewH ? viewH / 2 : Math.min(Math.max(v.cy, h / 2), viewH - h / 2);
    return { s, cx, cy };
  };

  /** Opening view: zoomed in (up to 1.7x) when the region would otherwise float in empty sea. */
  function initialView(): View {
    const slack = Math.max(base.w / VIEW_W, base.h / viewH);
    // Only zoom when there is lots of empty sea around the region; tall regions stay whole
    return clampView({ s: slack < 1.5 ? 1 : Math.min(slack, 1.7), cx: VIEW_W / 2, cy: viewH / 2 });
  }
  // Re-fit when the map loads or the screen changes shape, until the player moves it
  const userMoved = useRef(false);
  useEffect(() => {
    if (!userMoved.current) setView(initialView());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h, viewH]);

  const cur = clampView(view);
  const vb = { w: base.w / cur.s, h: base.h / cur.s, x: cur.cx - base.w / cur.s / 2, y: cur.cy - base.h / cur.s / 2 };
  /** Map units per screen pixel */
  const unitsPerPx = vb.w / box.w;

  const toMap = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: vb.x + ((clientX - r.left) / r.width) * vb.w, y: vb.y + ((clientY - r.top) / r.height) * vb.h };
  };

  const zoomAt = (factor: number, mx: number, my: number, from: View = view) => {
    const c = clampView(from);
    const s = Math.min(Math.max(c.s * factor, 1), MAX_ZOOM);
    const k = c.s / s; // new window size relative to the old one
    return clampView({ s, cx: mx + (c.cx - mx) * k, cy: my + (c.cy - my) * k });
  };

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    moved: boolean;
    downIso: string | null;
    startDist: number;
    startView: View;
    startMid: { x: number; y: number };
    origin: { x: number; y: number };
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const iso = (e.target as Element).closest('[data-iso]')?.getAttribute('data-iso') ?? null;
    if (pointers.current.size === 1) {
      gesture.current = { moved: false, downIso: iso, startDist: 0, startView: view, startMid: { x: 0, y: 0 }, origin: { x: e.clientX, y: e.clientY } };
    } else if (pointers.current.size === 2 && gesture.current) {
      const [p1, p2] = [...pointers.current.values()];
      gesture.current = {
        ...gesture.current,
        moved: true,
        startDist: Math.hypot(p1.x - p2.x, p1.y - p2.y),
        startView: view,
        startMid: toMap((p1.x + p2.x) / 2, (p1.y + p2.y) / 2),
      };
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* not supported */
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [p1, p2] = [...pointers.current.values()];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      userMoved.current = true;
      setView(zoomAt(dist / (g.startDist || dist), g.startMid.x, g.startMid.y, g.startView));
      return;
    }
    if (!g.moved && Math.hypot(e.clientX - g.origin.x, e.clientY - g.origin.y) < 8) return;
    g.moved = true;
    userMoved.current = true;
    const k = vb.w / svgRef.current!.getBoundingClientRect().width;
    const dx = (e.clientX - prev.x) * k;
    const dy = (e.clientY - prev.y) * k;
    setView(v => {
      const c = clampView(v);
      return clampView({ s: c.s, cx: c.cx - dx, cy: c.cy - dy });
    });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;
    if (g && !g.moved && g.downIso) tapCountry(g.downIso);
    gesture.current = null;
  };

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    const m = toMap(e.clientX, e.clientY);
    userMoved.current = true;
    setView(zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, m.x, m.y));
  };

  const zoomButton = (factor: number) => {
    userMoved.current = true;
    setView(zoomAt(factor, cur.cx, cur.cy));
  };

  // Keep wheel zoom from scrolling the page
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const stop = (ev: Event) => ev.preventDefault();
    el.addEventListener('wheel', stop, { passive: false });
    return () => el.removeEventListener('wheel', stop);
  }, [projected]);

  const shapes = projected?.shapes ?? [];
  const hearts = MAX_MISTAKES + 1;

  return (
    <div className="relative flex h-full flex-col bg-paper-deep">
      {/* Top bar */}
      <div className="relative z-20 flex items-center gap-2 px-3 pt-3 sm:px-4">
        <button onClick={onExit} className="hud-card btn min-h-[40px] min-w-[40px] px-2.5 py-2" aria-label="Back to all maps">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="hud-card flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-1.5">
          <div className="min-w-0">
            <div className="atlas-eyebrow leading-tight">
              {phase === 'playing' ? `Paint ${Math.min(step + 1, goal)} of ${goal}` : region.name}
            </div>
            <div className="truncate font-display text-lg font-bold leading-tight text-ink sm:text-xl" aria-live="polite">
              {phase === 'playing' && target ? target.name : region.title}
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5" aria-label={`${hearts - mistakes} of ${hearts} lives left`} role="img">
            {Array.from({ length: hearts }, (_, i) => (
              <Heart key={i} full={i < hearts - mistakes} />
            ))}
          </div>
        </div>
        <MuteButton />
      </div>

      {/* Progress dots */}
      {phase === 'playing' && (
        <div className="relative z-20 mx-auto mt-2 flex gap-1" aria-hidden="true">
          {Array.from({ length: goal }, (_, i) => (
            <span key={i} className={`h-1.5 w-4 rounded-full transition-colors ${i < step ? 'bg-moss' : 'bg-paper-line'}`} />
          ))}
        </div>
      )}

      {/* Map */}
      <div className="relative min-h-0 flex-1 p-2 sm:p-3">
        <div ref={boxRef} className="relative h-full overflow-hidden rounded-xl border border-paper-line bg-[#BCDCEC] shadow-inner">
          {shapes.length > 0 ? (
            <svg
              ref={svgRef}
              viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
              className="block h-full w-full touch-none select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
              role="group"
              aria-label={`Map of ${region.name}`}
            >
              <g>
                {shapes.map(s => {
                  const isPainted = painted.has(s.iso);
                  const f = flash?.iso === s.iso ? flash.kind : null;
                  const fill = f === 'wrong' ? '#E07A6A' : isPainted ? s.paint : f === 'reveal' ? '#FBF6EA' : LAND;
                  return (
                    <path
                      key={s.iso}
                      data-iso={s.iso}
                      d={s.d}
                      fill={fill}
                      stroke={f === 'reveal' ? '#C8553D' : '#B39D72'}
                      strokeWidth={f === 'reveal' ? 3 : 1}
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      className={`cursor-pointer transition-[fill] duration-300 ${f === 'reveal' ? 'animate-pulse' : ''}`}
                      role="button"
                      aria-label={s.name}
                    />
                  );
                })}
                {/* Names on painted countries big enough to hold them */}
                {shapes
                  .filter(s => painted.has(s.iso) && s.size / unitsPerPx > 70)
                  .map(s => (
                    <text
                      key={`t-${s.iso}`}
                      x={s.cx}
                      y={s.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={12 * unitsPerPx}
                      fontWeight="600"
                      fill="#1E2A44"
                      opacity="0.75"
                      fontFamily="Inter, sans-serif"
                      style={{ pointerEvents: 'none' }}
                    >
                      {s.name}
                    </text>
                  ))}
              </g>
            </svg>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-soft">Unrolling the map…</div>
          )}

          {/* Toast */}
          {toast && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 animate-pop rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-paper shadow-lg">
              {toast}
            </div>
          )}

          {/* Zoom buttons */}
          {phase === 'playing' && (
            <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
              <button onClick={() => zoomButton(1.5)} className="hud-card btn h-10 w-10 p-0 text-lg font-bold" aria-label="Zoom in">+</button>
              <button onClick={() => zoomButton(1 / 1.5)} className="hud-card btn h-10 w-10 p-0 text-lg font-bold" aria-label="Zoom out">−</button>
            </div>
          )}
          {phase === 'playing' && step === 0 && mistakes === 0 && (
            <p className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-paper/85 px-3 py-1 text-[11px] text-ink-soft">
              Pinch or scroll to zoom, drag to move
            </p>
          )}
        </div>
      </div>

      {/* Intro / result card */}
      {phase !== 'playing' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-ink/25 p-4 backdrop-blur-[1px]">
          <div className="atlas-card w-full max-w-sm animate-pop p-6 text-center">
            {phase === 'intro' && (
              <>
                <div className="atlas-eyebrow mb-1">Paint the Map</div>
                <h2 className="font-display text-3xl font-bold text-ink">{region.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  We call a {region.source === 'us-states' ? 'state' : 'country'}, you tap it to paint it in. Paint {PAINT_GOAL} to colour the whole region. {hearts} wrong taps
                  and you&apos;re out.
                </p>
                <div className="mt-3 flex justify-center gap-1 text-paper-line">
                  {[0, 1, 2].map(i => <Star key={i} filled={i < bestStars} className="h-7 w-7" />)}
                </div>
                <p className="mt-1 text-[11px] text-ink-faint">No mistakes 3★ · one 2★ · two 1★</p>
                <div className="mt-4 space-y-2">
                  <button onClick={start} disabled={!projected} className="btn btn-accent btn-block text-base">
                    {projected ? 'Start painting' : 'Loading map…'}
                  </button>
                  <button onClick={onExit} className="btn btn-ghost btn-block text-sm">All maps</button>
                </div>
              </>
            )}
            {phase === 'won' && result && (
              <>
                <div className="atlas-eyebrow mb-1">{region.name}</div>
                <h2 className="font-display text-3xl font-bold text-ink">Region painted!</h2>
                <div className="my-3 flex items-end justify-center gap-2 text-paper-line" role="img" aria-label={`${result.stars} of 3 stars`}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`${i === 1 ? 'mb-2' : ''} ${i < landed ? 'animate-star-land' : ''}`}>
                      <Star filled={i < landed} className={i === 1 ? 'h-14 w-14' : 'h-11 w-11'} />
                    </span>
                  ))}
                </div>
                <p className="text-sm text-ink-soft">
                  {mistakes === 0 ? 'Flawless!' : `${mistakes} wrong tap${mistakes > 1 ? 's' : ''}.`}{' '}
                  {result.newBest && bestStars > 0 ? 'New best!' : ''}
                </p>
                <div className="mt-4 space-y-2">
                  <button onClick={onExit} className="btn btn-success btn-block text-base">All maps</button>
                  {result.stars < 3 && (
                    <button onClick={start} className="btn btn-secondary btn-block text-sm">Paint again for 3 stars</button>
                  )}
                </div>
              </>
            )}
            {phase === 'lost' && (
              <>
                <div className="atlas-eyebrow mb-1">{region.name}</div>
                <h2 className="font-display text-3xl font-bold text-ink">Out of paint!</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  You painted <span className="font-semibold text-ink">{step}</span> of {goal}. Have another go.
                </p>
                <div className="mt-4 space-y-2">
                  <button onClick={start} className="btn btn-accent btn-block text-base">Try Again</button>
                  <button onClick={onExit} className="btn btn-ghost btn-block text-sm">All maps</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
