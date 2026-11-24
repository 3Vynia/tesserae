<script lang="ts">
  import { CARDS, CARDS_BY_ID } from '../../data/cards';
  import { fmtNumber, t } from '../../i18n/i18n.svelte';
  import { game } from '../save.svelte';
  import { clock, untilParts } from '../clock.svelte';
  import { cardName } from '../card-text';
  import {
    spin,
    WHEEL,
    WHEEL_COST,
    wheelChance,
    wheelReady,
    type Spin,
    type WheelPrize,
  } from '../../engine/rewards';
  import { motion } from '../../ui/motion/motion.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import type { IconName } from '../../ui/icons/paths';
  import SceneTitle from '../../ui/game/SceneTitle.svelte';
  import Frame from '../../ui/game/Frame.svelte';
  import CardView from '../../ui/card/Card.svelte';

  const N = WHEEL.length;
  const SLICE = 360 / N;
  const R = 180;
  // Alternating stones of a mosaic floor, with gold for the rarest prize.
  const FILLS = ['#1d2c63', '#5a2a3c', '#14303a', '#3a2a5a'];

  const ready = $derived(game.status === 'ready');
  const turnState = $derived(ready ? wheelReady(game.save, clock.now) : { free: false, nextAt: 0 });
  const canPay = $derived(ready && game.save.starlight >= WHEEL_COST);
  const wait = $derived.by(() => {
    const { h, m, s } = untilParts(turnState.nextAt, clock.now);
    return h > 0 ? t('ui.time.hm', { h, m }) : t('ui.time.ms', { m, s });
  });

  let angle = $state(0);
  let spinning = $state(false);
  let result = $state<Spin | null>(null);
  let recent = $state<Spin[]>([]);
  let disc = $state<SVGGElement>();

  const iconOf = (p: WheelPrize): IconName =>
    p.kind === 'starlight'
      ? 'starlight'
      : p.kind === 'dust'
        ? 'dust'
        : p.kind === 'golden'
          ? 'golden'
          : 'collection';
  const prizeText = (p: WheelPrize) =>
    p.kind === 'card'
      ? t('ui.wheel.prize.card', { rarity: t(`ui.rarity.${p.rarity}`) })
      : t(`ui.wheel.prize.${p.kind}`, { amount: p.amount });
  const short = (p: WheelPrize) =>
    p.kind === 'card' ? t(`ui.rarity.${p.rarity}`) : fmtNumber(p.amount);

  // Slice i is centred at i * SLICE degrees clockwise from the pointer at the top.
  const point = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  };
  const slicePath = (i: number) => {
    const a = i * SLICE - SLICE / 2;
    return `M0 0 L${point(a, R)} A${R} ${R} 0 0 1 ${point(a + SLICE, R)} Z`;
  };

  async function turn(): Promise<void> {
    if (spinning) return;
    let out: ReturnType<typeof spin> | undefined;
    game.update((save) => (out = spin(save, CARDS, Date.now())));
    if (!out || 'error' in out) return;
    const won = out;
    result = null;
    spinning = true;
    // Land with the won slice under the pointer, after several full turns and a small jitter.
    const jitter = ((won.slice * 7919) % 100) / 100 - 0.5;
    const desired = (((-won.slice * SLICE - jitter * SLICE * 0.6) % 360) + 360) % 360;
    const from = angle;
    const to = from + 360 * 6 + ((((desired - from) % 360) + 360) % 360);
    if (motion.calm || !disc) {
      angle = to;
    } else {
      const anim = disc.animate(
        [{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }],
        { duration: 4200, easing: 'cubic-bezier(0.12, 0.7, 0.12, 1)', fill: 'forwards' },
      );
      await anim.finished.catch(() => {});
      angle = to;
      anim.cancel();
    }
    spinning = false;
    result = won;
    recent = [won, ...recent].slice(0, 6);
  }
</script>

<div class="fortuna">
  <SceneTitle title={t('ui.wheel.heading')}>{t('ui.wheel.subtitle')}</SceneTitle>

  <div class="layout">
    <div class="wheel-wrap">
      <svg class="wheel" viewBox="-200 -215 400 420" role="img" aria-label={t('ui.wheel.label')}>
        <defs>
          <radialGradient id="hub" cx="50%" cy="35%" r="70%">
            <stop offset="0" stop-color="#fdf1d2" />
            <stop offset="0.45" stop-color="#d4ad55" />
            <stop offset="1" stop-color="#6b5226" />
          </radialGradient>
          <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ecd496" />
            <stop offset="0.5" stop-color="#8a6f33" />
            <stop offset="1" stop-color="#ecd496" />
          </linearGradient>
        </defs>
        <circle r="196" fill="#070a14" stroke="url(#rim)" stroke-width="10" />
        <g bind:this={disc} class="disc" style:transform="rotate({angle}deg)">
          {#each WHEEL as slice, i (slice.id)}
            <path
              d={slicePath(i)}
              fill={slice.prize.kind === 'golden' ? '#8a6f33' : FILLS[i % FILLS.length]}
              stroke="#d4ad55"
              stroke-width="1.5"
              class:won={!spinning && result?.slice === i}
            />
          {/each}
          {#each WHEEL as slice, i (slice.id + 'label')}
            <g transform="rotate({i * SLICE})">
              <foreignObject x="-34" y="-168" width="68" height="96">
                <div class="slice-label" class:gold={slice.prize.kind === 'golden'}>
                  <Icon name={iconOf(slice.prize)} size={26} />
                  <span>{short(slice.prize)}</span>
                </div>
              </foreignObject>
            </g>
          {/each}
          {#each { length: N } as _, i (i)}
            <circle
              cx={point(i * SLICE + SLICE / 2, 188).split(' ')[0]}
              cy={point(i * SLICE + SLICE / 2, 188).split(' ')[1]}
              r="4"
              fill="#ecd496"
            />
          {/each}
        </g>
        <circle r="46" fill="url(#hub)" stroke="#070a14" stroke-width="3" />
        <circle r="36" fill="none" stroke="#070a14" stroke-width="1" opacity="0.5" />
        <text y="6" text-anchor="middle" class="hub-text">FORTVNA</text>
        <path class="pointer" d="M0 -176 L-16 -212 Q0 -204 16 -212 Z" />
      </svg>
    </div>

    <div class="side">
      <Frame>
        <div class="panel">
          {#if turnState.free}
            <p class="lead">{t('ui.wheel.freeReady')}</p>
          {:else}
            <p class="lead">{t('ui.wheel.freeIn', { time: wait })}</p>
          {/if}
          <button
            type="button"
            class="spin"
            disabled={!ready || spinning || (!turnState.free && !canPay)}
            onclick={turn}
          >
            <Icon name="wheel" size={24} />
            <span class="spin-label caps">{t('ui.wheel.spin')}</span>
            <span class="spin-cost">
              {#if turnState.free}
                {t('ui.wheel.free')}
              {:else}
                <Icon name="starlight" size={16} />{fmtNumber(WHEEL_COST)}
              {/if}
            </span>
          </button>

          <div class="result" role="status" aria-live="polite">
            {#if result}
              {@const card = result.card ? CARDS_BY_ID.get(result.card) : undefined}
              <p class="won">{t('ui.wheel.won', { prize: prizeText(result.prize) })}</p>
              {#if card}
                <div class="won-card"><CardView {card} interactive={false} /></div>
                <p class="note">
                  {result.isNew
                    ? t('ui.wheel.newCard', { name: cardName(card) })
                    : t('ui.wheel.copyCard', { name: cardName(card) })}
                </p>
              {/if}
            {/if}
          </div>
        </div>
      </Frame>

      <Frame>
        <div class="panel">
          <h2 class="caps">{t('ui.wheel.oddsHeading')}</h2>
          <table class="odds">
            <tbody>
              {#each WHEEL as slice (slice.id)}
                <tr>
                  <th scope="row">
                    <Icon name={iconOf(slice.prize)} size={18} />{prizeText(slice.prize)}
                  </th>
                  <td>{t('ui.summon.rates.value', { rate: wheelChance(slice.weight) })}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          <p class="note">{t('ui.wheel.oddsNote', { cost: WHEEL_COST })}</p>
        </div>
      </Frame>

      {#if recent.length > 1}
        <Frame>
          <div class="panel">
            <h2 class="caps">{t('ui.wheel.recent')}</h2>
            <ul class="recent">
              {#each recent as r, i (i)}
                <li><Icon name={iconOf(r.prize)} size={16} />{prizeText(r.prize)}</li>
              {/each}
            </ul>
          </div>
        </Frame>
      {/if}
    </div>
  </div>
</div>

<style>
  .fortuna {
    max-width: 82rem;
    margin-inline: auto;
    padding: 0 var(--gutter) var(--space-7);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 24rem);
    gap: var(--space-6);
    align-items: start;
  }
  .wheel-wrap {
    position: relative;
    display: grid;
    place-items: center;
    padding: var(--space-4);
  }
  .wheel-wrap::before {
    content: '';
    position: absolute;
    inset: 8%;
    border-radius: 50%;
    background: radial-gradient(circle, rgb(212 173 85 / 0.18), transparent 65%);
  }
  .wheel {
    position: relative;
    width: min(36rem, 100%);
    height: auto;
    overflow: visible;
  }
  .disc {
    transform-origin: 0 0;
  }
  .won {
    animation: glow 1.2s ease-in-out 2;
  }
  path.won {
    filter: brightness(1.6);
  }
  @keyframes glow {
    50% {
      filter: brightness(1.9);
    }
  }
  .slice-label {
    display: grid;
    justify-items: center;
    gap: 2px;
    color: var(--gold-pale);
    font-family: var(--font-display);
    font-size: 15px;
    line-height: 1.1;
    text-align: center;
    font-variant-numeric: lining-nums;
  }
  .slice-label.gold {
    color: #fff6dc;
  }
  .hub-text {
    font-family: var(--font-caps);
    font-size: 13px;
    letter-spacing: 0.12em;
    fill: #2a1d08;
  }
  .pointer {
    fill: var(--gold-pale);
    stroke: #070a14;
    stroke-width: 2;
    filter: drop-shadow(0 4px 4px rgb(0 0 0 / 0.6));
  }
  .side {
    display: grid;
    gap: var(--space-4);
  }
  .panel {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-5);
  }
  .lead {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    color: var(--parchment);
  }
  h2 {
    font-size: var(--text-lg);
    font-weight: 400;
    color: var(--gold);
    letter-spacing: 0.06em;
  }
  .spin {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-3);
    min-height: 64px;
    padding: 0 var(--space-5);
    border: 1px solid var(--gold-pale);
    border-radius: 12px;
    background: linear-gradient(180deg, var(--gold-pale), var(--gold) 55%, #b98f3e);
    color: var(--ink);
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.5),
      var(--shadow-2);
    transition:
      transform var(--dur-press) var(--ease-out),
      filter var(--dur-quick) ease;
  }
  .spin:active:not(:disabled) {
    transform: scale(0.97);
  }
  .spin:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .spin-label {
    font-size: var(--text-xl);
    text-align: start;
    white-space: nowrap;
  }
  .spin-cost {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-lg);
    font-variant-numeric: lining-nums;
  }
  @media (hover: hover) and (pointer: fine) {
    .spin:hover:not(:disabled) {
      filter: brightness(1.08);
    }
  }
  .result {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    min-height: 1.5em;
  }
  .result .won {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    color: var(--gold-pale);
    text-align: center;
    animation: none;
  }
  .won-card {
    width: 9rem;
    animation: rise 520ms var(--ease-settle) both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(16px) scale(0.9);
    }
  }
  .odds {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: lining-nums tabular-nums;
  }
  .odds th,
  .odds td {
    padding: var(--space-1) 0;
    border-bottom: 1px solid var(--rule);
    font-weight: 400;
    text-align: start;
  }
  .odds th {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .odds th :global(svg) {
    color: var(--gold);
  }
  .odds td {
    text-align: end;
  }
  .note {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .recent {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--parchment-dim);
  }
  .recent li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  @media (max-width: 900px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  :global([data-motion='calm']) .won-card {
    animation-name: fade;
  }
  :global([data-motion='calm']) .won {
    animation: none;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
