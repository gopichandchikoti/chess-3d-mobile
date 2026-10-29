import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createGame, moveGame } from '../core/chess';
import { copy } from '../core/content';
import type { EnginePort, LibraryData, StringStorage } from '../core/contracts';
import { useLibrary } from './useLibrary';
import { useRobot } from './useRobot';

it('surfaces failed storage operations and ignores reads after unmount', async () => {
  const storage: StringStorage = {
    get: async () => {
      throw new Error('blocked');
    },
    set: async () => {
      throw new Error('quota');
    },
    remove: async () => {
      throw new Error('blocked');
    },
  };
  const hook = await renderHook(() => useLibrary(storage));
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  expect(hook.result.current.storageError).toBe(copy.storageError);
  await act(async () => hook.result.current.reset());
  expect(hook.result.current.storageError).toBe(copy.storageError);
  await hook.unmount();
  const late: { resolve: ((value: string | null) => void) | null } = { resolve: null };
  const slow = {
    ...storage,
    get: () =>
      new Promise<string | null>((resolve) => {
        late.resolve = resolve;
      }),
  };
  const pending = await renderHook(() => useLibrary(slow));
  await pending.unmount();
  await act(async () => late.resolve?.(null));
  const writable = { ...storage, get: async () => null };
  const write = await renderHook(() => useLibrary(writable));
  await waitFor(() => expect(write.result.current.ready).toBe(true));
  await act(async () =>
    write.result.current.update((data) => ({ ...data, settings: { ...data.settings, theme: 'dark' } })),
  );
  await waitFor(() => expect(write.result.current.storageError).toBe(copy.storageError));
});
it('refuses illegal robot output and ignores cancelled late results', async () => {
  const changes: ((data: LibraryData) => LibraryData)[] = [];
  const update = (change: (data: LibraryData) => LibraryData) => {
    changes.push(change);
  };
  const engine: EnginePort = { think: async () => ({ move: 'illegal', nodes: 1, depth: 1 }) };
  const none = await renderHook(() => useRobot(null, engine, update));
  expect(none.result.current.thinking).toBe(false);
  await none.unmount();
  const moved = moveGame(createGame('hook', 0, 'robot', 'medium'), 'e4');
  if (!moved.ok) throw new Error('fixture');
  const failed = await renderHook(() => useRobot(moved.value, engine, update));
  await waitFor(() => expect(failed.result.current.engineError).toBe(copy.engineError));
  expect(changes).toHaveLength(0);
  await failed.unmount();
  const pending: { resolve: ((value: { move: string; nodes: number; depth: number }) => void) | null } = {
    resolve: null,
  };
  const slow: EnginePort = {
    think: () =>
      new Promise((resolve) => {
        pending.resolve = resolve;
      }),
  };
  const late = await renderHook(() => useRobot(moved.value, slow, update));
  await late.unmount();
  await act(async () => pending.resolve?.({ move: 'e5', nodes: 1, depth: 1 }));
  expect(changes).toHaveLength(0);
});
