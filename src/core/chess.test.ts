import { coordinateMove, createGame, endGame, importGame, moveGame, parseFen, undoGame, viewGame } from './chess';
import type { GameRecord, Promotion } from './contracts';

const fresh = (): GameRecord => createGame('test-1', 0, 'local', 'medium');
function sequence(moves: string[], initial = fresh()): GameRecord {
  return moves.reduce((record, san) => {
    const result = moveGame(record, san);
    if (!result.ok) throw new Error(result.error);
    return result.value;
  }, initial);
}
function position(fen: string): GameRecord {
  const result = importGame(fresh(), fen, 'fen');
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
describe('standard chess adapter', () => {
  it('starts with 32 pieces and 20 legal moves; illegal moves leave state intact', () => {
    const game = fresh();
    const view = viewGame(game);
    expect(view.pieces).toHaveLength(32);
    expect(view.legal).toHaveLength(20);
    expect(view.turn).toBe('w');
    expect(coordinateMove(game, 'e2', 'e5').ok).toBe(false);
    expect(viewGame(game).fen).toBe(view.fen);
    expect(coordinateMove(game, 'e2', 'e4').ok).toBe(true);
  });
  it('tracks moves, captures, checkmate and rejects play after the end', () => {
    const game = sequence(['f3', 'e5', 'g4', 'Qh4#']);
    const view = viewGame(game);
    expect(view.outcome).toEqual({ winner: 'b', reason: 'checkmate' });
    expect(view.check).toBe('e1');
    expect(moveGame(game, 'a3').ok).toBe(false);
    expect(endGame(game, 'resignation').ok).toBe(false);
    expect(viewGame(sequence(['e4', 'd5', 'exd5'])).captures).toEqual([{ color: 'b', kind: 'p' }]);
    expect(view.lastMove).toEqual({ from: 'd8', to: 'h4' });
  });
  it('supports both castling sides and excludes attacks, moved pieces and blocked paths', () => {
    const open = position('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(viewGame(open).legal.map((move) => move.san)).toEqual(expect.arrayContaining(['O-O', 'O-O-O']));
    const castle = moveGame(open, 'O-O');
    expect(castle.ok).toBe(true);
    if (castle.ok) expect(viewGame(castle.value).pieces).toContainEqual({ square: 'f1', color: 'w', kind: 'r' });
    expect(viewGame(fresh()).legal.map((move) => move.san)).not.toContain('O-O');
    expect(viewGame(position('4kr2/8/8/8/8/8/8/R3K2R w KQ - 0 1')).legal.map((move) => move.san)).not.toContain('O-O');
    expect(viewGame(position('4r1k1/8/8/8/8/8/8/R3K2R w KQ - 0 1')).legal.map((move) => move.san)).not.toContain(
      'O-O-O',
    );
    const moved = sequence(['Rh2', 'Kf7', 'Rh1', 'Ke8'], open);
    expect(viewGame(moved).legal.map((move) => move.san)).not.toContain('O-O');
  });
  it('supports immediate en passant, but not a delayed capture', () => {
    const game = sequence(['e4', 'a6', 'e5', 'd5']);
    const capture = coordinateMove(game, 'e5', 'd6');
    expect(capture.ok).toBe(true);
    if (capture.ok) expect(viewGame(capture.value).pieces.some((piece) => piece.square === 'd5')).toBe(false);
    expect(viewGame(sequence(['Nf3', 'a5'], game)).legal.some((move) => move.from === 'e5' && move.to === 'd6')).toBe(
      false,
    );
  });
  it('allows every promotion and forbids unpromoted final-rank moves', () => {
    const game = position('7k/P7/8/8/8/8/8/7K w - - 0 1');
    expect(coordinateMove(game, 'a7', 'a8').ok).toBe(false);
    for (const promotion of ['q', 'r', 'b', 'n'] as Promotion[]) {
      const result = coordinateMove(game, 'a7', 'a8', promotion);
      expect(result.ok).toBe(true);
      if (result.ok)
        expect(viewGame(result.value).pieces).toContainEqual({ square: 'a8', color: 'w', kind: promotion });
    }
  });
  it('handles stalemate and supported dead positions', () => {
    expect(viewGame(position('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1')).outcome?.reason).toBe('stalemate');
    expect(viewGame(position('7k/8/8/8/8/8/8/7K w - - 0 1')).outcome?.reason).toBe('material');
  });
  it('makes threefold claimable and fivefold automatic, preserving undo history', () => {
    const cycle = ['Nf3', 'Nf6', 'Ng1', 'Ng8'];
    const three = sequence([...cycle, ...cycle]);
    expect(viewGame(three).claimable).toBe(true);
    expect(viewGame(three).outcome).toBeNull();
    expect(endGame(three, 'claim').ok).toBe(true);
    expect(endGame(fresh(), 'claim').ok).toBe(false);
    const five = sequence([...cycle, ...cycle], three);
    expect(viewGame(five).outcome?.reason).toBe('fivefold');
    expect(viewGame(undoGame(five)).outcome).toBeNull();
  });
  it('implements 50/75-move boundaries and checkmate precedence', () => {
    const fifty = sequence(['Ra2'], position('7k/8/5K2/8/8/8/8/R7 w - - 99 1'));
    expect(viewGame(fifty).claimable).toBe(true);
    expect(viewGame(fifty).outcome).toBeNull();
    const seventyFive = sequence(['Ra2'], position('7k/8/5K2/8/8/8/8/R7 w - - 149 1'));
    expect(viewGame(seventyFive).outcome?.reason).toBe('seventy-five');
    expect(viewGame(sequence(['Qg7#'], position('7k/8/5KQ1/8/8/8/8/8 w - - 149 1'))).outcome?.reason).toBe('checkmate');
  });
  it('undoes one ply locally and a robot pair without corrupting state', () => {
    expect(undoGame(fresh()).moves).toHaveLength(0);
    const robot = { ...fresh(), mode: 'robot' as const };
    expect(undoGame(sequence(['e4', 'e5'], robot)).moves).toHaveLength(0);
    expect(undoGame(sequence(['e4'], robot)).moves).toHaveLength(0);
    const local = sequence(['e4', 'e5']);
    expect(undoGame(local).moves).toEqual(['e4']);
  });
  it('supports resignation and agreed draws', () => {
    expect(endGame(fresh(), 'resignation')).toMatchObject({
      ok: true,
      value: { outcome: { winner: 'b', reason: 'resignation' } },
    });
    expect(endGame({ ...fresh(), mode: 'robot', human: 'b' }, 'resignation')).toMatchObject({
      ok: true,
      value: { outcome: { winner: 'w' } },
    });
    expect(endGame(fresh(), 'agreement')).toMatchObject({
      ok: true,
      value: { outcome: { winner: null, reason: 'agreement' } },
    });
  });
  it('round-trips PGN with strict input bounds and safe rejection', () => {
    const game = sequence(['e4', 'e5', 'Nf3']);
    const pgn = viewGame(game).pgn;
    const result = importGame(fresh(), pgn, 'pgn');
    expect(result.ok).toBe(true);
    if (result.ok) expect(viewGame(result.value).fen).toBe(viewGame(game).fen);
    for (const input of ['<script>alert(1)</script>', 'z'.repeat(32769), '1. e5'])
      expect(importGame(fresh(), input, 'pgn').ok).toBe(false);
    for (const input of [null, 'bad', 'x'.repeat(161), '8/8/8/8/8/8/8/8 w - - 0 1', '7k/6K1/8/8/8/8/8/8 w - - 0 1'])
      expect(parseFen(input).ok).toBe(false);
    expect(importGame(fresh(), 'bad', 'fen').ok).toBe(false);
  });
});
