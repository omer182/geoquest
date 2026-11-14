import { useEffect, useState } from 'react';
import { isMuted, onMuteChange, setMuted, sfx } from '../utils/sound';

/** Speaker toggle for game sounds; the choice is remembered per browser. */
export default function MuteButton({ className = '' }: { className?: string }) {
  const [muted, setMutedState] = useState(isMuted());
  useEffect(() => onMuteChange(setMutedState), []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    if (!next) sfx.click();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`hud-card btn min-h-[40px] min-w-[40px] px-2.5 py-2 ${className}`}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      aria-pressed={!muted}
      title={muted ? 'Sound off' : 'Sound on'}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
        {muted ? (
          <>
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  );
}
