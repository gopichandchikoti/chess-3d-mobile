import { createGame, viewGame } from './chess';
import { assistantText } from './content';

it('explains last moves, captures, castling, promotions and difficulty advice locally', () => {
  const view = viewGame(createGame('assistant', 0, 'robot', 'easy'));
  for (const difficulty of ['easy', 'medium', 'hard'] as const)
    expect(assistantText(view, difficulty)).toContain(
      difficulty === 'easy' ? 'legal destination' : difficulty === 'medium' ? 'Compare' : 'strongest reply',
    );
  const moved = { ...view, turn: 'b' as const, lastMove: { from: 'e2' as const, to: 'e4' as const }, history: ['e4'] };
  expect(assistantText(moved)).toContain('from e2 to e4');
  expect(assistantText({ ...moved, lastMove: { from: 'e7', to: 'e5' }, history: ['exd5'] })).toContain('capturing');
  expect(
    assistantText({
      ...moved,
      lastMove: { from: 'a7', to: 'a8' },
      history: ['a8=Q'],
      pieces: [{ square: 'a8', kind: 'q', color: 'w' }],
    }),
  ).toContain('promoted a pawn to a queen');
  expect(assistantText({ ...moved, history: ['O-O'] })).toContain('kingside');
  expect(assistantText({ ...moved, history: ['O-O-O'], turn: 'w' })).toContain('Black castled queenside');
});
