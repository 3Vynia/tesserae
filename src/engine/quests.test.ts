import { describe, expect, it } from 'vitest';
import { createSave } from './save';
import { claim, dayKey, questProgress, questsFor, QUESTS_PER_DAY, track } from './quests';

describe('quests', () => {
  it('picks a stable set of distinct quests per day', () => {
    const save = createSave('q', 0);
    const a = questsFor(save, '2026-11-23');
    expect(a).toHaveLength(QUESTS_PER_DAY);
    expect(new Set(a.map((q) => q.id)).size).toBe(QUESTS_PER_DAY);
    expect(questsFor(save, '2026-11-23')).toEqual(a);
  });

  it('tracks, caps progress and pays once', () => {
    const save = createSave('q', 0);
    const day = '2026-11-23';
    const quest = questsFor(save, day)[0]!;
    expect(claim(save, quest.id, day)).toBe(0);
    track(save, quest.event, day, quest.goal + 5);
    expect(questProgress(save, day, quest)).toBe(quest.goal);
    const before = save.starlight;
    expect(claim(save, quest.id, day)).toBe(quest.reward);
    expect(save.starlight).toBe(before + quest.reward);
    expect(claim(save, quest.id, day)).toBe(0);
  });

  it('resets on a new day', () => {
    const save = createSave('q', 0);
    const quest = questsFor(save, 'a')[0]!;
    track(save, quest.event, 'a', quest.goal);
    expect(questProgress(save, 'b', quest)).toBe(0);
    track(save, 'visit-vault', 'b');
    expect(save.quests.day).toBe('b');
  });

  it('formats local days', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
  });
});
