<script lang="ts">
  import { t } from '../../i18n/i18n.svelte';
  import { PANTHEONS } from '../../data/pantheons';
  import Meander from '../../ui/Meander.svelte';

  const pillars = ['collect', 'summon', 'battle'] as const;
</script>

<section class="hero">
  <h1>{t('ui.app.title')}</h1>
  <p class="tagline">{t('ui.app.tagline')}</p>
</section>

<Meander />

<section class="intro" aria-labelledby="home-heading">
  <h2 id="home-heading">{t('ui.home.heading')}</h2>
  <p>{t('ui.home.intro')}</p>
  <p class="count">{t('ui.home.pantheons', { count: PANTHEONS.length })}</p>
</section>

<ul class="pillars">
  {#each pillars as pillar (pillar)}
    <li class="pillar">
      <h3>{t(`ui.home.pillars.${pillar}.title`)}</h3>
      <p>{t(`ui.home.pillars.${pillar}.body`)}</p>
      <span class="tag">{t('ui.home.upcoming')}</span>
    </li>
  {/each}
</ul>

<style>
  .hero {
    text-align: center;
    padding: var(--space-12) 0 var(--space-8);
  }
  h1 {
    font-size: clamp(3rem, 11vw, 6.5rem);
    font-weight: 500;
    letter-spacing: 0.08em;
    background: linear-gradient(180deg, var(--gold-200), var(--gold-500));
    background-clip: text;
    color: transparent;
    margin: 0;
  }
  .tagline {
    font-size: 1.2rem;
    max-width: 34rem;
    margin: var(--space-4) auto 0;
    color: var(--parchment-200);
    font-style: italic;
  }
  .intro {
    max-width: 40rem;
    margin: var(--space-8) auto;
    text-align: center;
  }
  .count {
    color: var(--gold-300);
    font-family: var(--font-display);
    font-size: 1.2rem;
  }
  .pillars {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--space-12);
    display: grid;
    gap: var(--space-4);
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  }
  .pillar {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: var(--space-6);
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: linear-gradient(160deg, rgb(26 38 82 / 0.55), rgb(7 10 20 / 0.7));
  }
  .pillar p {
    margin: 0 0 var(--space-4);
    color: var(--text-muted);
  }
  .tag {
    margin-top: auto;
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--gold-400);
  }
</style>
