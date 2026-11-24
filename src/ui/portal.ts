import type { Action } from 'svelte/action';

/** Moves an element to the end of <body>, out of any stacking context it was rendered in. */
export const portal: Action<HTMLElement> = (node) => {
  document.body.append(node);
  return { destroy: () => node.remove() };
};
