import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * True after hydration, false during SSR and the first client render.
 * Used by theme-aware controls so the server and client markup agree.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
