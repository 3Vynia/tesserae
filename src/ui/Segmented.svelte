<script lang="ts" generics="T extends string">
  interface Props {
    name: string;
    legend: string;
    options: readonly { value: T; label: string; hint?: string }[];
    value: T;
    onchange: (value: T) => void;
    /** Keep the legend for screen readers only, when a visible label sits elsewhere. */
    hideLegend?: boolean;
  }
  let { name, legend, options, value, onchange, hideLegend = false }: Props = $props();
</script>

<fieldset class="segmented">
  <legend class="caps" class:visually-hidden={hideLegend}>{legend}</legend>
  <div class="plates">
    {#each options as option (option.value)}
      <label class="plate" class:selected={option.value === value}>
        <input
          type="radio"
          {name}
          value={option.value}
          checked={option.value === value}
          onchange={() => onchange(option.value)}
        />
        <span class="title">{option.label}</span>
        {#if option.hint}<span class="hint">{option.hint}</span>{/if}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .segmented {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  legend {
    padding: 0;
    margin-bottom: var(--space-3);
    color: var(--gold-pale);
    font-size: var(--text-xl);
  }
  .plates {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
    border: 1px solid var(--rule);
    border-radius: var(--radius-control);
  }
  .plate {
    position: relative;
    display: grid;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    transition: background-color var(--dur-quick) ease;
  }
  .plate + .plate {
    border-inline-start: 1px solid var(--rule);
  }
  @media (max-width: 560px) {
    .plate + .plate {
      border-inline-start: 0;
      border-block-start: 1px solid var(--rule);
    }
  }
  .plate.selected {
    background: var(--lapis);
    box-shadow: var(--bevel);
  }
  .plate:has(input:focus-visible) {
    outline: 2px solid var(--focus);
    outline-offset: -2px;
  }
  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    color: var(--parchment);
  }
  .selected .title {
    color: var(--gold-pale);
  }
  .hint {
    font-size: var(--text-sm);
    color: var(--text-muted);
    line-height: var(--leading-snug);
  }
  @media (hover: hover) and (pointer: fine) {
    .plate:not(.selected):hover {
      background: var(--vault);
    }
  }
</style>
