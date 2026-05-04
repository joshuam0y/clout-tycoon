/**
 * Subscribe to window.matchMedia; invokes onMatch after attach (microtask) and on every change.
 * @returns {() => void} unsubscribe
 */
export function subscribeMatchMedia(query, onMatch) {
  if (typeof window === 'undefined') {
    return () => {};
  }
  const mq = window.matchMedia(query);
  const handler = () => onMatch(mq.matches);
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', handler);
  } else {
    mq.addListener(handler);
  }
  queueMicrotask(() => onMatch(mq.matches));
  return () => {
    if (typeof mq.removeEventListener === 'function') {
      mq.removeEventListener('change', handler);
    } else {
      mq.removeListener(handler);
    }
  };
}
