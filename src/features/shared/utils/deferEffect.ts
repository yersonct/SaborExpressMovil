/** Schedules effect synchronization after the current commit and cancels it on cleanup. */
export function deferEffect(callback: () => void | (() => void)): () => void {
  let active = true;
  let cleanup: void | (() => void);

  Promise.resolve().then(() => {
    if (active) cleanup = callback();
  });

  return () => {
    active = false;
    cleanup?.();
  };
}
