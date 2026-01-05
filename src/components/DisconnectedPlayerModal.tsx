interface DisconnectedPlayerModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Name of the player who disconnected */
  playerName: string;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Callback when Leave Room button is clicked */
  onLeaveRoom?: () => void;
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
}: DisconnectedPlayerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-dark-elevated rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-up border border-red-500/50">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">⚠️</div>
          <h2 className="text-3xl font-bold text-white mb-2">Player Disconnected</h2>
        </div>

        {/* Message */}
        <div className="bg-dark-card rounded-lg p-4 mb-6">
          <p className="text-lg text-gray-300 text-center">
            <span className="font-semibold text-red-400">{playerName}</span> has disconnected from
            the game.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[44px] text-lg"
          >
            Continue Playing
          </button>
          {onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[44px] text-lg"
            >
              Leave Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
