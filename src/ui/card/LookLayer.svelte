<script lang="ts">
  import { FRAMES_BY_ID, GLYPHS, TINTS, type Glyph, type Tint } from '../../data/cosmetics';
  import type { Pantheon } from '../../data/pantheons';
  import type { Look } from '../../engine/vault';
  import { ORNAMENTS } from '../ornaments';

  // What a card wears, drawn over its front: a frame band, a sticker and an effect.
  let { look }: { look: Look } = $props();
  const id = $props.id();

  const frame = $derived(look.frame ? FRAMES_BY_ID.get(look.frame) : undefined);
  const tint = $derived(TINTS[(look.tint ?? 'gold') as Tint] ?? TINTS.gold);
  const ornament = $derived(frame?.pantheon ? ORNAMENTS[frame.pantheon] : null);
  const sticker = $derived.by(() => {
    const s = look.sticker;
    if (!s) return null;
    if (s.startsWith('seal-')) {
      const p = s.slice(5) as Pantheon;
      return ORNAMENTS[p] ? { kind: 'seal' as const, d: ORNAMENTS[p] } : null;
    }
    const g = s.slice(6) as Glyph;
    return GLYPHS[g] ? { kind: 'glyph' as const, d: GLYPHS[g] } : null;
  });
</script>

{#if frame}
  <svg class="frame-art" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      {#if ornament}
        <pattern id="h-{id}" width="7" height="6" patternUnits="userSpaceOnUse">
          <path
            d={ornament}
            transform="translate(0 0.6) scale(0.35)"
            fill="none"
            stroke={tint}
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </pattern>
        <pattern
          id="v-{id}"
          width="7"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(90)"
        >
          <path
            d={ornament}
            transform="translate(0 0.6) scale(0.35)"
            fill="none"
            stroke={tint}
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </pattern>
      {/if}
    </defs>
    <!-- the band: ground, then the ornament or the plain frame's own marks -->
    <path d="M0 0H100V140H0Z M6 6V134H94V6Z" fill-rule="evenodd" fill="#070a14" opacity="0.92" />
    {#if ornament}
      <rect x="0" y="0" width="100" height="6" fill="url(#h-{id})" />
      <rect x="0" y="134" width="100" height="6" fill="url(#h-{id})" />
      <rect x="0" y="6" width="6" height="128" fill="url(#v-{id})" />
      <rect x="94" y="6" width="6" height="128" fill="url(#v-{id})" />
    {:else if frame.id === 'constellation'}
      {#each { length: 9 } as _, i (i)}
        <circle cx={6 + i * 11} cy="3" r={i % 3 === 0 ? 1.2 : 0.7} fill={tint} />
        <circle cx={6 + i * 11} cy="137" r={i % 3 === 1 ? 1.2 : 0.7} fill={tint} />
      {/each}
      {#each { length: 12 } as _, i (i)}
        <circle cx="3" cy={10 + i * 11} r={i % 4 === 0 ? 1.2 : 0.7} fill={tint} />
        <circle cx="97" cy={10 + i * 11} r={i % 4 === 2 ? 1.2 : 0.7} fill={tint} />
      {/each}
      <path
        d="M6 3L17 3 28 3 M61 137 72 137 M3 21L3 32 3 43 M97 76 97 87"
        stroke={tint}
        stroke-width="0.3"
        opacity="0.7"
      />
    {:else}
      <path
        d="M2 2H98V138H2Z M4.2 4.2H95.8V135.8H4.2Z"
        fill="none"
        stroke={tint}
        stroke-width="0.9"
      />
      {#each [{ cx: 3, cy: 3 }, { cx: 97, cy: 3 }, { cx: 3, cy: 137 }, { cx: 97, cy: 137 }] as { cx, cy }, i (i)}
        <path
          d="M{cx} {cy - 2.6}l0.8 1.8 1.8 0.8-1.8 0.8-0.8 1.8-0.8-1.8-1.8-0.8 1.8-0.8z"
          fill={tint}
        />
      {/each}
    {/if}
    <path
      d="M0.4 0.4H99.6V139.6H0.4Z M6 6H94V134H6Z"
      fill="none"
      stroke={tint}
      stroke-width="0.6"
    />
  </svg>
{/if}

{#if look.effect}
  <div class="effect {look.effect}" aria-hidden="true"></div>
{/if}

{#if sticker}
  <svg
    class="sticker"
    viewBox={sticker.kind === 'seal' ? '-4 -5 28 24' : '-3 -3 30 30'}
    aria-hidden="true"
    style:--tint={tint}
  >
    <circle
      cx={sticker.kind === 'seal' ? 10 : 12}
      cy={sticker.kind === 'seal' ? 7 : 12}
      r={sticker.kind === 'seal' ? 13 : 14.5}
    />
    <path d={sticker.d} />
  </svg>
{/if}

<style>
  .frame-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
  }
  .sticker {
    position: absolute;
    z-index: 3;
    top: 8%;
    right: 8%;
    width: 16%;
    aspect-ratio: 1;
    filter: drop-shadow(0 2px 2px rgb(0 0 0 / 0.7));
    pointer-events: none;
  }
  .sticker circle {
    fill: #070a14;
    stroke: var(--tint);
    stroke-width: 1.4;
  }
  .sticker path {
    fill: none;
    stroke: var(--tint);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .effect {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    mix-blend-mode: screen;
  }
  /* stardust: points of light that come and go */
  .stardust {
    background-image:
      radial-gradient(circle, #fff6dc 0 1px, transparent 1.6px),
      radial-gradient(circle, #ecd496 0 1px, transparent 1.4px),
      radial-gradient(circle, #fff 0 0.8px, transparent 1.2px);
    background-size:
      37px 41px,
      53px 47px,
      29px 31px;
    background-position:
      3px 7px,
      19px 23px,
      11px 2px;
    animation: twinkle 3.2s ease-in-out infinite;
  }
  @keyframes twinkle {
    50% {
      opacity: 0.35;
      background-position:
        5px 4px,
        17px 27px,
        13px 6px;
    }
  }
  /* aurora: a slow veil of green and violet light */
  .aurora {
    background: linear-gradient(
      115deg,
      transparent 20%,
      rgb(111 174 116 / 0.35) 38%,
      rgb(140 110 200 / 0.3) 52%,
      transparent 70%
    );
    background-size: 260% 100%;
    animation: veil 7s ease-in-out infinite alternate;
  }
  @keyframes veil {
    from {
      background-position: 100% 0;
    }
    to {
      background-position: 0 0;
    }
  }
  /* eclipse: the art darkens at the edges and a ring of fire turns behind it */
  .eclipse {
    mix-blend-mode: normal;
    background:
      radial-gradient(circle at 50% 38%, transparent 26%, rgb(4 6 13 / 0.55) 62%),
      conic-gradient(
        from 0deg at 50% 38%,
        transparent 0 20%,
        rgb(242 200 121 / 0.28) 25%,
        transparent 32% 70%,
        rgb(208 83 58 / 0.25) 76%,
        transparent 84%
      );
    animation: corona 12s linear infinite;
  }
  @keyframes corona {
    to {
      filter: hue-rotate(40deg);
    }
  }
  :global([data-motion='calm']) .effect {
    animation: none;
  }
</style>
