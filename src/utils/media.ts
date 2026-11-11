/**
 * Native Media, Audio Alert, Haptics & Visual Assets for GYM App
 * 100% Local & Self-Contained — No external YouTube or CDN dependencies
 */

import { MuscleGroup } from '../types/workout';

// Athletic SVG Poster Thumbnails generated locally for each muscle group
const MUSCLE_ICONS_SVG: Record<string, string> = {
  Chest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#000000"/>
        <stop offset="60%" stop-color="#080C14"/>
        <stop offset="100%" stop-color="#0A1E2F"/>
      </linearGradient>
      <linearGradient id="cyanG" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00E5FF"/>
        <stop offset="100%" stop-color="#3B82F6"/>
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#bg)"/>
    <!-- Grid overlay -->
    <path d="M0 45 H400 M0 90 H400 M0 135 H400 M0 180 H400 M80 0 V225 M160 0 V225 M240 0 V225 M320 0 V225" stroke="#1E293B" stroke-width="0.7" opacity="0.3"/>
    <!-- Torso / Pectoral Contour -->
    <path d="M150 70 Q200 85 250 70 Q235 120 200 135 Q165 120 150 70 Z" fill="none" stroke="#00E5FF" stroke-width="3" filter="drop-shadow(0 0 8px #00E5FF)"/>
    <path d="M155 75 Q195 90 198 125" stroke="#38BDF8" stroke-width="2.5" fill="none"/>
    <path d="M245 75 Q205 90 202 125" stroke="#38BDF8" stroke-width="2.5" fill="none"/>
    <circle cx="200" cy="55" r="14" fill="none" stroke="#64748B" stroke-width="2"/>
    <!-- Brand badge -->
    <rect x="20" y="180" width="80" height="24" rx="4" fill="#000000" stroke="#00E5FF" stroke-width="1"/>
    <text x="60" y="196" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">CHEST</text>
    <text x="380" y="200" fill="#64748B" font-family="monospace" font-size="10" text-anchor="end">GYM APP</text>
  </svg>`,

  Back: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#000000"/>
        <stop offset="60%" stop-color="#080C14"/>
        <stop offset="100%" stop-color="#0B132B"/>
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#bg)"/>
    <path d="M0 45 H400 M0 90 H400 M0 135 H400 M0 180 H400 M80 0 V225 M160 0 V225 M240 0 V225 M320 0 V225" stroke="#1E293B" stroke-width="0.7" opacity="0.3"/>
    <!-- Latissimus / V-Taper Silhouette -->
    <path d="M140 60 Q200 70 260 60 L240 120 L215 155 L200 165 L185 155 L160 120 Z" fill="none" stroke="#00E5FF" stroke-width="3" filter="drop-shadow(0 0 8px #00E5FF)"/>
    <line x1="200" y1="65" x2="200" y2="160" stroke="#38BDF8" stroke-width="2" stroke-dasharray="4 2"/>
    <path d="M165 80 Q190 100 200 120" stroke="#38BDF8" stroke-width="2" fill="none"/>
    <path d="M235 80 Q210 100 200 120" stroke="#38BDF8" stroke-width="2" fill="none"/>
    <rect x="20" y="180" width="70" height="24" rx="4" fill="#000000" stroke="#00E5FF" stroke-width="1"/>
    <text x="55" y="196" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">BACK</text>
    <text x="380" y="200" fill="#64748B" font-family="monospace" font-size="10" text-anchor="end">GYM APP</text>
  </svg>`,

  Legs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#000000"/>
        <stop offset="60%" stop-color="#080C14"/>
        <stop offset="100%" stop-color="#1A102F"/>
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#bg)"/>
    <path d="M0 45 H400 M0 90 H400 M0 135 H400 M0 180 H400 M80 0 V225 M160 0 V225 M240 0 V225 M320 0 V225" stroke="#1E293B" stroke-width="0.7" opacity="0.3"/>
    <!-- Quad / Squat Silhouette -->
    <path d="M165 50 L155 110 L160 160 L175 160 L185 110 L195 50" fill="none" stroke="#00E5FF" stroke-width="3" filter="drop-shadow(0 0 8px #00E5FF)"/>
    <path d="M235 50 L245 110 L240 160 L225 160 L215 110 L205 50" fill="none" stroke="#00E5FF" stroke-width="3" filter="drop-shadow(0 0 8px #00E5FF)"/>
    <rect x="20" y="180" width="70" height="24" rx="4" fill="#000000" stroke="#00E5FF" stroke-width="1"/>
    <text x="55" y="196" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">LEGS</text>
    <text x="380" y="200" fill="#64748B" font-family="monospace" font-size="10" text-anchor="end">GYM APP</text>
  </svg>`,

  Shoulders: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#000000"/>
        <stop offset="60%" stop-color="#080C14"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#bg)"/>
    <path d="M0 45 H400 M0 90 H400 M0 135 H400 M0 180 H400 M80 0 V225 M160 0 V225 M240 0 V225 M320 0 V225" stroke="#1E293B" stroke-width="0.7" opacity="0.3"/>
    <!-- Deltoid / Press Silhouette -->
    <path d="M130 95 Q150 70 200 70 Q250 70 270 95 Q250 125 200 120 Q150 125 130 95 Z" fill="none" stroke="#00E5FF" stroke-width="3" filter="drop-shadow(0 0 8px #00E5FF)"/>
    <circle cx="145" cy="95" r="16" fill="none" stroke="#38BDF8" stroke-width="2"/>
    <circle cx="255" cy="95" r="16" fill="none" stroke="#38BDF8" stroke-width="2"/>
    <rect x="20" y="180" width="105" height="24" rx="4" fill="#000000" stroke="#00E5FF" stroke-width="1"/>
    <text x="72" y="196" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">SHOULDERS</text>
    <text x="380" y="200" fill="#64748B" font-family="monospace" font-size="10" text-anchor="end">GYM APP</text>
  </svg>`,

  Arms: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#000000"/>
        <stop offset="60%" stop-color="#080C14"/>
        <stop offset="100%" stop-color="#141E28"/>
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#bg)"/>
    <path d="M0 45 H400 M0 90 H400 M0 135 H400 M0 180 H400 M80 0 V225 M160 0 V225 M240 0 V225 M320 0 V225" stroke="#1E293B" stroke-width="0.7" opacity="0.3"/>
    <!-- Biceps / Arm Flex Silhouette -->
    <path d="M150 130 Q160 90 190 75 Q220 85 240 100 Q255 125 240 150 L190 150 Z" fill="none" stroke="#00E5FF" stroke-width="3" filter="drop-shadow(0 0 8px #00E5FF)"/>
    <path d="M185 80 Q205 70 220 88" stroke="#38BDF8" stroke-width="2.5" fill="none"/>
    <rect x="20" y="180" width="70" height="24" rx="4" fill="#000000" stroke="#00E5FF" stroke-width="1"/>
    <text x="55" y="196" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">ARMS</text>
    <text x="380" y="200" fill="#64748B" font-family="monospace" font-size="10" text-anchor="end">GYM APP</text>
  </svg>`,

  Abs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#000000"/>
        <stop offset="60%" stop-color="#080C14"/>
        <stop offset="100%" stop-color="#0D2028"/>
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#bg)"/>
    <path d="M0 45 H400 M0 90 H400 M0 135 H400 M0 180 H400 M80 0 V225 M160 0 V225 M240 0 V225 M320 0 V225" stroke="#1E293B" stroke-width="0.7" opacity="0.3"/>
    <!-- 6-Pack Grid Outline -->
    <rect x="175" y="60" width="22" height="20" rx="3" fill="none" stroke="#00E5FF" stroke-width="2"/>
    <rect x="203" y="60" width="22" height="20" rx="3" fill="none" stroke="#00E5FF" stroke-width="2"/>
    <rect x="175" y="85" width="22" height="20" rx="3" fill="none" stroke="#00E5FF" stroke-width="2"/>
    <rect x="203" y="85" width="22" height="20" rx="3" fill="none" stroke="#00E5FF" stroke-width="2"/>
    <rect x="175" y="110" width="22" height="20" rx="3" fill="none" stroke="#38BDF8" stroke-width="2"/>
    <rect x="203" y="110" width="22" height="20" rx="3" fill="none" stroke="#38BDF8" stroke-width="2"/>
    <rect x="20" y="180" width="60" height="24" rx="4" fill="#000000" stroke="#00E5FF" stroke-width="1"/>
    <text x="50" y="196" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">ABS</text>
    <text x="380" y="200" fill="#64748B" font-family="monospace" font-size="10" text-anchor="end">GYM APP</text>
  </svg>`,

  'Cardio/Full Body': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#000000"/>
        <stop offset="60%" stop-color="#080C14"/>
        <stop offset="100%" stop-color="#201018"/>
      </linearGradient>
    </defs>
    <rect width="400" height="225" fill="url(#bg)"/>
    <path d="M0 45 H400 M0 90 H400 M0 135 H400 M0 180 H400 M80 0 V225 M160 0 V225 M240 0 V225 M320 0 V225" stroke="#1E293B" stroke-width="0.7" opacity="0.3"/>
    <!-- Heart rate pulse / athletics wave -->
    <path d="M60 112 H140 L160 70 L180 150 L200 90 L220 130 L240 112 H340" fill="none" stroke="#00E5FF" stroke-width="3.5" filter="drop-shadow(0 0 8px #00E5FF)"/>
    <rect x="20" y="180" width="90" height="24" rx="4" fill="#000000" stroke="#00E5FF" stroke-width="1"/>
    <text x="65" y="196" fill="#00E5FF" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">CARDIO</text>
    <text x="380" y="200" fill="#64748B" font-family="monospace" font-size="10" text-anchor="end">GYM APP</text>
  </svg>`
};

/**
 * Get native SVG poster thumbnail for workout
 */
export function getWorkoutThumbnail(muscleGroup: string): string {
  const svg = MUSCLE_ICONS_SVG[muscleGroup] || MUSCLE_ICONS_SVG.Chest;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Haptic Vibration Feedback using navigator.vibrate
 */
export function triggerHaptic(pattern: number | number[] = 50): void {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    // Gracefully ignore if disabled or unsupported
  }
}

export { 
  playTimerAlertSound, 
  playWorkoutDoneSound, 
  playTimerTickSound, 
  playTimerStartSound, 
  playButtonClickSound, 
  playStageUpgradeSound, 
  playCalorieCelebrationSound, 
  playSuccessChime,
  isSoundEnabled,
  toggleSound,
  initAudioUnlock
} from './soundEffects';
