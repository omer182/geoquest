/** Five-point star; filled in brass when earned, an outline when not. */
export function Star({ filled, className = 'h-6 w-6' }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.6l2.85 5.78 6.38.93-4.62 4.5 1.09 6.36L12 17.17l-5.7 3 1.09-6.36-4.62-4.5 6.38-.93L12 2.6z"
        fill={filled ? '#C9962B' : 'none'}
        stroke={filled ? '#8A6418' : 'currentColor'}
        strokeWidth={filled ? 1.2 : 1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Row of three stars, `count` of them filled. */
export function StarRow({ count, className = 'h-4 w-4', gap = 'gap-0.5' }: { count: number; className?: string; gap?: string }) {
  return (
    <span className={`inline-flex ${gap}`} aria-label={`${count} of 3 stars`} role="img">
      {[0, 1, 2].map(i => (
        <Star key={i} filled={i < count} className={className} />
      ))}
    </span>
  );
}
