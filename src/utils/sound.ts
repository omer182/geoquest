/**
 * Game sounds, synthesised with the Web Audio API (no audio files to load or license).
 *
 * The AudioContext is created lazily on the first sound, which always follows a
 * user gesture (a tap or key press), so mobile browsers allow it. Mute is a
 * per-browser preference. Every call is a no-op when audio is unavailable
 * (tests, old browsers) or muted.
 */

const MUTE_KEY = 'geoquest:muted';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = readMuted();
const listeners = new Set<(muted: boolean) => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
  listeners.forEach(fn => fn(value));
}

export function onMuteChange(fn: (muted: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (muted) return null;
  if (!ctx) {
    const Ctor =
      typeof window !== 'undefined'
        ? window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

interface ToneOptions {
  freq: number;
  /** Seconds from now */
  at?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  /** Glide to this frequency over the note */
  slideTo?: number;
  attack?: number;
}

function tone({ freq, at = 0, duration = 0.2, type = 'sine', volume = 0.5, slideTo, attack = 0.005 }: ToneOptions) {
  const a = audio();
  if (!a) return;
  const t0 = a.ctx.currentTime + at;
  const osc = a.ctx.createOscillator();
  const gain = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(a.out);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Bell-like note: a sine with a quieter octave partial. */
function bell(freq: number, at = 0, duration = 0.6, volume = 0.45) {
  tone({ freq, at, duration, volume });
  tone({ freq: freq * 2, at, duration: duration * 0.6, volume: volume * 0.3 });
  tone({ freq: freq * 3.01, at, duration: duration * 0.3, volume: volume * 0.12 });
}

function noise(at = 0, duration = 0.3, volume = 0.2, from = 400, to = 4000) {
  const a = audio();
  if (!a) return;
  const t0 = a.ctx.currentTime + at;
  const length = Math.floor(a.ctx.sampleRate * duration);
  const buffer = a.ctx.createBuffer(1, length, a.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = a.ctx.createBufferSource();
  src.buffer = buffer;
  const filter = a.ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(from, t0);
  filter.frequency.exponentialRampToValueAtTime(to, t0 + duration);
  const gain = a.ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(gain).connect(a.out);
  src.start(t0);
}

// Note frequencies (Hz)
const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };

export const sfx = {
  /** UI tap */
  click() {
    tone({ freq: 660, duration: 0.05, type: 'triangle', volume: 0.18 });
  },

  /** Pin dropped on the map */
  pin() {
    tone({ freq: 900, slideTo: 420, duration: 0.09, type: 'triangle', volume: 0.3 });
  },

  /** One tick of a score counting up; `progress` 0..1 raises the pitch */
  tick(progress: number) {
    tone({ freq: 700 + progress * 900, duration: 0.035, type: 'square', volume: 0.06 });
  },

  /** Verdict for a guess, by its score (0-1000) */
  verdict(score: number) {
    if (score >= 950) {
      [N.C6, N.E6, N.G6, N.C7].forEach((f, i) => bell(f, i * 0.08, 0.7, 0.4));
      noise(0.3, 0.5, 0.05, 3000, 9000); // sparkle
    } else if (score >= 800) {
      [N.C6, N.E6, N.G6].forEach((f, i) => bell(f, i * 0.09, 0.6, 0.38));
    } else if (score >= 600) {
      [N.G5, N.C6].forEach((f, i) => bell(f, i * 0.1, 0.5, 0.32));
    } else if (score >= 300) {
      bell(N.E5, 0, 0.4, 0.28);
    } else {
      tone({ freq: 160, slideTo: 70, duration: 0.3, type: 'sine', volume: 0.5 }); // soft thud
    }
  },

  /** Streak milestone ("On fire") */
  streak(count: number) {
    noise(0, 0.35, 0.12, 300, 5000);
    const base = 1 + Math.min(count - 3, 4) * 0.06;
    [N.E5, N.G5, N.C6, N.E6].forEach((f, i) => tone({ freq: f * base, at: 0.05 + i * 0.05, duration: 0.18, type: 'triangle', volume: 0.22 }));
  },

  /** A level-complete star landing; index 0..2 rises in pitch */
  star(index: number) {
    const f = [N.E5, N.G5, N.C6][index] ?? N.C6;
    bell(f, 0, 0.8, 0.45);
    tone({ freq: f / 2, duration: 0.15, type: 'triangle', volume: 0.25 }); // thump
  },

  /** Level passed / next level unlocked */
  fanfare() {
    [N.C5, N.E5, N.G5].forEach((f, i) => tone({ freq: f, at: i * 0.11, duration: 0.2, type: 'triangle', volume: 0.28 }));
    [N.C6, N.E5, N.G5].forEach(f => tone({ freq: f, at: 0.36, duration: 0.9, type: 'triangle', volume: 0.2 }));
    bell(N.C7, 0.36, 1, 0.15);
  },

  /** Level not passed: a gentle, not punishing, falling pair */
  fail() {
    tone({ freq: N.E5, duration: 0.25, type: 'triangle', volume: 0.25 });
    tone({ freq: N.C5, at: 0.22, duration: 0.45, type: 'triangle', volume: 0.25 });
  },

  /** One footstep of the journey marker */
  step(index: number) {
    tone({ freq: 300 + (index % 2) * 60, slideTo: 180, duration: 0.07, type: 'sine', volume: 0.25 });
  },

  /** Marker arrives at a new stop */
  arrive() {
    [N.G5, N.C6].forEach((f, i) => bell(f, i * 0.08, 0.5, 0.35));
  },
};
