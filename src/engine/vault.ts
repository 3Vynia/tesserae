import type { Card, Rarity } from '../data/schema';
import {
  EFFECTS,
  FRAMES,
  FRAMES_BY_ID,
  GLYPH_PRICE,
  GLYPHS,
  TINTS,
  type Glyph,
  type Tint,
} from '../data/cosmetics';
import { createRng } from './rng';
import { grant, type Save } from './save';

const WEEK = 7 * 24 * 3600 * 1000;
export const weekOf = (now: number) => Math.floor(now / WEEK);
/** When the current week's rotation ends. */
export const weekEnds = (now: number) => (weekOf(now) + 1) * WEEK;

/* Dissolving: spare copies become stardust. Locked cards and the last copy are always kept. */

export const DUST: Record<Rarity, number> = {
  mortal: 5,
  hero: 15,
  demigod: 50,
  god: 200,
  primordial: 600,
};

/** What dissolving would give for these cards, keeping `keep` copies of each. */
export function dissolvePreview(
  save: Save,
  ids: readonly string[],
  cards: ReadonlyMap<string, Card>,
  keep = 1,
): { copies: number; dust: number } {
  let copies = 0;
  let dust = 0;
  for (const id of ids) {
    const owned = save.owned[id];
    const card = cards.get(id);
    if (!owned || !card || owned.locked) continue;
    const spare = Math.max(0, owned.count - Math.max(1, keep));
    copies += spare;
    dust += spare * DUST[card.rarity];
  }
  return { copies, dust };
}

export function dissolve(
  save: Save,
  ids: readonly string[],
  cards: ReadonlyMap<string, Card>,
  keep = 1,
): { copies: number; dust: number } {
  const out = dissolvePreview(save, ids, cards, keep);
  for (const id of ids) {
    const owned = save.owned[id];
    if (!owned || owned.locked || !cards.has(id)) continue;
    owned.count = Math.min(owned.count, Math.max(1, keep));
  }
  save.wallet.dust += out.dust;
  save.stats.dissolved += out.copies;
  return out;
}

export function setLocked(save: Save, ids: readonly string[], locked: boolean): void {
  for (const id of ids) {
    const owned = save.owned[id];
    if (owned) owned.locked = locked;
  }
}

export const MAX_TAGS = 8;
export const normalizeTag = (tag: string) => tag.trim().replace(/\s+/g, ' ').slice(0, 24);

export function addTag(save: Save, ids: readonly string[], raw: string): void {
  const tag = normalizeTag(raw);
  if (!tag) return;
  for (const id of ids) {
    const owned = save.owned[id];
    if (owned && !owned.tags.includes(tag) && owned.tags.length < MAX_TAGS) owned.tags.push(tag);
  }
}

export function removeTag(save: Save, ids: readonly string[], tag: string): void {
  for (const id of ids) {
    const owned = save.owned[id];
    if (owned) owned.tags = owned.tags.filter((t) => t !== tag);
  }
}

/** Every tag in use, sorted. */
export const allTags = (save: Save) =>
  [...new Set(Object.values(save.owned).flatMap((o) => o.tags))].sort((a, b) => a.localeCompare(b));

/* Wishlist, showcase and albums */

export const WISHLIST_MAX = 40;
export const SHOWCASE_MAX = 5;
export const ALBUMS_MAX = 10;
export const ALBUM_CARDS_MAX = 40;

function toggleIn(list: string[], id: string, max: number): boolean {
  const at = list.indexOf(id);
  if (at >= 0) {
    list.splice(at, 1);
    return true;
  }
  if (list.length >= max) return false;
  list.push(id);
  return true;
}

export const toggleWish = (save: Save, id: string) => toggleIn(save.wishlist, id, WISHLIST_MAX);

export function toggleShowcase(save: Save, id: string): boolean {
  if (!save.owned[id] && !save.profile.showcase.includes(id)) return false;
  return toggleIn(save.profile.showcase, id, SHOWCASE_MAX);
}

export function createAlbum(
  save: Save,
  name: string,
  cards: readonly string[] = [],
): string | null {
  const clean = name.trim().slice(0, 32);
  if (!clean || save.albums.length >= ALBUMS_MAX) return null;
  const id = `album-${save.albums.reduce((n, a) => Math.max(n, Number(a.id.slice(6)) || 0), 0) + 1}`;
  save.albums.push({ id, name: clean, cards: [...new Set(cards)].slice(0, ALBUM_CARDS_MAX) });
  return id;
}

export function renameAlbum(save: Save, id: string, name: string): void {
  const album = save.albums.find((a) => a.id === id);
  const clean = name.trim().slice(0, 32);
  if (album && clean) album.name = clean;
}

export function deleteAlbum(save: Save, id: string): void {
  save.albums = save.albums.filter((a) => a.id !== id);
}

/** Adds the cards to an album, up to its limit. Returns how many were added. */
export function addToAlbum(save: Save, id: string, cards: readonly string[]): number {
  const album = save.albums.find((a) => a.id === id);
  if (!album) return 0;
  let added = 0;
  for (const card of cards) {
    if (album.cards.includes(card) || album.cards.length >= ALBUM_CARDS_MAX) continue;
    album.cards.push(card);
    added++;
  }
  return added;
}

export function removeFromAlbum(save: Save, id: string, card: string): void {
  const album = save.albums.find((a) => a.id === id);
  if (album) album.cards = album.cards.filter((c) => c !== card);
}

/* The Oracle's market: a weekly stall of cards sold for stardust, one of each. */

export const MARKET_PRICE: Record<Rarity, number> = {
  mortal: 60,
  hero: 180,
  demigod: 600,
  god: 2400,
  primordial: 7200,
};
export const MARKET_SIZE = 6;

/** The week's stall: picked by the save seed and the week, at least one god or better. */
export function marketStock(save: Save, cards: readonly Card[], now: number): Card[] {
  const rng = createRng(`${save.seed}:market:${weekOf(now)}`);
  const high = cards.filter((c) => c.rarity === 'god' || c.rarity === 'primordial');
  const left = [...cards];
  const out: Card[] = [];
  if (high.length) {
    const first = rng.pick(high);
    out.push(first);
    left.splice(left.indexOf(first), 1);
  }
  while (out.length < MARKET_SIZE && left.length) {
    out.push(left.splice(Math.floor(rng.next() * left.length), 1)[0] as Card);
  }
  return out;
}

export function marketBought(save: Save, now: number): string[] {
  return save.market.week === weekOf(now) ? save.market.bought : [];
}

export type BuyError = 'not-enough-dust' | 'sold' | 'not-in-stock' | 'unknown';

export function buyCard(
  save: Save,
  cards: readonly Card[],
  id: string,
  now: number,
): { isNew: boolean } | { error: BuyError } {
  const card = marketStock(save, cards, now).find((c) => c.id === id);
  if (!card) return { error: 'not-in-stock' };
  if (marketBought(save, now).includes(id)) return { error: 'sold' };
  const price = MARKET_PRICE[card.rarity];
  if (save.wallet.dust < price) return { error: 'not-enough-dust' };
  if (save.market.week !== weekOf(now)) save.market = { week: weekOf(now), bought: [] };
  save.wallet.dust -= price;
  save.market.bought.push(id);
  save.stats.bought += 1;
  return { isNew: grant(save, id, now) };
}

/* The frame workshop: a weekly rotation of frames, with one free gift per rotation. */

export const ROTATION_SIZE = 4;

export function workshopRotation(now: number): { frames: string[]; gift: string; id: string } {
  const week = weekOf(now);
  const rng = createRng(`workshop:${week}`);
  const left = FRAMES.map((f) => f.id);
  const frames: string[] = [];
  while (frames.length < ROTATION_SIZE && left.length) {
    frames.push(left.splice(Math.floor(rng.next() * left.length), 1)[0] as string);
  }
  const tints = Object.keys(TINTS) as Tint[];
  const gift = `${frames[0] ?? 'gilded'}/${rng.pick(tints)}`;
  return { frames, gift, id: `week-${week}` };
}

export const ownsFrame = (save: Save, frame: string, tint: Tint) =>
  save.cosmetics.frames.includes(`${frame}/${tint}`);

export function buyFrame(
  save: Save,
  frame: string,
  tint: Tint,
  now: number,
): { ok: true } | { error: BuyError } {
  const def = FRAMES_BY_ID.get(frame);
  if (!def || !(tint in TINTS)) return { error: 'unknown' };
  if (!workshopRotation(now).frames.includes(frame)) return { error: 'not-in-stock' };
  if (ownsFrame(save, frame, tint)) return { error: 'sold' };
  if (save.wallet.dust < def.price) return { error: 'not-enough-dust' };
  save.wallet.dust -= def.price;
  save.cosmetics.frames.push(`${frame}/${tint}`);
  return { ok: true };
}

export function claimGift(save: Save, now: number): string | null {
  const rotation = workshopRotation(now);
  if (save.cosmetics.gifts.includes(rotation.id)) return null;
  save.cosmetics.gifts.push(rotation.id);
  if (!save.cosmetics.frames.includes(rotation.gift)) save.cosmetics.frames.push(rotation.gift);
  return rotation.gift;
}

export function buyGlyph(save: Save, glyph: Glyph): { ok: true } | { error: BuyError } {
  if (!(glyph in GLYPHS)) return { error: 'unknown' };
  if (save.cosmetics.glyphs.includes(glyph)) return { error: 'sold' };
  if (save.wallet.dust < GLYPH_PRICE) return { error: 'not-enough-dust' };
  save.wallet.dust -= GLYPH_PRICE;
  save.cosmetics.glyphs.push(glyph);
  return { ok: true };
}

/* Customizing a card */

/** Stickers this save may use: a seal for each pantheon it holds, and every bought glyph. */
export function stickersFor(save: Save, cards: ReadonlyMap<string, Card>): string[] {
  const seals = new Set<string>();
  for (const id of Object.keys(save.owned)) {
    const card = cards.get(id);
    if (card) seals.add(`seal-${card.pantheon}`);
  }
  return [...seals, ...save.cosmetics.glyphs.map((g) => `glyph-${g}`)];
}

export const effectsFor = (copies: number) =>
  EFFECTS.filter((e) => copies >= e.copies).map((e) => e.id);

export interface Look {
  frame?: string | undefined;
  tint?: string | undefined;
  sticker?: string | undefined;
  effect?: string | undefined;
}

/** Applies a look to a card, dropping any piece the save does not own. */
export function setLook(
  save: Save,
  id: string,
  look: Look,
  cards: ReadonlyMap<string, Card>,
): boolean {
  const owned = save.owned[id];
  if (!owned) return false;
  const next: Look = {};
  if (look.frame && look.tint && ownsFrame(save, look.frame, look.tint as Tint)) {
    next.frame = look.frame;
    next.tint = look.tint;
  }
  if (look.sticker && stickersFor(save, cards).includes(look.sticker)) next.sticker = look.sticker;
  if (look.effect && effectsFor(owned.count).some((e) => e === look.effect))
    next.effect = look.effect;
  owned.look = next;
  return true;
}

export const isCustomized = (o: { look: Look }) =>
  !!(o.look.frame || o.look.sticker || o.look.effect);
