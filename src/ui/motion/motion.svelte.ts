export const MOTION_MODES = ['system', 'full', 'calm'] as const;
export type MotionMode = (typeof MOTION_MODES)[number];

const STORAGE_KEY = 'tesserae.motion';
const query =
  typeof matchMedia === 'undefined' ? null : matchMedia('(prefers-reduced-motion: reduce)');

function readStored(): MotionMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return (MOTION_MODES as readonly string[]).includes(value ?? '')
      ? (value as MotionMode)
      : 'system';
  } catch {
    return 'system';
  }
}

let mode = $state<MotionMode>(readStored());
let systemReduced = $state(query?.matches ?? false);
query?.addEventListener('change', (e) => (systemReduced = e.matches));

const isCalm = (): boolean => mode === 'calm' || (mode === 'system' && systemReduced);

function apply(): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset['motion'] = isCalm() ? 'calm' : 'full';
  }
}
apply();

export const motion = {
  get mode(): MotionMode {
    return mode;
  },
  /** True when movement should be replaced by fades. */
  get calm(): boolean {
    return isCalm();
  },
  setMode(next: MotionMode): void {
    mode = next;
    apply();
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not persisted when storage is unavailable.
    }
  },
};

query?.addEventListener('change', apply);

/** Fewer particles on small or low-core devices, none in calm mode. */
export function particleBudget(): number {
  if (isCalm()) return 0;
  const narrow = typeof innerWidth !== 'undefined' && innerWidth < 700;
  const weak = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 4;
  return narrow || weak ? 60 : 120;
}
