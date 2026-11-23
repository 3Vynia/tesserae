<script lang="ts">
  import { i18n, localeName, t } from '../../i18n/i18n.svelte';
</script>

<section class="settings" aria-labelledby="settings-heading">
  <h1 id="settings-heading">{t('ui.settings.heading')}</h1>

  <div class="field">
    <label for="locale">{t('ui.settings.language')}</label>
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
    <p id="locale-hint" class="hint">{t('ui.settings.languageHint')}</p>
  </div>

  <p class="privacy">{t('ui.settings.privacy')}</p>
</section>

<style>
  .settings {
    max-width: 36rem;
    margin: var(--space-8) auto;
  }
  .field {
    display: grid;
    gap: var(--space-2);
    margin-bottom: var(--space-6);
  }
  label {
    font-family: var(--font-display);
    font-size: 1.25rem;
    color: var(--parchment-100);
  }
  select {
    max-width: 20rem;
    padding: var(--space-2) var(--space-3);
    min-height: 44px;
    background: var(--night-800);
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
  }
  .hint,
  .privacy {
    color: var(--text-muted);
    margin: 0;
  }
</style>
