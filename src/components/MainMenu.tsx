import { useGame } from '../context/GameContext';

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-4 relative overflow-hidden">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none" />

      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-[240px] space-y-3 relative z-10 animate-fade-in-up">
        {/* Logo/Title */}
        <div className="text-center mb-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white tracking-tight">
            GeoQuest
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Explore the World, Test Your Knowledge</p>
        </div>

        {/* Menu Buttons */}
        <div className="space-y-2">
          {/* Single Player Button */}
          <button
            onClick={onSinglePlayer}
            className="group relative w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-glow-sm transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Single Player
          </button>

          {/* Multiplayer Button */}
          <button
            onClick={onMultiplayer}
            className="group relative w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-glow-sm transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Multiplayer
          </button>

          {/* About Button */}
          <button
            onClick={onAbout}
            className="group w-full py-2.5 px-4 bg-transparent hover:bg-dark-elevated text-gray-400 hover:text-white font-medium text-sm rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600"
          >
            About
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-600">
          <p>Built by Rio</p>
        </div>
      </div>
    </div>
  );
}
