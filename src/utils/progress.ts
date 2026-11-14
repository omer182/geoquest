/**
 * Solo-run progress, persisted in the browser so players can continue from the
 * level they reached and keep their best stars per level. Every storage access
 * is guarded: private windows or blocked storage just mean "no saved progress".
 */
const STORAGE_KEY = 'geoquest:solo-progress';

export interface SoloProgress {
  /** Level the player will resume at (the next unbeaten level) */
  level: number;
  /** Best stars (1-3) earned per beaten level */
  stars: Record<number, number>;
}

const EMPTY: SoloProgress = { level: 1, stars: {} };

export function loadProgress(): SoloProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, stars: {} };
    const parsed = JSON.parse(raw) as Partial<SoloProgress>;
    const level = Number(parsed.level);
    const stars: Record<number, number> = {};
    if (parsed.stars && typeof parsed.stars === 'object') {
      for (const [k, v] of Object.entries(parsed.stars)) {
        const lvl = Number(k);
        const s = Number(v);
        if (Number.isInteger(lvl) && lvl >= 1 && Number.isInteger(s) && s >= 1 && s <= 3) stars[lvl] = s;
      }
    }
    return { level: Number.isInteger(level) && level >= 1 ? level : 1, stars };
  } catch {
    return { ...EMPTY, stars: {} };
  }
}

function save(progress: SoloProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable */
  }
}

export function loadSavedLevel(): number {
  return loadProgress().level;
}

/** Saves `level` as the resume point, never moving progress backwards. */
export function saveReachedLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1) return;
  const progress = loadProgress();
  if (level <= progress.level) return;
  save({ ...progress, level });
}

/**
 * Records a passed level: unlocks the next one and keeps the best star count.
 * @returns whether this pass unlocked a new level (for the journey-map walk)
 */
export function recordLevelPassed(level: number, stars: number): { unlocked: boolean; newBest: boolean } {
  const progress = loadProgress();
  const unlocked = level + 1 > progress.level;
  const prevStars = progress.stars[level] ?? 0;
  const newBest = stars > prevStars;
  save({
    level: Math.max(progress.level, level + 1),
    stars: { ...progress.stars, [level]: Math.max(prevStars, stars) },
  });
  return { unlocked, newBest };
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
