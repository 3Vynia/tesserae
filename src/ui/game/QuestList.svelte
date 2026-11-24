<script lang="ts">
  import { claim, dayKey, isClaimed, questProgress, questsFor } from '../../engine/quests';
  import { t } from '../../i18n/i18n.svelte';
  import { game } from '../../app/save.svelte';
  import Button from '../Button.svelte';
  import { flyStarlight } from '../motion/flight';

  const today = dayKey(Date.now());
  const quests = $derived(game.status === 'ready' ? questsFor(game.save, today) : []);

  function claimQuest(id: string, from: EventTarget | null): void {
    let reward = 0;
    game.update((save) => (reward = claim(save, id, today)));
    if (reward && from instanceof Element) void flyStarlight(from, 'hud-starlight');
  }
</script>

<ul class="quests">
  {#each quests as quest (quest.id)}
    {@const done = questProgress(game.save, today, quest)}
    {@const claimed = isClaimed(game.save, today, quest)}
    <li class:complete={done >= quest.goal} class:claimed>
      <span class="seal" aria-hidden="true"></span>
      <p class="title">{t(`ui.summon.quests.titles.${quest.id}`)}</p>
      <p class="progress">
        <span class="bar" aria-hidden="true">
          <i style:transform="scaleX({done / quest.goal})"></i>
        </span>
        {t('ui.summon.quests.progress', { done, goal: quest.goal })}
      </p>
      {#if claimed}
        <span class="done">{t('ui.summon.quests.claimed')}</span>
      {:else}
        <Button
          variant={done >= quest.goal ? 'gilt' : 'engraved'}
          icon="starlight"
          disabled={done < quest.goal}
          onclick={(e) => claimQuest(quest.id, e.currentTarget)}
        >
          {t('ui.summon.quests.claim', { reward: quest.reward })}
        </Button>
      {/if}
    </li>
  {/each}
</ul>
<p class="note">{t('ui.summon.quests.resets')}</p>

<style>
  .quests {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-3);
  }
  li {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--rule);
  }
  li:last-child {
    border-bottom: 0;
  }
  .seal {
    grid-row: span 2;
    width: 14px;
    height: 14px;
    rotate: 45deg;
    border: 1.5px solid var(--gold);
  }
  .complete .seal {
    background: var(--gold);
  }
  .claimed .seal {
    background: var(--lapis-bright);
    border-color: var(--lapis-bright);
  }
  .title {
    color: var(--parchment);
    line-height: var(--leading-snug);
  }
  .claimed .title {
    color: var(--text-muted);
  }
  .progress {
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
  }
  .bar {
    width: 4.5rem;
    height: 4px;
    border-radius: 2px;
    background: var(--lapis);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--gold);
    transform-origin: left;
  }
  li :global(.btn),
  .done {
    grid-column: 3;
    grid-row: 1 / span 2;
  }
  .done {
    font-style: italic;
    color: var(--text-muted);
  }
  @media (max-width: 520px) {
    li :global(.btn) {
      padding-inline: var(--space-3);
      font-size: var(--text-md);
    }
  }
  .note {
    margin-top: var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
</style>
