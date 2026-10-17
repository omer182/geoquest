import type { ReactNode } from 'react';
import WorldBackdrop from './WorldBackdrop';

interface AtlasScreenProps {
  children: ReactNode;
  /** Max width of the content column (Tailwind class). Defaults to a narrow menu column. */
  widthClass?: string;
}

/**
 * Full-screen shell for every non-map screen: drifting world map behind,
 * a centred content column in front. Scrolls vertically on short screens.
 */
export default function AtlasScreen({ children, widthClass = 'max-w-[340px]' }: AtlasScreenProps) {
  return (
    <div className="relative h-full w-full overflow-hidden text-ink">
      <WorldBackdrop />
      <div className="relative z-10 flex h-full w-full overflow-y-auto">
        <div className={`m-auto w-full ${widthClass} px-4 py-8 animate-fade-in-up`}>{children}</div>
      </div>
    </div>
  );
}

/**
 * Compass-rose emblem used next to the wordmark.
 */
export function CompassRose({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#FBF6EA" stroke="#C9B48A" strokeWidth="2" />
      <circle cx="32" cy="32" r="23" fill="none" stroke="#E0D2B4" strokeWidth="1" strokeDasharray="2 3" />
      {/* Diagonal points */}
      <path d="M32 32 L46 18 L35 33 Z M32 32 L18 46 L29 31 Z" fill="#8B93A5" />
      <path d="M32 32 L18 18 L33 29 Z M32 32 L46 46 L31 35 Z" fill="#8B93A5" />
      {/* Cardinal points */}
      <path d="M32 6 L37 32 L27 32 Z" fill="#C8553D" />
      <path d="M32 58 L27 32 L37 32 Z" fill="#1E2A44" />
      <path d="M6 32 L32 27 L32 37 Z" fill="#1E2A44" />
      <path d="M58 32 L32 37 L32 27 Z" fill="#1E2A44" />
      <circle cx="32" cy="32" r="3.5" fill="#FBF6EA" stroke="#1E2A44" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Screen heading: optional eyebrow caption, display title, ornament rule with subtitle.
 */
export function AtlasHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5 text-center">
      {eyebrow && <div className="atlas-eyebrow mb-1">{eyebrow}</div>}
      <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
    </div>
  );
}
