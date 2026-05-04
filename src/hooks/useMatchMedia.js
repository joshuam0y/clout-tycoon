import { useState, useEffect } from 'react';
import { subscribeMatchMedia } from './matchMediaSubscribe';

/**
 * Subscribes to `window.matchMedia(query)` for responsive layout (SSR-safe).
 */
export function useMatchMedia(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => subscribeMatchMedia(query, setMatches), [query]);

  return matches;
}
