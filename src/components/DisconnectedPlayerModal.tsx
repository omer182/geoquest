interface DisconnectedPlayerModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Name of the player who disconnected */
  playerName: string;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Callback when Leave Room button is clicked */
  onLeaveRoom?: () => void;
  /** Number of players remaining in the room (excluding disconnected player) */
  remainingPlayersCount?: number;
}

/**
 * DisconnectedPlayerModal component shows a blocking modal when a player
 * disconnects during the game.
 * Allows closing the modal or leaving the room.
 */
export default function DisconnectedPlayerModal({
  isOpen,
  playerName,
  onClose,
  onLeaveRoom,
  remainingPlayersCount = 1,
}: DisconnectedPlayerModalProps) {
  if (!isOpen) return null;

  // Player is alone if there's only 1 player remaining (themselves)
  const isAlone = remainingPlayersCount === 1;

  return (
    <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="atlas-card max-w-sm w-full p-6 animate-slide-up text-center">
        {/* Icon */}
        <div className="text-5xl mb-2">⚠️</div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-3">Player Disconnected</h2>

        {/* Message */}
        <div className="rounded-xl border border-paper-line bg-paper-deep/60 p-4 mb-5">
          {isAlone ? (
            <p className="text-base text-ink-soft">
              <span className="font-semibold text-compass-dark">{playerName}</span> has disconnected.
              <br />
              <span className="text-sm text-ink-faint mt-2 block">
                You are the only player remaining in the room.
              </span>
            </p>
          ) : (
            <p className="text-base text-ink-soft">
              <span className="font-semibold text-compass-dark">{playerName}</span> has disconnected from
              the game.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {!isAlone && (
            <button onClick={onClose} className="btn btn-primary btn-block">
              Continue Playing
            </button>
          )}
          {onLeaveRoom && (
            <button onClick={onLeaveRoom} className={`btn btn-block ${isAlone ? 'btn-accent' : 'btn-danger'}`}>
              {isAlone ? 'Back to Main Menu' : 'Leave Room'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
