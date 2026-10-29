import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { createGame } from '../core/chess';
import type { EngineResult } from '../core/contracts';
import { search } from '../core/engine';
import { nativeEngine } from './engine';

jest.mock('../core/engine', () => ({ search: jest.fn() }));
const game = createGame('native-engine', 0, 'robot', 'hard');
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});
it('checks native results and always releases its AppState subscription', async () => {
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
  jest.mocked(search).mockResolvedValue({ move: 'e4', nodes: 1, depth: 1 });
  expect(await nativeEngine.think(game, 'easy', new AbortController().signal)).toEqual({
    move: 'e4',
    nodes: 1,
    depth: 1,
  });
  jest.mocked(search).mockResolvedValueOnce({ move: 'e5', nodes: 1, depth: 1 });
  await expect(nativeEngine.think(game, 'medium', new AbortController().signal)).rejects.toThrow('unavailable');
  expect(remove).toHaveBeenCalledTimes(2);
});
it('cancels on caller abort, backgrounding, a stale pre-abort and the watchdog', async () => {
  const state: { listener: ((state: AppStateStatus) => void) | null } = { listener: null };
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, listener) => {
    state.listener = listener;
    return { remove: jest.fn() };
  });
  jest.mocked(search).mockImplementation(async (_game, _difficulty, signal) => {
    if (signal.aborted) throw new Error('cancelled');
    return new Promise<EngineResult>((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true }),
    );
  });
  const cancelled = new AbortController();
  cancelled.abort();
  await expect(nativeEngine.think(game, 'hard', cancelled.signal)).rejects.toThrow('cancelled');
  const caller = new AbortController();
  const pending = nativeEngine.think(game, 'hard', caller.signal);
  const rejection = expect(pending).rejects.toThrow('cancelled');
  caller.abort();
  await rejection;
  const background = nativeEngine.think(game, 'hard', new AbortController().signal);
  const stopped = expect(background).rejects.toThrow('cancelled');
  state.listener?.('background');
  await stopped;
  jest.useFakeTimers();
  const timed = nativeEngine.think(game, 'hard', new AbortController().signal);
  const failure = expect(timed).rejects.toThrow('cancelled');
  await jest.advanceTimersByTimeAsync(4500);
  await failure;
});
