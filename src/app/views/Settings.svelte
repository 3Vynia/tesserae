<script lang="ts">
  import { i18n, localeName, t } from '../../i18n/i18n.svelte';
  import { motion, MOTION_MODES, type MotionMode } from '../../ui/motion/motion.svelte';
  import Segmented from '../../ui/Segmented.svelte';
  import Icon from '../../ui/icons/Icon.svelte';

  const motionOptions = $derived(
    MOTION_MODES.map((value) => ({
      value,
      label: t(`ui.settings.motion.${value}`),
      hint: t(`ui.settings.motion.${value}Hint`),
    })),
  );
</script>

<div class="settings">
  <h1>{t('ui.settings.heading')}</h1>

  <section class="row">
    <label class="caps label" for="locale">
      <Icon name="language" size={22} />{t('ui.settings.language')}
    </label>
    <div class="control">
      <span class="select">
        <select
          id="locale"
          value={i18n.locale}
          onchange={(e) => i18n.setLocale(e.currentTarget.value)}
          aria-describedby="locale-hint"
        >
          {#each i18n.locales as locale (locale)}
            <option value={locale} lang={locale}>{localeName(locale)}</option>
          {/each}
        </select>
        <Icon name="chevron" size={18} />
      </span>
      <p id="locale-hint" class="hint">{t('ui.settings.languageHint')}</p>
    </div>
  </section>

  <section class="row">
    <span class="caps label" aria-hidden="true">
      <Icon name="motion" size={22} />{t('ui.settings.motion.legend')}
    </span>
    <div class="control">
      <Segmented
        name="motion"
        legend={t('ui.settings.motion.legend')}
        options={motionOptions}
        value={motion.mode}
        onchange={(v: MotionMode) => motion.setMode(v)}
        hideLegend
      />
    </div>
  </section>

  <section class="row" aria-labelledby="privacy-heading">
    <h2 id="privacy-heading" class="caps label">
      <Icon name="shield" size={22} />{t('ui.settings.privacy.heading')}
    </h2>
    <div class="control">
      <p>{t('ui.settings.privacy.body')}</p>
    </div>
  </section>
</div>

<style>
  .settings {
    max-width: 62rem;
    padding: var(--space-8) var(--gutter) var(--space-9);
  }
  h1 {
    font-size: var(--text-5xl);
    margin-bottom: var(--space-7);
  }
  .row {
    display: grid;
    grid-template-columns: 13rem minmax(0, 1fr);
    gap: var(--space-3) var(--space-6);
    padding: var(--space-5) 0;
    border-top: 1px solid var(--rule);
  }
  .label {
    display: inline-flex;
    align-items: center;
    align-self: start;
    gap: var(--space-3);
    min-height: 44px;
    font-size: var(--text-xl);
    font-weight: 400;
    color: var(--gold-pale);
    margin: 0;
  }
  .control {
    display: grid;
    gap: var(--space-2);
  }
  .select {
    position: relative;
    display: inline-flex;
    align-items: center;
    max-width: 20rem;
    color: var(--gold);
  }
  .select :global(.icon) {
    position: absolute;
    right: var(--space-3);
    pointer-events: none;
  }
  select {
    appearance: none;
    width: 100%;
    min-height: 44px;
    padding: 0 var(--space-7) 0 var(--space-4);
    background: var(--vault);
    color: var(--parchment);
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-control);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    cursor: pointer;
    transition: border-color var(--dur-quick) ease;
  }
  @media (hover: hover) and (pointer: fine) {
    select:hover {
      border-color: var(--gold);
    }
  }
  .hint {
    color: var(--text-muted);
    font-size: var(--text-md);
  }
  @media (max-width: 680px) {
    .row {
      grid-template-columns: 1fr;
    }
  }
</style>
