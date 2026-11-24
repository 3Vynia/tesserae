<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import {
    act,
    attackTargets,
    entryEffect,
    playable,
    sameTarget,
    targetsFor,
    BOARD_LIMIT,
    type DeckEntry,
    type Duel,
    type DuelEvent,
    type DuelState,
    type HandCard,
    type Side,
    type Target,
    type Unit,
  } from '../../engine/duel';
  import { rivalNextAction } from '../../engine/rival';
  import { t } from '../../i18n/i18n.svelte';
  import { cardName } from '../../app/card-text';
  import { effectText, entryName, keywordName } from '../../app/duel-text';
  import { motion } from '../motion/motion.svelte';
  import { modal, portal } from '../portal';
  import { POP_FRAMES, sleep } from '../battle/fx';
  import DuelCard from './DuelCard.svelte';
  import CardArt from '../card/CardArt.svelte';
  import Icon from '../icons/Icon.svelte';
  import Ornament from '../Ornament.svelte';
  import type { Card } from '../../data/schema';

  interface Props {
    duel: Duel;
    title: string;
    /** Card shown as the opposing hero's portrait. */
    rival: Card | undefined;
    onfinish: (winner: Side) => void;
    onleave: () => void;
  }
  let { duel, title, rival, onfinish, onleave }: Props = $props();

  type Mode =
    | { kind: 'idle' }
    | { kind: 'target'; uid: number; options: Target[] }
    | { kind: 'attack'; uid: number; options: Target[] };

  let view = $state.raw<DuelState>(untrack(() => structuredClone(duel.state)));
  let mode = $state<Mode>({ kind: 'idle' });
  let busy = $state(false);
  let banner = $state<string | null>(null);
  let reveal = $state<DeckEntry | null>(null);
  let announce = $state('');
  let root = $state<HTMLDivElement>();
  let fx = $state<HTMLDivElement>();

  const mine = $derived(view.seats.player);
  const theirs = $derived(view.seats.enemy);
  const myTurn = $derived(view.active === 'player' && !view.winner && !busy);
  const canPlay = $derived(
    myTurn ? new Set(playable(duel, 'player').map((c) => c.uid)) : new Set<number>(),
  );

  const sync = () => (view = structuredClone(duel.state));
  const speed = () => (motion.calm ? 0.5 : 1);
  const isOption = (t: Target) =>
    mode.kind !== 'idle' && mode.options.some((o) => sameTarget(o, t));

  function el(t: Target): HTMLElement | null {
    if (!root) return null;
    return 'hero' in t
      ? root.querySelector(`[data-hero="${t.side}"]`)
      : root.querySelector(`[data-uid="${t.uid}"]`);
  }

  function nameOf(target: Target): string {
    if ('hero' in target) return target.side === 'player' ? t('ui.duel.log.yours') : title;
    const unit = duel.state.seats[target.side].board.find((u) => u.uid === target.uid);
    return unit ? cardName(unit.card) : '';
  }

  function float(t: Target, text: string, kind: string): void {
    const target = el(t);
    if (!target || !fx) return;
    const box = target.getBoundingClientRect();
    const host = fx.getBoundingClientRect();
    const n = document.createElement('span');
    n.className = `num ${kind}`;
    n.textContent = text;
    n.style.left = `${box.left - host.left + box.width / 2}px`;
    n.style.top = `${box.top - host.top + box.height * 0.3}px`;
    // eslint-disable-next-line svelte/no-dom-manipulating
    fx.append(n);
    void n.animate(motion.calm ? [{ opacity: 0 }, { opacity: 1 }] : POP_FRAMES, {
      duration: 500,
      fill: 'forwards',
    });
    void n
      .animate(
        [
          { translate: '0 0', opacity: 1 },
          { translate: '0 -40px', opacity: 0 },
        ],
        {
          duration: 1000,
          delay: 300,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'forwards',
        },
      )
      .finished.finally(() => n.remove());
  }

  async function lunge(attacker: Target, target: Target): Promise<void> {
    const a = el(attacker);
    const b = el(target);
    if (!a || !b || motion.calm) return;
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    const dx = (rb.left + rb.width / 2 - (ra.left + ra.width / 2)) * 0.7;
    const dy = (rb.top + rb.height / 2 - (ra.top + ra.height / 2)) * 0.7;
    await a
      .animate(
        [
          { transform: 'translate(0, 0) scale(1)' },
          { transform: `translate(${dx}px, ${dy}px) scale(1.08)`, offset: 0.45 },
          { transform: 'translate(0, 0) scale(1)' },
        ],
        { duration: 460, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
      )
      .finished.catch(() => {});
  }

  function shake(t: Target): void {
    const target = el(t);
    if (!target || motion.calm) return;
    void target.animate(
      [{ translate: '0 0' }, { translate: '6px 0' }, { translate: '-5px 0' }, { translate: '0 0' }],
      { duration: 220 },
    );
  }

  async function play(events: DuelEvent[]): Promise<void> {
    for (const e of events) {
      switch (e.type) {
        case 'turn':
          sync();
          banner = e.side === 'player' ? t('ui.duel.yourTurn') : t('ui.duel.theirTurn');
          announce = banner;
          await sleep(900 * speed());
          banner = null;
          break;
        case 'play':
          if (e.side === 'enemy') {
            reveal = e.entry;
            announce = t('ui.duel.log.play', {
              side: t('ui.duel.log.theirs'),
              name: entryName(e.entry),
            });
            await sleep(1000 * speed());
            reveal = null;
          }
          sync();
          await tick();
          break;
        case 'attack': {
          const from = { side: e.side, uid: e.uid };
          announce = t('ui.duel.log.attack', { attacker: nameOf(from), target: nameOf(e.target) });
          await lunge(from, e.target);
          break;
        }
        case 'damage':
          float(e.target, `−${e.amount}`, 'hurt');
          shake(e.target);
          await sleep(140 * speed());
          break;
        case 'heal':
          float(e.target, `+${e.amount}`, 'heal');
          break;
        case 'buff':
          float(
            { side: e.side, uid: e.uid },
            `${e.attack >= 0 ? '+' : ''}${e.attack}/+${e.health}`,
            e.attack < 0 ? 'hurt' : 'buff',
          );
          break;
        case 'kinship':
          float({ side: e.side, uid: e.uid }, t('ui.duel.kinshipShort'), 'buff');
          await sleep(300 * speed());
          break;
        case 'death': {
          announce = t('ui.duel.log.death', { name: nameOf({ side: e.side, uid: e.uid }) });
          const node = el({ side: e.side, uid: e.uid });
          if (node) {
            await node
              .animate(
                [
                  { opacity: 1, transform: 'scale(1)', filter: 'none' },
                  { opacity: 0, transform: 'scale(0.8)', filter: 'grayscale(1) blur(2px)' },
                ],
                { duration: 380, easing: 'ease', fill: 'forwards' },
              )
              .finished.catch(() => {});
          }
          break;
        }
        case 'win':
          sync();
          await sleep(700);
          onfinish(e.side);
          return;
        default:
          break;
      }
    }
    sync();
  }

  async function perform(action: Parameters<typeof act>[1]): Promise<void> {
    busy = true;
    mode = { kind: 'idle' };
    try {
      await play(act(duel, action));
      // The opponent's turn plays out one action at a time.
      while (duel.state.active === 'enemy' && !duel.state.winner) {
        await sleep(450 * speed());
        await play(act(duel, rivalNextAction(duel)));
      }
    } finally {
      busy = false;
      sync();
    }
  }

  function pickHand(card: HandCard): void {
    if (!myTurn || !canPlay.has(card.uid)) return;
    const effect = entryEffect(card.entry, duel.cards);
    const options = targetsFor(duel.state, 'player', effect);
    if (options && options.length > 0) mode = { kind: 'target', uid: card.uid, options };
    else void perform({ type: 'play', uid: card.uid });
  }

  function pickTarget(target: Target): void {
    if (mode.kind === 'target' && isOption(target)) {
      void perform({ type: 'play', uid: mode.uid, target });
    } else if (mode.kind === 'attack' && isOption(target)) {
      void perform({ type: 'attack', uid: mode.uid, target });
    } else if (myTurn && target.side === 'player' && !('hero' in target)) {
      const unit = duel.state.seats.player.board.find((u) => u.uid === target.uid);
      if (unit && unit.attacks > 0) {
        mode = { kind: 'attack', uid: unit.uid, options: attackTargets(duel.state, 'player') };
      }
    }
  }

  const unitLabel = (u: Unit) =>
    t('ui.duel.unitCard', {
      name: cardName(u.card),
      stats: t('ui.duel.stats', { attack: u.attack, health: u.health }),
      state:
        u.stunned > 0
          ? t('ui.duel.stunned')
          : u.attacks > 0
            ? t('ui.duel.ready')
            : t('ui.duel.resting'),
    }) + (u.keywords.length ? ` ${u.keywords.map(keywordName).join(', ')}.` : '');

  const handLabel = (c: HandCard) => {
    const effect = entryEffect(c.entry, duel.cards);
    const card = c.entry.kind === 'figure' ? duel.cards.get(c.entry.id) : undefined;
    const parts = [
      card
        ? t('ui.duel.stats', { attack: card.duel.attack, health: card.duel.health })
        : t('ui.duel.rite'),
      ...(card?.duel.keywords.map(keywordName) ?? []),
      effect ? effectText(effect) : '',
    ];
    return t('ui.duel.handCard', {
      name: entryName(c.entry),
      cost: c.cost,
      text: parts.filter(Boolean).join('. '),
    });
  };

  const hint = $derived.by(() => {
    const m = mode;
    if (m.kind === 'target') {
      const card = mine.hand.find((c) => c.uid === m.uid);
      return card ? t('ui.duel.pickTarget', { name: entryName(card.entry) }) : '';
    }
    if (m.kind === 'attack') {
      const unit = mine.board.find((u) => u.uid === m.uid);
      return unit ? t('ui.duel.pickAttack', { name: cardName(unit.card) }) : '';
    }
    return '';
  });

  onMount(() => {
    root?.focus({ preventScroll: true });
    banner = t('ui.duel.yourTurn');
    const id = setTimeout(() => (banner = null), 900);
    return () => clearTimeout(id);
  });
</script>

{#snippet manaRow(mana: number, max: number)}
  <span class="mana" aria-label={t('ui.duel.mana', { mana, max })}>
    {#each { length: max } as _, i (i)}<i class:full={i < mana}></i>{/each}
  </span>
{/snippet}

<div
  use:portal
  use:modal
  bind:this={root}
  class="table"
  role="dialog"
  aria-modal="true"
  aria-label={title}
  tabindex="-1"
  onkeydown={(e) => {
    if (e.key === 'Escape' && mode.kind !== 'idle') {
      e.stopPropagation();
      mode = { kind: 'idle' };
    }
  }}
>
  <!-- opponent -->
  <header class="seat enemy">
    <button type="button" class="leave" onclick={onleave}>
      <Icon name="back" size={18} />{t('ui.duel.leave')}
    </button>
    <button
      type="button"
      class="hero"
      class:target={isOption({ side: 'enemy', hero: true })}
      data-hero="enemy"
      disabled={!isOption({ side: 'enemy', hero: true })}
      aria-label={t('ui.duel.enemyHero', { life: theirs.life })}
      onclick={() => pickTarget({ side: 'enemy', hero: true })}
    >
      <span class="portrait">
        {#if rival}<CardArt card={rival} />{/if}
      </span>
      <span class="life">{theirs.life}</span>
    </button>
    <div class="meta">
      <p class="who caps">{title}</p>
      {@render manaRow(theirs.mana, theirs.maxMana)}
      <p class="counts">
        <span class="backs" aria-label={t('ui.duel.hand', { count: theirs.hand.length })}>
          {#each theirs.hand as c (c.uid)}<i></i>{/each}
        </span>
        <span>{t('ui.duel.deck', { count: theirs.deck.length })}</span>
      </p>
    </div>
  </header>

  <section class="row enemy-row" aria-label={title}>
    {#each theirs.board as u (u.uid)}
      <button
        type="button"
        class="slot"
        data-uid={u.uid}
        disabled={!isOption({ side: 'enemy', uid: u.uid })}
        aria-label={unitLabel(u)}
        onclick={() => pickTarget({ side: 'enemy', uid: u.uid })}
      >
        <DuelCard unit={u} glow={isOption({ side: 'enemy', uid: u.uid }) ? 'target' : null} />
      </button>
    {/each}
  </section>

  <div class="midline">
    <span class="ornament"><Ornament pantheon={rival?.pantheon ?? 'greek'} height={10} /></span>
    <p class="hint" aria-live="polite">{hint}</p>
    {#if mode.kind !== 'idle'}
      <button type="button" class="ghost" onclick={() => (mode = { kind: 'idle' })}>
        {t('ui.duel.cancel')}
      </button>
    {/if}
    <button
      type="button"
      class="end"
      disabled={!myTurn}
      onclick={() => void perform({ type: 'end' })}
    >
      {view.active === 'player' ? t('ui.duel.endTurn') : t('ui.duel.theirTurn')}
    </button>
  </div>

  <section class="row player-row" aria-label={t('ui.duel.you')}>
    {#each mine.board as u (u.uid)}
      {@const option = isOption({ side: 'player', uid: u.uid })}
      {@const ready = myTurn && mode.kind === 'idle' && u.attacks > 0}
      <button
        type="button"
        class="slot"
        class:arrive={true}
        data-uid={u.uid}
        disabled={!option && !ready}
        aria-label={unitLabel(u)}
        onclick={() => pickTarget({ side: 'player', uid: u.uid })}
      >
        <DuelCard unit={u} glow={option ? 'target' : ready ? 'ready' : null} />
      </button>
    {/each}
    {#each { length: Math.max(0, BOARD_LIMIT - mine.board.length) } as _, i (i)}
      <span class="empty" aria-hidden="true"></span>
    {/each}
  </section>

  <!-- you -->
  <footer class="seat player">
    <button
      type="button"
      class="hero"
      class:target={isOption({ side: 'player', hero: true })}
      data-hero="player"
      disabled={!isOption({ side: 'player', hero: true })}
      aria-label={t('ui.duel.ownHero', { life: mine.life })}
      onclick={() => pickTarget({ side: 'player', hero: true })}
    >
      <span class="portrait crest"><Icon name="shield" size={40} /></span>
      <span class="life">{mine.life}</span>
    </button>
    <div class="meta">
      {@render manaRow(mine.mana, mine.maxMana)}
      <p class="counts"><span>{t('ui.duel.deck', { count: mine.deck.length })}</span></p>
    </div>
    <ul class="hand" style:--n={mine.hand.length}>
      {#each mine.hand as c, i (c.uid)}
        <li style:--i={i - (mine.hand.length - 1) / 2}>
          <button
            type="button"
            class="hand-slot"
            class:selected={mode.kind === 'target' && mode.uid === c.uid}
            aria-disabled={!canPlay.has(c.uid)}
            aria-label={handLabel(c)}
            onclick={() => pickHand(c)}
          >
            <DuelCard
              entry={c.entry}
              cost={c.cost}
              glow={canPlay.has(c.uid) && mode.kind === 'idle' ? 'play' : null}
            />
          </button>
        </li>
      {/each}
    </ul>
  </footer>

  {#if reveal}
    <div class="reveal" aria-hidden="true"><DuelCard entry={reveal} /></div>
  {/if}
  {#if banner}
    <p class="turn-banner caps" aria-hidden="true">{banner}</p>
  {/if}
  <div class="fx" bind:this={fx} aria-hidden="true"></div>
  <p class="visually-hidden" aria-live="polite">{announce}</p>
</div>

<style>
  .table {
    position: fixed;
    inset: 0;
    z-index: var(--z-ceremony);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto minmax(0, 1fr) auto;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-2);
    padding: var(--space-3) var(--gutter) 0;
    background:
      radial-gradient(ellipse at 50% 50%, rgb(43 63 134 / 0.35), transparent 65%),
      radial-gradient(ellipse at 50% 120%, rgb(122 82 102 / 0.35), transparent 50%), var(--ink);
    overflow: clip;
    animation: open var(--dur-sheet) var(--ease-out) both;
  }
  .table:focus {
    outline: none;
  }
  @keyframes open {
    from {
      opacity: 0;
    }
  }
  .seat {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
  .seat.enemy {
    justify-content: center;
    position: relative;
  }
  .leave {
    position: absolute;
    left: 0;
    top: 0;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 40px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.8);
    color: var(--parchment-dim);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .hero {
    position: relative;
    width: 84px;
    height: 84px;
    padding: 0;
    border: 0;
    background: none;
    cursor: default;
  }
  .hero.target {
    cursor: crosshair;
  }
  .portrait {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    overflow: hidden;
    box-shadow:
      inset 0 0 0 3px var(--gold),
      inset 0 0 0 6px rgb(4 6 13 / 0.6),
      var(--shadow-2);
  }
  .portrait.crest {
    display: grid;
    place-items: center;
    background: radial-gradient(circle at 50% 35%, #2b3f86, #0b1128);
    color: var(--gold-pale);
  }
  .hero.target .portrait {
    box-shadow:
      inset 0 0 0 3px var(--danger),
      0 0 0 4px rgb(232 149 122 / 0.6),
      var(--shadow-3);
  }
  .life {
    position: absolute;
    right: -6px;
    bottom: -6px;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 30%, #f6c8a8, #c4523a 60%, #6e241a);
    border: 2px solid var(--gold-pale);
    color: var(--parchment);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-variant-numeric: lining-nums;
    box-shadow: 0 3px 8px rgb(0 0 0 / 0.7);
  }
  .meta {
    display: grid;
    gap: var(--space-1);
  }
  .who {
    color: var(--gold-pale);
    letter-spacing: 0.08em;
  }
  .mana {
    display: flex;
    gap: 4px;
  }
  .mana i {
    width: 14px;
    height: 14px;
    rotate: 45deg;
    border: 1.5px solid #6f8fe0;
    border-radius: 2px;
  }
  .mana i.full {
    background: radial-gradient(circle at 40% 30%, #b9ccff, #4a6ad0);
  }
  .counts {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-variant-numeric: lining-nums;
  }
  .backs {
    display: flex;
  }
  .backs i {
    width: 16px;
    height: 22px;
    margin-inline-end: -6px;
    border-radius: 3px;
    border: 1px solid var(--gold);
    background: linear-gradient(135deg, #1d2c63, #0b1128);
  }
  .row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-3);
    min-height: 0;
  }
  .slot {
    width: clamp(4.5rem, 9vw, 7.5rem);
    padding: 0;
    border: 0;
    background: none;
    cursor: default;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .slot:not(:disabled) {
    cursor: pointer;
  }
  .slot:not(:disabled):active {
    transform: scale(0.96);
  }
  .player-row .slot {
    animation: land 520ms var(--ease-settle) both;
  }
  .enemy-row .slot {
    animation: land-down 520ms var(--ease-settle) both;
  }
  @keyframes land {
    from {
      opacity: 0;
      transform: translateY(40px) scale(1.2);
    }
  }
  @keyframes land-down {
    from {
      opacity: 0;
      transform: translateY(-40px) scale(1.2);
    }
  }
  .empty {
    width: clamp(4.5rem, 9vw, 7.5rem);
    aspect-ratio: 4 / 5;
    border: 1px dashed rgb(212 173 85 / 0.18);
    border-radius: 14px;
  }
  .midline {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    min-height: 52px;
  }
  .ornament {
    position: absolute;
    inset-inline: 8%;
    opacity: 0.4;
    pointer-events: none;
  }
  .hint {
    position: relative;
    padding: 0 var(--space-3);
    background: var(--ink);
    color: var(--gold-pale);
    font-style: italic;
  }
  .hint:empty {
    display: none;
  }
  .ghost {
    position: relative;
    min-height: 40px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: var(--ink);
    color: var(--parchment-dim);
    cursor: pointer;
  }
  .end {
    position: absolute;
    right: 0;
    min-height: 52px;
    padding: 0 var(--space-5);
    border: 1px solid var(--gold-pale);
    border-radius: 12px;
    background: linear-gradient(180deg, var(--gold-pale), var(--gold) 55%, #b98f3e);
    color: var(--ink);
    font-family: var(--font-caps);
    font-size: var(--text-lg);
    letter-spacing: 0.06em;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.5),
      var(--shadow-2);
    transition:
      transform var(--dur-press) var(--ease-out),
      filter var(--dur-quick) ease;
  }
  .end:active:not(:disabled) {
    transform: scale(0.96);
  }
  .end:disabled {
    background: linear-gradient(180deg, #2b3f86, #141f47);
    color: var(--parchment-dim);
    border-color: var(--rule-strong);
    cursor: default;
  }
  .seat.player {
    align-items: flex-end;
    padding-bottom: var(--space-2);
  }
  .hand {
    flex: 1;
    display: flex;
    justify-content: center;
    list-style: none;
    margin: 0;
    padding: 0;
    height: clamp(7rem, 16vh, 10.5rem);
  }
  .hand li {
    width: clamp(5.2rem, 8.5vw, 8rem);
    margin-inline: calc(clamp(5.2rem, 8.5vw, 8rem) * -0.12);
    transform-origin: 50% 160%;
    rotate: calc(var(--i) * 4deg);
    translate: 0 calc(var(--i) * var(--i) * 3px + 22%);
    transition:
      translate var(--dur-base) var(--ease-out),
      rotate var(--dur-base) var(--ease-out),
      scale var(--dur-base) var(--ease-out);
    animation: draw 520ms var(--ease-out) both;
  }
  @keyframes draw {
    from {
      opacity: 0;
      transform: translateX(40vw) rotate(20deg);
    }
  }
  .hand-slot {
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .hand-slot[aria-disabled='true'] {
    filter: brightness(0.6) saturate(0.6);
    cursor: not-allowed;
  }
  .hand li:has(.selected) {
    translate: 0 -30%;
    rotate: 0deg;
    scale: 1.2;
    z-index: 5;
  }
  @media (hover: hover) and (pointer: fine) {
    .hand li:hover {
      translate: 0 -28%;
      rotate: 0deg;
      scale: 1.25;
      z-index: 5;
    }
    .end:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  }
  .hand-slot:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 4px;
    border-radius: 8px;
  }
  .reveal {
    position: absolute;
    left: 50%;
    top: 45%;
    width: clamp(9rem, 16vw, 13rem);
    translate: -50% -50%;
    z-index: 20;
    animation: reveal 1000ms var(--ease-out) both;
  }
  @keyframes reveal {
    0% {
      opacity: 0;
      transform: translateY(-80px) scale(0.7);
    }
    25%,
    80% {
      opacity: 1;
      transform: none;
    }
    100% {
      opacity: 0;
      transform: scale(0.85);
    }
  }
  .turn-banner {
    position: absolute;
    left: 0;
    right: 0;
    top: 45%;
    translate: 0 -50%;
    z-index: 30;
    padding: var(--space-4) 0;
    text-align: center;
    font-size: var(--text-5xl);
    letter-spacing: 0.14em;
    color: var(--parchment);
    background: linear-gradient(
      90deg,
      transparent,
      rgb(7 10 20 / 0.9) 25%,
      rgb(7 10 20 / 0.9) 75%,
      transparent
    );
    text-shadow: 0 2px 14px rgb(0 0 0 / 0.8);
    pointer-events: none;
    animation: sweep 900ms var(--ease-out) both;
  }
  @keyframes sweep {
    0% {
      opacity: 0;
      clip-path: inset(0 50% 0 50%);
    }
    30%,
    75% {
      opacity: 1;
      clip-path: inset(0 0 0 0);
    }
    100% {
      opacity: 0;
    }
  }
  .fx {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 40;
  }
  .fx :global(.num) {
    position: absolute;
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-variant-numeric: lining-nums;
    text-shadow:
      0 2px 6px rgb(0 0 0 / 0.95),
      0 0 2px rgb(0 0 0 / 0.95);
    white-space: nowrap;
  }
  .fx :global(.num.hurt) {
    color: #ff9c7f;
  }
  .fx :global(.num.heal) {
    color: var(--success);
  }
  .fx :global(.num.buff) {
    color: var(--gold-pale);
    font-size: var(--text-xl);
  }
  @media (max-width: 640px) {
    .table {
      padding-inline: var(--space-2);
      gap: var(--space-1);
    }
    .seat.enemy {
      gap: var(--space-2);
    }
    .leave {
      position: static;
      order: -1;
      padding: 0 var(--space-2);
      font-size: 0;
      gap: 0;
    }
    .meta {
      min-width: 0;
    }
    .who {
      font-size: var(--text-sm);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mana i {
      width: 10px;
      height: 10px;
    }
    .midline {
      justify-content: flex-start;
      gap: var(--space-2);
    }
    .end {
      position: static;
      margin-inline-start: auto;
    }
    .hint {
      font-size: var(--text-sm);
    }
    .row {
      gap: var(--space-1);
    }
    .slot,
    .empty {
      width: calc((100vw - 2rem) / 5.4);
    }
    .hero {
      width: 60px;
      height: 60px;
    }
    .end {
      min-height: 44px;
      padding-inline: var(--space-3);
      font-size: var(--text-md);
    }
    .hand li {
      width: calc((100vw - 6.5rem) / 4.6);
      margin-inline: calc((100vw - 6.5rem) / 4.6 * -0.14);
    }
    .seat.player {
      gap: var(--space-2);
    }
    .seat.player .meta {
      display: none;
    }
    .turn-banner {
      font-size: var(--text-3xl);
    }
  }
  :global([data-motion='calm']) .table *,
  :global([data-motion='calm']) .hand li {
    animation-name: fade !important;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
