import type { Action } from 'svelte/action';

/** Moves an element to the end of <body>, out of any stacking context it was rendered in. */
export const portal: Action<HTMLElement> = (node) => {
  document.body.append(node);
  return { destroy: () => node.remove() };
};

/**
 * Full-screen overlay behavior: everything else on the page becomes inert while the node is
 * mounted, and focus returns to where it was when it closes. Use after `portal`.
 */
export const modal: Action<HTMLElement> = (node) => {
  const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const siblings = [...document.body.children].filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el !== node && !el.inert,
  );
  for (const el of siblings) el.inert = true;
  return {
    destroy() {
      for (const el of siblings) el.inert = false;
      previous?.focus({ preventScroll: true });
    },
  };
};
