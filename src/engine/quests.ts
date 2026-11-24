import { createRng } from './rng';
import type { Save } from './save';

export type QuestEvent = 'summon' | 'open-card' | 'read-myth' | 'visit-vault' | 'win-battle';

export interface Quest {
  id: string;
  event: QuestEvent;
  goal: number;
  reward: number;
}

/** Quests the day draws from. */
export const QUEST_POOL: readonly Quest[] = [
  { id: 'summon-once', event: 'summon', goal: 1, reward: 160 },
  { id: 'summon-ten', event: 'summon', goal: 10, reward: 320 },
  { id: 'open-three', event: 'open-card', goal: 3, reward: 120 },
  { id: 'read-a-myth', event: 'read-myth', goal: 1, reward: 120 },
  { id: 'read-three-myths', event: 'read-myth', goal: 3, reward: 200 },
  { id: 'visit-vault', event: 'visit-vault', goal: 1, reward: 80 },
  { id: 'win-battle', event: 'win-battle', goal: 1, reward: 160 },
  { id: 'win-three-battles', event: 'win-battle', goal: 3, reward: 280 },
];
export const QUESTS_PER_DAY = 3;

/** Local calendar day as YYYY-MM-DD; quests reset at local midnight. */
export function dayKey(now: number): string {
  const d = new Date(now);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** The day's quests: picked from the pool by the save seed and the day, without repeats. */
export function questsFor(save: Save, day: string, pool: readonly Quest[] = QUEST_POOL): Quest[] {
  const rng = createRng(`${save.seed}:quests:${day}`);
  const left = [...pool];
  const out: Quest[] = [];
  while (out.length < QUESTS_PER_DAY && left.length) {
    out.push(left.splice(Math.floor(rng.next() * left.length), 1)[0] as Quest);
  }
  return out;
}

function rollover(save: Save, day: string): void {
  if (save.quests.day !== day) save.quests = { day, progress: {}, claimed: [] };
}

/** Records an event toward today's quests. */
export function track(save: Save, event: QuestEvent, day: string, amount = 1): void {
  rollover(save, day);
  for (const q of questsFor(save, day)) {
    if (q.event !== event) continue;
    save.quests.progress[q.id] = Math.min(q.goal, (save.quests.progress[q.id] ?? 0) + amount);
  }
}

export function questProgress(save: Save, day: string, quest: Quest): number {
  return save.quests.day === day ? (save.quests.progress[quest.id] ?? 0) : 0;
}

export function isClaimed(save: Save, day: string, quest: Quest): boolean {
  return save.quests.day === day && save.quests.claimed.includes(quest.id);
}

/** Claims a finished quest. Returns the starlight granted, or 0 when it cannot be claimed. */
export function claim(save: Save, questId: string, day: string): number {
  rollover(save, day);
  const quest = questsFor(save, day).find((q) => q.id === questId);
  if (!quest || isClaimed(save, day, quest) || questProgress(save, day, quest) < quest.goal)
    return 0;
  save.quests.claimed.push(quest.id);
  save.starlight += quest.reward;
  return quest.reward;
}
