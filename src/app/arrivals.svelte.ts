/** Cards just summoned, so the vault can ripple them into place on the next visit. */
let ids = $state<string[]>([]);

export const arrivals = {
  get ids(): string[] {
    return ids;
  },
  set(next: string[]): void {
    ids = next;
  },
  take(): string[] {
    const out = ids;
    ids = [];
    return out;
  },
};
