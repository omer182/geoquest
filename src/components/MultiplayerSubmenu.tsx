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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 relative overflow-hidden">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 right-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-[240px] space-y-3 relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-white tracking-tight">
            Multiplayer
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">Challenge your friends online</p>
        </div>

        {/* Menu Buttons */}
        <div className="space-y-2">
          {/* Create Room Button */}
          <button
            onClick={onCreateRoom}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-glow-sm transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Room
          </button>

          {/* Join Room Button */}
          <button
            onClick={onJoinRoom}
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-glow-sm transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Join Room
          </button>

          {/* Back Button */}
          <button
            onClick={onBack}
            className="w-full py-2.5 px-4 bg-transparent hover:bg-dark-elevated text-gray-400 hover:text-white font-medium text-sm rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600"
          >
            Back to Main Menu
          </button>
        </div>

        {/* Info Tip */}
        <div className="mt-6 p-3 bg-dark-elevated/50 border border-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 text-center">
            Create a room to host or join with a room code
          </p>
        </div>
      </div>
    </div>
  );
}
