import { AppState } from 'react-native';
import type { EnginePort } from '../core/contracts';
import { search } from '../core/engine';
import { readEngineResult } from '../core/protocol';
export const nativeEngine: EnginePort = {
  think: async (game, difficulty, signal) => {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal.aborted) controller.abort();
    signal.addEventListener('abort', cancel, { once: true });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') controller.abort();
    });
    const timeout = setTimeout(cancel, 4500);
    try {
      const result = await search(game, difficulty, controller.signal);
      const validated = readEngineResult(result, game);
      if (!validated) throw new Error('Engine unavailable.');
      return validated;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', cancel);
      subscription.remove();
    }
  },
};
