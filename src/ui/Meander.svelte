<script lang="ts">
  // Greek key band used as a divider. Other pantheon ornaments arrive with the collection view.
  let { id = 'meander' }: { id?: string } = $props();
</script>

<svg class="meander" height="14" aria-hidden="true">
  <defs>
    <pattern {id} width="20" height="14" patternUnits="userSpaceOnUse">
      <path d="M1 13 V1 H15 V9 H7 V5 H11" fill="none" stroke="currentColor" stroke-width="1.4" />
      <path d="M15 13 H19" fill="none" stroke="currentColor" stroke-width="1.4" />
    </pattern>
  </defs>
  <rect width="100%" height="14" fill="url(#{id})" />
</svg>

<style>
  .meander {
    display: block;
    width: 100%;
    color: var(--gold-400);
    opacity: 0.7;
  }
</style>
