/**
 * Athletic Web Audio Sound Engine for GYM App
 * Generates rich, native synthesized audio effects with zero external network requests.
 * Uses a singleton AudioContext that unlocks reliably on user gestures.
 */

const SOUND_STORAGE_KEY = 'gymapp_sound_v1';

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Auto-unlock AudioContext on first user interaction anywhere in the window
export function initAudioUnlock(): void {
  if (typeof window === 'undefined' || isAudioUnlocked) return;

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        // Play silent buffer to force unlock on iOS WebKit
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        isAudioUnlocked = true;
      }
    } catch {
      // Ignore
    } finally {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    }
  };

  window.addEventListener('click', unlock, { passive: true, once: false });
  window.addEventListener('touchstart', unlock, { passive: true, once: false });
  window.addEventListener('keydown', unlock, { passive: true, once: false });
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val !== 'false'; // defaults to true
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {}
}

export function toggleSound(): boolean {
  const current = isSoundEnabled();
  const next = !current;
  setSoundEnabled(next);
  if (next) {
    playButtonClickSound();
  }
  return next;
}

// Ensure AudioContext is running before playing any sound
function prepareContext(): AudioContext | null {
  if (!isSoundEnabled()) return null;
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/**
 * 1. WORKOUT COMPLETED SOUND
 * Triumphant ascending 4-note athletic chime (C5 -> E5 -> G5 -> C6)
 */
export function playWorkoutDoneSound(): void {
  try {
    const ctx = prepareContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = startTime + idx * 0.12;

      osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * 2. REST TIMER TICK SOUND
 * Metronome tick for rest countdown stopwatch.
 * Pitch rises when under 4 seconds (urgent countdown).
 */
export function playTimerTickSound(isUrgent = false): void {
  try {
    const ctx = prepareContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 440, now);

    gain.gain.setValueAtTime(isUrgent ? 0.2 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch {}
}

/**
 * 3. REST TIMER ALERT / BUZZER
 * Energetic 3-tone finish alarm when rest time expires.
 */
export function playTimerAlertSound(): void {
  try {
    const ctx = prepareContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Beep 1 (high pitch 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Beep 2 (1174Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.18);
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.35);

    // Beep 3 (1760Hz crescendo)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(1760, now + 0.38);
    gain3.gain.setValueAtTime(0.35, now + 0.38);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.38);
    osc3.stop(now + 0.7);
  } catch {}
}

/**
 * 4. TIMER START / PAUSE / RESET SOUND
 * Quick punchy mechanical tone
 */
export function playTimerStartSound(): void {
  try {
    const ctx = prepareContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch {}
}

/**
 * 5. BUTTON / TAB / FILTER CLICK SOUND
 * Subtle tactile feedback micro-tone
 */
export function playButtonClickSound(): void {
  try {
    const ctx = prepareContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  } catch {}
}

/**
 * 6. STAGE REQUEST & UPGRADE FANFARE
 * Grand 5-tone athletic victory fanfare
 */
export function playStageUpgradeSound(): void {
  try {
    const ctx = prepareContext();
    if (!ctx) return;

    const notes = [349.23, 440.00, 523.25, 659.25, 698.46]; // F4, A4, C5, E5, F5
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = startTime + idx * 0.11;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + (idx === notes.length - 1 ? 0.6 : 0.35));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.6);
    });
  } catch {}
}

/**
 * 7. CALORIE TARGET GOAL CELEBRATION CHIME
 * Bright harmonic arpeggio when daily calorie target is achieved
 */
export function playCalorieCelebrationSound(): void {
  try {
    const ctx = prepareContext();
    if (!ctx) return;

    const freqs = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    const startTime = ctx.currentTime;

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = startTime + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch {}
}

/**
 * 8. SUCCESS CONFIRMATION CHIME
 * Dual bell tone for video upload, database sync, and theme changes
 */
export function playSuccessChime(): void {
  try {
    const ctx = prepareContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.08); // B5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.12);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  } catch {}
}
