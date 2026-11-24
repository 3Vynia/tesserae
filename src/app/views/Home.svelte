<script lang="ts">
  import { t } from '../../i18n/i18n.svelte';
  import { PANTHEONS } from '../../data/pantheons';
  import Oculus from '../../ui/sky/Oculus.svelte';
  import Ornament from '../../ui/Ornament.svelte';
  import Icon from '../../ui/icons/Icon.svelte';
  import { reveal } from '../../ui/motion/reveal';
  import Button from '../../ui/Button.svelte';
  import { router } from '../router.svelte';

  const ways = [
    { id: 'collect', icon: 'collection' },
    { id: 'summon', icon: 'summon' },
    { id: 'battle', icon: 'battle' },
  ] as const;
</script>

<section class="portal">
  <Oculus />
  <div class="plate">
    <h1 class="title">{t('ui.app.title')}</h1>
    <p class="tagline">{t('ui.home.tagline')}</p>
    <p class="promise">{t('ui.home.promise')}</p>
    <div class="cta">
      <Button variant="gilt" icon="collection" href={router.href('collection')}>
        {t('ui.home.enter')}
      </Button>
    </div>
  </div>
</section>

<section class="atlas" aria-labelledby="atlas-heading">
  <div class="atlas-text">
    <h2 id="atlas-heading">{t('ui.home.atlas.heading', { count: PANTHEONS.length })}</h2>
    <p>{t('ui.home.atlas.body')}</p>
  </div>
  <ul class="bands" use:reveal>
    {#each PANTHEONS as pantheon, i (pantheon)}
      <li style:--i={i}>
        <span class="name caps">{t(`ui.pantheon.${pantheon}`)}</span>
        <span class="band"><Ornament {pantheon} height={16} /></span>
      </li>
    {/each}
  </ul>
</section>

<section class="ways" aria-labelledby="ways-heading">
  <h2 id="ways-heading">{t('ui.home.ways.heading')}</h2>
  <p class="soon">{t('ui.home.ways.soon')}</p>
  <ul>
    {#each ways as { id: way, icon } (way)}
      <li class="way {way}">
        <Icon name={icon} size={44} />
        <h3>{t(`ui.home.ways.${way}.title`)}</h3>
        <p>{t(`ui.home.ways.${way}.body`)}</p>
      </li>
    {/each}
  </ul>
</section>

<style>
  .portal {
    position: relative;
    display: grid;
    align-items: end;
    min-height: 100svh;
    padding: var(--space-9) var(--gutter) var(--space-8);
    isolation: isolate;
  }
  .portal :global(.oculus) {
    z-index: -1;
  }
  .plate {
    max-width: 44rem;
    display: grid;
    gap: var(--space-4);
  }
  .title {
    font-family: var(--font-caps);
    font-size: clamp(3.25rem, 1rem + 10vw, 8rem);
    letter-spacing: 0.14em;
    line-height: 0.95;
    color: var(--parchment);
    text-shadow: 0 2px 24px rgb(7 10 20 / 0.6);
    margin-inline-start: -0.05em;
    animation: rise var(--dur-ceremony) var(--ease-out) 350ms both;
  }
  .tagline {
    font-size: var(--text-2xl);
    font-style: italic;
    line-height: var(--leading-snug);
    color: var(--gold-pale);
    max-width: 36ch;
    animation: rise var(--dur-ceremony) var(--ease-out) 550ms both;
  }
  .promise {
    color: var(--parchment-dim);
    max-width: 46ch;
    animation: rise var(--dur-ceremony) var(--ease-out) 700ms both;
  }
  .cta {
    margin-top: var(--space-3);
    animation: rise var(--dur-ceremony) var(--ease-out) 850ms both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
      filter: blur(3px);
    }
  }

  .atlas {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: var(--space-7) var(--space-8);
    padding: var(--space-9) var(--gutter);
  }
  .atlas-text {
    display: grid;
    gap: var(--space-4);
    align-content: start;
    position: sticky;
    top: var(--space-9);
  }
  .atlas h2 {
    font-size: var(--text-5xl);
  }
  .bands {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--rule);
  }
  .bands li {
    display: grid;
    grid-template-columns: 10.5rem 1fr;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) 0;
    border-bottom: 1px solid var(--rule);
  }
  .name {
    font-size: var(--text-xl);
    color: var(--parchment);
  }
  .band {
    display: block;
    clip-path: inset(0 100% 0 0);
  }
  :global(.bands[data-revealed]) .band {
    clip-path: inset(0 0 0 0);
    transition: clip-path var(--dur-ceremony) var(--ease-in-out);
    transition-delay: calc(var(--i) * 45ms + (var(--i) * var(--i)) * 1ms);
  }

  .ways {
    padding: var(--space-8) var(--gutter) var(--space-9);
  }
  .ways h2 {
    font-size: var(--text-4xl);
  }
  .ways .soon {
    margin: var(--space-2) 0 var(--space-7);
    font-style: italic;
    color: var(--text-muted);
  }
  .ways ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    row-gap: var(--space-6);
  }
  .way {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--space-5);
    row-gap: var(--space-2);
    align-items: start;
    padding-top: var(--space-4);
    border-top: 1px solid var(--rule-strong);
    color: var(--gold);
  }
  .way :global(.icon) {
    grid-row: span 2;
  }
  .way.collect {
    grid-column: 1 / span 6;
  }
  .way.summon {
    grid-column: 4 / span 6;
  }
  .way.battle {
    grid-column: 7 / span 6;
  }
  .way h3 {
    font-size: var(--text-3xl);
  }
  .way p {
    color: var(--text);
  }

  @media (max-width: 860px) {
    .atlas {
      grid-template-columns: 1fr;
    }
    .atlas-text {
      position: static;
    }
    .way.collect,
    .way.summon,
    .way.battle {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 480px) {
    .bands li {
      grid-template-columns: 1fr;
      gap: var(--space-2);
    }
  }

  :global([data-motion='calm']) .title,
  :global([data-motion='calm']) .tagline,
  :global([data-motion='calm']) .promise,
  :global([data-motion='calm']) .cta {
    animation-name: fade-in;
  }
  :global([data-motion='calm']) .band {
    clip-path: none;
    opacity: 0;
  }
  :global([data-motion='calm']) :global(.bands[data-revealed]) .band {
    opacity: 1;
    transition: opacity var(--dur-base) ease;
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
</style>
