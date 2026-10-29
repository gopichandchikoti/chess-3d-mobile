import { createGame, importGame, parseFen, viewGame } from './chess';
import { assistantText, copy, outcomeText } from './content';
import type { EndReason, Outcome } from './contracts';
import { readEngineResult, readRequest } from './protocol';
import { decodeLibrary, emptyLibrary, readRecord } from './storage';

describe('assistant and hostile boundary cases', () => {
  const record = createGame('edge', 1, 'local', 'hard');
  it('explains turns, last moves, check, every result and draw claims without a network', () => {
    const view = viewGame(record);
    expect(assistantText(view)).toContain('White');
    expect(assistantText({ ...view, history: ['e4'] })).toContain('e4');
    expect(assistantText({ ...view, check: 'e1' })).toContain('check');
    expect(assistantText({ ...view, claimable: true })).toContain('claim');
    for (const reason of [
      'checkmate',
      'stalemate',
      'material',
      'fivefold',
      'seventy-five',
      'claim',
      'agreement',
      'resignation',
    ] as EndReason[]) {
      const outcome: Outcome = { winner: null, reason };
      expect(outcomeText(outcome)).toContain('Draw');
      expect(assistantText({ ...view, outcome })).toBe(outcomeText(outcome));
      expect(outcomeText({ winner: 'w', reason })).toContain('White wins');
    }
    expect(copy.assistantIntro).toContain('offline robot');
  });
  it('rejects malformed fields and preserves a valid non-empty stored game', () => {
    for (const change of [
      { createdAt: Infinity },
      { createdAt: 9e15 },
      { id: '' },
      { moves: 'text' },
      { moves: Array(1201).fill('e4') },
      { outcome: undefined },
    ])
      expect(readRecord({ ...record, ...change })).toBeNull();
    for (const change of [
      { settings: { ...emptyLibrary().settings, reducedMotion: 0 } },
      { lessons: Array(13).fill('lesson-1') },
      { current: undefined },
      { history: [null] },
    ])
      expect(decodeLibrary(JSON.stringify({ ...emptyLibrary(), ...change })).issue).not.toBeNull();
    expect(
      decodeLibrary(JSON.stringify({ ...emptyLibrary(), lessons: ['lesson-1', 'lesson-1'] })).data.lessons,
    ).toEqual(['lesson-1']);
    for (const value of [
      { move: 1, nodes: 1, depth: 1 },
      { move: 'e4', nodes: 1.5, depth: 1 },
      { move: 'e4', nodes: 20001, depth: 1 },
      { move: 'e4', nodes: 1, depth: -1 },
      { id: 1.5, game: record, difficulty: 'easy' },
      { id: 1, game: record, difficulty: 'invalid' },
    ]) {
      expect(readEngineResult(value, record)).toBeNull();
    }
    expect(readRequest({ id: 1.5, game: record, difficulty: 'easy' })).toBeNull();
    expect(importGame(record, '[FEN "invalid"]\n[SetUp "1"]\n1. e4', 'pgn').ok).toBe(false);
  });
});

it('rejects impossible piece and pawn counts before restoration or engine search', () => {
  expect(parseFen('7k/8/8/8/8/PPPPPPPP/PPPPPPPP/K7 w - - 0 1').ok).toBe(false);
  expect(parseFen('7k/8/8/8/8/P7/PPPPPPPP/K7 w - - 0 1').ok).toBe(false);
});
