<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { t } from '../../i18n/i18n.svelte';
  import Icon from '../icons/Icon.svelte';

  // A framed modal sheet on a native <dialog>: focus trap and Escape come with it.
  let { title, onclose, children }: { title: string; onclose: () => void; children: Snippet } =
    $props();
  let dialog = $state<HTMLDialogElement>();
  const id = $props.id();

  onMount(() => {
    dialog?.showModal();
    return () => dialog?.close();
  });
</script>

<dialog
  bind:this={dialog}
  class="sheet"
  aria-labelledby="sheet-{id}"
  oncancel={(e) => {
    e.preventDefault();
    onclose();
  }}
>
  <header>
    <h2 id="sheet-{id}" class="caps">{title}</h2>
    <button type="button" class="close" onclick={onclose} aria-label={t('ui.detail.close')}>
      <Icon name="close" size={22} />
    </button>
  </header>
  <div class="body">{@render children()}</div>
</dialog>

<style>
  .sheet {
    width: min(34rem, 100vw - 2rem);
    max-height: min(80dvh, 44rem);
    padding: 0;
    border: 1px solid var(--rule-strong);
    border-radius: var(--radius-sheet);
    background: linear-gradient(180deg, #101c3e, #070a14);
    color: var(--text);
    box-shadow:
      inset 0 0 0 4px rgb(4 6 13 / 0.6),
      inset 0 0 0 5px rgb(212 173 85 / 0.2),
      var(--shadow-3);
    animation: rise var(--dur-sheet) var(--ease-sheet) both;
  }
  .sheet::backdrop {
    background: rgb(4 6 13 / 0.75);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(24px) scale(0.98);
    }
  }
  header {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--rule);
    background: #0e1834;
  }
  h2 {
    font-size: var(--text-2xl);
    letter-spacing: 0.08em;
  }
  .close {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 1px solid var(--rule);
    border-radius: 50%;
    background: transparent;
    color: var(--gold-pale);
    cursor: pointer;
  }
  .body {
    padding: var(--space-5);
    overflow: auto;
  }
  :global([data-motion='calm']) .sheet {
    animation-name: fade;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
