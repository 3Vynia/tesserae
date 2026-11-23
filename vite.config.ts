import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  // Relative base so the build works on GitHub Pages and from any subfolder.
  base: './',
  plugins: [svelte()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
