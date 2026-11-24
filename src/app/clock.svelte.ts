// A shared clock for countdowns. It ticks once a second while the page is visible.
let now = $state(Date.now());

if (typeof window !== 'undefined') {
  setInterval(() => {
    if (document.visibilityState === 'visible') now = Date.now();
  }, 1000);
  document.addEventListener('visibilitychange', () => (now = Date.now()));
}

export const clock = {
  get now(): number {
    return now;
  },
};

/** Remaining time as hours and minutes, or minutes and seconds under an hour. */
export function untilParts(target: number, from: number): { h: number; m: number; s: number } {
  const left = Math.max(0, Math.ceil((target - from) / 1000));
  return { h: Math.floor(left / 3600), m: Math.floor((left % 3600) / 60), s: left % 60 };
}
