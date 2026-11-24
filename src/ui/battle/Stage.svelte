<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { BattleEvent, BattleResult, Unit } from '../../engine/battle';
  import { t } from '../../i18n/i18n.svelte';
  import { cardName, skillName } from '../../app/card-text';
  import { motion } from '../motion/motion.svelte';
  import { modal, portal } from '../portal';
  import CardArt from '../card/CardArt.svelte';
  import { ELEMENT_TINT } from '../card/art';
  import Rosette from './Rosette.svelte';
  import { POP_FRAMES, sleep } from './fx';
  import Icon from '../icons/Icon.svelte';
  import Ornament from '../Ornament.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    result: BattleResult;
    /** Rendered over the stage once the fight has played out. */
    outcome: Snippet;
  }
  let { result, outcome }: Props = $props();

  interface View {
    unit: Unit;
    hp: number;
    maxHp: number;
    shield: number;
    energy: number;
    stunned: boolean;
    burning: boolean;
    down: boolean;
  }

  const initialViews = () =>
    Object.fromEntries(
      result.initial.map((u) => [
        u.id,
        {
          unit: u,
          hp: u.hp,
          maxHp: u.maxHp,
          shield: 0,
          energy: 0,
          stunned: false,
          burning: false,
          down: false,
        },
      ]),
    ) as Record<string, View>;

  let views = $state<Record<string, View>>(initialViews());
  let round = $state(0);
  let order = $state<string[]>([]);
  let actor = $state<string | null>(null);
  let speed = $state(1);
  let finished = $state(false);
  let skipping = false;
  let announcement = $state('');
  let stage = $state<HTMLDivElement>();
  const tokens: Record<string, HTMLElement> = {};
  let fx = $state<HTMLDivElement>();
  let root = $state<HTMLDivElement>();
  let outcomeBox = $state<HTMLDivElement>();

  const side = (s: 'player' | 'enemy') =>
    Object.values(views)
      .filter((v) => v.unit.side === s)
      .sort((a, b) => a.unit.slot - b.unit.slot);
  const nameOf = (id: string) => (views[id] ? cardName(views[id].unit.card) : id);
  const wait = (ms: number) => (skipping ? Promise.resolve() : sleep(ms / speed));
  const animated = () => !skipping && !motion.calm;

  function animate(el: HTMLElement | undefined, frames: Keyframe[], ms: number, easing: string) {
    if (!el || !animated()) return Promise.resolve();
    return el.animate(frames, { duration: ms / speed, easing }).finished.catch(() => {});
  }

  // The effect layers below are empty in the template and filled imperatively: numbers and
  // blooms are short-lived, numerous and never read back, so they skip Svelte's bookkeeping.
  function floatNumber(id: string, text: string, kind: string, note?: string) {
    const token = tokens[id];
    if (!token || !fx || skipping) return;
    const box = token.getBoundingClientRect();
    const host = fx.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = `number ${kind}`;
    el.textContent = text;
    if (note) {
      const small = document.createElement('small');
      small.textContent = note;
      el.append(small);
    }
    el.style.left = `${box.left - host.left + box.width / 2}px`;
    el.style.top = `${box.top - host.top + box.height * 0.2}px`;
    // eslint-disable-next-line svelte/no-dom-manipulating
    fx.append(el);
    const calm = motion.calm;
    const pop = calm ? [{ opacity: 0 }, { opacity: 1 }] : POP_FRAMES;
    void el.animate(pop, { duration: 600 / speed, fill: 'forwards' });
    void el
      .animate(
        calm
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [
              { translate: '0 0', opacity: 1 },
              { translate: '0 -46px', opacity: 0 },
            ],
        {
          duration: 1100 / speed,
          delay: 250 / speed,
          easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          fill: 'forwards',
        },
      )
      .finished.finally(() => el.remove());
  }

  function bloom(id: string, ultimate: boolean) {
    const token = tokens[id];
    const v = views[actor ?? ''];
    if (!token || !fx || !v || skipping) return;
    const box = token.getBoundingClientRect();
    const host = fx.getBoundingClientRect();
    const holder = document.createElement('div');
    holder.className = 'bloom';
    holder.style.left = `${box.left - host.left + box.width / 2}px`;
    holder.style.top = `${box.top - host.top + box.height / 2}px`;
    holder.style.color = ELEMENT_TINT[v.unit.card.element];
    holder.style.width = holder.style.height = `${box.width * (ultimate ? 2.2 : 1.5)}px`;
    // Svelte renders the rosette markup into a template we clone; simpler than mounting.
    const source = document.querySelector<SVGElement>(`#rosette-${v.unit.card.pantheon}`);
    if (source) holder.append(source.cloneNode(true));
    // eslint-disable-next-line svelte/no-dom-manipulating
    fx.append(holder);
    const frames = motion.calm
      ? [{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0 }]
      : [
          { transform: 'translate(-50%, -50%) scale(0.5) rotate(-20deg)', opacity: 0 },
          { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1, offset: 0.35 },
          { transform: 'translate(-50%, -50%) scale(1.2) rotate(12deg)', opacity: 0 },
        ];
    void holder
      .animate(frames, {
        duration: (ultimate ? 900 : 650) / speed,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      })
      .finished.finally(() => holder.remove());
  }

  async function shake(strength: number) {
    if (!stage || !animated()) return;
    const k = strength;
    await stage
      .animate(
        [
          { translate: '0 0' },
          { translate: `${k}px ${-k / 2}px` },
          { translate: `${-k}px ${k / 2}px` },
          { translate: `${k / 2}px 0` },
          { translate: '0 0' },
        ],
        { duration: 220 / speed, easing: 'linear' },
      )
      .finished.catch(() => {});
  }

  async function step(e: BattleEvent): Promise<void> {
    switch (e.type) {
      case 'round':
        round = e.round;
        announcement = t('ui.battle.stage.log.round', { round: e.round });
        return wait(260);
      case 'turn':
        actor = e.actor;
        order = e.order.slice(e.order.indexOf(e.actor));
        return wait(140);
      case 'skill': {
        const v = views[e.actor];
        if (!v) return;
        const enemyTargets = e.targets.some((id) => views[id]?.unit.side !== v.unit.side);
        if (e.kind !== 'basic') {
          const skill =
            e.kind === 'active'
              ? v.unit.card.skills.active
              : e.kind === 'ultimate'
                ? v.unit.card.skills.ultimate
                : v.unit.card.skills.passives.find((p) => p.id === e.skill);
          if (skill)
            announcement = t('ui.battle.stage.log.skill', {
              actor: cardName(v.unit.card),
              skill: skillName(v.unit.card, skill),
            });
          for (const id of e.targets) bloom(id, e.kind === 'ultimate');
          if (e.kind === 'ultimate') void shake(5);
        } else {
          announcement = t('ui.battle.stage.log.basic', {
            actor: cardName(v.unit.card),
            target: nameOf(e.targets[0] ?? ''),
          });
        }
        if (enemyTargets && e.kind !== 'passive') {
          const dir = v.unit.side === 'player' ? -1 : 1;
          await animate(
            tokens[e.actor],
            [
              { transform: 'translateY(0) scale(1)' },
              { transform: `translateY(${dir * 30}px) scale(1.06)`, offset: 0.4 },
              { transform: 'translateY(0) scale(1)' },
            ],
            420,
            'cubic-bezier(0.77, 0, 0.175, 1)',
          );
        } else {
          await wait(e.kind === 'passive' ? 280 : 420);
        }
        return;
      }
      case 'damage': {
        const v = views[e.target];
        if (!v) return;
        v.hp = e.hp;
        v.shield = e.shield;
        const kind = e.crit ? 'crit' : (e.advantage ?? 'damage');
        const note =
          kind === 'crit'
            ? t('ui.battle.stage.crit')
            : kind === 'strong'
              ? t('ui.battle.stage.strong')
              : kind === 'weak'
                ? t('ui.battle.stage.weak')
                : undefined;
        floatNumber(e.target, `${e.amount}`, kind, note);
        void animate(
          tokens[e.target],
          [
            { translate: '0 0' },
            { translate: '5px 0' },
            { translate: '-4px 0' },
            { translate: '0 0' },
          ],
          200,
          'linear',
        );
        if (e.crit) void shake(4);
        return wait(170);
      }
      case 'heal': {
        const v = views[e.target];
        if (v) v.hp = e.hp;
        floatNumber(e.target, `+${e.amount}`, 'heal');
        return wait(120);
      }
      case 'shield': {
        const v = views[e.target];
        if (v) v.shield += e.amount;
        return wait(80);
      }
      case 'modify': {
        const v = views[e.target];
        if (v && e.stat === 'health') {
          const extra = Math.round(v.maxHp * e.amount);
          v.maxHp += extra;
          v.hp += Math.max(0, extra);
        }
        floatNumber(
          e.target,
          `${e.amount > 0 ? '+' : '−'} ${t(`ui.stat.${e.stat}`)}`,
          e.amount > 0 ? 'buff' : 'debuff',
        );
        return wait(80);
      }
      case 'stun': {
        const v = views[e.target];
        if (v) v.stunned = true;
        return wait(120);
      }
      case 'skip': {
        const v = views[e.actor];
        if (v) v.stunned = false;
        return wait(200);
      }
      case 'burn': {
        const v = views[e.target];
        if (v) {
          v.hp = e.hp;
          v.burning = true;
        }
        floatNumber(e.target, `${e.amount}`, 'burn');
        return wait(200);
      }
      case 'energy': {
        const v = views[e.target];
        if (v) v.energy = e.energy;
        return;
      }
      case 'defeat': {
        const v = views[e.target];
        if (v) v.down = true;
        announcement = t('ui.battle.stage.log.defeat', { target: nameOf(e.target) });
        return wait(380);
      }
      case 'end':
        actor = null;
        return;
    }
  }

  async function play(): Promise<void> {
    await tick();
    await wait(500);
    for (const e of result.events) await step(e);
    finished = true;
    await tick();
    outcomeBox?.querySelector<HTMLElement>('button, a')?.focus();
  }

  function skip(): void {
    skipping = true;
  }

  onMount(() => {
    root?.focus();
    void play();
  });
</script>

<!-- Rosette templates cloned by the bloom effect. -->
<div class="templates" aria-hidden="true">
  {#each [...new Set(result.initial.map((u) => u.card.pantheon))] as p (p)}
    <div id="rosette-{p}"><Rosette pantheon={p} /></div>
  {/each}
</div>

<div
  use:portal
  use:modal
  class="battle"
  role="dialog"
  aria-modal="true"
  aria-label={t('ui.battle.stage.label')}
  tabindex="-1"
  bind:this={root}
>
  <div class="stage" bind:this={stage}>
    <header class="top">
      <p class="round caps">{t('ui.battle.stage.round', { round: Math.max(1, round) })}</p>
      <ol class="ribbon" aria-label={t('ui.battle.stage.order')}>
        {#each order as id, i (id)}
          {@const v = views[id]}
          {#if v}
            <li class="chip {v.unit.side}" class:now={i === 0}>
              <span class="mini"><CardArt card={v.unit.card} /></span>
              <span class="visually-hidden">{cardName(v.unit.card)}</span>
            </li>
          {/if}
        {/each}
      </ol>
      <div class="controls">
        <button type="button" class="ctl" onclick={() => (speed = speed === 4 ? 1 : speed * 2)}>
          {t('ui.battle.stage.speed', { speed })}
        </button>
        {#if !finished}
          <button type="button" class="ctl" onclick={skip}>{t('ui.battle.stage.skip')}</button>
        {/if}
      </div>
    </header>

    {#each ['enemy', 'player'] as const as s (s)}
      {#if s === 'player'}
        <div class="field" aria-hidden="true">
          <Ornament pantheon={result.initial[0]?.card.pantheon ?? 'greek'} height={10} />
        </div>
      {/if}
      <div class="side {s}">
        {#each side(s) as v (v.unit.id)}
          <div
            class="unit rarity-{v.unit.card.rarity}"
            class:back={v.unit.slot > 2}
            class:acting={actor === v.unit.id}
            class:down={v.down}
            bind:this={tokens[v.unit.id]}
          >
            <span class="art" class:warded={v.shield > 0}><CardArt card={v.unit.card} /></span>
            <span class="name">{cardName(v.unit.card)}</span>
            <span class="bars">
              <span
                class="hp"
                role="meter"
                aria-valuemin="0"
                aria-valuemax={v.maxHp}
                aria-valuenow={v.hp}
                aria-label={t('ui.battle.stage.hp', { hp: v.hp, max: v.maxHp })}
              >
                <i style:transform="scaleX({Math.max(0, v.hp / v.maxHp)})"></i>
              </span>
              <span class="en" aria-hidden="true">
                <i
                  style:transform="scaleX({Math.min(
                    1,
                    v.energy / v.unit.card.skills.ultimate.energy,
                  )})"
                ></i>
              </span>
            </span>
            {#if v.stunned}<span class="status caps">{t('ui.battle.stage.stunned')}</span>{/if}
            {#if v.burning && !v.down}<span class="burning" aria-hidden="true">
                <Icon name="summon" size={16} />
              </span>{/if}
          </div>
        {/each}
      </div>
    {/each}
    <div class="fx" bind:this={fx} aria-hidden="true"></div>
    <p class="visually-hidden" aria-live="polite">{announcement}</p>
  </div>

  {#if finished}
    <div class="outcome" bind:this={outcomeBox}>{@render outcome()}</div>
  {/if}
</div>

<style>
  .templates {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }
  .battle:focus {
    outline: none;
  }
  .battle {
    position: fixed;
    inset: 0;
    z-index: var(--z-ceremony);
    display: grid;
    background:
      radial-gradient(ellipse at 50% 120%, rgb(43 63 134 / 0.45), transparent 60%),
      radial-gradient(ellipse at 50% -20%, rgb(122 82 102 / 0.35), transparent 55%), var(--ink);
    animation: in var(--dur-sheet) var(--ease-out) both;
  }
  @keyframes in {
    from {
      opacity: 0;
    }
  }
  .stage {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto 1fr;
    gap: var(--space-5);
    padding: var(--space-4) var(--gutter) var(--space-6);
    max-width: 72rem;
    width: 100%;
    margin-inline: auto;
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-5);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--rule);
  }
  .round {
    color: var(--gold);
    font-size: var(--text-lg);
    min-width: 6rem;
  }
  .ribbon {
    display: flex;
    gap: 6px;
    list-style: none;
    margin: 0;
    padding: 0;
    flex: 1;
    overflow: hidden;
  }
  .chip {
    position: relative;
    width: 34px;
    height: 34px;
    flex: none;
    border-radius: var(--radius-tile);
    overflow: hidden;
    box-shadow: inset 0 0 0 2px var(--lapis-bright);
    transition:
      transform var(--dur-base) var(--ease-out),
      opacity var(--dur-base) ease;
  }
  .chip.enemy {
    box-shadow: inset 0 0 0 2px var(--danger);
  }
  .chip.now {
    transform: scale(1.18);
    box-shadow: inset 0 0 0 2px var(--gold-pale);
  }
  .mini {
    position: absolute;
    inset: 0;
    opacity: 0.85;
  }
  .controls {
    display: flex;
    gap: var(--space-2);
  }
  .ctl {
    min-height: 44px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--gold-pale);
    font-family: var(--font-body);
    font-size: var(--text-md);
    cursor: pointer;
    font-variant-numeric: lining-nums;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .ctl:active {
    transform: scale(0.96);
  }
  .side {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: start;
    align-self: start;
    gap: var(--space-4);
  }
  .side.enemy {
    align-self: end;
    align-items: end;
  }
  .unit {
    --accent: var(--rarity-mortal);
    position: relative;
    display: grid;
    gap: var(--space-1);
    width: clamp(5rem, 13vw, 8.5rem);
    transition:
      opacity var(--dur-sheet) ease,
      filter var(--dur-sheet) ease;
  }
  .rarity-hero {
    --accent: var(--rarity-hero);
  }
  .rarity-demigod {
    --accent: var(--rarity-demigod);
  }
  .rarity-god {
    --accent: var(--rarity-god);
  }
  .rarity-primordial {
    --accent: var(--rarity-primordial);
  }
  .player .unit.back {
    translate: 0 18px;
    scale: 0.92;
  }
  .enemy .unit.back {
    translate: 0 -18px;
    scale: 0.92;
  }
  .art {
    position: relative;
    display: block;
    aspect-ratio: 1;
    border-radius: var(--radius-tile);
    overflow: hidden;
    box-shadow:
      inset 0 0 0 2px var(--accent),
      var(--shadow-2);
  }
  .acting .art {
    box-shadow:
      inset 0 0 0 2px var(--gold-pale),
      0 0 0 3px rgb(236 212 150 / 0.35),
      var(--shadow-3);
  }
  .down {
    opacity: 0.32;
    filter: grayscale(1);
  }
  .art.warded::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow:
      inset 0 0 0 3px rgb(180 200 220 / 0.9),
      inset 0 0 16px rgb(180 200 220 / 0.55);
    pointer-events: none;
  }
  .field {
    align-self: center;
    width: min(36rem, 80%);
    margin-inline: auto;
    opacity: 0.55;
  }
  .name {
    font-family: var(--font-display);
    font-size: clamp(0.8rem, 0.7rem + 0.4vw, 1rem);
    line-height: 1.1;
    color: var(--parchment);
  }
  .bars {
    display: grid;
    gap: 3px;
  }
  .hp,
  .en {
    display: block;
    height: 6px;
    background: rgb(4 6 13 / 0.8);
    border-radius: 3px;
    overflow: hidden;
  }
  .en {
    height: 3px;
  }
  .hp i,
  .en i {
    display: block;
    height: 100%;
    transform-origin: left;
    transition: transform 300ms var(--ease-out);
  }
  .hp i {
    background: var(--success);
  }
  .enemy .hp i {
    background: var(--danger);
  }
  .en i {
    background: var(--gold);
  }
  .status {
    font-size: var(--text-xs);
    color: var(--gold-pale);
  }
  .burning {
    position: absolute;
    top: 4px;
    right: 4px;
    color: var(--danger);
  }
  .fx {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .fx :global(.number) {
    position: absolute;
    font-family: var(--font-display);
    font-size: clamp(1.2rem, 1rem + 1vw, 1.9rem);
    font-variant-numeric: lining-nums;
    color: var(--danger);
    text-shadow:
      0 2px 6px rgb(0 0 0 / 0.9),
      0 0 2px rgb(0 0 0 / 0.9);
    white-space: nowrap;
  }
  .fx :global(.number small) {
    display: block;
    font-family: var(--font-caps);
    font-size: 0.5em;
    letter-spacing: var(--tracking-caps);
    text-align: center;
  }
  .fx :global(.number.crit) {
    color: var(--gold-pale);
    font-size: clamp(1.6rem, 1.2rem + 1.4vw, 2.6rem);
  }
  .fx :global(.number.strong) {
    color: #ffb59c;
  }
  .fx :global(.number.weak) {
    color: var(--vellum);
  }
  .fx :global(.number.heal),
  .fx :global(.number.buff) {
    color: var(--success);
  }
  .fx :global(.number.debuff),
  .fx :global(.number.burn) {
    color: #e7965c;
  }
  .fx :global(.bloom) {
    position: absolute;
    translate: none;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .outcome {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: var(--gutter);
    background: rgb(4 6 13 / 0.72);
    animation: in var(--dur-sheet) var(--ease-out) both;
  }
  @media (max-width: 600px) {
    .side {
      gap: var(--space-2);
    }
    .unit {
      width: calc((100vw - 2 * var(--gutter) - 4 * var(--space-2)) / 5);
    }
    .player .unit.back,
    .enemy .unit.back {
      translate: none;
    }
  }
</style>
