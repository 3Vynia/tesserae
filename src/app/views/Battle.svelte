<script lang="ts">
  import { CARDS, CARDS_BY_ID } from '../../data/cards';
  import { BOSSES, CHAPTERS } from '../../data/stages';
  import { RARITIES } from '../../data/schema';
  import { createDuel, type Duel, type Side } from '../../engine/duel';
  import {
    bossEncounter,
    campaignEncounter,
    deckFigures,
    deckReady,
    DECK_FIGURES_MAX,
    playerDeck,
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
  import SceneTitle from '../../ui/game/SceneTitle.svelte';
  import Frame from '../../ui/game/Frame.svelte';
  import ChapterMap from '../../ui/battle/ChapterMap.svelte';
  import Board from '../../ui/duel/Board.svelte';
  import DuelCard from '../../ui/duel/DuelCard.svelte';
  import { flyStarlight } from '../../ui/motion/flight';

  const FIRST_BOSS = BOSSES[0]?.id ?? '';
  let mode = $state<Mode>('campaign');
  let selected = $state<string>('1-1');
  // Raw: the duel engine mutates its own state and the board clones it, which proxies would break.
  let match = $state.raw<{ duel: Duel; encounter: Encounter; title: string } | null>(null);
  let result = $state<{
    winner: Side;
    encounter: Encounter;
    reward: number;
    xp: number;
    levels: { name: string; level: number }[];
  } | null>(null);

  const ready = $derived(game.status === 'ready');
  const deck = $derived(ready ? game.save.battle.deck : []);
  const deckOk = $derived(ready && deckReady(game.save));
  const owned = $derived(
    ready
      ? CARDS.filter((c) => game.save.owned[c.id]).sort(
          (a, b) =>
            a.duel.cost - b.duel.cost || RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity),
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
        CARDS,
      );
    return campaignEncounter(game.save, selected.includes('-') ? selected : '1-1');
  });

  const encounterTitle = (e: Encounter) =>
    e.mode === 'tower'
      ? t('ui.battle.tower.floor', { floor: game.save.battle.tower + 1 })
      : e.mode === 'boss'
        ? (() => {
            const boss = CARDS_BY_ID.get(e.faces[0] ?? '');
            return boss ? cardName(boss) : e.id;
          })()
        : t('ui.battle.stageName', { id: e.id });

  function toggleCard(id: string): void {
    game.update((save) => {
      const list = save.battle.deck;
      const at = list.indexOf(id);
      if (at >= 0) list.splice(at, 1);
      else if (list.length < DECK_FIGURES_MAX) list.push(id);
    });
  }

  function start(): void {
    const e = encounter;
    if (!e || !deckOk) return;
    const save = game.save;
    const seed = `${save.seed}:${e.id}:${save.battle.wins}:${save.pulls.total}:${Date.now()}`;
    const { duel } = createDuel(
      { deck: playerDeck(save) },
      { deck: e.deck, life: e.life },
      seed,
      CARDS_BY_ID,
    );
    result = null;
    match = { duel, encounter: e, title: encounterTitle(e) };
  }

  function finish(winner: Side): void {
    if (!match) return;
    const e = match.encounter;
    const won = winner === 'player';
    const xp = battleXp([e.level], won);
    const levels: { name: string; level: number }[] = [];
    let reward = 0;
    game.update((s) => {
      if (won) {
        reward = recordWin(s, e);
        track(s, 'win-battle', dayKey(Date.now()));
      }
      for (const f of deckFigures(s)) {
        const card = s.owned[f.id];
        const data = CARDS_BY_ID.get(f.id);
        if (card && data && addXp(card, xp) > 0)
          levels.push({ name: cardName(data), level: card.level });
      }
    });
    match = null;
    result = { winner, encounter: e, reward, xp, levels };
  }

  function nextStage(): string | null {
    const stages = CHAPTERS.flatMap((c) => c.stages);
    const i = stages.findIndex((s) => s.id === result?.encounter.id);
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
  <SceneTitle title={t('ui.battle.heading')} />

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
            <Frame tone="ink" class="chapter-frame">
              <h3 class="chapter caps">{t(`ui.battle.chapters.${chapter.id}`)}</h3>
              <ChapterMap
                stages={chapter.stages}
                cleared={game.save.battle.cleared}
                unlocked={(id) => stageUnlocked(game.save, id)}
                {selected}
                onselect={(id) => (selected = id)}
              />
            </Frame>
          {/each}
        {:else if mode === 'tower'}
          <Frame tone="ink" class="chapter-frame">
            <p class="floor">{t('ui.battle.tower.floor', { floor: game.save.battle.tower + 1 })}</p>
            <p class="note">{t('ui.battle.tower.body')}</p>
          </Frame>
        {:else}
          <Frame tone="ink" class="chapter-frame">
            <p class="note">{t('ui.battle.boss.body')}</p>
            <ul class="bosses">
              {#each BOSSES as boss (boss.id)}
                {@const card = CARDS_BY_ID.get(boss.card)}
                <li>
                  <label class="boss" class:selected={selected === boss.id}>
                    <input type="radio" name="boss" value={boss.id} bind:group={selected} />
                    <span class="boss-art">
                      {#if card}<CardArt {card} />{/if}
                    </span>
                    <span class="boss-name">{card ? cardName(card) : boss.id}</span>
                    <span class="meta">
                      {game.save.battle.bosses.includes(boss.id)
                        ? t('ui.battle.boss.defeated')
                        : t('ui.battle.level', { level: boss.level })}
                    </span>
                  </label>
                </li>
              {/each}
            </ul>
          </Frame>
        {/if}

        {#if encounter}
          <Frame class="opponent">
            <h3 class="caps sub">{t('ui.battle.opponents')}</h3>
            <div class="faces">
              {#each encounter.faces.slice(0, 6) as id (id)}
                {@const card = CARDS_BY_ID.get(id)}
                {#if card}<span class="face" title={cardName(card)}><CardArt {card} /></span>{/if}
              {/each}
            </div>
            <p class="note">{t('ui.battle.deck.opponentLife', { life: encounter.life })}</p>
            <p class="reward">
              {t('ui.battle.reward', { reward: encounter.reward })}
              {#if encounter.firstClear && encounter.mode !== 'tower'}<span>
                  {t('ui.battle.firstWin')}
                </span>{/if}
            </p>
            <div class="go">
              <Button variant="gilt" icon="battle" disabled={!deckOk} onclick={start}>
                {t('ui.battle.fight')}
              </Button>
              {#if !deckOk}<p class="warn" role="status">{t('ui.battle.deck.invalid')}</p>{/if}
            </div>
          </Frame>
        {/if}
      </section>

      <section class="deck" aria-labelledby="deck-heading">
        <Frame>
          <header class="deck-head">
            <h2 id="deck-heading">{t('ui.battle.deck.heading')}</h2>
            <p class="count">{t('ui.battle.deck.count', { count: deck.length })}</p>
          </header>
          <p class="note">{t('ui.battle.deck.hint')}</p>
          <p class="note">{t('ui.duel.kinship')}</p>
          <ul class="cards">
            {#each owned as card (card.id)}
              {@const inDeck = deck.includes(card.id)}
              {@const full = !inDeck && deck.length >= DECK_FIGURES_MAX}
              <li>
                <button
                  type="button"
                  class="pick"
                  class:in-deck={inDeck}
                  disabled={full}
                  aria-pressed={inDeck}
                  aria-label={inDeck
                    ? t('ui.battle.team.remove', { name: cardName(card) })
                    : t('ui.battle.team.place', { name: cardName(card) })}
                  onclick={() => toggleCard(card.id)}
                >
                  <DuelCard
                    entry={{
                      kind: 'figure',
                      id: card.id,
                      level: game.save.owned[card.id]?.level ?? 1,
                    }}
                  />
                  {#if inDeck}<span class="check caps">×2</span>{/if}
                </button>
              </li>
            {/each}
          </ul>
        </Frame>
      </section>
    </div>
  {/if}
</div>

{#if match}
  <Board
    duel={match.duel}
    title={match.title}
    rival={CARDS_BY_ID.get(match.encounter.faces[0] ?? '')}
    onfinish={finish}
    onleave={() => finish('enemy')}
  />
{/if}

{#if result}
  {@const r = result}
  <div class="result-layer" role="dialog" aria-modal="true" aria-labelledby="result-title">
    <div class="result {r.winner}">
      <h2 id="result-title">
        {t(r.winner === 'player' ? 'ui.battle.result.victory' : 'ui.battle.result.defeat')}
      </h2>
      <Ornament pantheon="greek" height={12} />
      {#if r.reward}<p class="gain" id="battle-reward">
          {t('ui.battle.result.reward', { reward: r.reward })}
        </p>{/if}
      <p>{t('ui.battle.result.xp', { xp: r.xp })}</p>
      {#each r.levels as l (l.name)}<p class="level-up">
          {t('ui.battle.result.levelUp', l)}
        </p>{/each}
      <div class="result-actions">
        {#if r.winner === 'player' && r.encounter.mode === 'campaign' && nextStage()}
          <Button
            variant="gilt"
            onclick={() => {
              const next = nextStage();
              if (next) selected = next;
              result = null;
            }}
          >
            {t('ui.battle.result.next')}
          </Button>
        {/if}
        <Button variant="engraved" onclick={start}>{t('ui.battle.result.again')}</Button>
        <Button
          variant="quiet"
          onclick={() => {
            const from = document.getElementById('battle-reward');
            if (from && r.reward) void flyStarlight(from, 'hud-starlight');
            result = null;
          }}
        >
          {t('ui.battle.result.back')}
        </Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .battle-page {
    padding: var(--space-4) var(--gutter) var(--space-6);
    max-width: 90rem;
    margin-inline: auto;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(18rem, 5fr) minmax(0, 7fr);
    gap: var(--space-6);
    align-items: start;
  }
  .encounters {
    display: grid;
    gap: var(--space-4);
  }
  .chapter {
    margin-bottom: var(--space-2);
    font-size: var(--text-xl);
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--gold-pale);
  }
  .floor {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    color: var(--gold-pale);
  }
  .note {
    color: var(--parchment-dim);
    font-size: var(--text-md);
  }
  .bosses {
    list-style: none;
    margin: var(--space-3) 0 0;
    padding: 0;
    display: grid;
    gap: var(--space-2);
  }
  .boss {
    display: grid;
    grid-template-columns: 52px 1fr auto;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2);
    border: 1px solid var(--rule);
    border-radius: 12px;
    cursor: pointer;
  }
  .boss.selected {
    border-color: var(--gold);
    background: var(--lapis);
  }
  .boss:has(input:focus-visible) {
    outline: 2px solid var(--focus);
  }
  .boss input {
    position: absolute;
    opacity: 0;
  }
  .boss-art {
    position: relative;
    width: 52px;
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--danger);
  }
  .boss-name {
    font-family: var(--font-display);
    font-size: var(--text-xl);
  }
  .meta {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .sub {
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
    margin-bottom: var(--space-2);
  }
  .faces {
    display: flex;
    gap: 6px;
    margin-bottom: var(--space-2);
  }
  .face {
    position: relative;
    width: 48px;
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--danger);
  }
  .reward {
    margin-top: var(--space-2);
    color: var(--gold-pale);
  }
  .reward span {
    margin-inline-start: var(--space-2);
    font-style: italic;
    color: var(--text-muted);
  }
  .go {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }
  .go :global(.btn) {
    min-height: 56px;
    padding-inline: var(--space-7);
    font-size: var(--text-2xl);
  }
  .warn {
    color: var(--danger);
  }
  .deck-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .deck-head h2 {
    font-size: var(--text-4xl);
  }
  .count {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    color: var(--gold);
    font-variant-numeric: lining-nums;
  }
  .cards {
    list-style: none;
    margin: var(--space-5) 0 0;
    padding: var(--space-2);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
    gap: var(--space-5) var(--space-4);
  }
  .pick {
    position: relative;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    transition:
      transform var(--dur-press) var(--ease-out),
      filter var(--dur-quick) ease;
  }
  .pick:active:not(:disabled) {
    transform: scale(0.96);
  }
  .pick:not(.in-deck) {
    filter: brightness(0.6) saturate(0.7);
  }
  .pick:disabled {
    cursor: not-allowed;
  }
  .pick.in-deck {
    transform: translateY(-4px);
  }
  .check {
    position: absolute;
    top: -10px;
    right: -6px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--gold);
    color: var(--ink);
    font-size: var(--text-sm);
  }
  @media (hover: hover) and (pointer: fine) {
    .pick:not(:disabled):hover {
      filter: none;
    }
  }
  .result-layer {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    display: grid;
    place-items: center;
    padding: var(--gutter);
    background: rgb(4 6 13 / 0.8);
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
  .result.enemy h2 {
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
  @media (max-width: 960px) {
    .layout {
      grid-template-columns: 1fr;
    }
  }
</style>
