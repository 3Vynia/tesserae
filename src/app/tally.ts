import { RARITIES, type Rarity } from '../data/schema';

export interface TallyRow {
  card: string;
  rarity: Rarity;
  count: number;
  isNew: boolean;
}

/** Each card once with how many came, rarest first, then the most frequent. */
export function tally(
  items: readonly { card: string; rarity: string; isNew?: boolean }[],
): TallyRow[] {
  const rows = new Map<string, TallyRow>();
  for (const item of items) {
    const row = rows.get(item.card);
    if (row) {
      row.count += 1;
      row.isNew ||= !!item.isNew;
    } else {
      rows.set(item.card, {
        card: item.card,
        rarity: item.rarity as Rarity,
        count: 1,
        isNew: !!item.isNew,
      });
    }
  }
  const rank = (r: Rarity) => RARITIES.indexOf(r);
  return [...rows.values()].sort((a, b) => rank(b.rarity) - rank(a.rarity) || b.count - a.count);
}
