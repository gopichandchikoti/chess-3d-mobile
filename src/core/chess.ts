import { Chess, DEFAULT_POSITION, SQUARES, validateFen } from 'chess.js';
import type {
  Color,
  Difficulty,
  GameRecord,
  GameView,
  LegalMove,
  Mode,
  Outcome,
  Promotion,
  Result,
  Square,
} from './contracts';
export const MAX_PLIES = 1200;
export const MAX_PGN_LENGTH = 32768;
export const INITIAL_FEN = DEFAULT_POSITION;
export const squares: readonly Square[] = SQUARES;
const positionKey = (fen: string): string => fen.split(' ').slice(0, 4).join(' ');
export function isSquare(value: unknown): value is Square {
  return typeof value === 'string' && /^[a-h][1-8]$/.test(value);
}
/** Reject hostile or impossible setup positions before they reach rules or search. */
export function parseFen(value: unknown): Result<string> {
  if (typeof value !== 'string' || value.length > 160 || !/^[prnbqkPRNBQK1-8/ wbKQkq0-9a-h-]+$/.test(value)) {
    return { ok: false, error: 'The position is not a valid FEN.' };
  }
  if (!validateFen(value).ok) return { ok: false, error: 'The position is not a valid FEN.' };
  const game = new Chess(value);
  const other = game.turn() === 'w' ? 'b' : 'w';
  const pieces = game
    .board()
    .flat()
    .filter((piece) => piece !== null);
  const otherKing = pieces.find((piece) => piece.color === other && piece.type === 'k');
  if (!otherKing || game.isAttacked(otherKing.square, game.turn())) {
    return { ok: false, error: 'The side that just moved cannot leave its king in check.' };
  }
  for (const color of ['w', 'b'] as const) {
    if (pieces.filter((piece) => piece.color === color).length > 16) {
      return { ok: false, error: 'The position has too many pieces.' };
    }
    if (pieces.filter((piece) => piece.color === color && piece.type === 'p').length > 8) {
      return { ok: false, error: 'The position has too many pawns.' };
    }
  }
  return { ok: true, value: game.fen() };
}
export function createGame(
  id: string,
  now: number,
  mode: Mode,
  difficulty: Difficulty,
  human: Color = 'w',
): GameRecord {
  return { id, createdAt: now, initialFen: INITIAL_FEN, moves: [], mode, difficulty, human, outcome: null };
}
/** Replaying the complete sequence preserves castling rights and repetition through undo and restore. */
export function restoreChess(record: GameRecord): Chess {
  const game = new Chess(record.initialFen);
  for (const san of record.moves) game.move(san, { strict: true });
  return game;
}
function repetitionCount(game: Chess): number {
  const history = game.history({ verbose: true });
  const initial = history[0]?.before ?? game.fen();
  const current = positionKey(game.fen());
  return [initial, ...history.map((move) => move.after)].filter((fen) => positionKey(fen) === current).length;
}
/** chess.js treats threefold/50 moves as game over; this adapter keeps those claimable until 5/75. */
export function automaticOutcome(game: Chess): Outcome | null {
  if (game.isCheckmate()) return { winner: game.turn() === 'w' ? 'b' : 'w', reason: 'checkmate' };
  if (game.isStalemate()) return { winner: null, reason: 'stalemate' };
  if (game.isInsufficientMaterial()) return { winner: null, reason: 'material' };
  if (repetitionCount(game) >= 5) return { winner: null, reason: 'fivefold' };
  if (Number(game.fen().split(' ')[4]) >= 150) return { winner: null, reason: 'seventy-five' };
  return null;
}
export function viewGame(record: GameRecord): GameView {
  const game = restoreChess(record);
  const verbose = game.history({ verbose: true });
  const last = verbose.at(-1);
  const pieces = game
    .board()
    .flatMap((row) =>
      row.flatMap((piece) => (piece ? [{ square: piece.square, color: piece.color, kind: piece.type }] : [])),
    );
  const outcome = record.outcome ?? automaticOutcome(game);
  return {
    fen: game.fen(),
    turn: game.turn(),
    pieces,
    legal: outcome
      ? []
      : game.moves({ verbose: true }).map((move): LegalMove => {
          const base = { from: move.from, to: move.to, san: move.san };
          const promotion = move.promotion;
          return promotion === 'q' || promotion === 'r' || promotion === 'b' || promotion === 'n'
            ? { ...base, promotion }
            : base;
        }),
    history: game.history(),
    captures: verbose.flatMap((move) =>
      move.captured ? [{ color: move.color === 'w' ? ('b' as const) : ('w' as const), kind: move.captured }] : [],
    ),
    lastMove: last ? { from: last.from, to: last.to } : null,
    check: game.isCheck()
      ? (pieces.find((piece) => piece.color === game.turn() && piece.kind === 'k')?.square ?? null)
      : null,
    outcome,
    claimable: !outcome && (repetitionCount(game) >= 3 || game.isDrawByFiftyMoves()),
    pgn: game.pgn(),
  };
}
export function moveGame(record: GameRecord, san: string): Result<GameRecord> {
  if (viewGame(record).outcome || record.moves.length >= MAX_PLIES)
    return { ok: false, error: 'This game cannot accept another move.' };
  const game = restoreChess(record);
  if (!game.moves().includes(san))
    return { ok: false, error: 'That move is not legal. Choose one of the legal moves.' };
  game.move(san, { strict: true });
  return { ok: true, value: { ...record, moves: [...record.moves, san], outcome: automaticOutcome(game) } };
}
export function coordinateMove(
  record: GameRecord,
  from: Square,
  to: Square,
  promotion?: Promotion,
): Result<GameRecord> {
  const move = viewGame(record).legal.find(
    (candidate) => candidate.from === from && candidate.to === to && candidate.promotion === promotion,
  );
  if (!move) return { ok: false, error: 'That move is not legal. Choose one of the legal moves.' };
  return moveGame(record, move.san);
}
export function undoGame(record: GameRecord): GameRecord {
  const view = viewGame(record);
  const count = record.mode === 'robot' && view.turn === record.human ? 2 : 1;
  return { ...record, moves: record.moves.slice(0, Math.max(0, record.moves.length - count)), outcome: null };
}
export function endGame(record: GameRecord, reason: 'resignation' | 'agreement' | 'claim'): Result<GameRecord> {
  const view = viewGame(record);
  if (view.outcome) return { ok: false, error: 'The game has already finished.' };
  if (reason === 'claim' && !view.claimable) return { ok: false, error: 'A draw cannot be claimed in this position.' };
  const loser = record.mode === 'robot' ? record.human : view.turn;
  return {
    ok: true,
    value: { ...record, outcome: { winner: reason === 'resignation' ? (loser === 'w' ? 'b' : 'w') : null, reason } },
  };
}
export function importGame(record: GameRecord, text: string, format: 'fen' | 'pgn'): Result<GameRecord> {
  if (format === 'fen') {
    const parsed = parseFen(text.trim());
    if (!parsed.ok) return parsed;
    const next = { ...record, initialFen: parsed.value, moves: [], outcome: null };
    return { ok: true, value: { ...next, outcome: automaticOutcome(restoreChess(next)) } };
  }
  if (
    text.length > MAX_PGN_LENGTH ||
    /[<>]/.test(text) ||
    Array.from(text).some((character) => character.charCodeAt(0) < 9)
  )
    return { ok: false, error: 'The PGN is too large or contains unsupported text.' };
  const game = new Chess();
  try {
    game.loadPgn(text, { strict: true });
  } catch {
    return { ok: false, error: 'The PGN could not be read.' };
  }
  const moves = game.history({ verbose: true });
  const initialFen = moves[0]?.before ?? game.fen();
  if (moves.length > MAX_PLIES || !parseFen(initialFen).ok)
    return { ok: false, error: 'The PGN exceeds the supported limits.' };
  return { ok: true, value: { ...record, initialFen, moves: game.history(), outcome: automaticOutcome(game) } };
}
