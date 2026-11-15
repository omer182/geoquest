import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Star } from './ui/Star';
import MuteButton from './MuteButton';
import { useShapes } from '../utils/countryShapes';
import { projectRegion, VIEW_W, PAINT, LAND, type Shape } from '../utils/regionProjection';
import { getPaintStars, PAINT_LIVES, type Region } from '../data/regions';
import { recordMiniGame } from '../utils/progress';
import { sfx } from '../utils/sound';
import { useMapView } from '../utils/useMapView';

interface MiniGameProps {
  region: Region;
  /** Best stars already earned on this region */
  bestStars?: number;
  /** Back to the Paint the Map menu */
  onExit: () => void;
}


function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = 'intro' | 'playing' | 'won' | 'lost';

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
 * A place is called; tap it to paint it in. Paint every place in the region
 * yourself to win; running out of lives (wrong taps) ends the game. Stars depend on mistakes.
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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const target = targets[step];
  const goal = targets.length || projected?.shapes.length || 0;
  const hearts = PAINT_LIVES;

  // Each new place is first called out big in the middle of the map, then flies up
  // into the top bar (a stronger call to action than just changing the bar text).
  const [callout, setCallout] = useState<{ name: string; flying: boolean } | null>(null);
  useEffect(() => {
    if (phase !== 'playing' || !target) {
      setCallout(null);
      return;
    }
    setCallout({ name: target.name, flying: false });
    const fly = setTimeout(() => setCallout(c => (c && c.name === target.name ? { ...c, flying: true } : c)), 950);
    const done = setTimeout(() => setCallout(c => (c && c.name === target.name ? null : c)), 1400);
    return () => {
      clearTimeout(fly);
      clearTimeout(done);
    };
  }, [phase, target]);
  /** The bar shows the name once the callout has flown up into it */
  const barNameReady = !callout || callout.name !== target?.name;
  const placeWord = region.source === 'us-states' ? 'state' : 'country';

  const start = () => {
    if (!projected) return;
    sfx.click();
    setTargets(shuffle(projected.shapes));
    setStep(0);
    setPainted(new Set());
    setMistakes(0);
    setFlash(null);
    setToast(null);
    setResult(null);
    setLanded(0);
    map.reset();
    setPhase('playing');
  };

  const finishWon = (finalMistakes: number) => {
    const stars = getPaintStars(true, finalMistakes);
    const newBest = recordMiniGame(region.id, stars);
    later(() => {
      setResult({ stars, newBest });
      setPhase('won');
      sfx.fanfare();
      confetti({ particleCount: 150, spread: 110, startVelocity: 42, origin: { x: 0.5, y: 0.4 }, colors: PAINT, zIndex: 70 });
      for (let i = 0; i < stars; i++) later(() => { setLanded(i + 1); sfx.star(i); }, 500 + i * 420);
    }, 900);
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
    // Wrong place: flash it red but don't name it, so a miss never gives away an answer
    const WRONG = 'Wrong, try again';
    const m = mistakes + 1;
    setMistakes(m);
    sfx.wrong();
    setFlash({ iso, kind: 'wrong' });
    setToast(WRONG);
    later(() => setFlash(f => (f?.iso === iso && f.kind === 'wrong' ? null : f)), 700);
    if (m >= hearts) {
      later(() => {
        setFlash({ iso: target.iso, kind: 'reveal' });
        setToast(`${target.name} was here`);
      }, 750);
      later(() => {
        setPhase('lost');
        sfx.fail();
      }, 2600);
    } else {
      later(() => setToast(t => (t === WRONG ? null : t)), 1400);
    }
  };

  // ----- Pan & zoom (drag, pinch, wheel, buttons) -----
  const map = useMapView({
    viewH,
    ready: !!projected,
    onTap: tapCountry,
    // Zoomed in (up to 1.7x) only when the region would otherwise float in lots of empty sea
    initial: (base, clamp) => {
      const slack = Math.max(base.w / VIEW_W, base.h / viewH);
      return clamp({ s: slack < 1.5 ? 1 : Math.min(slack, 1.7), cx: VIEW_W / 2, cy: viewH / 2 });
    },
  });
  const { unitsPerPx, zoomButton } = map;

  const shapes = projected?.shapes ?? [];

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
              {phase === 'playing' && target ? (
                // Kept in the DOM for screen readers; shown once the callout lands here
                <span key={`${target.iso}-${barNameReady}`} className={barNameReady ? 'inline-block animate-pop' : 'opacity-0'}>
                  {target.name}
                </span>
              ) : (
                region.title
              )}
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

      {/* Progress */}
      {phase === 'playing' && (
        <div className="relative z-20 mx-3 mt-2 flex items-center gap-2 sm:mx-4" aria-hidden="true">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-line">
            <div className="h-full rounded-full bg-moss transition-all duration-300" style={{ width: `${goal ? (step / goal) * 100 : 0}%` }} />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-ink-soft">
            {step}/{goal}
          </span>
        </div>
      )}

      {/* Map */}
      <div className="relative min-h-0 flex-1 p-2 sm:p-3">
        <div ref={map.boxRef} className="relative h-full overflow-hidden rounded-xl border border-paper-line bg-[#BCDCEC] shadow-inner">
          {shapes.length > 0 ? (
            <svg
              ref={map.svgRef}
              viewBox={map.viewBox}
              className="block h-full w-full touch-none select-none"
              {...map.handlers}
              role="group"
              aria-label={`Map of ${region.name}`}
            >
              <g>
                {shapes.map(s => {
                  const isPainted = painted.has(s.iso);
                  const f = flash?.iso === s.iso ? flash.kind : null;
                  const fill = f === 'wrong' ? '#E07A6A' : isPainted ? s.paint : f === 'reveal' ? '#FBF6EA' : LAND;
                  return (
                    <g key={s.iso}>
                      <path
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
                      {s.mergedD && (
                        // Part of this place: same fill, and a matching edge that hides the old inner border
                        <path
                          data-iso={s.iso}
                          d={s.mergedD}
                          fill={fill}
                          stroke={fill}
                          strokeWidth={2.5}
                          vectorEffect="non-scaling-stroke"
                          strokeLinejoin="round"
                          className="cursor-pointer transition-[fill,stroke] duration-300"
                          aria-hidden="true"
                        />
                      )}
                    </g>
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

          {/* Callout: the place to paint, big in the middle, then flying up into the bar */}
          {callout && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div
                className={`atlas-card px-7 py-4 text-center ${callout.flying ? '' : 'animate-pop'}`}
                style={{
                  transition: 'transform 420ms cubic-bezier(0.5, 0, 0.75, 0), opacity 420ms ease-in',
                  transform: callout.flying ? 'translateY(-42vh) scale(0.45)' : 'none',
                  opacity: callout.flying ? 0 : 1,
                }}
                aria-hidden="true"
              >
                <div className="atlas-eyebrow text-compass">Paint</div>
                <div className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">{callout.name}</div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            // Centred by flex, since the pop animation's transform would override a translate
            <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-center">
              <div className="animate-pop rounded-full bg-ink px-4 py-1.5 text-center text-sm font-semibold text-paper shadow-lg">{toast}</div>
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
                  We call a {placeWord}, you tap it to paint it in. Paint all {projected?.shapes.length ?? ''} {placeWord === 'state' ? 'states' : 'countries'}{' '}
                  yourself to colour the whole map. Three strikes and you&apos;re out.
                </p>
                <div className="mt-3 flex justify-center gap-1 text-paper-line">
                  {[0, 1, 2].map(i => <Star key={i} filled={i < bestStars} className="h-7 w-7" />)}
                </div>
                <p className="mt-1 text-[11px] text-ink-faint">
                  No mistakes 3★ · one 2★ · two 1★
                </p>
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
