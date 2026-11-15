// Flag images from the flag-icons package (MIT), bundled with the app. Each file
// becomes its own small asset, so only the flags a player sees are downloaded.
const FLAGS = import.meta.glob('../../../node_modules/flag-icons/flags/4x3/*.svg', {
  query: '?no-inline',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const byIso = new Map(Object.entries(FLAGS).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4).toUpperCase(), url]));

/**
 * A country's flag (4:3). It has no alt text on purpose: in Flag Match the
 * name is the answer.
 */
export function Flag({ iso, className = '' }: { iso: string; className?: string }) {
  const src = byIso.get(iso.toUpperCase());
  if (!src) return <span className={`inline-block rounded-sm bg-paper-line ${className}`} aria-hidden="true" />;
  return <img src={src} alt="" draggable={false} className={`inline-block rounded-sm object-cover shadow-sm ring-1 ring-ink/10 ${className}`} />;
}
