import AtlasScreen, { CompassRose } from './ui/AtlasScreen';
import { loadDay, localDate } from '../utils/roadTrip';

interface MainMenuProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
  onPaintTheMap: () => void;
  onRoadTrip: () => void;
  onAbout: () => void;
}

/**
 * MainMenu component - Entry point for choosing game mode
 * Options: My Journey, Paint the Map (mini games), the daily Road Trip, Online Battle, and About
 */
export default function MainMenu({ onSinglePlayer, onMultiplayer, onPaintTheMap, onRoadTrip, onAbout }: MainMenuProps) {
  const today = loadDay(localDate());
  const tripDone = today?.status === 'won' || today?.status === 'lost';
  return (
    <AtlasScreen>
      {/* Wordmark */}
      <div className="mb-6 text-center">
        <CompassRose className="mx-auto mb-3 h-16 w-16 drop-shadow-md" />
        <h1 className="font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl">GeoQuest</h1>
        <div className="atlas-rule mx-auto mt-2 max-w-[380px] text-ink-soft">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] sm:whitespace-nowrap sm:text-[11px]">
            Explore the World, Test Your Knowledge
          </span>
        </div>
      </div>

      <div className="atlas-card p-5">
        <div className="space-y-2.5">
          {/* My Journey (solo levels) */}
          <button onClick={onSinglePlayer} className="btn btn-primary btn-block justify-between">
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-lg">🧭</span>
              My Journey
            </span>
            <span aria-hidden="true" className="text-paper/60">→</span>
          </button>

          {/* Paint the Map (mini games) */}
          <button onClick={onPaintTheMap} className="btn btn-success btn-block justify-between">
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-lg">🎨</span>
              Paint the Map
            </span>
            <span aria-hidden="true" className="text-white/70">→</span>
          </button>

          {/* Road Trip (daily puzzle) */}
          <button onClick={onRoadTrip} className="btn btn-sea btn-block justify-between">
            <span className="flex items-center gap-2.5 whitespace-nowrap">
              <span aria-hidden="true" className="text-lg">🚗</span>
              Road Trip
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                  tripDone ? 'bg-white/20 text-white' : 'bg-brass-light text-ink'
                }`}
              >
                {tripDone ? 'Done today' : 'Daily challenge'}
              </span>
              {/* No room for the arrow beside the pill on the narrowest phones */}
              <span aria-hidden="true" className="hidden text-white/70 min-[360px]:inline">→</span>
            </span>
          </button>

          {/* Online Battle Button */}
          <button onClick={onMultiplayer} className="btn btn-accent btn-block justify-between">
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-lg">⚔️</span>
              Online Battle
            </span>
            <span aria-hidden="true" className="text-white/70">→</span>
          </button>

          {/* About Button */}
          <button onClick={onAbout} className="btn btn-ghost btn-block text-sm">
            About
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-5 text-center text-xs font-medium text-ink/60">Built by Rio</p>
    </AtlasScreen>
  );
}
