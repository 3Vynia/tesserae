<script lang="ts">
  import { CARDS, CARDS_BY_ID } from '../../data/cards';
  import {
    FRAMES_BY_ID,
    GLYPH_PRICE,
    GLYPHS,
    TINT_IDS,
    TINTS,
    type Glyph,
    type Tint,
  } from '../../data/cosmetics';
  import {
    buyFrame,
    buyGlyph,
    claimGift,
    ownsFrame,
    weekEnds,
    workshopRotation,
  } from '../../engine/vault';
  import { fmtNumber, t } from '../../i18n/i18n.svelte';
  import { game } from '../save.svelte';
  import { clock } from '../clock.svelte';
  import { cardName } from '../card-text';
  import CardView from '../../ui/card/Card.svelte';
  import LookLayer from '../../ui/card/LookLayer.svelte';
  import SceneTitle from '../../ui/game/SceneTitle.svelte';
  import Frame from '../../ui/game/Frame.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import Button from '../../ui/Button.svelte';

  const ready = $derived(game.status === 'ready');
  const rotation = $derived(workshopRotation(clock.now));
  const left = $derived.by(() => {
    const ms = Math.max(0, weekEnds(clock.now) - clock.now);
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return d > 0 ? t('ui.time.dh', { d, h }) : t('ui.time.hm', { h, m });
  });
  const ownedCards = $derived(ready ? CARDS.filter((c) => game.save.owned[c.id]) : []);
  let model = $state<string | null>(null);
  let mode = $state<'card' | 'frame'>('card');
  let picks = $state<Record<string, Tint>>({});
  let said = $state('');
  const card = $derived(
    CARDS_BY_ID.get(model ?? (ready ? game.save.profile.featured : null) ?? '') ?? ownedCards[0],
  );
  const dust = $derived(ready ? game.save.wallet.dust : 0);
  const giftTaken = $derived(ready && game.save.cosmetics.gifts.includes(rotation.id));
  const [giftFrame, giftTint] = $derived(rotation.gift.split('/') as [string, Tint]);

  const tintOf = (frame: string): Tint => picks[frame] ?? 'gold';
  const frameName = (id: string) => t(`ui.look.frames.${id}`);

  function take(): void {
    let got: string | null = null;
    game.update((s) => (got = claimGift(s, Date.now())));
    if (got) said = t('ui.workshop.giftTaken', { name: frameName(giftFrame) });
  }
  function buy(frame: string): void {
    const tint = tintOf(frame);
    let out: ReturnType<typeof buyFrame> | undefined;
    game.update((s) => (out = buyFrame(s, frame, tint, Date.now())));
    if (out && 'ok' in out)
      said = t('ui.workshop.bought', {
        name: t('ui.look.frameName', { frame: frameName(frame), tint: t(`ui.look.tints.${tint}`) }),
      });
  }
  function buySticker(glyph: Glyph): void {
    let out: ReturnType<typeof buyGlyph> | undefined;
    game.update((s) => (out = buyGlyph(s, glyph)));
    if (out && 'ok' in out)
      said = t('ui.workshop.boughtSticker', { name: t(`ui.look.glyphs.${glyph}`) });
  }
</script>

{#snippet preview(frame: string, tint: Tint)}
  <div class="preview" class:bare={mode === 'frame' || !card}>
    {#if mode === 'card' && card}
      <CardView {card} interactive={false} look={{ frame, tint }} />
    {:else}
      <div class="blank"><LookLayer look={{ frame, tint }} /></div>
    {/if}
  </div>
{/snippet}

<div class="workshop">
  <SceneTitle title={t('ui.workshop.heading')}>
    {t('ui.workshop.rotation', { time: left })}
  </SceneTitle>

  {#if ready}
    <div class="bench">
      <label class="model">
        <span>{t('ui.workshop.tryOn')}</span>
        <select
          value={card?.id}
          onchange={(e) => (model = e.currentTarget.value)}
          disabled={!ownedCards.length}
        >
          {#each ownedCards as c (c.id)}
            <option value={c.id}>{cardName(c)}</option>
          {/each}
        </select>
      </label>
      <div class="modes" role="group" aria-label={t('ui.workshop.previewLabel')}>
        <button type="button" aria-pressed={mode === 'card'} onclick={() => (mode = 'card')}>
          {t('ui.workshop.onCard')}
        </button>
        <button type="button" aria-pressed={mode === 'frame'} onclick={() => (mode = 'frame')}>
          {t('ui.workshop.frameOnly')}
        </button>
      </div>
      <p class="said" role="status">{said}</p>
    </div>

    <section class="gift" aria-labelledby="gift-h">
      <div class="gift-art">{@render preview(giftFrame, giftTint)}</div>
      <div class="gift-text">
        <p class="eyebrow caps">{t('ui.workshop.giftEyebrow')}</p>
        <h2 id="gift-h">
          {t('ui.look.frameName', {
            frame: frameName(giftFrame),
            tint: t(`ui.look.tints.${giftTint}`),
          })}
        </h2>
        <p>{t('ui.workshop.giftBody')}</p>
        <Button variant="gilt" icon="gift" disabled={giftTaken} onclick={take}>
          {giftTaken ? t('ui.workshop.giftTakenShort') : t('ui.workshop.takeGift')}
        </Button>
      </div>
    </section>

    <h2 class="row-h caps">{t('ui.workshop.frames')}</h2>
    <ul class="stalls">
      {#each rotation.frames as frame (frame)}
        {@const def = FRAMES_BY_ID.get(frame)}
        {@const tint = tintOf(frame)}
        {@const has = ownsFrame(game.save, frame, tint)}
        {#if def}
          <li>
            <Frame>
              <div class="stall">
                {@render preview(frame, tint)}
                <h3>{frameName(frame)}</h3>
                <p class="origin">
                  {def.pantheon
                    ? t('ui.workshop.from', { pantheon: t(`ui.pantheonInline.${def.pantheon}`) })
                    : t('ui.workshop.plain')}
                </p>
                <fieldset class="tints">
                  <legend class="visually-hidden">{t('ui.workshop.color')}</legend>
                  {#each TINT_IDS as id (id)}
                    <button
                      type="button"
                      class="tint"
                      class:owned={ownsFrame(game.save, frame, id)}
                      style:--c={TINTS[id]}
                      aria-pressed={tint === id}
                      aria-label={t(`ui.look.tints.${id}`) +
                        (ownsFrame(game.save, frame, id) ? `, ${t('ui.workshop.owned')}` : '')}
                      title={t(`ui.look.tints.${id}`)}
                      onclick={() => (picks = { ...picks, [frame]: id })}
                    ></button>
                  {/each}
                </fieldset>
                <p class="tint-name">{t(`ui.look.tints.${tint}`)}</p>
                <button
                  type="button"
                  class="buy"
                  disabled={has || dust < def.price}
                  onclick={() => buy(frame)}
                >
                  {#if has}
                    <Icon name="check" size={18} />{t('ui.workshop.owned')}
                  {:else}
                    <Icon name="dust" size={18} />{fmtNumber(def.price)}
                  {/if}
                </button>
              </div>
            </Frame>
          </li>
        {/if}
      {/each}
    </ul>

    <h2 class="row-h caps">{t('ui.workshop.stickers')}</h2>
    <ul class="glyphs">
      {#each Object.keys(GLYPHS) as Glyph[] as glyph (glyph)}
        {@const has = game.save.cosmetics.glyphs.includes(glyph)}
        <li>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={GLYPHS[glyph]} /></svg>
          <span>{t(`ui.look.glyphs.${glyph}`)}</span>
          <button
            type="button"
            class="buy small"
            disabled={has || dust < GLYPH_PRICE}
            onclick={() => buySticker(glyph)}
          >
            {#if has}<Icon name="check" size={16} />{t('ui.workshop.owned')}{:else}<Icon
                name="dust"
                size={16}
              />{fmtNumber(GLYPH_PRICE)}{/if}
          </button>
        </li>
      {/each}
    </ul>
    <p class="note">{t('ui.workshop.note')}</p>
  {/if}
</div>

<style>
  .workshop {
    display: grid;
    gap: var(--space-5);
    max-width: 76rem;
    margin-inline: auto;
    padding: 0 var(--gutter) var(--space-7);
  }
  .bench {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
  }
  .model {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.85);
    color: var(--gold);
  }
  select {
    min-height: 44px;
    border: 0;
    background: transparent;
    color: var(--parchment);
    font: inherit;
  }
  select option {
    background: var(--ink);
  }
  .modes {
    display: inline-flex;
    border: 1px solid var(--rule-strong);
    border-radius: 999px;
    overflow: hidden;
  }
  .modes button {
    min-height: 44px;
    padding: 0 var(--space-4);
    border: 0;
    background: rgb(7 10 20 / 0.85);
    color: var(--parchment-dim);
    font: inherit;
    cursor: pointer;
  }
  .modes button[aria-pressed='true'] {
    background: var(--gold);
    color: var(--ink);
  }
  .said {
    flex: 1;
    text-align: end;
    font-style: italic;
    color: var(--gold-pale);
  }
  .gift {
    display: grid;
    grid-template-columns: minmax(10rem, 14rem) 1fr;
    gap: var(--space-6);
    align-items: center;
    padding: var(--space-5) var(--space-6);
    border: 1px solid var(--gold);
    border-radius: 14px;
    background:
      radial-gradient(90% 120% at 0% 50%, rgb(212 173 85 / 0.22), transparent 60%),
      linear-gradient(180deg, rgb(16 28 62 / 0.95), rgb(7 10 20 / 0.95));
  }
  .gift-text {
    display: grid;
    gap: var(--space-2);
    justify-items: start;
    max-width: 44ch;
  }
  .eyebrow {
    font-size: var(--text-sm);
    color: var(--gold);
  }
  .gift h2 {
    font-size: var(--text-4xl);
    color: var(--gold-pale);
  }
  .row-h {
    font-size: var(--text-2xl);
    font-weight: 400;
    color: var(--gold);
    letter-spacing: 0.06em;
  }
  .stalls {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .stall {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    padding: var(--space-5) var(--space-4);
    text-align: center;
  }
  .preview {
    width: min(11rem, 100%);
  }
  .gift-art .preview {
    width: 100%;
  }
  .blank {
    position: relative;
    aspect-ratio: 5 / 7;
    border-radius: 3.5%;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 35%, rgb(43 63 134 / 0.5), transparent 60%), var(--ink);
    box-shadow: var(--shadow-3);
  }
  .stall h3 {
    margin-top: var(--space-2);
    font-size: var(--text-2xl);
    color: var(--parchment);
  }
  .origin,
  .tint-name {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .tints {
    display: grid;
    grid-template-columns: repeat(6, 28px);
    gap: 6px;
    justify-content: center;
    margin: var(--space-2) 0 0;
    padding: 0;
    border: 0;
  }
  .tint {
    position: relative;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 2px solid rgb(7 10 20 / 0.9);
    border-radius: 50%;
    background: var(--c);
    box-shadow: 0 0 0 1px var(--rule-strong);
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .tint:active {
    transform: scale(0.9);
  }
  .tint[aria-pressed='true'] {
    box-shadow: 0 0 0 2px var(--gold-pale);
  }
  .tint.owned::after {
    content: '';
    position: absolute;
    right: -3px;
    bottom: -3px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--gold-pale);
    box-shadow: 0 0 0 2px var(--ink);
  }
  .buy {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-width: 9rem;
    min-height: 44px;
    margin-top: var(--space-2);
    padding: 0 var(--space-4);
    border: 1px solid var(--gold-pale);
    border-radius: 10px;
    background: linear-gradient(180deg, var(--gold-pale), var(--gold) 55%, #b98f3e);
    color: var(--ink);
    font: inherit;
    font-variant-numeric: lining-nums;
    cursor: pointer;
    transition: transform var(--dur-press) var(--ease-out);
  }
  .buy:active:not(:disabled) {
    transform: scale(0.96);
  }
  .buy:disabled {
    border-color: var(--rule);
    background: transparent;
    color: var(--text-muted);
    cursor: not-allowed;
  }
  .buy.small {
    min-width: 0;
    margin: 0;
  }
  .glyphs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    gap: var(--space-3);
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .glyphs li {
    display: grid;
    justify-items: center;
    gap: var(--space-2);
    padding: var(--space-4);
    border: 1px solid var(--rule);
    border-radius: 10px;
    background: rgb(7 10 20 / 0.75);
    color: var(--parchment);
  }
  .glyphs svg {
    width: 44px;
    height: 44px;
    fill: none;
    stroke: var(--gold-pale);
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .note {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
  @media (max-width: 640px) {
    .gift {
      grid-template-columns: 1fr;
      justify-items: center;
      padding: var(--space-4);
    }
    .gift-art {
      width: 11rem;
    }
    .said {
      text-align: start;
    }
  }
</style>
