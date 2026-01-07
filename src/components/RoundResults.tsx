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
 * - Points awarded with color coding:
 *   - Red: 0 to 1/3 max points (0-500)
 *   - Yellow: 1/3 to 2/3 max points (501-1000)
 *   - Green: 2/3 to max points (1001-1500)
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
  const MAX_POINTS = 1500;
  const THIRD_MAX = MAX_POINTS / 3; // ~500
  const TWO_THIRDS_MAX = (MAX_POINTS * 2) / 3; // ~1000

  // Determine color based on score percentage
  let scoreColor: string;
  if (score === 0) {
    scoreColor = 'text-red-500'; // Red for 0 points
  } else if (score <= THIRD_MAX) {
    scoreColor = 'text-red-500'; // Red: 0 to 1/3 max
  } else if (score <= TWO_THIRDS_MAX) {
    scoreColor = 'text-yellow-500'; // Yellow: 1/3 to 2/3 max
  } else {
    scoreColor = 'text-green-500'; // Green: 2/3 to max
  }

  return (
    <div 
      className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4"
      style={{
        animation: 'slide-up-centered 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-3xl shadow-2xl border-2 border-black/30 px-4 py-3 inline-block">
        <div className="text-center">
          {/* Distance message */}
          <h2 className="text-lg font-bold text-white mb-2">
            You were {formatNumber(distance)}km off!
          </h2>

          {/* Points */}
          <div className={`text-3xl font-bold ${scoreColor} mb-3`}>
            {score > 0 ? '+' : ''}{formatNumber(score)} points
          </div>

          {/* Next Round button */}
          <div className="flex justify-center">
            <button
              onClick={onContinue}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold text-base px-6 py-2.5 rounded-lg transition-colors duration-200 min-h-[44px] border border-white/30"
            >
              Next Round
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
