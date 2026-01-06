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
export default function ConfirmButton({ onConfirm, disabled }: ConfirmButtonProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4 animate-slide-up">
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px] text-lg"
        aria-label="Confirm guess location"
      >
        Confirm Guess
      </button>
    </div>
  );
}
