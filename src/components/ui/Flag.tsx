/** A country's flag as an emoji (two regional-indicator letters from the ISO code). */
function flagEmoji(iso: string): string {
  return [...iso.toUpperCase()].map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}

/**
 * A flag. Phones draw these as real flags; some desktop systems (Windows) show
 * the two letters instead.
 */
export function Flag({ iso, className = '' }: { iso: string; className?: string }) {
  return (
    <span className={`inline-block leading-none ${className}`} aria-hidden="true">
      {flagEmoji(iso)}
    </span>
  );
}
