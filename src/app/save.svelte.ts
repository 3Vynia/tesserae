import Dexie, { type Table } from 'dexie';
import { createSave, parseSave, type Save } from '../engine/save';

class SaveDb extends Dexie {
  saves!: Table<{ id: string; data: Save }, string>;
  constructor() {
    super('tesserae');
    this.version(1).stores({ saves: 'id' });
  }
}

type Status = 'loading' | 'ready' | 'error';
const SLOT = 'main';

let db: SaveDb | null = null;
let status = $state<Status>('loading');
let error = $state<string | null>(null);
let data = $state<Save | null>(null);
let writeTimer: ReturnType<typeof setTimeout> | undefined;

function newSeed(): string {
  const bytes = new Uint32Array(2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36)).join('');
}

async function load(): Promise<void> {
  status = 'loading';
  error = null;
  try {
    db ??= new SaveDb();
    const row = await db.saves.get(SLOT);
    data = row ? parseSave(row.data) : createSave(newSeed(), Date.now());
    if (!row) await persistNow();
    if (import.meta.env.DEV) applyDevParams();
    status = 'ready';
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    status = 'error';
  }
}

/**
 * Development only, stripped from production builds: `?starlight` sets the balance to five
 * million (or `?starlight=200` to an exact amount) so summons and progression can be tested.
 * It also tops stardust up to 100,000 and golden tesserae up to 10.
 */
function applyDevParams(): void {
  const param = new URLSearchParams(location.search).get('starlight');
  if (param === null) return;
  const amount = param === '' ? 5_000_000 : Number(param);
  if (data && Number.isFinite(amount) && amount > 0) {
    data.starlight = Math.floor(amount);
    data.wallet.dust = Math.max(data.wallet.dust, 100_000);
    data.wallet.golden = Math.max(data.wallet.golden, 10);
    void persistNow();
  }
}

async function persistNow(): Promise<void> {
  if (!db || !data) return;
  await db.saves.put({ id: SLOT, data: $state.snapshot(data) as Save });
}

export const game = {
  get status(): Status {
    return status;
  },
  get error(): string | null {
    return error;
  },
  /** The current save. Only read it when status is 'ready'. */
  get save(): Save {
    if (!data) throw new Error('save not loaded');
    return data;
  },
  load,
  /** Applies a change to the save and writes it shortly after. */
  update(change: (save: Save) => void): void {
    if (!data) return;
    change(data);
    clearTimeout(writeTimer);
    writeTimer = setTimeout(() => void persistNow(), 150);
  },
  /** Replaces the save, for example from an imported file. */
  async replace(next: unknown): Promise<void> {
    data = parseSave(next);
    await persistNow();
    status = 'ready';
  },
};
