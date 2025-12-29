/**
 * Props for the RoundResults component
 */
interface RoundResultsProps {
  /**
   * Distance in kilometers between the guess and actual city location
   */
  distance: number;

  /**
   * Points awarded for the round based on distance
   */
  score: number;

  /**
   * Name of the city that was being located
   */
  cityName: string;

  /**
   * Callback function triggered when the continue button is clicked
   */
  onContinue: () => void;
}

/**
 * Formats a number with commas for readability.
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * RoundResults Component
 *
 * Displays the results after a round is completed in a clean, centered modal:
 * - Distance message: "You were [X]km off!"
 * - Points awarded in green: "+[X] points"
 * - Next Turn button
 *
 * @example
 * ```tsx
 * <RoundResults
 *   distance={2714}
 *   score={50}
 *   cityName="Tokyo"
 *   onContinue={handleContinue}
 * />
 * ```
 */
export default function RoundResults({ distance, score, onContinue }: RoundResultsProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-dark-elevated/95 backdrop-blur-sm rounded-xl shadow-2xl px-4 py-3 border-2 border-primary min-w-[320px]">
        <div className="text-center">
          {/* Distance message */}
          <h2 className="text-lg font-bold text-white mb-2">
            You were {formatNumber(distance)}km off!
          </h2>

          {/* Points */}
          <div className="text-3xl font-bold text-green-400 mb-3">
            +{formatNumber(score)} points
          </div>

          {/* Next Round button */}
          <button
            onClick={onContinue}
            className="w-full bg-primary hover:bg-primary-dark text-dark-base font-semibold text-base px-6 py-2.5 rounded-lg transition-colors duration-200"
          >
            Next Round
          </button>
        </div>
      </div>
    </div>
  );
}
