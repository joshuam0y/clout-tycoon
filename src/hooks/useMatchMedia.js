import { useState, useEffect } from 'react';

/**
 * Subscribes to `window.matchMedia(query)` for responsive layout (SSR-safe).
 */
export function useMatchMedia(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
    } else {
      mq.addListener(onChange);
    }
    setMatches(mq.matches);
    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', onChange);
      } else {
        mq.removeListener(onChange);
      }
    };
  }, [query]);

  return matches;
}
