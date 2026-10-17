import AtlasScreen, { AtlasHeading } from './ui/AtlasScreen';


interface MultiplayerSubmenuProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onBack: () => void;
}

/**
 * MultiplayerSubmenu component - Choose between creating or joining a room
 */
export default function MultiplayerSubmenu({
  onCreateRoom,
  onJoinRoom,
  onBack,
}: MultiplayerSubmenuProps) {
  return (
    <AtlasScreen>
      <AtlasHeading eyebrow="Multiplayer" title="Online Battle" subtitle="Challenge your friends online" />

      <div className="atlas-card p-5">
        <div className="space-y-2.5">
          {/* Create Room Button */}
          <button onClick={onCreateRoom} className="btn btn-accent btn-block justify-between">
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-lg">🏕️</span>
              Create Room
            </span>
            <span aria-hidden="true" className="text-white/70">→</span>
          </button>

          {/* Join Room Button */}
          <button onClick={onJoinRoom} className="btn btn-primary btn-block justify-between">
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-lg">🎟️</span>
              Join Room
            </span>
            <span aria-hidden="true" className="text-paper/60">→</span>
          </button>

          {/* Back Button */}
          <button onClick={onBack} className="btn btn-ghost btn-block text-sm">
            Back to Main Menu
          </button>
        </div>

        {/* Info Tip */}
        <p className="mt-4 border-t border-paper-line pt-3 text-center text-xs text-ink-faint">
          Create a room to host or join with a room code
        </p>
      </div>
    </AtlasScreen>
  );
}
