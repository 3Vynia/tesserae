<script lang="ts">
  import { onMount } from 'svelte';
  import { motion } from '../motion/motion.svelte';
  import { stepSpring, TILT_SPRING, type SpringState } from '../motion/spring';
  import { cloudTextureUrl } from './clouds';
  import NightSky from '../NightSky.svelte';

  let near = $state<HTMLDivElement>();
  let far = $state<HTMLDivElement>();
  let nearUrl = $state<string | null>(null);
  let farUrl = $state<string | null>(null);

  onMount(() => {
    let cancelled = false;
    const urls: string[] = [];
    // Generated after first paint so the page is interactive immediately.
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1));
    idle(async () => {
      const light = { x: 0.5, y: 0.5 };
      const [a, b] = await Promise.all([
        cloudTextureUrl({ size: 768, seed: 'vault-far', light, frequency: 3, coverage: 0.4 }),
        cloudTextureUrl({ size: 1024, seed: 'vault-near', light, frequency: 3, coverage: 0.3 }),
      ]);
      if (cancelled) return;
      if (a) urls.push((farUrl = a));
      if (b) urls.push((nearUrl = b));
    });

    // Pointer parallax with a spring, fine pointers only.
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    let raf = 0;
    let target = { x: 0, y: 0 };
    let sx: SpringState = { value: 0, velocity: 0 };
    let sy: SpringState = { value: 0, velocity: 0 };
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      sx = stepSpring(sx, target.x, dt, TILT_SPRING);
      sy = stepSpring(sy, target.y, dt, TILT_SPRING);
      if (near) near.style.translate = `${sx.value * 18}px ${sy.value * 12}px`;
      if (far) far.style.translate = `${sx.value * 7}px ${sy.value * 5}px`;
      raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (motion.calm) return;
      target = { x: e.clientX / innerWidth - 0.5, y: e.clientY / innerHeight - 0.5 };
    };
    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true });
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  });
</script>

<div class="oculus" aria-hidden="true">
  <div class="light"></div>
  <div class="layer far" bind:this={far}>
    <div
      class="clouds"
      class:ready={farUrl}
      style:background-image={farUrl ? `url(${farUrl})` : undefined}
    ></div>
  </div>
  <div class="layer near" bind:this={near}>
    <div
      class="clouds"
      class:ready={nearUrl}
      style:background-image={nearUrl ? `url(${nearUrl})` : undefined}
    ></div>
  </div>
  <div class="stars"><NightSky stars={90} seed="oculus" fixed={false} /></div>
  <div class="vignette"></div>
</div>

<style>
  .oculus {
    --ox: 66%;
    --oy: 36%;
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--ink);
    contain: strict;
  }
  @media (max-width: 760px) {
    .oculus {
      --ox: 58%;
      --oy: 30%;
    }
  }
  .light {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at var(--ox) var(--oy),
      #fdf1d2 0,
      #f2c879 3.5%,
      #e7965c 9%,
      #7a5266 17%,
      #2b3f86 28%,
      #1a2a63 42%,
      var(--vault) 58%,
      var(--ink) 82%
    );
    animation: open var(--dur-ceremony) var(--ease-out) both;
  }
  .layer {
    position: absolute;
    left: var(--ox);
    top: var(--oy);
    width: 0;
    height: 0;
    will-change: translate;
  }
  .clouds {
    position: absolute;
    width: 125vmax;
    height: 125vmax;
    left: -62.5vmax;
    top: -62.5vmax;
    background-size: cover;
    opacity: 0;
    transition: opacity 1400ms var(--ease-out);
    will-change: transform;
  }
  .clouds.ready {
    opacity: 1;
  }
  .far .clouds.ready {
    opacity: 0.8;
  }
  .far .clouds {
    animation: turn 420s linear infinite;
    opacity: 0.85;
  }
  .near .clouds {
    animation: turn 300s linear infinite reverse;
  }
  .stars {
    position: absolute;
    inset: 0;
    mask-image: radial-gradient(circle at var(--ox) var(--oy), transparent 30%, #000 62%);
  }
  .vignette {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgb(7 10 20 / 0.75) 0, transparent 18%),
      linear-gradient(0deg, var(--ink) 0, rgb(7 10 20 / 0.9) 12%, transparent 48%),
      linear-gradient(90deg, rgb(7 10 20 / 0.85) 0, transparent 55%);
  }
  @keyframes turn {
    to {
      rotate: 360deg;
    }
  }
  @keyframes open {
    from {
      clip-path: circle(0% at var(--ox) var(--oy));
    }
    to {
      clip-path: circle(150% at var(--ox) var(--oy));
    }
  }
  :global([data-motion='calm']) .clouds {
    animation: none;
  }
  :global([data-motion='calm']) .light {
    animation: fade var(--dur-base) ease both;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
