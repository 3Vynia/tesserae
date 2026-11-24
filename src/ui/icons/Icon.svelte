<script lang="ts">
  import { ICONS, type IconName } from './paths';

  interface Props {
    name: IconName;
    size?: number;
    /** Accessible name; omit for decorative icons next to visible text. */
    label?: string;
  }
  let { name, size = 22, label }: Props = $props();
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>
  <path d={ICONS[name]} />
</svg>

<style>
  .icon {
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
