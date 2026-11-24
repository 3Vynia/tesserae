import type { Action } from 'svelte/action';

/** Marks an element with data-revealed once it scrolls into view; CSS does the rest. */
export const reveal: Action<HTMLElement> = (node) => {
  if (typeof IntersectionObserver === 'undefined') {
    node.dataset['revealed'] = '';
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.dataset['revealed'] = '';
          observer.disconnect();
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  observer.observe(node);
  return { destroy: () => observer.disconnect() };
};
