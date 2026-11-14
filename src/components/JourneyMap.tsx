import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import countriesLowUrl from '@/assets/geo/countries-low.geojson?url';
import AtlasScreen from './ui/AtlasScreen';
import { Star } from './ui/Star';
import MuteButton from './MuteButton';
import { MAX_LEVEL } from '../utils/scoring';
import type { SoloProgress } from '../utils/progress';
import { sfx } from '../utils/sound';

interface JourneyMapProps {
  progress: SoloProgress;
  /** Level stop the marker walks from (set right after unlocking a new level) */
  walkFrom?: number | null;
  /** Start a level (current or any beaten one) */
  onPlay: (level: number) => void;
  /** Wipe progress and start again from level 1 */
  onStartOver: () => void;
  onMainMenu?: () => void;
}

/**
 * The solo run as a trip around the world: levels 1-10 are stops on real
 * cities, the 11th (Auckland) is the endless stop for levels 11+.
 */
const STOPS = [
  { city: 'New York', country: 'United States of America', lat: 40.71, lng: -74.0 },
  { city: 'Mexico City', country: 'Mexico', lat: 19.43, lng: -99.13 },
  { city: 'Rio', country: 'Brazil', lat: -22.91, lng: -43.17 },
  { city: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.13 },
  { city: 'Rome', country: 'Italy', lat: 41.9, lng: 12.5 },
  { city: 'Cairo', country: 'Egypt', lat: 30.04, lng: 31.24 },
  { city: 'Dubai', country: 'United Arab Emirates', lat: 25.2, lng: 55.27 },
  { city: 'Delhi', country: 'India', lat: 28.61, lng: 77.21 },
  { city: 'Tokyo', country: 'Japan', lat: 35.68, lng: 139.65 },
  { city: 'Sydney', country: 'Australia', lat: -33.87, lng: 151.21 },
  { city: 'Auckland', country: 'New Zealand', lat: -36.85, lng: 174.76 },
] as const;
const N_STOPS = STOPS.length; // MAX_LEVEL + 1

// Equirectangular projection, 4 px per degree, cropped to latitudes 75°N..50°S
const PX_PER_DEG = 4;
const LAT_TOP = 75;
const LAT_BOTTOM = -50;
const VIEW_W = 360 * PX_PER_DEG;
const VIEW_H = (LAT_TOP - LAT_BOTTOM) * PX_PER_DEG;
const project = (lng: number, lat: number) => ({ x: (lng + 180) * PX_PER_DEG, y: (LAT_TOP - lat) * PX_PER_DEG });

const POINTS = STOPS.map(s => project(s.lng, s.lat));

/** Route legs as arcs bowing north, like flight paths on a travel map. */
const SEGMENTS = POINTS.slice(0, -1).map((a, i) => {
  const b = POINTS[i + 1];
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  // Normal pointing "up" the map
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const bow = Math.min(len * 0.22, 90);
  return `M${a.x},${a.y} Q${mx + nx * bow},${my + ny * bow} ${b.x},${b.y}`;
});

const stopIndex = (level: number) => Math.min(level, N_STOPS) - 1;

function canAnimate(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

type Ring = number[][];
interface CountryShape {
  name: string;
  d: string;
}

function ringPath(ring: Ring): string {
  let d = '';
  let prevLng: number | null = null;
  for (const [lng, lat] of ring) {
    const p = project(lng, Math.max(Math.min(lat, LAT_TOP + 10), LAT_BOTTOM - 30));
    // Start a new subpath when a ring jumps across the antimeridian
    const jump = prevLng !== null && Math.abs(lng - prevLng) > 180;
    d += `${d === '' || jump ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    prevLng = lng;
  }
  return d + 'Z';
}

/** Loads and projects the country outlines once per page (the file is already cached by the game map). */
let shapesPromise: Promise<CountryShape[]> | null = null;
function loadShapes(): Promise<CountryShape[]> {
  if (!shapesPromise) {
    shapesPromise = fetch(countriesLowUrl)
      .then(r => r.json())
      .then((geo: { features: { properties: { NAME: string }; geometry: { type: string; coordinates: unknown } }[] }) =>
        geo.features
          .filter(f => f.properties.NAME !== 'Antarctica')
          .map(f => {
            const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates) as Ring[][];
            return { name: f.properties.NAME, d: polys.map(rings => rings.map(ringPath).join('')).join('') };
          })
      )
      .catch(() => {
        shapesPromise = null;
        return [];
      });
  }
  return shapesPromise;
}

function useCountryShapes(): CountryShape[] {
  const [shapes, setShapes] = useState<CountryShape[]>([]);
  useEffect(() => {
    if (typeof fetch !== 'function') return;
    let alive = true;
    loadShapes().then(s => alive && setShapes(s));
    return () => {
      alive = false;
    };
  }, []);
  return shapes;
}

const STAR_PATH = 'M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.17l-5.7 3 1.09-6.36-4.62-4.5 6.38-.93L12 2.6z';

/**
 * Candy-style journey map for the solo run, drawn as a trip around the world:
 * each level is a stop on a real city, beaten stops show their best stars and
 * paint their country green, and the player's pin flies the route to the next
 * stop after a new unlock. Scrolls sideways on phones and follows the pin.
 */
export default function JourneyMap({ progress, walkFrom, onPlay, onStartOver, onMainMenu }: JourneyMapProps) {
  const current = progress.level;
  const currentStop = stopIndex(current);
  const fromStop = walkFrom != null ? stopIndex(walkFrom) : null;
  const shouldWalk = fromStop !== null && fromStop < currentStop && canAnimate();

  const shapes = useCountryShapes();
  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const segRefs = useRef<(SVGPathElement | null)[]>([]);
  const [marker, setMarker] = useState(() => POINTS[shouldWalk ? fromStop! : currentStop]);
  const [walking, setWalking] = useState(shouldWalk);
  const [trailStop, setTrailStop] = useState(shouldWalk ? fromStop! : currentStop);
  const [confirmingReset, setConfirmingReset] = useState(false);

  /** Scroll the map so a point (in map units) sits in the middle. */
  const centerOn = (x: number) => {
    const box = scrollRef.current;
    const svg = svgRef.current;
    if (!box || !svg || !svg.clientWidth) return;
    box.scrollLeft = (x * svg.clientWidth) / VIEW_W - box.clientWidth / 2;
  };

  useLayoutEffect(() => {
    centerOn(marker.x);
    if (!shouldWalk) return;
    const segs = segRefs.current.slice(fromStop!, currentStop).filter(Boolean) as SVGPathElement[];
    if (segs.length === 0 || typeof segs[0].getTotalLength !== 'function') {
      setMarker(POINTS[currentStop]);
      setWalking(false);
      setTrailStop(currentStop);
      return;
    }
    const lengths = segs.map(s => s.getTotalLength());
    const total = lengths.reduce((a, b) => a + b, 0);
    const duration = Math.min(1100 + total * 2.2, 3200);
    let frame = 0;
    let steps = 0;
    const startAt = performance.now() + 500; // a beat before setting off
    const tick = (now: number) => {
      const t = Math.max(0, Math.min((now - startAt) / duration, 1));
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      let dist = eased * total;
      let k = 0;
      while (k < segs.length - 1 && dist > lengths[k]) {
        dist -= lengths[k];
        k++;
      }
      const p = segs[k].getPointAtLength(Math.min(dist, lengths[k]));
      setMarker({ x: p.x, y: p.y });
      centerOn(p.x);
      const stepsDue = Math.floor((now - startAt) / 170);
      if (t > 0 && t < 1 && stepsDue > steps) {
        steps = stepsDue;
        sfx.step(steps);
      }
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setWalking(false);
        setTrailStop(currentStop);
        sfx.arrive();
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!confirmingReset) return;
    const t = setTimeout(() => setConfirmingReset(false), 3000);
    return () => clearTimeout(t);
  }, [confirmingReset]);

  const totalStars = useMemo(() => Object.values(progress.stars).reduce((a, b) => a + b, 0), [progress.stars]);
  const isFresh = current === 1 && totalStars === 0;

  // Countries painted by progress: beaten stops green, the current one warm
  const countryFill = useMemo(() => {
    const fills = new Map<string, string>();
    STOPS.forEach((s, i) => {
      if (i < trailStop || (i === N_STOPS - 1 && current > N_STOPS)) fills.set(s.country, '#A6CF8E');
      else if (i === currentStop && !walking) fills.set(s.country, '#F2B790');
    });
    return fills;
  }, [trailStop, currentStop, walking, current]);

  const play = (level: number) => {
    sfx.click();
    onPlay(level);
  };

  const handleStartOver = () => {
    if (!confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    setConfirmingReset(false);
    onStartOver();
  };

  const here = STOPS[currentStop];

  return (
    <AtlasScreen widthClass="max-w-3xl">
      <div className="absolute right-4 top-4 z-10">
        <MuteButton />
      </div>

      <div className="mb-3 text-center">
        <div className="atlas-eyebrow">Solo Run</div>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Around the World</h1>
        <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-ink-soft">
          <Star filled className="h-4 w-4" />
          {totalStars} / {MAX_LEVEL * 3}
        </div>
      </div>

      <div className="atlas-card overflow-hidden p-1.5">
        <div ref={scrollRef} className="journey-scroll overflow-x-auto overflow-y-hidden rounded-[10px]" style={{ scrollbarWidth: 'none' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="block max-w-none"
            style={{ height: 'min(56dvh, 460px)', aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
            role="group"
            aria-label="World journey map"
          >
            <defs>
              <pattern id="jm-waves" width="60" height="34" patternUnits="userSpaceOnUse">
                <path d="M6 20 q6 -6 12 0 t12 0" fill="none" stroke="#9FC6DB" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M36 6 q5 -5 10 0" fill="none" stroke="#A9CDE0" strokeWidth="1.4" strokeLinecap="round" />
              </pattern>
              <filter id="jm-shadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="0" dy="3" stdDeviation="0" floodColor="#8FB4C8" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Ocean */}
            <rect width={VIEW_W} height={VIEW_H} fill="#BCDCEC" />
            <rect width={VIEW_W} height={VIEW_H} fill="url(#jm-waves)" />
            {/* Graticule */}
            {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lng => (
              <line key={`m${lng}`} x1={project(lng, 0).x} x2={project(lng, 0).x} y1={0} y2={VIEW_H} stroke="#A7CCDF" strokeWidth="1" strokeDasharray="3 7" />
            ))}
            {[60, 30, 0, -30].map(lat => (
              <line key={`p${lat}`} y1={project(0, lat).y} y2={project(0, lat).y} x1={0} x2={VIEW_W} stroke="#A7CCDF" strokeWidth="1" strokeDasharray="3 7" />
            ))}

            {/* Land */}
            <g filter="url(#jm-shadow)" stroke="#C4AE84" strokeWidth="1.1" strokeLinejoin="round">
              {shapes.map(s => (
                <path key={s.name} d={s.d} fill={countryFill.get(s.name) ?? '#F4E7C5'} />
              ))}
            </g>

            {/* Compass rose */}
            <g transform={`translate(${project(-150, -35).x},${project(-150, -35).y})`} opacity="0.75">
              <circle r="34" fill="#F7EFD9" stroke="#C4AE84" strokeWidth="2" />
              <path d="M0,-30 L6,0 L0,30 L-6,0Z" fill="#1E2A44" />
              <path d="M-30,0 L0,6 L30,0 L0,-6Z" fill="#8A7A5C" />
              <path d="M0,-30 L6,0 L-6,0Z" fill="#C8553D" />
              <text y="-40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1E2A44" fontFamily="Fraunces, serif">N</text>
            </g>

            {/* Route: whole trip as a faint dotted road, travelled legs solid */}
            {SEGMENTS.map((d, i) => (
              <g key={i}>
                <path d={d} fill="none" stroke="#FBF6EA" strokeWidth="9" strokeLinecap="round" opacity="0.85" />
                <path d={d} fill="none" stroke="#9C8A68" strokeWidth="3" strokeDasharray="1 11" strokeLinecap="round" />
                <path
                  ref={el => (segRefs.current[i] = el)}
                  d={d}
                  fill="none"
                  stroke="#C8553D"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeDasharray="10 8"
                  opacity={i < trailStop ? 0.95 : 0}
                />
              </g>
            ))}

            {/* Stops */}
            {POINTS.map((p, i) => {
              const level = i + 1;
              const stop = STOPS[i];
              const endless = i === N_STOPS - 1;
              const beaten = !endless && level < current;
              const isCurrent = i === currentStop;
              const unlocked = beaten || i <= currentStop;
              const stars = progress.stars[level] ?? 0;
              const label = endless ? (current > MAX_LEVEL ? `${current}` : '∞') : `${level}`;
              const fill = beaten ? '#4E8B5A' : isCurrent ? '#C8553D' : '#EDE3CC';
              const ring = beaten ? '#3B6E45' : isCurrent ? '#9E3F2C' : '#C9B994';
              const text = beaten || isCurrent ? '#FBF6EA' : '#A8977A';
              const labelBelow = !(beaten && stars > 0);
              return (
                <g
                  key={i}
                  transform={`translate(${p.x},${p.y})`}
                  onClick={unlocked && !walking ? () => play(endless ? Math.max(current, MAX_LEVEL + 1) : level) : undefined}
                  style={{ cursor: unlocked && !walking ? 'pointer' : 'default' }}
                  role={unlocked ? 'button' : undefined}
                  aria-label={
                    endless
                      ? unlocked
                        ? `Endless, level ${current}, ${stop.city}`
                        : `Endless levels, locked, ${stop.city}`
                      : `Level ${level}${beaten ? `, ${stars} stars` : unlocked ? ', current' : ', locked'}, ${stop.city}`
                  }
                >
                  {isCurrent && !walking && (
                    <circle r="24" fill="#C8553D" className="animate-node-pulse" style={{ transformOrigin: 'center', transformBox: 'fill-box' }} />
                  )}
                  <circle r="19" cy="3" fill="#1E2A4426" />
                  <circle r="18" fill={fill} stroke={ring} strokeWidth="3" />
                  <text y={endless && current > MAX_LEVEL ? 5 : 6} textAnchor="middle" fontSize={endless && current > MAX_LEVEL ? 13 : endless ? 19 : 16} fontWeight="700" fill={text} fontFamily="Fraunces, serif">
                    {label}
                  </text>
                  {beaten && stars > 0 && (
                    <g transform="translate(-21,19)">
                      {[0, 1, 2].map(s => (
                        <path
                          key={s}
                          transform={`translate(${s * 14},${s === 1 ? 3 : 0}) scale(0.6)`}
                          d={STAR_PATH}
                          fill={s < stars ? '#C9962B' : '#FBF6EA'}
                          stroke={s < stars ? '#8A6418' : '#C9B994'}
                          strokeWidth="1.6"
                        />
                      ))}
                    </g>
                  )}
                  {/* City name on a little paper label */}
                  <g transform={`translate(0,${labelBelow ? 32 : 44})`}>
                    <rect x={-stop.city.length * 3.9 - 7} y="-9" width={stop.city.length * 7.8 + 14} height="18" rx="9" fill="#FBF6EA" stroke="#D9C9A5" strokeWidth="1" opacity="0.95" />
                    <text y="4.5" textAnchor="middle" fontSize="12" fontWeight="600" fill={unlocked ? '#1E2A44' : '#A8977A'} fontFamily="Inter, sans-serif">
                      {stop.city}
                    </text>
                  </g>
                  {!unlocked && (
                    <g transform="translate(13,-15)">
                      <rect x="-5" y="-2" width="10" height="8" rx="1.5" fill="#A8977A" />
                      <path d="M-3,-2 v-2 a3,3 0 0 1 6,0 v2" fill="none" stroke="#A8977A" strokeWidth="1.8" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Player pin */}
            <g transform={`translate(${marker.x},${marker.y - 46})`} style={{ pointerEvents: 'none' }}>
              <g className={walking ? '' : 'animate-bob'}>
                <path d="M0,26 C-3,17 -14,10 -14,-2 a14,14 0 0 1 28,0 C14,10 3,17 0,26z" fill="#1E2A44" stroke="#FBF6EA" strokeWidth="2.5" />
                <circle cy="-2" r="5.5" fill="#FBF6EA" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-ink-faint">
        {current > MAX_LEVEL ? `Endless run · level ${current}` : `Next stop: ${here.city}`}
        <span className="sm:hidden"> · swipe the map</span>
      </p>

      {isFresh && (
        <p className="mt-2 text-center text-xs leading-relaxed text-ink-soft">
          Pin each city as close as you can. Hit the target over 5 rounds to fly to the next stop, and earn up to 3 stars
          per level.
        </p>
      )}

      <div className="mx-auto mt-3 max-w-md space-y-2">
        <button onClick={() => play(current)} disabled={walking} className="btn btn-accent btn-block text-base">
          {isFresh ? 'Start Level 1' : `Play Level ${current}`}
        </button>
        <div className="flex gap-2">
          {onMainMenu && (
            <button onClick={onMainMenu} className="btn btn-ghost flex-1 text-sm">
              Main Menu
            </button>
          )}
          {!isFresh && (
            <button onClick={handleStartOver} className={`btn flex-1 text-sm ${confirmingReset ? 'btn-primary' : 'btn-ghost'}`}>
              {confirmingReset ? 'Tap again to reset' : 'Start Over'}
            </button>
          )}
        </div>
      </div>
    </AtlasScreen>
  );
}
