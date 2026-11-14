/**
 * Solo-run progress, persisted in the browser so players can continue from the
 * level they reached. Every storage access is guarded: private windows or
 * blocked storage just mean "no saved progress".
 */
const STORAGE_KEY = 'geoquest:solo-progress';

interface SoloProgress {
  /** Level the player will resume at (the next unbeaten level) */
  level: number;
}

export function loadSavedLevel(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 1;
    const parsed = JSON.parse(raw) as Partial<SoloProgress>;
    const level = Number(parsed.level);
    return Number.isInteger(level) && level >= 1 ? level : 1;
  } catch {
    return 1;
  }
}

/** Saves `level` as the resume point, never moving progress backwards. */
export function saveReachedLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1) return;
  if (level <= loadSavedLevel()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ level } satisfies SoloProgress));
  } catch {
    /* storage unavailable */
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
