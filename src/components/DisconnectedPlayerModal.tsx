interface DisconnectedPlayerModalProps {
  /** Name of the player who disconnected */
  playerName: string;
  /** Callback when Main Menu button is clicked */
  onMainMenu: () => void;
}

/**
 * DisconnectedPlayerModal component shows a blocking modal when a player
 * disconnects during the final results screen.
 * Prevents any other interaction and forces navigation to main menu.
 */
export default function DisconnectedPlayerModal({
  playerName,
  onMainMenu,
}: DisconnectedPlayerModalProps) {
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

        {/* Main Menu Button */}
        <button
          onClick={onMainMenu}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-h-[44px] text-lg"
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
