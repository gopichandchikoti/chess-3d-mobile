import { createGame, endGame } from './chess';
import type { StringStorage } from './contracts';
import { decodeLibrary, emptyLibrary, MAX_STORAGE_LENGTH, readRecord, serialStorage, withCurrent } from './storage';

describe('local data trust boundary', () => {
  it('handles first launch, valid data, missing values and migration', () => {
    expect(decodeLibrary(null)).toEqual({ data: emptyLibrary(), issue: null });
    const data = { ...emptyLibrary(), current: createGame('test', 1, 'local', 'easy') };
    expect(decodeLibrary(JSON.stringify(data))).toEqual({ data, issue: null });
    expect(decodeLibrary(JSON.stringify({ schemaVersion: 1, theme: 'dark' })).data.settings.theme).toBe('dark');
  });
  it('rejects corruption, oversized data, future versions and hostile stored content', () => {
    expect(decodeLibrary('{').issue).toBe('corrupt');
    expect(decodeLibrary('[]').issue).toBe('corrupt');
    expect(decodeLibrary('x'.repeat(MAX_STORAGE_LENGTH + 1)).issue).toBe('oversized');
    expect(decodeLibrary('{"schemaVersion":99}').issue).toBe('unsupported');
    const base = emptyLibrary();
    for (const change of [
      { settings: {} },
      { history: {} },
      { history: Array(51).fill(null) },
      { lessons: ['<script>'] },
      { current: {} },
      { settings: { ...base.settings, theme: 'remote' } },
    ])
      expect(decodeLibrary(JSON.stringify({ ...base, ...change })).issue).toBe('corrupt');
  });
  it('rejects bad records and replays moves before trusting them', () => {
    const base = createGame('valid', 0, 'robot', 'hard');
    expect(readRecord(base)).toEqual(base);
    for (const change of [
      { id: '../bad' },
      { createdAt: -1 },
      { initialFen: 'bad' },
      { moves: ['not a move'] },
      { moves: [1] },
      { mode: 'online' },
      { difficulty: 'impossible' },
      { human: 'x' },
      { outcome: { winner: 'x', reason: 'draw' } },
      { outcome: { winner: null, reason: 'made up' } },
    ])
      expect(readRecord({ ...base, ...change })).toBeNull();
    expect(readRecord(null)).toBeNull();
  });
  it('deduplicates finished games, bounds history and removes undone results', () => {
    const game = createGame('id', 0, 'local', 'medium');
    const result = endGame(game, 'agreement');
    if (!result.ok) throw new Error('fixture');
    const once = withCurrent(emptyLibrary(), result.value);
    const twice = withCurrent(once, result.value);
    expect(twice.history).toHaveLength(1);
    expect(withCurrent(twice, game).history).toHaveLength(0);
    expect(decodeLibrary(JSON.stringify(twice)).issue).toBeNull();
    expect(decodeLibrary(JSON.stringify({ ...twice, history: [game] })).issue).toBe('corrupt');
  });
  it('serializes writes, exposes errors and supports reset without deleting other keys', async () => {
    const calls: string[] = [];
    let failing = true;
    const storage: StringStorage = {
      get: async () => null,
      set: async (value) => {
        if (failing) {
          failing = false;
          throw new Error('Quota');
        }
        calls.push(value);
      },
      remove: async () => {
        calls.push('reset');
      },
    };
    const serial = serialStorage(storage);
    expect(await serial.get()).toBeNull();
    await expect(serial.set('failed')).rejects.toThrow('Quota');
    await Promise.all([serial.set('first'), serial.set('last'), serial.remove()]);
    expect(calls).toEqual(['first', 'last', 'reset']);
  });
});
