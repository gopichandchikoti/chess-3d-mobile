import { createGame, importGame, restoreChess, viewGame } from './chess';
import type { SearchRuntime } from './engine';
import { evaluate, search } from './engine';
import { readEngineResult, readRequest } from './protocol';

const runtime: SearchRuntime = { now: () => 0, random: () => 0.4, yieldControl: async () => undefined };
const game = createGame('engine', 0, 'robot', 'medium');
describe('original local engine', () => {
  it('returns legal weighted easy moves with deterministic injected randomness', async () => {
    const result = await search(game, 'easy', new AbortController().signal, runtime);
    expect(viewGame(game).legal.some((move) => move.san === result.move)).toBe(true);
    expect(result.depth).toBe(1);
    expect(await search(game, 'easy', new AbortController().signal, runtime)).toEqual(result);
  });
  it('finds mate at medium and hard, including promotion tactics', async () => {
    for (const difficulty of ['medium', 'hard'] as const) {
      const setup = importGame(game, '7k/8/5KQ1/8/8/8/8/8 w - - 0 1', 'fen');
      if (!setup.ok) throw new Error('fixture');
      const result = await search(setup.value, difficulty, new AbortController().signal, runtime);
      expect(result.move).toContain('#');
      expect(result.nodes).toBeGreaterThan(0);
    }
    const promotion = importGame(game, '7k/P7/8/8/8/8/8/7K w - - 0 1', 'fen');
    if (!promotion.ok) throw new Error('fixture');
    expect((await search(promotion.value, 'medium', new AbortController().signal, runtime)).move).toContain('=');
  });
  it('cancels before and during a search', async () => {
    const abort = new AbortController();
    abort.abort();
    await expect(search(game, 'hard', abort.signal, runtime)).rejects.toThrow('cancelled');
    const pending = new AbortController();
    const yielding = {
      ...runtime,
      yieldControl: async () => {
        pending.abort();
      },
    };
    await expect(search(game, 'hard', pending.signal, yielding)).rejects.toThrow('cancelled');
  });
  it('stops at time and node budgets, handles terminal positions and evaluates both colors', async () => {
    let clock = 0;
    const timed = {
      ...runtime,
      now: () => {
        clock += 1000;
        return clock;
      },
    };
    const result = await search(game, 'hard', new AbortController().signal, timed);
    expect(result.depth).toBe(0);
    expect(result.nodes).toBeLessThan(10);
    const terminal = importGame(game, '7k/8/8/8/8/8/8/7K w - - 0 1', 'fen');
    if (!terminal.ok) throw new Error('fixture');
    await expect(search(terminal.value, 'medium', new AbortController().signal, runtime)).rejects.toThrow('No legal');
    expect(Number.isFinite(evaluate(restoreChess(game)))).toBe(true);
  });
  it('validates worker messages and refuses illegal engine responses', () => {
    expect(readRequest({ id: 1, game, difficulty: 'hard' })).not.toBeNull();
    for (const value of [
      null,
      { id: -1 },
      { id: 1, game, difficulty: 'online' },
      { id: 1, game: {}, difficulty: 'easy' },
    ])
      expect(readRequest(value)).toBeNull();
    expect(readEngineResult({ move: 'e4', nodes: 20, depth: 1 }, game)).not.toBeNull();
    for (const value of [
      null,
      { move: 'e5', nodes: 1, depth: 1 },
      { move: 'e4', nodes: -1, depth: 1 },
      { move: 'e4', nodes: 1, depth: 99 },
    ])
      expect(readEngineResult(value, game)).toBeNull();
  });
});
