import { isServerAlive } from "@/features/auth/services/serverHealth";

const listeners = new Set<(recovered: boolean) => void>();
let watchTimer: ReturnType<typeof setInterval> | null = null;
let visibleTimer: ReturnType<typeof setTimeout> | null = null;
let recoveryVisible = false;
let inFlight = false;

function emit() {
  for (const listener of listeners) listener(recoveryVisible);
}

export function subscribeBackendRecovery(listener: (recovered: boolean) => void) {
  listeners.add(listener);
  listener(recoveryVisible);
  return () => { listeners.delete(listener); };
}

export function dismissBackendRecovery() {
  recoveryVisible = false;
  if (visibleTimer) clearTimeout(visibleTimer);
  visibleTimer = null;
  emit();
}

export function stopBackendRecoveryWatch() {
  if (watchTimer) clearInterval(watchTimer);
  watchTimer = null;
  inFlight = false;
  dismissBackendRecovery();
}

/** El login sigue comprobando /health tras cerrar sesión por caída. */
export function startBackendRecoveryWatch() {
  if (watchTimer) return;
  let active = true;
  const poll = async () => {
    if (!active || inFlight) return;
    inFlight = true;
    try {
      const available = await isServerAlive(3500);
      if (!active || !available) return;
      if (watchTimer) clearInterval(watchTimer);
      watchTimer = null;
      active = false;
      recoveryVisible = true;
      emit();
      visibleTimer = setTimeout(dismissBackendRecovery, 10000);
    } finally {
      inFlight = false;
    }
  };
  watchTimer = setInterval(() => { void poll(); }, 5000);
  void poll();
}
