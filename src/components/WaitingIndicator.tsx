/**
 * WaitingIndicator component shows "Waiting for other players to submit..." text
 * after the current player has submitted their guess.
 * Positioned below the timer so both can be visible at the same time.
 */
export default function WaitingIndicator() {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="hud-card px-3 sm:px-4 py-2.5">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Loading spinner */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-compass border-t-transparent rounded-full animate-spin" />

          {/* Waiting text */}
          <span className="text-sm sm:text-base font-semibold text-ink">
            Waiting for other players to submit...
          </span>
        </div>
      </div>
    </div>
  );
}
