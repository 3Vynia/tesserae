<script lang="ts">
  // Loading indicator: three stars joined by a line that draws and fades.
</script>

<svg class="tracer" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
  <path d="M3 15L9 5L17 11" />
  <circle cx="3" cy="15" r="1.6" /><circle cx="9" cy="5" r="1.6" /><circle
    cx="17"
    cy="11"
    r="1.6"
  />
</svg>

<style>
  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.2;
    stroke-dasharray: 26;
    animation: trace 900ms var(--ease-in-out) infinite;
  }
  circle {
    fill: currentColor;
  }
  @keyframes trace {
    from {
      stroke-dashoffset: 26;
    }
    60% {
      stroke-dashoffset: 0;
      opacity: 1;
    }
    to {
      stroke-dashoffset: 0;
      opacity: 0;
    }
  }
  :global([data-motion='calm']) path {
    animation: pulse 1200ms ease-in-out infinite;
    stroke-dashoffset: 0;
  }
  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }
</style>
