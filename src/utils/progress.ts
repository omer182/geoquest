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
  /** Best stars (1-3) per won "paint the region" bonus game, by region id */
  mini: Record<string, number>;
}

const empty = (): SoloProgress => ({ level: 1, stars: {}, mini: {} });

const validStars = (v: unknown) => {
  const s = Number(v);
  return Number.isInteger(s) && s >= 1 && s <= 3 ? s : 0;
};

export function loadProgress(): SoloProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
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
    const mini: Record<string, number> = {};
    if (parsed.mini && typeof parsed.mini === 'object') {
      for (const [k, v] of Object.entries(parsed.mini)) if (validStars(v)) mini[k] = validStars(v);
    }
    return { level: Number.isInteger(level) && level >= 1 ? level : 1, stars, mini };
  } catch {
    return empty();
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
    ...progress,
    level: Math.max(progress.level, level + 1),
    stars: { ...progress.stars, [level]: Math.max(prevStars, stars) },
  });
  return { unlocked, newBest };
}

/** Records a won region game, keeping the best stars. @returns whether it beat the previous best */
export function recordMiniGame(regionId: string, stars: number): boolean {
  if (!validStars(stars)) return false;
  const progress = loadProgress();
  const prev = progress.mini[regionId] ?? 0;
  if (stars <= prev) return false;
  save({ ...progress, mini: { ...progress.mini, [regionId]: stars } });
  return true;
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
