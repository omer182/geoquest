import { useState, useEffect } from 'react';

interface LevelAnnouncementProps {
  level: number;
  round: number;
  onComplete?: () => void;
}

/**
 * LevelAnnouncement Component
 *
 * Displays the level and round announcement at the start of each round as a card.
 * Fades in, shows for 1.2 seconds, then fades out before triggering the city animation.
 *
 * @example
 * ```tsx
 * <LevelAnnouncement
 *   level={2}
 *   round={3}
 *   onComplete={() => setShowCityAnimation(true)}
 * />
 * ```
 */
export default function LevelAnnouncement({ level, round, onComplete }: LevelAnnouncementProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Start fade out after 1.5 seconds (added 1s from previous 0.5s)
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    // Call onComplete after fade out animation completes (300ms)
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 1800); // Added 1s from previous 800ms

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [level, round, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className={`atlas-card px-10 py-8 animate-fade-in transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-center space-y-2">
          <div className="font-display text-5xl md:text-7xl font-bold text-ink">Level {level}</div>
          <div className="atlas-rule text-ink-soft">
            <span className="text-sm md:text-base font-semibold uppercase tracking-[0.2em]">
              Round {round} / 5
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
