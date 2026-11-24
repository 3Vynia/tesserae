<script lang="ts">
  import { CARDS, CARDS_BY_ID } from '../../data/cards';
  import { BOSSES, CHAPTERS } from '../../data/stages';
  import { RARITIES } from '../../data/schema';
  import {
    simulate,
    synergyFor,
    teamSynergies,
    validTeam,
    type BattleResult,
  } from '../../engine/battle';
  import {
    bossEncounter,
    campaignEncounter,
    playerFighters,
    recordWin,
    stageUnlocked,
    towerEncounter,
    type Encounter,
    type Mode,
  } from '../../engine/modes';
  import { addXp, battleXp } from '../../engine/progress';
  import { dayKey, track } from '../../engine/quests';
  import { t } from '../../i18n/i18n.svelte';
  import { game } from '../save.svelte';
  import { cardName } from '../card-text';
  import Button from '../../ui/Button.svelte';
  import Segmented from '../../ui/Segmented.svelte';
  import Ornament from '../../ui/Ornament.svelte';
  import CardArt from '../../ui/card/CardArt.svelte';
  import Stage from '../../ui/battle/Stage.svelte';
  import { flyStarlight } from '../../ui/motion/flight';

  const FIRST_BOSS = BOSSES[0]?.id ?? '';
  let mode = $state<Mode>('campaign');
  let selected = $state<string>('1-1');
  let fight = $state<{
    encounter: Encounter;
    result: BattleResult;
    reward: number;
    xp: number;
    levels: { name: string; level: number }[];
  } | null>(null);

  const ready = $derived(game.status === 'ready');
  const team = $derived(ready ? game.save.battle.team : []);
  const fighters = $derived(ready ? playerFighters(game.save, CARDS_BY_ID) : []);
  const teamOk = $derived(validTeam(fighters));
  const synergies = $derived(
    [...teamSynergies(fighters.map((f) => f.card))].filter(([, n]) => n >= 2),
  );
  const firstLocked = $derived(
    ready
      ? CHAPTERS.flatMap((c) => c.stages).find((st) => !stageUnlocked(game.save, st.id))?.id
      : undefined,
  );
  const owned = $derived(
    ready
      ? CARDS.filter((c) => game.save.owned[c.id]).sort(
          (a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity),
        )
      : [],
  );

  const encounter = $derived.by((): Encounter | null => {
    if (!ready) return null;
    if (mode === 'tower') return towerEncounter(game.save, CARDS);
    if (mode === 'boss')
      return bossEncounter(
        game.save,
        BOSSES.some((b) => b.id === selected) ? selected : FIRST_BOSS,
        CARDS_BY_ID,
      );
    return campaignEncounter(game.save, selected.includes('-') ? selected : '1-1', CARDS_BY_ID);
  });

  function toggleCard(id: string): void {
    game.update((save) => {
      const slots = save.battle.team;
      const at = slots.indexOf(id);
      if (at >= 0) slots[at] = null;
      else {
        const free = slots.indexOf(null);
        if (free >= 0) slots[free] = id;
      }
    });
  }

  function start(): void {
    const enc = encounter;
    if (!enc || !teamOk) return;
    const save = game.save;
    const result = simulate(
      fighters,
      enc.enemies,
      `${save.seed}:${enc.id}:${save.battle.wins}:${save.pulls.total}`,
    );
    const won = result.winner === 'player';
    const xp = battleXp(
      enc.enemies.map((e) => e.level),
      won,
    );
    const levels: { name: string; level: number }[] = [];
    let reward = 0;
    game.update((s) => {
      if (won) {
        reward = recordWin(s, enc);
        track(s, 'win-battle', dayKey(Date.now()));
      }
      for (const f of fighters) {
        const card = s.owned[f.card.id];
        if (card && addXp(card, xp) > 0) levels.push({ name: cardName(f.card), level: card.level });
      }
    });
    fight = { encounter: enc, result, reward, xp, levels };
  }

  function nextStage(): string | null {
    const stages = CHAPTERS.flatMap((c) => c.stages);
    const i = stages.findIndex((s) => s.id === fight?.encounter.id);
    return stages[i + 1]?.id ?? null;
  }

  const modeOptions = $derived(
    (['campaign', 'tower', 'boss'] as const).map((value) => ({
      value,
      label: t(`ui.battle.modes.${value}`),
    })),
  );
</script>

<div class="battle-page">
  <header class="head">
    <h1>{t('ui.battle.heading')}</h1>
    <p class="intro">{t('ui.battle.intro')}</p>
  </header>

  {#if ready}
    <div class="layout">
      <section class="encounters" aria-labelledby="modes">
        <h2 id="modes" class="visually-hidden">{t('ui.battle.modes.label')}</h2>
        <Segmented
          name="mode"
          legend={t('ui.battle.modes.label')}
          options={modeOptions}
          value={mode}
          onchange={(v: Mode) => {
            mode = v;
            selected = v === 'boss' ? FIRST_BOSS : v === 'campaign' ? '1-1' : '';
          }}
          hideLegend
        />

        {#if mode === 'campaign'}
          {#each CHAPTERS as chapter (chapter.id)}
            <h3 class="chapter">{t(`ui.battle.chapters.${chapter.id}`)}</h3>
            <ul class="stages">
              {#each chapter.stages as stage (stage.id)}
                {@const open = stageUnlocked(game.save, stage.id)}
                {@const done = game.save.battle.cleared.includes(stage.id)}
                <li>
                  <label class="stage" class:selected={selected === stage.id} class:locked={!open}>
                    <input
                      type="radio"
                      name="stage"
                      value={stage.id}
                      bind:group={selected}
                      disabled={!open}
                    />
                    <span class="stage-name">{t('ui.battle.stageName', { id: stage.id })}</span>
                    <span class="meta">
                      {#if done}{t('ui.battle.cleared')}{:else if !open}{stage.id === firstLocked
                          ? t('ui.battle.locked')
                          : t('ui.battle.lockedShort')}{:else}{t('ui.battle.level', {
                          level: stage.enemies[0]?.level ?? 1,
                        })}{/if}
                    </span>
                  </label>
                </li>
              {/each}
            </ul>
          {/each}
        {:else if mode === 'tower'}
          <div class="tower">
            <p class="floor">{t('ui.battle.tower.floor', { floor: game.save.battle.tower + 1 })}</p>
            <p>{t('ui.battle.tower.body')}</p>
          </div>
        {:else}
          <p class="note">{t('ui.battle.boss.body')}</p>
          <ul class="stages">
            {#each BOSSES as boss (boss.id)}
              {@const card = CARDS_BY_ID.get(boss.card)}
              <li>
                <label class="stage" class:selected={selected === boss.id}>
                  <input type="radio" name="boss" value={boss.id} bind:group={selected} />
                  <span class="stage-name">{card ? cardName(card) : boss.id}</span>
                  <span class="meta">
                    {game.save.battle.bosses.includes(boss.id)
                      ? t('ui.battle.boss.defeated')
                      : t('ui.battle.level', { level: boss.level })}
                  </span>
                </label>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="formation" aria-labelledby="formation-heading">
        <h2 id="formation-heading">{t('ui.battle.team.heading')}</h2>
        <p class="note">{t('ui.battle.team.hint')}</p>
        {#each [{ label: 'front', slots: [0, 1, 2] }, { label: 'back', slots: [3, 4] }] as row (row.label)}
          <p class="row-label caps">{t(`ui.battle.team.${row.label}`)}</p>
          <div class="row {row.label}">
            {#each row.slots as slot (slot)}
              {@const id = team[slot] ?? null}
              {@const card = id ? CARDS_BY_ID.get(id) : undefined}
              {#if card}
                <button
                  type="button"
                  class="slot filled"
                  onclick={() => toggleCard(card.id)}
                  aria-label={t('ui.battle.team.remove', { name: cardName(card) })}
                >
                  <span class="art"><CardArt {card} /></span>
                  <span class="slot-name">{cardName(card)}</span>
                  <span class="lvl">
                    {t('ui.detail.level', { level: game.save.owned[card.id]?.level ?? 1 })}
                  </span>
                </button>
              {:else}
                <span class="slot empty">{t('ui.battle.team.empty')}</span>
              {/if}
            {/each}
          </div>
        {/each}

        <div class="synergy">
          {#if synergies.length === 0}
            <p class="note">{t('ui.battle.team.noSynergy')}</p>
          {:else}
            {#each synergies as [pantheon, count] (pantheon)}
              {@const bonus = synergyFor(count)}
              <div class="syn">
                <Ornament {pantheon} height={10} />
                <p>
                  {bonus.health > 0
                    ? t('ui.battle.team.synergyHealth', {
                        count,
                        pantheon: t(`ui.pantheon.${pantheon}`),
                        attack: Math.round(bonus.attack * 100),
                        health: Math.round(bonus.health * 100),
                      })
                    : t('ui.battle.team.synergy', {
                        count,
                        pantheon: t(`ui.pantheon.${pantheon}`),
                        attack: Math.round(bonus.attack * 100),
                      })}
                </p>
              </div>
            {/each}
          {/if}
        </div>

        {#if encounter}
          <h3 class="caps pick">{t('ui.battle.opponents')}</h3>
          <div
            class="foes"
            aria-label={t('ui.battle.level', { level: encounter.enemies[0]?.level ?? 1 })}
          >
            {#each encounter.enemies as foe (foe.slot)}
              <span class="foe" title={cardName(foe.card)}><CardArt card={foe.card} /></span>
            {/each}
          </div>
          <p class="reward">
            {t('ui.battle.reward', { reward: encounter.reward })}
            {#if encounter.firstClear && encounter.mode !== 'tower'}<span>
                {t('ui.battle.firstWin')}
              </span>{/if}
          </p>
        {/if}

        <div class="go">
          <Button variant="gilt" icon="battle" disabled={!teamOk || !encounter} onclick={start}>
            {t('ui.battle.fight')}
          </Button>
          {#if !teamOk}<p class="warn" role="status">{t('ui.battle.team.invalid')}</p>{/if}
        </div>

        <h3 class="caps pick">{t('ui.battle.team.pick')}</h3>
        <ul class="bench">
          {#each owned as card (card.id)}
            {@const inTeam = team.includes(card.id)}
            {@const full = !team.includes(null)}
            <li>
              <button
                type="button"
                class="bench-card"
                class:in-team={inTeam}
                disabled={!inTeam && full}
                aria-pressed={inTeam}
                aria-label={inTeam
                  ? t('ui.battle.team.remove', { name: cardName(card) })
                  : t('ui.battle.team.place', { name: cardName(card) })}
                title={!inTeam && full ? t('ui.battle.team.full') : undefined}
                onclick={() => toggleCard(card.id)}
              >
                <span class="art"><CardArt {card} /></span>
                <span class="slot-name">{cardName(card)}</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    </div>
  {/if}
</div>

{#if fight}
  {@const f = fight}
  <Stage result={f.result}>
    {#snippet outcome()}
      <div class="result {f.result.winner}">
        <h2>
          {t(
            f.result.winner === 'player'
              ? 'ui.battle.result.victory'
              : f.result.winner === 'enemy'
                ? 'ui.battle.result.defeat'
                : 'ui.battle.result.draw',
          )}
        </h2>
        <Ornament pantheon="greek" height={12} />
        {#if f.reward}<p class="gain" id="battle-reward">
            {t('ui.battle.result.reward', { reward: f.reward })}
          </p>{/if}
        <p>{t('ui.battle.result.xp', { xp: f.xp })}</p>
        {#each f.levels as l (l.name)}<p class="level-up">
            {t('ui.battle.result.levelUp', l)}
          </p>{/each}
        <div class="result-actions">
          {#if f.result.winner === 'player' && f.encounter.mode === 'campaign' && nextStage()}
            <Button
              variant="gilt"
              onclick={() => {
                const next = nextStage();
                if (next) selected = next;
                fight = null;
              }}
            >
              {t('ui.battle.result.next')}
            </Button>
          {/if}
          <Button
            variant="engraved"
            onclick={() => {
              fight = null;
              start();
            }}
          >
            {t('ui.battle.result.again')}
          </Button>
          <Button
            variant="quiet"
            onclick={(e) => {
              const from = document.getElementById('battle-reward');
              if (from && f.reward) void flyStarlight(from, 'hud-starlight');
              fight = null;
              void e;
            }}
          >
            {t('ui.battle.result.back')}
          </Button>
        </div>
      </div>
    {/snippet}
  </Stage>
{/if}

<style>
  .battle-page {
    padding: var(--space-8) var(--gutter) var(--space-9);
  }
  .head {
    display: grid;
    gap: var(--space-3);
    margin-bottom: var(--space-7);
  }
  h1 {
    font-size: var(--text-6xl);
  }
  .intro,
  .note {
    color: var(--parchment-dim);
  }
  .note {
    font-size: var(--text-md);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(16rem, 5fr) minmax(0, 7fr);
    gap: var(--space-8);
    align-items: start;
  }
  .chapter {
    margin: var(--space-6) 0 var(--space-3);
    font-size: var(--text-2xl);
  }
  .stages {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--rule);
  }
  .stage {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-3);
    min-height: 44px;
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--rule);
    cursor: pointer;
    transition: background-color var(--dur-quick) ease;
  }
  .stage input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .stage:has(input:focus-visible) {
    outline: 2px solid var(--focus);
    outline-offset: -2px;
  }
  .stage.selected {
    background: var(--lapis);
  }
  .stage.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .stage-name {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    color: var(--parchment);
  }
  .meta {
    font-size: var(--text-sm);
    color: var(--text-muted);
    text-align: end;
  }
  .tower {
    margin-top: var(--space-5);
    display: grid;
    gap: var(--space-2);
  }
  .floor {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    color: var(--gold-pale);
  }
  .foes {
    display: flex;
    gap: 6px;
    margin-top: var(--space-5);
  }
  .foe {
    position: relative;
    width: 52px;
    aspect-ratio: 1;
    border-radius: var(--radius-tile);
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--danger);
  }
  .reward {
    margin-top: var(--space-3);
    color: var(--gold-pale);
  }
  .reward span {
    margin-inline-start: var(--space-2);
    font-style: italic;
    color: var(--text-muted);
  }
  .formation h2 {
    font-size: var(--text-4xl);
    margin-bottom: var(--space-2);
  }
  .row-label {
    margin: var(--space-5) 0 var(--space-2);
    font-size: var(--text-sm);
    color: var(--gold);
  }
  .row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 8rem));
    gap: var(--space-3);
  }
  .row.back {
    padding-inline-start: calc(4rem + var(--space-3) / 2);
  }
  .slot,
  .bench-card {
    position: relative;
    width: 100%;
    display: grid;
    gap: var(--space-1);
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    text-align: start;
    cursor: pointer;
    transition:
      transform var(--dur-press) var(--ease-out),
      opacity var(--dur-quick) ease;
  }
  .slot:active,
  .bench-card:active:not(:disabled) {
    transform: scale(0.96);
  }
  .art {
    position: relative;
    display: block;
    aspect-ratio: 1;
    border-radius: var(--radius-tile);
    overflow: hidden;
    box-shadow:
      inset 0 0 0 2px var(--gold),
      var(--shadow-1);
  }
  .slot.empty {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border: 1px dashed var(--rule-strong);
    border-radius: var(--radius-tile);
    color: var(--text-muted);
    font-style: italic;
    cursor: default;
  }
  .slot-name {
    font-family: var(--font-display);
    font-size: var(--text-md);
    color: var(--parchment);
  }
  .lvl {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .synergy {
    margin: var(--space-5) 0;
    display: grid;
    gap: var(--space-3);
  }
  .syn {
    display: grid;
    gap: var(--space-1);
    max-width: 24rem;
    color: var(--gold-pale);
  }
  .go {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }
  .warn {
    color: var(--danger);
  }
  .pick {
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
    margin-bottom: var(--space-3);
  }
  .bench {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
    gap: var(--space-3);
  }
  .bench-card.in-team .art {
    box-shadow:
      inset 0 0 0 3px var(--gold-pale),
      var(--shadow-1);
    opacity: 0.55;
  }
  .bench-card:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
  .result {
    display: grid;
    gap: var(--space-3);
    justify-items: center;
    text-align: center;
    padding: var(--space-7);
    max-width: 30rem;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-sheet);
    background: var(--ink);
    box-shadow: var(--shadow-3);
    animation: settle 600ms var(--ease-settle) both;
  }
  .result h2 {
    font-size: var(--text-6xl);
  }
  .result.enemy h2,
  .result.draw h2 {
    color: var(--parchment-dim);
  }
  .gain {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    color: var(--gold-pale);
  }
  .level-up {
    color: var(--success);
  }
  .result-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }
  @keyframes settle {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.96);
    }
  }
  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 520px) {
    .row.back {
      padding-inline-start: 0;
    }
  }
</style>
