import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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

// ---------------------------------------------------------------------------
// Layout: a made-up world climbing from meadows to a castle in the sky.
// Level stops wind up the middle of the map.
// ---------------------------------------------------------------------------
const W = 360;
const N_LEVELS = MAX_LEVEL + 1; // 10 levels + the endless castle stop
const GAP = 118;
const BOTTOM_PAD = 92;
const TOP_PAD = 150;
const H = BOTTOM_PAD + (N_LEVELS - 1) * GAP + TOP_PAD;

type Pt = { x: number; y: number };
const NODES: Pt[] = Array.from({ length: N_LEVELS }, (_, i) => ({
  x: W / 2 + 92 * Math.sin(i * 1.3 + 0.5),
  y: H - BOTTOM_PAD - i * GAP,
}));

function controls(i: number): [Pt, Pt] {
  const p0 = NODES[Math.max(i - 1, 0)];
  const p1 = NODES[i];
  const p2 = NODES[i + 1];
  const p3 = NODES[Math.min(i + 2, N_LEVELS - 1)];
  return [
    { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
    { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
  ];
}
const bezierAt = (i: number, t: number): Pt => {
  const p1 = NODES[i];
  const p2 = NODES[i + 1];
  const [c1, c2] = controls(i);
  const u = 1 - t;
  return {
    x: u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x,
    y: u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y,
  };
};
const SEGMENTS = Array.from({ length: N_LEVELS - 1 }, (_, i) => {
  const [c1, c2] = controls(i);
  return `M${NODES[i].x},${NODES[i].y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${NODES[i + 1].x},${NODES[i + 1].y}`;
});

// Zones (by level index), bottom to top
const ZONES = [
  { name: 'Meadowlands', from: 0, to: 2, ground: '#CDE7B0', kind: 'meadow' },
  { name: 'Sunny Dunes', from: 3, to: 4, ground: '#F3DFA6', kind: 'desert' },
  { name: 'Jungle Deep', from: 5, to: 6, ground: '#A6D49E', kind: 'jungle' },
  { name: 'Frost Peaks', from: 7, to: 8, ground: '#E2EDF3', kind: 'frost' },
  { name: 'Sky Castle', from: 9, to: 10, ground: '#D9D1F1', kind: 'sky' },
] as const;
type Zone = (typeof ZONES)[number];
type ZoneKind = Zone['kind'];
const zoneTop = (z: Zone) => (z.to >= N_LEVELS - 1 ? 0 : (NODES[z.to].y + NODES[z.to + 1].y) / 2);
const zoneBottom = (z: Zone) => (z.from === 0 ? H : (NODES[z.from].y + NODES[z.from - 1].y) / 2);
const zoneAt = (y: number): Zone => ZONES.find(z => y <= zoneBottom(z) && y >= zoneTop(z)) ?? ZONES[0];

// Seeded RNG so the scenery is identical on every visit
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

/** Scenery positions that keep clear of the road, the stops and their labels. */
const SCENERY = (() => {
  const keepOut: Pt[] = [];
  for (let i = 0; i < N_LEVELS - 1; i++) for (let t = 0; t <= 1; t += 1 / 14) keepOut.push(bezierAt(i, t));
  NODES.forEach(n => keepOut.push({ x: n.x, y: n.y + 30 }));
  const castle = { x: NODES[N_LEVELS - 1].x, y: NODES[N_LEVELS - 1].y - 70 };
  keepOut.push(castle, { x: castle.x - 40, y: castle.y }, { x: castle.x + 40, y: castle.y }, { x: castle.x, y: castle.y - 40 });
  const clear = (p: Pt, r: number) => keepOut.every(k => Math.hypot(k.x - p.x, k.y - p.y) > r);

  const rand = rng(7);
  const items: { x: number; y: number; kind: ZoneKind; v: number; s: number; big?: boolean }[] = [];
  // One lake in the meadow and one in the jungle, where there's room
  for (const kind of ['meadow', 'jungle'] as const) {
    const z = ZONES.find(zz => zz.kind === kind)!;
    for (let tries = 0; tries < 300; tries++) {
      const p = { x: 40 + rand() * (W - 80), y: zoneTop(z) + 40 + rand() * (zoneBottom(z) - zoneTop(z) - 80) };
      if (clear(p, 58)) {
        items.push({ ...p, kind, v: -1, s: 1, big: true });
        keepOut.push(p, { x: p.x - 30, y: p.y }, { x: p.x + 30, y: p.y });
        break;
      }
    }
  }
  for (let y = 20; y < H - 10; y += 30) {
    for (let x = 16; x < W - 10; x += 30) {
      const p = { x: x + (rand() - 0.5) * 18, y: y + (rand() - 0.5) * 18 };
      if (rand() < 0.42 || !clear(p, 30)) continue;
      items.push({ ...p, kind: zoneAt(p.y).kind, v: rand(), s: 0.75 + rand() * 0.5 });
      keepOut.push(p);
    }
  }
  return items.sort((a, b) => a.y - b.y); // back to front
})();

function Scenery({ kind, v, big }: { kind: ZoneKind; v: number; big?: boolean }): ReactNode {
  if (big) {
    return (
      <g>
        <ellipse rx="34" ry="17" fill="#8EC3DE" stroke="#6FA9C6" strokeWidth="2" />
        <path d="M-14,-3 q6,-4 12,0 M4,5 q5,-3 10,0" stroke="#D6ECF6" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  switch (kind) {
    case 'meadow':
      if (v < 0.5)
        return (
          <g>
            <rect x="-2" y="2" width="4" height="9" rx="1" fill="#8A6A44" />
            <circle cy="-3" r="10" fill="#6FAE5C" />
            <circle cx="-3" cy="-6" r="5" fill="#86C26F" />
          </g>
        );
      if (v < 0.75)
        return (
          <g fill="#7DB966">
            <circle cx="-6" cy="2" r="6" />
            <circle cx="5" cy="2" r="6" />
            <circle cy="-3" r="7" fill="#8CC774" />
          </g>
        );
      if (v < 0.92)
        return (
          <g>
            <circle cx="-4" r="2.2" fill="#F4A6A0" />
            <circle cx="3" cy="-3" r="2.2" fill="#F7E08A" />
            <circle cx="4" cy="4" r="2.2" fill="#FBF6EA" />
          </g>
        );
      return (
        <g>
          <rect x="-9" y="-4" width="18" height="13" fill="#FBF6EA" stroke="#B39D72" strokeWidth="1.2" />
          <path d="M-12,-3 L0,-13 L12,-3Z" fill="#C8553D" />
          <rect x="-2" y="2" width="4" height="7" fill="#8A6A44" />
        </g>
      );
    case 'desert':
      if (v < 0.45)
        return (
          <g fill="#6E9F57">
            <rect x="-3" y="-12" width="6" height="22" rx="3" />
            <rect x="-10" y="-5" width="5" height="10" rx="2.5" />
            <rect x="5" y="-8" width="5" height="9" rx="2.5" />
            <rect x="-8" y="2" width="8" height="3" rx="1.5" />
            <rect x="2" y="-1" width="7" height="3" rx="1.5" />
          </g>
        );
      if (v < 0.8) return <path d="M-16,6 Q-4,-8 8,4 Q12,0 18,6Z" fill="#E7CB86" />;
      if (v < 0.93) return <ellipse rx="7" ry="4.5" cy="3" fill="#C9B48A" />;
      return (
        <g>
          <path d="M-14,8 L0,-12 L14,8Z" fill="#E9C46A" />
          <path d="M0,-12 L14,8 L4,8Z" fill="#D2A94F" />
        </g>
      );
    case 'jungle':
      if (v < 0.45)
        return (
          <g>
            <path d="M0,10 Q2,0 -1,-10" stroke="#8A6A44" strokeWidth="3" fill="none" strokeLinecap="round" />
            <g fill="#3E8E4E">
              <path d="M-1,-10 Q-12,-14 -16,-6 Q-8,-10 -1,-9Z" />
              <path d="M-1,-10 Q10,-15 15,-6 Q7,-10 -1,-9Z" />
              <path d="M-1,-10 Q-6,-20 -2,-22 Q-2,-15 0,-10Z" />
              <path d="M-1,-10 Q6,-19 10,-18 Q3,-14 -1,-10Z" />
            </g>
          </g>
        );
      if (v < 0.85)
        return (
          <g>
            <rect x="-2.5" y="3" width="5" height="8" fill="#6B4F33" />
            <circle cy="-4" r="11" fill="#3F8A4C" />
            <circle cx="-5" cy="-7" r="5" fill="#57A35F" />
            <circle cx="5" cy="-1" r="4" fill="#57A35F" />
          </g>
        );
      return <path d="M0,8 Q-3,-2 -10,-6 M0,8 Q1,-4 0,-10 M0,8 Q4,-2 10,-5" stroke="#2F7A3E" strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    case 'frost':
      if (v < 0.5)
        return (
          <g>
            <path d="M-20,10 L0,-18 L20,10Z" fill="#9FB4C4" />
            <path d="M0,-18 L20,10 L6,10Z" fill="#879DAE" />
            <path d="M-7,-8 L0,-18 L7,-8 L3,-6 L0,-9 L-3,-5Z" fill="#FBFDFF" />
          </g>
        );
      if (v < 0.88)
        return (
          <g>
            <rect x="-1.5" y="6" width="3" height="5" fill="#6B4F33" />
            <path d="M-9,7 L0,-4 L9,7Z" fill="#3F7A5E" />
            <path d="M-7,1 L0,-10 L7,1Z" fill="#4C8B6C" />
            <path d="M-3,-6 L0,-10 L3,-6Z" fill="#FBFDFF" />
          </g>
        );
      return <circle r="2" fill="#FFFFFF" />;
    case 'sky':
      if (v < 0.6)
        return (
          <g fill="#FFFFFF" opacity="0.9">
            <circle cx="-8" r="7" />
            <circle cx="2" cy="-4" r="9" />
            <circle cx="11" r="6" />
            <rect x="-14" y="0" width="30" height="6" rx="3" />
          </g>
        );
      return <path d="M0,-6 L1.5,-1.5 L6,0 L1.5,1.5 L0,6 L-1.5,1.5 L-6,0 L-1.5,-1.5Z" fill="#F7E08A" />;
  }
}

function Castle() {
  return (
    <g>
      <ellipse cy="40" rx="62" ry="12" fill="#FFFFFF" opacity="0.85" />
      <rect x="-34" y="-6" width="68" height="44" fill="#EDE6F7" stroke="#9C8FC4" strokeWidth="2" />
      <rect x="-48" y="-22" width="20" height="60" fill="#E4DBF3" stroke="#9C8FC4" strokeWidth="2" />
      <rect x="28" y="-22" width="20" height="60" fill="#E4DBF3" stroke="#9C8FC4" strokeWidth="2" />
      <path d="M-52,-22 L-38,-42 L-24,-22Z M24,-22 L38,-42 L52,-22Z" fill="#C8553D" />
      <rect x="-12" y="-30" width="24" height="30" fill="#E4DBF3" stroke="#9C8FC4" strokeWidth="2" />
      <path d="M-16,-30 L0,-52 L16,-30Z" fill="#C8553D" />
      <path d="M0,-52 v-12 l10,4 -10,4" stroke="#1E2A44" strokeWidth="1.5" fill="#C9962B" />
      <path d="M-9,38 v-14 a9,9 0 0 1 18,0 v14Z" fill="#9C8FC4" />
      <rect x="-42" y="-10" width="7" height="10" rx="3.5" fill="#9C8FC4" />
      <rect x="35" y="-10" width="7" height="10" rx="3.5" fill="#9C8FC4" />
    </g>
  );
}

const STAR_PATH = 'M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.17l-5.7 3 1.09-6.36-4.62-4.5 6.38-.93L12 2.6z';

function MiniStars({ count, y }: { count: number; y: number }) {
  return (
    <g transform={`translate(-21,${y})`}>
      {[0, 1, 2].map(s => (
        <path
          key={s}
          transform={`translate(${s * 14},${s === 1 ? 3 : 0}) scale(0.6)`}
          d={STAR_PATH}
          fill={s < count ? '#C9962B' : '#FBF6EA'}
          stroke={s < count ? '#8A6418' : '#C9B994'}
          strokeWidth="1.6"
        />
      ))}
    </g>
  );
}

const stopIndex = (level: number) => Math.min(level, N_LEVELS) - 1;

function canAnimate(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Candy-style journey map for the solo run: a made-up world that climbs from
 * the Meadowlands to a castle in the sky. Beaten stops show their best stars,
 * the player's pin walks the road to each newly unlocked stop, and
 * "paint the region" bonus stops branch off the road as they unlock.
 */
export default function JourneyMap({ progress, walkFrom, onPlay, onStartOver, onMainMenu }: JourneyMapProps) {
  const current = progress.level;
  const currentStop = stopIndex(current);
  const fromStop = walkFrom != null ? stopIndex(walkFrom) : null;
  const shouldWalk = fromStop !== null && fromStop < currentStop && canAnimate();

  const scrollRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const segRefs = useRef<(SVGPathElement | null)[]>([]);
  const [marker, setMarker] = useState<Pt>(() => NODES[shouldWalk ? fromStop! : currentStop]);
  const [walking, setWalking] = useState(shouldWalk);
  const [trailStop, setTrailStop] = useState(shouldWalk ? fromStop! : currentStop);
  const [confirmingReset, setConfirmingReset] = useState(false);

  /** Scroll so a map point sits a little below the middle (more road ahead in view). */
  const centerOn = (y: number) => {
    const box = scrollRef.current;
    const svg = svgRef.current;
    if (!box || !svg || !svg.clientWidth) return;
    box.scrollTop = (y * svg.clientWidth) / W - box.clientHeight * 0.58;
  };

  useLayoutEffect(() => {
    centerOn(marker.y);
    if (!shouldWalk) return;
    const segs = segRefs.current.slice(fromStop!, currentStop).filter(Boolean) as SVGPathElement[];
    if (segs.length === 0 || typeof segs[0].getTotalLength !== 'function') {
      setMarker(NODES[currentStop]);
      setWalking(false);
      setTrailStop(currentStop);
      return;
    }
    const lengths = segs.map(s => s.getTotalLength());
    const total = lengths.reduce((a, b) => a + b, 0);
    const duration = Math.min(900 + total * 5, 3000);
    let frame = 0;
    let steps = 0;
    const startAt = performance.now() + 500;
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
      centerOn(p.y);
      const stepsDue = Math.floor((now - startAt) / 170);
      if (t > 0 && t < 1 && stepsDue > steps) {
        steps = stepsDue;
        sfx.step(steps);
      }
      if (t < 1) frame = requestAnimationFrame(tick);
      else {
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
  const maxStars = MAX_LEVEL * 3;
  const isFresh = current === 1 && totalStars === 0;

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

  return (
    <AtlasScreen widthClass="max-w-md">
      <div className="absolute right-4 top-4 z-10">
        <MuteButton />
      </div>

      <div className="mb-3 text-center">
        <div className="atlas-eyebrow">Solo Run</div>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Your Journey</h1>
        <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums text-ink-soft">
          <Star filled className="h-4 w-4" />
          {totalStars} / {maxStars}
        </div>
      </div>

      <div className="atlas-card overflow-hidden p-1.5">
        <div
          ref={scrollRef}
          className="journey-scroll overflow-y-auto overflow-x-hidden rounded-[10px]"
          style={{ height: 'min(58dvh, 600px)', scrollbarWidth: 'none' }}
        >
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label="Journey map">
            <defs>
              <linearGradient id="jm-ground" x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
                {ZONES.slice()
                  .reverse()
                  .flatMap(z => [
                    <stop key={`${z.name}-a`} offset={Math.max(0, zoneTop(z) + 30) / H} stopColor={z.ground} />,
                    <stop key={`${z.name}-b`} offset={Math.min(H, zoneBottom(z) - 30) / H} stopColor={z.ground} />,
                  ])}
              </linearGradient>
            </defs>

            <rect width={W} height={H} fill="url(#jm-ground)" />

            {/* Scenery */}
            {SCENERY.map((s, i) => (
              <g key={i} transform={`translate(${s.x.toFixed(1)},${s.y.toFixed(1)}) scale(${s.s.toFixed(2)})`}>
                <Scenery kind={s.kind} v={s.v} big={s.big} />
              </g>
            ))}

            {/* Zone signposts */}
            {ZONES.map(z => {
              // Put the sign wherever near the zone edge is farthest from any stop, its stars or its label
              const stops = [
                ...NODES,
                ...NODES.map(n => ({ x: n.x, y: n.y + 22 })),
              ];
              const yBase = zoneBottom(z) - (z.from === 0 ? 34 : 22);
              const spots = [62, W - 62].flatMap(sx => [0, 26, -26].map(dy => ({ x: sx, y: yBase + dy })));
              const room = (s: Pt) => Math.min(...stops.map(p => Math.hypot((p.x - s.x) * 0.6, p.y - s.y)));
              const { x, y } = spots.reduce((best, s) => (room(s) > room(best) ? s : best));
              return (
                <g key={z.name} transform={`translate(${x},${y})`}>
                  <rect x="-2" y="2" width="4" height="16" fill="#8A6A44" />
                  <rect
                    x={-z.name.length * 3.6 - 9}
                    y="-10"
                    width={z.name.length * 7.2 + 18}
                    height="18"
                    rx="3"
                    fill="#B98A57"
                    stroke="#8A6A44"
                    strokeWidth="1.5"
                  />
                  <text y="3.5" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FBF6EA" fontFamily="Fraunces, serif" letterSpacing="0.3">
                    {z.name}
                  </text>
                </g>
              );
            })}

            {/* Castle behind the endless stop */}
            <g transform={`translate(${NODES[N_LEVELS - 1].x},${NODES[N_LEVELS - 1].y - 78})`}>
              <Castle />
            </g>

            {/* Road */}
            {SEGMENTS.map((d, i) => (
              <g key={i}>
                <path d={d} fill="none" stroke="#E9D9B4" strokeWidth="18" strokeLinecap="round" />
                <path d={d} fill="none" stroke="#F8EED6" strokeWidth="12" strokeLinecap="round" />
                <path
                  ref={el => (segRefs.current[i] = el)}
                  d={d}
                  fill="none"
                  stroke="#C8553D"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 7"
                  opacity={i < trailStop ? 0.9 : 0.18}
                />
              </g>
            ))}

            {/* Level stops */}
            {NODES.map((p, i) => {
              const level = i + 1;
              const endless = i === N_LEVELS - 1;
              const beaten = !endless && level < current;
              const isCurrent = i === currentStop;
              const unlocked = beaten || i <= currentStop;
              const stars = progress.stars[level] ?? 0;
              const label = endless ? (current > MAX_LEVEL ? `${current}` : '∞') : `${level}`;
              const fill = beaten ? '#4E8B5A' : isCurrent ? '#C8553D' : '#EDE3CC';
              const ring = beaten ? '#3B6E45' : isCurrent ? '#9E3F2C' : '#C9B994';
              const text = beaten || isCurrent ? '#FBF6EA' : '#A8977A';
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
                        ? `Endless, level ${current}`
                        : 'Endless levels, locked'
                      : `Level ${level}${beaten ? `, ${stars} stars` : unlocked ? ', current' : ', locked'}`
                  }
                >
                  {isCurrent && !walking && (
                    <circle r="26" fill="#C8553D" className="animate-node-pulse" style={{ transformOrigin: 'center', transformBox: 'fill-box' }} />
                  )}
                  <circle r="21" cy="4" fill="#1E2A4430" />
                  <circle r="20" fill={fill} stroke={ring} strokeWidth="3.5" />
                  <circle r="13" cy="-4" fill="#FFFFFF" opacity="0.12" />
                  <text
                    y={endless && current > MAX_LEVEL ? 5 : 6}
                    textAnchor="middle"
                    fontSize={endless && current > MAX_LEVEL ? 13 : endless ? 20 : 17}
                    fontWeight="700"
                    fill={text}
                    fontFamily="Fraunces, serif"
                  >
                    {label}
                  </text>
                  {beaten && stars > 0 && <MiniStars count={stars} y={21} />}
                  {!unlocked && (
                    <g transform="translate(14,-16)">
                      <rect x="-5" y="-2" width="10" height="8" rx="1.5" fill="#A8977A" />
                      <path d="M-3,-2 v-2 a3,3 0 0 1 6,0 v2" fill="none" stroke="#A8977A" strokeWidth="1.8" />
                    </g>
                  )}
                </g>
              );
            })}

            {/* Player pin */}
            <g transform={`translate(${marker.x},${marker.y - 48})`} style={{ pointerEvents: 'none' }}>
              <g className={walking ? '' : 'animate-bob'}>
                <path d="M0,26 C-3,17 -14,10 -14,-2 a14,14 0 0 1 28,0 C14,10 3,17 0,26z" fill="#1E2A44" stroke="#FBF6EA" strokeWidth="2.5" />
                <circle cy="-2" r="5.5" fill="#FBF6EA" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {isFresh && (
        <p className="mt-3 text-center text-xs leading-relaxed text-ink-soft">
          Pin each city as close as you can. Hit the target over 5 rounds to unlock the next stop, earn up to 3 stars per
          level.
        </p>
      )}

      <div className="mt-3 space-y-2">
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
