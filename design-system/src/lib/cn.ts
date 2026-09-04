import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge must know the design system's custom tokens, otherwise it
 * misreads `text-small` as a color and drops `text-primary-foreground`
 * (and likewise for radius, shadow, width and easing tokens). The lists
 * mirror the @theme namespaces in design-system/foundations/tokens.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['hero', 'display-lg', 'display', 'title', 'heading', 'lead', 'read', 'body', 'small', 'label', 'data', 'meta'],
      radius: ['control', 'card', 'panel', 'frame'],
      shadow: ['card', 'raised', 'overlay'],
      container: ['content', 'reading', 'narrow', 'landing'],
      spacing: ['sidebar', 'sidebar-rail', 'topbar'],
      ease: ['standard', 'exit', 'emphasis'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
