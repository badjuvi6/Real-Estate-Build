import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a debounced version of `callback`: calling the returned function
 * repeatedly only actually invokes `callback` once, `delay` ms after the
 * last call. Used to turn "fires on every keystroke/slider drag" events
 * into a single delayed action (e.g. one API request instead of one per
 * keystroke).
 *
 * The latest `callback` is always used (via a ref), so callers don't need
 * to memoize it themselves or worry about stale closures - only `delay`
 * needs to stay stable to avoid re-creating the debounced function.
 *
 * The returned function also has a `.cancel()` method, for the case where
 * something else makes an immediate, authoritative change (e.g. an
 * explicit "Apply"/"Reset" action) that a late-firing stale debounced call
 * could otherwise clobber a moment later.
 */
export function useDebouncedCallback(callback, delay) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const debounced = useCallback(
    (...args) => {
      cancel();
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [cancel, delay]
  );

  debounced.cancel = cancel;
  return debounced;
}
