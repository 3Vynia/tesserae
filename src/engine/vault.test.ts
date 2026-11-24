import { describe, expect, it } from 'vitest';
import { CARDS, CARDS_BY_ID } from '../data/cards';
import { createSave, grant } from './save';
import {
  addTag,
  addToAlbum,
  allTags,
  buyCard,
  buyFrame,
  buyGlyph,
  claimGift,
  createAlbum,
  dissolve,
  dissolvePreview,
  DUST,
  effectsFor,
  MARKET_PRICE,
  MARKET_SIZE,
  marketStock,
  setLocked,
  setLook,
  stickersFor,
  toggleShowcase,
  toggleWish,
  WISHLIST_MAX,
  workshopRotation,
} from './vault';

const zeus = CARDS_BY_ID.get('zeus');

describe('dissolving', () => {
  it('turns spare copies into stardust and keeps one', () => {
    const save = createSave('v', 0);
    for (let i = 0; i < 4; i++) grant(save, 'zeus', 1);
    const expected = 3 * DUST[zeus?.rarity ?? 'god'];
    expect(dissolvePreview(save, ['zeus'], CARDS_BY_ID)).toEqual({ copies: 3, dust: expected });
    expect(dissolve(save, ['zeus'], CARDS_BY_ID).dust).toBe(expected);
    expect(save.owned['zeus']?.count).toBe(1);
    expect(save.wallet.dust).toBe(expected);
  });

  it('never touches a locked card', () => {
    const save = createSave('v', 0);
    grant(save, 'zeus', 1);
    grant(save, 'zeus', 1);
    setLocked(save, ['zeus'], true);
    expect(dissolve(save, ['zeus'], CARDS_BY_ID)).toEqual({ copies: 0, dust: 0 });
    expect(save.owned['zeus']?.count).toBe(2);
  });
});

describe('tags, wishes and albums', () => {
  it('tags cards without duplicates', () => {
    const save = createSave('v', 0);
    addTag(save, ['achilles', 'patroclus'], '  Troy  ');
    addTag(save, ['achilles'], 'Troy');
    expect(save.owned['achilles']?.tags).toEqual(['Troy']);
    expect(allTags(save)).toEqual(['Troy']);
  });

  it('caps the wishlist and the showcase', () => {
    const save = createSave('v', 0);
    for (let i = 0; i < WISHLIST_MAX; i++) expect(toggleWish(save, `c${i}`)).toBe(true);
    expect(toggleWish(save, 'extra')).toBe(false);
    expect(toggleWish(save, 'c0')).toBe(true);
    expect(toggleShowcase(save, 'zeus')).toBe(false);
    expect(toggleShowcase(save, 'achilles')).toBe(true);
  });

  it('creates albums and adds cards once', () => {
    const save = createSave('v', 0);
    const id = createAlbum(save, 'Troy', ['achilles']) ?? '';
    expect(addToAlbum(save, id, ['achilles', 'patroclus'])).toBe(1);
    expect(save.albums[0]?.cards).toEqual(['achilles', 'patroclus']);
    expect(createAlbum(save, '   ')).toBeNull();
  });
});

describe('market', () => {
  it('stocks the same cards all week, with a god or better', () => {
    const save = createSave('v', 0);
    const a = marketStock(save, CARDS, 1000);
    expect(a).toHaveLength(MARKET_SIZE);
    expect(new Set(a.map((c) => c.id)).size).toBe(MARKET_SIZE);
    expect(a.some((c) => c.rarity === 'god' || c.rarity === 'primordial')).toBe(true);
    expect(marketStock(save, CARDS, 5000)).toEqual(a);
  });

  it('sells each card once for stardust', () => {
    const save = createSave('v', 0);
    const card = marketStock(save, CARDS, 0)[0];
    if (!card) throw new Error('empty market');
    expect(buyCard(save, CARDS, card.id, 0)).toEqual({ error: 'not-enough-dust' });
    save.wallet.dust = MARKET_PRICE[card.rarity] * 2;
    expect('error' in buyCard(save, CARDS, card.id, 0)).toBe(false);
    expect(buyCard(save, CARDS, card.id, 0)).toEqual({ error: 'sold' });
    expect(save.wallet.dust).toBe(MARKET_PRICE[card.rarity]);
  });
});

describe('workshop and looks', () => {
  it('gives one gift per rotation and sells frames in stock', () => {
    const save = createSave('v', 0);
    const rotation = workshopRotation(0);
    expect(claimGift(save, 0)).toBe(rotation.gift);
    expect(claimGift(save, 0)).toBeNull();
    save.wallet.dust = 10_000;
    const frame = rotation.frames[1] ?? '';
    expect(buyFrame(save, frame, 'jade', 0)).toEqual({ ok: true });
    expect(buyFrame(save, frame, 'jade', 0)).toEqual({ error: 'sold' });
    expect(buyGlyph(save, 'owl')).toEqual({ ok: true });
  });

  it('only lets a card wear what the save owns', () => {
    const save = createSave('v', 0);
    const [frame, tint] = workshopRotation(0).gift.split('/') as [string, string];
    claimGift(save, 0);
    setLook(
      save,
      'achilles',
      { frame, tint, sticker: 'seal-norse', effect: 'eclipse' },
      CARDS_BY_ID,
    );
    expect(save.owned['achilles']?.look).toEqual({ frame, tint });
    expect(stickersFor(save, CARDS_BY_ID)).toContain('seal-greek');
    expect(effectsFor(5)).toEqual(['stardust', 'aurora']);
  });
});
