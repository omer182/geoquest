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
        className={`bg-dark-elevated rounded-xl shadow-2xl p-8 border-2 border-primary transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-center space-y-3">
          <div className="text-5xl md:text-7xl font-bold text-primary">Level {level}</div>
          <div className="text-2xl md:text-4xl font-semibold text-gray-300">
            Round {round} / 5
          </div>
        </div>
      </div>
    </div>
  );
}
