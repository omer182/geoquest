import { useMemo } from 'react';
import AtlasScreen, { AtlasHeading } from './ui/AtlasScreen';
import { Star, StarRow } from './ui/Star';
import MuteButton from './MuteButton';
import { REGIONS, livesFor, type Region, type RegionId } from '../data/regions';
import { useShapes, type CountryFeature } from '../utils/countryShapes';
import { projectRegion, VIEW_W, LAND } from '../utils/regionProjection';
import { loadProgress } from '../utils/progress';
import { sfx } from '../utils/sound';

interface PaintTheMapMenuProps {
  onPlay: (region: RegionId) => void;
  onBack: () => void;
}

/** Small outline of a region; painted in once the player has won it. */
function RegionThumb({ region, features, painted }: { region: Region; features: CountryFeature[] | null; painted: boolean }) {
  const projected = useMemo(() => (features ? projectRegion(region, features) : null), [features, region]);
  if (!projected) return <div className="h-full w-full animate-pulse rounded-md bg-paper-line/50" />;
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${projected.viewH}`} className="h-full w-full" aria-hidden="true">
      {projected.shapes.map(s => (
        <path key={s.iso} d={s.d} fill={painted ? s.paint : LAND} stroke="#B39D72" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/**
 * "Paint the Map" mode: pick a region, then paint its countries (or US states)
 * as they are called. Separate from the solo journey, all regions open.
 */
export default function PaintTheMapMenu({ onPlay, onBack }: PaintTheMapMenuProps) {
  const countries = useShapes('countries');
  const states = useShapes('us-states');
  const best = useMemo(() => loadProgress().mini, []);
  const total = Object.values(best).reduce((a, b) => a + b, 0);

  return (
    <AtlasScreen widthClass="max-w-lg">
      <div className="absolute right-4 top-4 z-10">
        <MuteButton />
      </div>
      <AtlasHeading
        eyebrow="Mini games"
        title="Paint the Map"
        subtitle="We call a place, you tap it. Paint every one yourself to colour the whole map. Wrong taps cost a life."
      />

      <div className="mb-3 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/80 px-3 py-1 text-sm font-semibold tabular-nums text-ink-soft">
          <Star filled className="h-4 w-4" />
          {total} / {REGIONS.length * 3}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {REGIONS.map(region => {
          const stars = best[region.id] ?? 0;
          return (
            <button
              key={region.id}
              onClick={() => {
                sfx.click();
                onPlay(region.id);
              }}
              className="atlas-card group flex flex-col items-stretch p-2.5 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
              aria-label={`Paint ${region.name}${stars ? `, best ${stars} stars` : ''}`}
            >
              <div className="h-24 overflow-hidden rounded-md bg-[#BCDCEC] p-1.5 sm:h-28">
                <RegionThumb region={region} features={region.source === 'us-states' ? states : countries} painted={stars > 0} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="font-display text-base font-bold leading-tight text-ink">{region.name}</span>
                <StarRow count={stars} className="h-3.5 w-3.5" gap="gap-0" />
              </div>
              <div className="text-[11px] text-ink-faint">
                {region.codes.length} {region.source === 'us-states' ? 'states' : 'countries'} · {livesFor(region.codes.length)} lives
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={onBack} className="btn btn-secondary btn-block mt-4 text-sm">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        Main Menu
      </button>
    </AtlasScreen>
  );
}
