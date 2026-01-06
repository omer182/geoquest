import { useState, useEffect } from 'react';

/**
 * Props for the CityPrompt component
 */
interface CityPromptProps {
  /**
   * Name of the city to find
   */
  cityName: string;

  /**
   * Country where the city is located
   */
  country: string;

  /**
   * Whether to show the initial animation from center to top
   */
  showInitialAnimation?: boolean;

  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void;
}

/**
 * CityPrompt Component
 *
 * Displays the city name and country that the user needs to locate on the map.
 * Can show with or without animation:
 * - With animation: Fades in at center, stays briefly, then flies up to top
 * - Without animation: Static display at top of screen
 * Optimized for mobile with text truncation for long city/country names.
 *
 * @example
 * ```tsx
 * <CityPrompt cityName="Paris" country="France" showInitialAnimation onAnimationComplete={() => {}} />
 * ```
 */
export default function CityPrompt({
  cityName,
  country,
  showInitialAnimation = false,
  onAnimationComplete
}: CityPromptProps) {
  const [animationPhase, setAnimationPhase] = useState<'fadeIn' | 'center' | 'flyingUp' | 'static'>(
    showInitialAnimation ? 'fadeIn' : 'static'
  );

  useEffect(() => {
    if (!showInitialAnimation) {
      setAnimationPhase('static');
      return;
    }

    // Phase 1: Fade in (200ms)
    const fadeInTimer = setTimeout(() => {
      setAnimationPhase('center');
    }, 200);

    // Phase 2: Stay at center (2200ms total - added 1s)
    const flyUpTimer = setTimeout(() => {
      setAnimationPhase('flyingUp');
    }, 2200);

    // Phase 3: Call completion after fly animation completes (total 3000ms - added 1s)
    const completeTimer = setTimeout(() => {
      setAnimationPhase('static');
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(flyUpTimer);
      clearTimeout(completeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityName, country, showInitialAnimation]); // Removed onAnimationComplete to prevent loop

  // Single component that transitions through all phases
  // Center (large) → Top-right (small) - smooth continuous transition using transforms
  const isSmall = animationPhase === 'flyingUp' || animationPhase === 'static';
  const isCentered = animationPhase === 'fadeIn' || animationPhase === 'center';

  return (
    <div
      className={`fixed z-50 pointer-events-none transition-all duration-700 ease-in-out ${
        isCentered
          ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          : 'top-4 right-4 translate-x-0 translate-y-0'
      } ${
        animationPhase === 'fadeIn' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`rounded-xl shadow-2xl transition-all duration-700 ease-out ${
          isSmall
            ? 'bg-dark-elevated/90 backdrop-blur-sm border border-primary/30 px-3 sm:px-4 py-2.5'
            : 'bg-dark-elevated border-2 border-primary p-6 sm:p-8'
        }`}
      >
        <div className="text-center space-y-1 sm:space-y-2">
          <div
            className={`font-semibold transition-all duration-700 ease-out ${
              isSmall
                ? 'text-sm sm:text-lg text-primary inline truncate max-w-[140px] sm:max-w-none'
                : 'text-2xl sm:text-3xl md:text-5xl text-primary block font-bold'
            }`}
          >
            {cityName}
          </div>
          <div
            className={`transition-all duration-700 ease-out ${
              isSmall
                ? 'text-xs sm:text-base text-gray-300 inline truncate max-w-[100px] sm:max-w-none'
                : 'text-xl sm:text-2xl md:text-4xl text-gray-300 block font-semibold'
            }`}
          >
            {isSmall && ', '}
            {country}
          </div>
        </div>
      </div>
    </div>
  );
}
