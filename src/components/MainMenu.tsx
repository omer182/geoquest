import AtlasScreen, { CompassRose } from './ui/AtlasScreen';

interface MainMenuProps {
  onSinglePlayer: () => void;
  onMultiplayer: () => void;
  onAbout: () => void;
}

/**
 * MainMenu component - Entry point for choosing game mode
 * Displays three options: Single Player, Multiplayer, and About
 */
export default function MainMenu({ onSinglePlayer, onMultiplayer, onAbout }: MainMenuProps) {
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
          {/* Solo Run Button */}
          <button onClick={onSinglePlayer} className="btn btn-primary btn-block justify-between">
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-lg">🧭</span>
              Solo Run
            </span>
            <span aria-hidden="true" className="text-paper/60">→</span>
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
