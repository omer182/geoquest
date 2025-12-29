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
        className={`bg-dark-elevated rounded-xl shadow-2xl border-2 border-primary transition-all duration-700 ease-out ${
          isSmall ? 'p-3 px-6' : 'p-8'
        }`}
      >
        <div className="text-center space-y-2">
          <div
            className={`font-semibold transition-all duration-700 ease-out ${
              isSmall
                ? 'text-lg text-primary inline'
                : 'text-3xl md:text-5xl text-white block'
            }`}
          >
            {cityName}
          </div>
          <div
            className={`transition-all duration-700 ease-out ${
              isSmall
                ? 'text-base text-gray-300 inline'
                : 'text-2xl md:text-4xl text-gray-400 block'
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
