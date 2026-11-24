<script lang="ts">
  import { CARDS_BY_ID } from '../../data/cards';
  import { EFFECTS, GLYPHS, TINTS, type Glyph, type Tint } from '../../data/cosmetics';
  import type { Pantheon } from '../../data/pantheons';
  import type { OwnedCard } from '../../engine/save';
  import { setLook, stickersFor, type Look } from '../../engine/vault';
  import { t } from '../../i18n/i18n.svelte';
  import { game } from '../../app/save.svelte';
  import { router } from '../../app/router.svelte';
  import { ORNAMENTS } from '../ornaments';
  import Icon from '../icons/Icon.svelte';

  // Dress a card with what the vault owns. Every change shows on the card at once.
  let { cardId, owned }: { cardId: string; owned: OwnedCard } = $props();

  const frames = $derived(game.save.cosmetics.frames);
  const stickers = $derived(stickersFor(game.save, CARDS_BY_ID));
  const look = $derived(owned.look);

  function apply(patch: Partial<Look>): void {
    game.update((s) => setLook(s, cardId, { ...owned.look, ...patch }, CARDS_BY_ID));
  }
  const frameLabel = (key: string) => {
    const [frame, tint] = key.split('/') as [string, string];
    return t('ui.look.frameName', {
      frame: t(`ui.look.frames.${frame}`),
      tint: t(`ui.look.tints.${tint}`),
    });
  };
  const stickerLabel = (key: string) =>
    key.startsWith('seal-')
      ? t('ui.look.seal', { pantheon: t(`ui.pantheonInline.${key.slice(5)}`) })
      : t(`ui.look.glyphs.${key.slice(6)}`);
  const stickerPath = (key: string) =>
    key.startsWith('seal-')
      ? (ORNAMENTS[key.slice(5) as Pantheon] ?? '')
      : (GLYPHS[key.slice(6) as Glyph] ?? '');
</script>

<div class="editor">
  <fieldset>
    <legend class="caps">{t('ui.look.frame')}</legend>
    <div class="swatches">
      <button
        type="button"
        class="swatch none"
        aria-pressed={!look.frame}
        onclick={() => apply({ frame: undefined, tint: undefined })}
      >
        {t('ui.look.none')}
      </button>
      {#each frames as key (key)}
        {@const [frame, tint] = key.split('/') as [string, string]}
        <button
          type="button"
          class="swatch"
          aria-pressed={look.frame === frame && look.tint === tint}
          style:--tint={TINTS[tint as Tint]}
          onclick={() => apply({ frame, tint })}
        >
          <span class="dot" aria-hidden="true"></span>{frameLabel(key)}
        </button>
      {/each}
    </div>
    {#if frames.length === 0}
      <p class="note">{t('ui.look.noFrames')}</p>
    {/if}
    <a class="more" href={router.href('workshop')}>
      <Icon name="workshop" size={18} />{t('ui.look.toWorkshop')}
    </a>
  </fieldset>

  <fieldset>
    <legend class="caps">{t('ui.look.sticker')}</legend>
    <div class="stickers">
      <button
        type="button"
        class="sticker none"
        aria-pressed={!look.sticker}
        onclick={() => apply({ sticker: undefined })}
      >
        {t('ui.look.none')}
      </button>
      {#each stickers as key (key)}
        <button
          type="button"
          class="sticker"
          aria-pressed={look.sticker === key}
          aria-label={stickerLabel(key)}
          title={stickerLabel(key)}
          onclick={() => apply({ sticker: key })}
        >
          <svg viewBox={key.startsWith('seal-') ? '-2 -3 24 20' : '0 0 24 24'} aria-hidden="true">
            <path d={stickerPath(key)} />
          </svg>
        </button>
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend class="caps">{t('ui.look.effect')}</legend>
    <div class="swatches">
      <button
        type="button"
        class="swatch none"
        aria-pressed={!look.effect}
        onclick={() => apply({ effect: undefined })}
      >
        {t('ui.look.none')}
      </button>
      {#each EFFECTS as effect (effect.id)}
        {@const open = owned.count >= effect.copies}
        <button
          type="button"
          class="swatch"
          aria-pressed={look.effect === effect.id}
          disabled={!open}
          onclick={() => apply({ effect: effect.id })}
        >
          {#if !open}<Icon name="lock" size={14} />{/if}
          {t(`ui.look.effects.${effect.id}`)}
          {#if !open}
            <span class="need">{t('ui.look.needCopies', { count: effect.copies })}</span>
          {/if}
        </button>
      {/each}
    </div>
  </fieldset>
</div>

<style>
  .editor {
    display: grid;
    gap: var(--space-5);
  }
  fieldset {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    margin-bottom: var(--space-2);
    font-size: var(--text-lg);
    color: var(--gold);
  }
  .swatches,
  .stickers {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  .swatch,
  .sticker {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 40px;
    padding: 0 var(--space-3);
    border: 1px solid var(--rule);
    border-radius: 999px;
    background: rgb(7 10 20 / 0.85);
    color: var(--parchment-dim);
    font: inherit;
    font-size: var(--text-sm);
    cursor: pointer;
    transition:
      border-color var(--dur-quick) ease,
      transform var(--dur-press) var(--ease-out);
  }
  .swatch:active:not(:disabled),
  .sticker:active {
    transform: scale(0.96);
  }
  .swatch[aria-pressed='true'],
  .sticker[aria-pressed='true'] {
    border-color: var(--gold-pale);
    color: var(--gold-pale);
    box-shadow: inset 0 0 0 1px var(--gold-pale);
  }
  .swatch:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--tint);
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.4);
  }
  .need {
    color: var(--text-muted);
  }
  .sticker {
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: 50%;
  }
  .sticker.none {
    width: auto;
    padding: 0 var(--space-3);
    border-radius: 999px;
  }
  .sticker svg {
    width: 28px;
    height: 28px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .note {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
  .more {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    justify-self: start;
    min-height: 44px;
    color: var(--gold-pale);
  }
</style>
