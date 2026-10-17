/**
 * Props for the ConfirmButton component
 */
interface ConfirmButtonProps {
  /**
   * Callback function triggered when the button is clicked
   */
  onConfirm: () => void;

  /**
   * Whether the button is disabled
   */
  disabled: boolean;

  /**
   * Whether to show waiting state instead of confirm button
   */
  isWaiting?: boolean;
}

/**
 * ConfirmButton Component
 *
 * A floating action button positioned at the bottom of the screen that appears
 * when the user has placed a pin on the map. Features a slide-up animation
 * on appearance using CSS transitions.
 *
 * Button meets minimum touch target size of 44px height for mobile accessibility.
 *
 * @example
 * ```tsx
 * <ConfirmButton
 *   onConfirm={handleConfirmGuess}
 *   disabled={!pinPlaced}
 * />
 * ```
 */
export default function ConfirmButton({ onConfirm, disabled, isWaiting = false }: ConfirmButtonProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4 animate-slide-up">
      {isWaiting ? (
        <div className="hud-card rounded-full px-6 py-3 min-h-[44px] flex items-center justify-center gap-3">
          {/* Loading spinner */}
          <div className="w-5 h-5 border-2 border-compass border-t-transparent rounded-full animate-spin" />
          {/* Waiting text */}
          <span className="text-ink font-semibold text-base">
            Waiting for other players...
          </span>
        </div>
      ) : (
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="btn btn-accent rounded-full px-8 py-3 text-lg"
          aria-label="Confirm guess location"
        >
          <span className="flex items-center gap-2">
            Confirm Guess
            <kbd className="kbd hidden sm:inline">Enter</kbd>
          </span>
        </button>
      )}
    </div>
  );
}
