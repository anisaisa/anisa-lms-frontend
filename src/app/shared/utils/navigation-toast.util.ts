import { ToastService } from '../services/toast.service';

/** Show toasts for router navigation state flags, then clear them from history. */
export function applyNavigationToasts(
  toast: ToastService,
  messages: Record<string, string>,
): void {
  const state = history.state as Record<string, unknown> | undefined;
  if (!state) {
    return;
  }

  let shown = false;
  for (const [key, message] of Object.entries(messages)) {
    if (state[key]) {
      toast.success(message);
      shown = true;
    }
  }

  if (shown) {
    const nextState = { ...state };
    for (const key of Object.keys(messages)) {
      delete nextState[key];
    }
    history.replaceState(nextState, '');
  }
}
