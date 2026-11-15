import { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Star } from './ui/Star';
import FlagMatch from './FlagMatch';
import MuteButton from './MuteButton';
import { useShapes, type CountryFeature, type Ring } from '../utils/countryShapes';
import { projectRegion, VIEW_W } from '../utils/regionProjection';
import { useMapView } from '../utils/useMapView';
import { MERGED_INTO } from '../data/borders';
import {
  ROAD_TRIP_STRIKES,
  analyseRoute,
  countryName,
  dailyPuzzle,
  getRoadTripStars,
  isConnected,
  judge,
  loadDay,
  minGuesses,
  oneShortestRoute,
  roadTripStreak,
  saveDay,
  saveFlagStars,
  shortestRouteCountries,
  suggestCountries,
  type Puzzle,
  type Verdict,
} from '../utils/roadTrip';
import { sfx } from '../utils/sound';

/** Map colours */
const C = {
  land: '#E4DFD3',
  edge: '#B8AE98',
  start: '#2F6F9A',
  end: '#C8553D',
  green: '#6DAE69',
  yellow: '#E9C46A',
  gray: '#9C968A',
  reveal: '#CFE6C6',
};
const VERDICT_FILL: Record<Verdict, string> = { green: C.green, yellow: C.yellow, gray: C.gray };

type Phase = 'intro' | 'playing' | 'won' | 'lost';

interface RoadTripProps {
  onExit: () => void;
  /** Defaults to today's puzzle */
  puzzle?: Puzzle;
}

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

/** Centre and lng/lat box of a country's largest piece */
function largestPiece(polygons: Ring[][]) {
  let best = { area: -1, w: 0, e: 0, s: 0, n: 0 };
  for (const poly of polygons) {
    const ring = poly[0];
    let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
    for (const [lng, lat] of ring) {
      w = Math.min(w, lng); e = Math.max(e, lng); s = Math.min(s, lat); n = Math.max(n, lat);
    }
    const area = (e - w) * (n - s);
    if (area > best.area) best = { area, w, e, s, n };
  }
  return best;
}

/** Window onto the route: start, end and the shortest-route countries, with room around them. */
function routeBounds(features: CountryFeature[], start: string, end: string, middle: string[]) {
  const byIso = new Map(features.map(f => [f.iso, f]));
  let w = Infinity, e = -Infinity, s = Infinity, n = -Infinity;
  const add = (lng: number, lat: number) => {
    w = Math.min(w, lng); e = Math.max(e, lng); s = Math.min(s, lat); n = Math.max(n, lat);
  };
  for (const iso of [start, end]) {
    const f = byIso.get(iso);
    if (!f) continue;
    const p = largestPiece(f.polygons);
    add(p.w, p.s);
    add(p.e, p.n);
  }
  for (const iso of middle) {
    const f = byIso.get(iso);
    if (!f) continue;
    const p = largestPiece(f.polygons);
    add((p.w + p.e) / 2, (p.s + p.n) / 2);
  }
  const padX = Math.max(3, (e - w) * 0.12);
  const padY = Math.max(3, (n - s) * 0.12);
  return {
    west: Math.max(-180, w - padX),
    east: Math.min(180, e + padX),
    south: Math.max(-58, s - padY),
    north: Math.min(80, n + padY),
  };
}

function untilMidnight() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const mins = Math.max(0, Math.round((next.getTime() - now.getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;
}

/**
 * Road Trip, the daily puzzle: get from one country to another over land by naming
 * the countries in between. Green is on a shortest route, yellow is close, gray is a
 * wasted stop and costs a strike. Join start and end before the third strike.
 */
export default function RoadTrip({ onExit, puzzle: given }: RoadTripProps) {
  const puzzle = useMemo(() => given ?? dailyPuzzle(), [given]);
  const route = useMemo(() => analyseRoute(puzzle.start, puzzle.end)!, [puzzle]);
  const fewest = minGuesses(route);
  const saved = useMemo(() => loadDay(puzzle.date), [puzzle.date]);

  const [guesses, setGuesses] = useState<string[]>(saved?.guesses ?? []);
  const [phase, setPhase] = useState<Phase>(saved ? (saved.status === 'playing' ? 'playing' : saved.status) : 'intro');
  const [stars, setStars] = useState(saved?.stars ?? 0);
  const [landed, setLanded] = useState(saved && saved.status !== 'playing' ? saved.stars : 0);
  const [cardOpen, setCardOpen] = useState(true);
  const [flagStars, setFlagStars] = useState(saved?.flagStars ?? 0);
  const [flagOpen, setFlagOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const verdicts = useMemo(() => new Map(guesses.map(g => [g, judge(route, g)])), [guesses, route]);
  const strikes = [...verdicts.values()].filter(v => v === 'gray').length;
  const finished = phase === 'won' || phase === 'lost';

  // ----- Map -----
  const raw = useShapes('countries');
  const features = useMemo(() => {
    if (!raw) return null;
    // Pieces drawn as part of another country get their own key, merged in by projectRegion
    return raw.map(f => (MERGED_INTO[f.name] ? { ...f, iso: `merge:${f.name}` } : f));
  }, [raw]);
  const projected = useMemo(() => {
    if (!features) return null;
    const merge: Record<string, string> = {};
    for (const f of features) if (f.iso.startsWith('merge:')) merge[f.iso] = MERGED_INTO[f.name];
    const codes = features.filter(f => !f.iso.startsWith('merge:') && f.iso !== '-99' && f.iso !== 'AQ').map(f => f.iso);
    const bounds = routeBounds(features, route.start, route.end, shortestRouteCountries(route));
    return projectRegion({ bounds, codes, merge }, features);
  }, [features, route]);
  const viewH = projected?.viewH ?? 700;

  const map = useMapView({
    viewH,
    ready: !!projected,
    onTap: () => {},
    initial: (_base, clamp) => clamp({ s: 1, cx: VIEW_W / 2, cy: viewH / 2 }),
  });
  const k = map.unitsPerPx;
  const shapeOf = (iso: string) => projected?.shapes.find(s => s.iso === iso);

  // Once the day is over, the shortest way is shown on the map
  const shortest = useMemo(() => oneShortestRoute(route), [route]);
  const revealed = useMemo(() => (finished ? new Set(shortest.slice(1, -1)) : new Set<string>()), [finished, shortest]);
  const fillFor = (iso: string) => {
    if (iso === route.start) return C.start;
    if (iso === route.end) return C.end;
    const v = verdicts.get(iso);
    if (v) return VERDICT_FILL[v];
    if (revealed.has(iso)) return C.reveal;
    return C.land;
  };

  // ----- Guessing -----
  const exclude = useMemo(() => new Set([route.start, route.end, ...guesses]), [route, guesses]);
  const suggestions = useMemo(() => suggestCountries(query, exclude), [query, exclude]);
  useEffect(() => setActive(0), [query]);

  const persist = (next: string[], status: 'playing' | 'won' | 'lost', s = 0) => saveDay(puzzle.date, { guesses: next, status, stars: s });

  const guess = (iso: string) => {
    if (phase !== 'playing' || exclude.has(iso)) return;
    const next = [...guesses, iso];
    const v = judge(route, iso);
    setGuesses(next);
    setQuery('');
    setFresh(iso);
    later(() => setFresh(f => (f === iso ? null : f)), 900);

    const useful = next.filter(g => judge(route, g) !== 'gray');
    const nextStrikes = next.length - useful.length;
    if (v === 'gray') {
      sfx.wrong();
      setToast(`${countryName(iso)} is off the route`);
      later(() => setToast(t => (t?.startsWith(countryName(iso)) ? null : t)), 1600);
    } else {
      sfx.paint(useful.length - 1);
    }

    if (v !== 'gray' && isConnected(route, useful)) {
      const s = getRoadTripStars(true, next.length, fewest);
      persist(next, 'won', s);
      setStars(s);
      inputRef.current?.blur();
      later(() => {
        setPhase('won');
        setCardOpen(true);
        sfx.fanfare();
        confetti({ particleCount: 150, spread: 110, startVelocity: 42, origin: { x: 0.5, y: 0.4 }, colors: [C.green, C.yellow, C.start, C.end], zIndex: 70 });
        for (let i = 0; i < s; i++) later(() => { setLanded(i + 1); sfx.star(i); }, 500 + i * 420);
      }, 700);
    } else if (nextStrikes >= ROAD_TRIP_STRIKES) {
      persist(next, 'lost');
      inputRef.current?.blur();
      later(() => {
        setPhase('lost');
        setCardOpen(true);
        sfx.fail();
      }, 1200);
    } else {
      persist(next, 'playing');
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = suggestions[active];
      if (pick) guess(pick.iso);
      else if (query.trim()) {
        const again = suggestCountries(query, new Set(), 1)[0];
        const msg = again && exclude.has(again.iso) ? `${again.name} is already on the map` : 'No country by that name';
        setToast(msg);
        later(() => setToast(t => (t === msg ? null : t)), 1600);
      }
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  const start = () => {
    sfx.click();
    setPhase('playing');
    persist(guesses, 'playing');
    later(() => inputRef.current?.focus(), 50);
  };

  // Tick the "next trip in" countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!finished) return;
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, [finished]);

  const dateLabel = new Date(`${puzzle.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const streak = finished ? roadTripStreak(puzzle.date) : 0;
  const shapes = projected?.shapes ?? [];
  const flagButtons = (
    <div className="mt-4 space-y-2">
      <button onClick={() => setFlagOpen(true)} className="btn btn-success btn-block justify-between text-base">
        <span>Bonus: Flag Match</span>
        {flagStars > 0 ? (
          <span className="flex gap-0.5 text-white/90" role="img" aria-label={`best ${flagStars} of 3 stars`}>
            {[0, 1, 2].map(i => <Star key={i} filled={i < flagStars} className="h-4 w-4" />)}
          </span>
        ) : (
          <span aria-hidden="true" className="text-white/70">→</span>
        )}
      </button>
      <div className="flex gap-2">
        <button onClick={() => setCardOpen(false)} className="btn btn-secondary flex-1 text-sm">See the map</button>
        <button onClick={onExit} className="btn btn-secondary flex-1 text-sm">Main Menu</button>
      </div>
    </div>
  );
  const labelled = new Set([route.start, route.end]);

  return (
    <div className="relative flex h-full flex-col bg-paper-deep">
      {/* Top bar */}
      <div className="relative z-20 flex items-center gap-2 px-3 pt-3 sm:px-4">
        <button onClick={onExit} className="hud-card btn min-h-[40px] min-w-[40px] px-2.5 py-2" aria-label="Back to main menu">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="hud-card flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-1.5">
          <div className="min-w-0">
            <div className="atlas-eyebrow leading-tight">Road Trip · {dateLabel}</div>
            <div className="flex items-center gap-1 font-display text-base font-bold leading-tight text-ink sm:text-xl">
              <span className="truncate" style={{ color: C.start }}>{countryName(route.start)}</span>
              <span aria-label="to" className="shrink-0 text-ink-faint">→</span>
              <span className="truncate" style={{ color: C.end }}>{countryName(route.end)}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5" aria-label={`${ROAD_TRIP_STRIKES - strikes} of ${ROAD_TRIP_STRIKES} lives left`} role="img">
            {Array.from({ length: ROAD_TRIP_STRIKES }, (_, i) => (
              <Heart key={i} full={i < ROAD_TRIP_STRIKES - strikes} />
            ))}
          </div>
        </div>
        <MuteButton />
      </div>

      {/* Country input, with suggestions as you type */}
      <div className="relative z-30 mx-3 mt-2 sm:mx-4">
        {phase === 'playing' ? (
          <>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a country on the way…"
              aria-label="Type a country"
              role="combobox"
              aria-expanded={suggestions.length > 0}
              aria-controls="road-trip-suggestions"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="w-full rounded-xl border border-paper-edge/80 bg-paper px-4 py-2.5 text-base text-ink shadow-sm outline-none placeholder:text-ink-faint focus:border-sea-deep focus:ring-2 focus:ring-sea-deep/25"
            />
            {suggestions.length > 0 && (
              <ul id="road-trip-suggestions" role="listbox" className="absolute inset-x-0 top-full mt-1 overflow-hidden rounded-xl border border-paper-line bg-paper shadow-xl">
                {suggestions.map((s, i) => (
                  <li key={s.iso} role="option" aria-selected={i === active}>
                    <button
                      // Keep the keyboard open on phones: pick on pointer down, before the input loses focus
                      onPointerDown={e => e.preventDefault()}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => guess(s.iso)}
                      className={`block w-full px-4 py-2.5 text-left text-base ${i === active ? 'bg-sea-deep/10 font-semibold text-ink' : 'text-ink-soft'}`}
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-paper-line bg-paper/70 px-4 py-2.5 text-sm text-ink-soft">
            {phase === 'intro' ? 'Start the trip to type countries' : phase === 'won' ? 'Arrived! A new trip tomorrow.' : 'Out of fuel. A new trip tomorrow.'}
          </div>
        )}
      </div>

      {/* Guesses so far */}
      <div className="relative z-20 mx-3 mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:mx-4" aria-label="Your stops">
        <span className="shrink-0 text-[11px] font-semibold text-ink-soft">
          {guesses.length} {guesses.length === 1 ? 'stop' : 'stops'} · fewest {fewest}
        </span>
        {guesses.map(g => (
          <span
            key={g}
            className={`flex shrink-0 items-center gap-1 rounded-full border border-paper-line bg-paper px-2 py-0.5 text-xs font-medium text-ink ${fresh === g ? 'animate-pop' : ''}`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: VERDICT_FILL[verdicts.get(g)!] }} aria-hidden="true" />
            {countryName(g)}
            <span className="sr-only">: {verdicts.get(g) === 'green' ? 'on a shortest route' : verdicts.get(g) === 'yellow' ? 'close' : 'off the route'}</span>
          </span>
        ))}
      </div>

      {/* Map */}
      <div className="relative min-h-0 flex-1 p-2 sm:p-3">
        <div ref={map.boxRef} className="relative h-full overflow-hidden rounded-xl border border-paper-line bg-[#BCDCEC] shadow-inner">
          {shapes.length > 0 ? (
            <svg
              ref={map.svgRef}
              viewBox={map.viewBox}
              className="block h-full w-full touch-none select-none"
              {...map.handlers}
              role="img"
              aria-label={`Map from ${countryName(route.start)} to ${countryName(route.end)}`}
            >
              {shapes.map(s => {
                const fill = fillFor(s.iso);
                return (
                  <g key={s.iso} data-country={s.iso}>
                    <path d={s.d} fill={fill} stroke={C.edge} strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="transition-[fill] duration-500" />
                    {s.mergedD && <path d={s.mergedD} fill={fill} stroke={fill} strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="transition-[fill,stroke] duration-500" />}
                  </g>
                );
              })}
              {/* Names: start, end, and guessed countries big enough to hold one */}
              {shapes
                .filter(s => labelled.has(s.iso) || ((verdicts.has(s.iso) || revealed.has(s.iso)) && s.size / k > 60))
                .map(s => {
                  const pinned = labelled.has(s.iso);
                  return (
                    <text
                      key={`t-${s.iso}`}
                      x={s.cx}
                      y={s.cy + (pinned ? 12 * k : 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={(pinned ? 13 : 11.5) * k}
                      fontWeight="700"
                      fill="#1E2A44"
                      stroke="#FBF6EA"
                      strokeWidth={3 * k}
                      paintOrder="stroke"
                      fontFamily="Inter, sans-serif"
                      style={{ pointerEvents: 'none' }}
                    >
                      {countryName(s.iso)}
                    </text>
                  );
                })}
              {/* Pins on start and end */}
              {[route.start, route.end].map(iso => {
                const s = shapeOf(iso);
                if (!s) return null;
                return (
                  <g key={`pin-${iso}`} transform={`translate(${s.cx - 12 * k} ${s.cy - 30 * k}) scale(${k})`} style={{ pointerEvents: 'none' }}>
                    <path d="M12 0C5.4 0 0 5.2 0 11.6 0 20 12 30 12 30s12-10 12-18.4C24 5.2 18.6 0 12 0z" fill={iso === route.start ? C.start : C.end} stroke="#FBF6EA" strokeWidth="2" />
                    <circle cx="12" cy="11.5" r="4.5" fill="#FBF6EA" />
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-soft">Unfolding the road map…</div>
          )}

          {toast && (
            // Centred by flex, since the pop animation's transform would override a translate
            <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-center">
              <div className="animate-pop rounded-full bg-ink px-4 py-1.5 text-center text-sm font-semibold text-paper shadow-lg">{toast}</div>
            </div>
          )}

          <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
            <button onClick={() => map.zoomButton(1.5)} className="hud-card btn h-10 w-10 p-0 text-lg font-bold" aria-label="Zoom in">+</button>
            <button onClick={() => map.zoomButton(1 / 1.5)} className="hud-card btn h-10 w-10 p-0 text-lg font-bold" aria-label="Zoom out">−</button>
          </div>

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-0.5 rounded-lg bg-paper/90 px-2.5 py-1.5 text-[11px] text-ink-soft shadow-sm">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: C.green }} />Shortest route</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: C.yellow }} />Close, a longer way</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: C.gray }} />Off the route</span>
          </div>

          {finished && !cardOpen && (
            <button onClick={() => setCardOpen(true)} className="btn btn-primary absolute left-1/2 top-3 z-10 -translate-x-1/2 px-4 py-2 text-sm">
              Today&apos;s result
            </button>
          )}
        </div>
      </div>

      {/* Intro / result card */}
      {(phase === 'intro' || (finished && cardOpen)) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/25 p-4 backdrop-blur-[1px]">
          <div className="atlas-card w-full max-w-sm animate-pop p-6 text-center">
            {phase === 'intro' && (
              <>
                <div className="atlas-eyebrow mb-1">Daily Road Trip · {dateLabel}</div>
                <h2 className="font-display text-2xl font-bold leading-tight text-ink">
                  <span style={{ color: C.start }}>{countryName(route.start)}</span> to <span style={{ color: C.end }}>{countryName(route.end)}</span>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Drive there over land: type the countries you&apos;d cross. You need at least <span className="font-semibold text-ink">{fewest}</span>. No ferries, no flights.
                </p>
                <ul className="mx-auto mt-3 w-fit space-y-1 text-left text-sm text-ink-soft">
                  <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: C.green }} />On a shortest route</li>
                  <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: C.yellow }} />Close, but a longer way</li>
                  <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: C.gray }} />Off the route: a strike</li>
                </ul>
                <p className="mt-2 text-[11px] text-ink-faint">Three strikes and the trip is over · fewest stops 3★</p>
                <div className="mt-4 space-y-2">
                  <button onClick={start} className="btn btn-sea btn-block text-base">Start the trip</button>
                  <button onClick={onExit} className="btn btn-ghost btn-block text-sm">Main Menu</button>
                </div>
              </>
            )}
            {phase === 'won' && (
              <>
                <div className="atlas-eyebrow mb-1">Road Trip · {dateLabel}</div>
                <h2 className="font-display text-3xl font-bold text-ink">You made it!</h2>
                <div className="my-3 flex items-end justify-center gap-2 text-paper-line" role="img" aria-label={`${stars} of 3 stars`}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`${i === 1 ? 'mb-2' : ''} ${i < landed ? 'animate-star-land' : ''}`}>
                      <Star filled={i < landed} className={i === 1 ? 'h-14 w-14' : 'h-11 w-11'} />
                    </span>
                  ))}
                </div>
                <p className="text-sm text-ink-soft">
                  {guesses.length} {guesses.length === 1 ? 'stop' : 'stops'}, fewest possible {fewest}.
                  {streak > 1 && <span className="font-semibold text-ink"> {streak} days in a row!</span>}
                </p>
                <p className="mt-3 text-xs text-ink-soft">The shortest way</p>
                <p className="mt-0.5 text-sm font-semibold leading-relaxed text-ink">{shortest.map(countryName).join(' → ')}</p>
                <p className="mt-2 text-xs text-ink-faint">Next trip in {untilMidnight()}</p>
                {flagButtons}
              </>
            )}
            {phase === 'lost' && (
              <>
                <div className="atlas-eyebrow mb-1">Road Trip · {dateLabel}</div>
                <h2 className="font-display text-3xl font-bold text-ink">Out of fuel!</h2>
                <p className="mt-2 text-sm text-ink-soft">One shortest way was</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">{shortest.map(countryName).join(' → ')}</p>
                <p className="mt-2 text-xs text-ink-faint">Next trip in {untilMidnight()}</p>
                {flagButtons}
              </>
            )}
          </div>
        </div>
      )}

      {flagOpen && (
        <FlagMatch
          route={shortest}
          onDone={s => {
            saveFlagStars(puzzle.date, s);
            setFlagStars(f => Math.max(f, s));
          }}
          onClose={() => setFlagOpen(false)}
        />
      )}
    </div>
  );
}
