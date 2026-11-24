<script lang="ts">
  import { CARDS_BY_ID } from '../../data/cards';
  import { RITES_BY_ID, type Keyword } from '../../data/duel';
  import type { DeckEntry, Unit } from '../../engine/duel';
  import { t } from '../../i18n/i18n.svelte';
  import { cardName } from '../../app/card-text';
  import { effectText, entryName, keywordName } from '../../app/duel-text';
  import CardArt from '../card/CardArt.svelte';
  import Icon from '../icons/Icon.svelte';

  // One card on the duel table: a full card in the hand, or a figure token on the board.
  interface Props {
    entry?: DeckEntry;
    unit?: Unit;
    cost?: number;
    /** Highlight: can be played, can attack, or is a valid target. */
    glow?: 'play' | 'ready' | 'target' | null;
  }
  let { entry, unit, cost, glow = null }: Props = $props();

  const card = $derived(
    unit?.card ?? (entry?.kind === 'figure' ? CARDS_BY_ID.get(entry.id) : undefined),
  );
  const rite = $derived(entry?.kind === 'rite' ? RITES_BY_ID.get(entry.id) : undefined);
  const effect = $derived(card?.duel.play ?? rite?.effect);
  const keywords = $derived<Keyword[]>(unit?.keywords ?? card?.duel.keywords ?? []);
</script>

{#if unit && card}
  <div
    class="token rarity-{card.rarity}"
    class:guard={keywords.includes('guard')}
    class:ward={unit.ward}
    class:stunned={unit.stunned > 0}
    class:glow-ready={glow === 'ready'}
    class:glow-target={glow === 'target'}
  >
    <span class="art"><CardArt {card} /></span>
    <span class="name">{cardName(card)}</span>
    {#if keywords.length}
      <span class="keys">
        {#each keywords as k (k)}<i class="key {k}" title={keywordName(k)}>
            {keywordName(k)[0]}
          </i>{/each}
      </span>
    {/if}
    <span class="gem atk"><Icon name="battle" size={12} />{unit.attack}</span>
    <span class="gem hp" class:hurt={unit.health < unit.maxHealth}>{unit.health}</span>
  </div>
{:else if entry}
  <div
    class="hand-card"
    class:rite={!!rite}
    class:rarity-mortal={card?.rarity === 'mortal'}
    class:rarity-hero={card?.rarity === 'hero'}
    class:rarity-demigod={card?.rarity === 'demigod'}
    class:rarity-god={card?.rarity === 'god'}
    class:rarity-primordial={card?.rarity === 'primordial'}
    class:glow-play={glow === 'play'}
  >
    <span class="cost"><span>{cost ?? card?.duel.cost ?? rite?.cost}</span></span>
    <span class="pic">
      {#if card}<CardArt {card} />{:else}<span class="rite-art">
          <Icon name="scroll" size={44} />
        </span>{/if}
    </span>
    <span class="title">{entryName(entry)}</span>
    <span class="text">
      {#if keywords.length}<b>{keywords.map(keywordName).join(' · ')}</b>{/if}
      {#if effect}{effectText(effect)}{/if}
      {#if rite}<em>{t('ui.duel.rite')}</em>{/if}
    </span>
    {#if card}
      <span class="gem atk">
        <Icon name="battle" size={12} />{card.duel.attack +
          (entry.kind === 'figure' ? Math.floor((entry.level - 1) / 10) : 0)}
      </span>
      <span class="gem hp">
        {card.duel.health + (entry.kind === 'figure' ? Math.floor((entry.level - 1) / 10) : 0)}
      </span>
    {/if}
  </div>
{/if}

<style>
  .token,
  .hand-card {
    --accent: var(--rarity-mortal);
    container-type: inline-size;
    position: relative;
    display: block;
    width: 100%;
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

  /* board token */
  .token {
    aspect-ratio: 4 / 5;
  }
  .art {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    overflow: hidden;
    box-shadow:
      inset 0 0 0 3px var(--accent),
      var(--shadow-2);
  }
  .token .art :global(.art) {
    position: absolute;
  }
  .guard .art {
    border-radius: 14px 14px 40% 40% / 14px 14px 22% 22%;
    box-shadow:
      inset 0 0 0 5px #8d939e,
      inset 0 0 0 7px var(--accent),
      var(--shadow-2);
  }
  .ward::after {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 18px;
    border: 2px solid rgb(180 200 220 / 0.9);
    box-shadow: inset 0 0 18px rgb(180 200 220 / 0.5);
    pointer-events: none;
  }
  .stunned .art {
    filter: grayscale(1) brightness(0.65);
  }
  .glow-ready .art {
    box-shadow:
      inset 0 0 0 3px var(--gold-pale),
      0 0 0 3px rgb(236 212 150 / 0.55),
      var(--shadow-3);
  }
  .glow-target .art {
    box-shadow:
      inset 0 0 0 3px var(--danger),
      0 0 0 3px rgb(232 149 122 / 0.6),
      var(--shadow-3);
  }
  .name {
    position: absolute;
    inset-inline: 6%;
    bottom: 20%;
    font-family: var(--font-display);
    font-size: max(0.7rem, 12cqi);
    line-height: 1;
    color: var(--parchment);
    text-shadow: 0 1px 4px rgb(0 0 0 / 0.95);
    text-align: center;
  }
  .keys {
    position: absolute;
    top: 6%;
    inset-inline: 0;
    display: flex;
    justify-content: center;
    gap: 3px;
  }
  .key {
    display: grid;
    place-items: center;
    width: max(16px, 16cqi);
    height: max(16px, 16cqi);
    border-radius: 50%;
    background: rgb(7 10 20 / 0.85);
    border: 1px solid var(--gold);
    color: var(--gold-pale);
    font-family: var(--font-caps);
    font-style: normal;
    font-size: max(0.6rem, 9cqi);
  }
  .gem {
    position: absolute;
    bottom: -8%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
    min-width: max(24px, 30cqi);
    height: max(24px, 30cqi);
    padding-inline: 4px;
    border-radius: 50%;
    font-family: var(--font-display);
    font-size: max(0.85rem, 18cqi);
    font-variant-numeric: lining-nums;
    color: var(--ink);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.45),
      0 3px 8px rgb(0 0 0 / 0.7);
  }
  .gem :global(svg) {
    width: max(9px, 10cqi);
    height: max(9px, 10cqi);
  }
  .atk {
    left: -6%;
    background: radial-gradient(circle at 40% 30%, #f6c8a8, #e8957a 55%, #a35a40);
  }
  .hp {
    right: -6%;
    background: radial-gradient(circle at 40% 30%, #c9ecdb, #86c4a6 55%, #3f7d62);
  }
  .hp.hurt {
    color: #5a0f0f;
  }

  /* card in the hand */
  .hand-card {
    aspect-ratio: 5 / 7;
    border-radius: 7% / 5%;
    background: linear-gradient(180deg, #13214a, #070a14);
    box-shadow:
      inset 0 0 0 2px var(--accent),
      inset 0 0 0 5px rgb(4 6 13 / 0.6),
      var(--shadow-2);
    overflow: visible;
  }
  .hand-card.rite {
    --accent: var(--gold-deep);
    background: linear-gradient(180deg, #f1e6cc, #d9cba8);
    color: #23202e;
  }
  .glow-play {
    box-shadow:
      inset 0 0 0 2px var(--gold-pale),
      0 0 0 3px rgb(236 212 150 / 0.6),
      var(--shadow-3);
  }
  .pic {
    position: absolute;
    inset: 6% 7% 46%;
    border-radius: 4cqi;
    overflow: hidden;
  }
  .rite-art {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--gold-deep);
    background: radial-gradient(circle, rgb(255 255 255 / 0.6), transparent 70%);
  }
  .cost {
    position: absolute;
    top: -6%;
    left: -6%;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 30cqi;
    height: 30cqi;
    min-width: 26px;
    min-height: 26px;
    rotate: 45deg;
    border-radius: 6px;
    background: radial-gradient(circle at 40% 30%, #6f8fe0, #2b3f86 60%, #141f47);
    border: 1.5px solid var(--gold-pale);
    font-family: var(--font-display);
    font-size: max(0.85rem, 18cqi);
    color: var(--parchment);
    font-variant-numeric: lining-nums;
    box-shadow: 0 3px 8px rgb(0 0 0 / 0.6);
  }
  .cost > span {
    rotate: -45deg;
    line-height: 1;
  }
  .title {
    position: absolute;
    inset-inline: 6%;
    top: 55%;
    font-family: var(--font-display);
    font-size: max(0.75rem, 11cqi);
    line-height: 1;
    text-align: center;
  }
  .hand-card:not(.rite) .title {
    color: var(--parchment);
  }
  .text {
    position: absolute;
    inset-inline: 7%;
    top: 66%;
    bottom: 12%;
    overflow: hidden;
    font-size: max(0.6rem, 7.4cqi);
    line-height: 1.2;
    text-align: center;
    color: var(--parchment-dim);
  }
  .rite .text {
    color: #3d3546;
  }
  .text b {
    display: block;
    font-family: var(--font-caps);
    font-weight: 400;
    color: var(--gold-pale);
  }
  .text em {
    display: block;
    margin-top: 2px;
    font-family: var(--font-caps);
    font-style: normal;
    color: var(--gold-deep);
  }
  .hand-card .gem {
    bottom: -5%;
  }
</style>
