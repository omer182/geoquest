import { useEffect, useState } from 'react';

interface MultiplayerTimerProps {
  /** Server timestamp when round started */
  serverStartTime: number;
  /** Timer duration in seconds (15, 30, 45, or 60) */
  timerDuration: number;
  /** Callback when timer reaches 0 */
  onTimeUp: () => void;
}

/**
 * MultiplayerTimer component displays a countdown timer synchronized with server time.
 * Uses pure server timestamp approach without client-side setInterval for accuracy.
 * Color changes based on percentage thresholds: white -> amber -> red with pulse.
 */
export default function MultiplayerTimer({
  serverStartTime,
  timerDuration,
  onTimeUp,
}: MultiplayerTimerProps) {
  const [, setTick] = useState(0);

  // Force re-render every 100ms to update timer display
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time using server timestamp
  const elapsedSeconds = (Date.now() - serverStartTime) / 1000;
  const remainingTime = Math.max(0, timerDuration - elapsedSeconds);

  // Call onTimeUp when timer expires
  useEffect(() => {
    if (remainingTime === 0) {
      onTimeUp();
    }
  }, [remainingTime, onTimeUp]);

  // Calculate percentage remaining
  const percentageRemaining = (remainingTime / timerDuration) * 100;

  // Determine color based on percentage thresholds
  let colorClass = 'text-white'; // 100-67%
  if (percentageRemaining <= 66 && percentageRemaining > 32) {
    colorClass = 'text-amber-400'; // 66-33%
  } else if (percentageRemaining <= 32) {
    colorClass = 'text-red-500 animate-pulse'; // 32-0% with pulse
  }

  // Format time as MM:SS
  const minutes = Math.floor(remainingTime / 60);
  const seconds = Math.floor(remainingTime % 60);
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-dark-elevated/90 backdrop-blur-sm border border-primary/30 rounded-lg px-4 py-2 shadow-lg">
        <div
          className={`text-xl sm:text-2xl font-bold font-mono ${colorClass} transition-colors duration-300`}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
