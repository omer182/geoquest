/**
 * Props for the GameHeader component
 */
interface GameHeaderProps {
  /**
   * Current level number (1-indexed)
   */
  level: number;

  /**
   * Current round number within the level (1-5)
   */
  round: number;
}

/**
 * GameHeader Component
 *
 * Displays the current level and round information at the top of the game interface.
 * Format: "Level [X] - Round [Y]/5"
 * Optimized for mobile with responsive text sizes to prevent overlap at 390px width.
 *
 * @example
 * ```tsx
 * <GameHeader level={2} round={3} />
 * // Renders: "Level 2 - Round 3/5"
 * ```
 */
export default function GameHeader({ level, round }: GameHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-2 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 shadow-md">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-center text-white">
          Level {level} - Round {round}/5
        </h1>
      </div>
    </header>
  );
}
