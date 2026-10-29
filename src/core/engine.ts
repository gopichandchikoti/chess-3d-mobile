import type { Chess, Move } from 'chess.js';
import { restoreChess, viewGame } from './chess';
import type { Difficulty, EngineResult, GameRecord } from './contracts';
export interface SearchRuntime {
  now(): number;
  random(): number;
  yieldControl(): Promise<void>;
}
export const defaultRuntime: SearchRuntime = {
  now: () => performance.now(),
  random: () => Math.random(),
  yieldControl: () => new Promise((resolve) => setTimeout(resolve, 0)),
};
export const SEARCH_LIMITS = {
  easy: { depth: 1, nodes: 128, ms: 150 },
  medium: { depth: 2, nodes: 1800, ms: 700 },
  hard: { depth: 4, nodes: 14000, ms: 1800 },
} as const;
const values = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 } as const;
const MATE = 100000;
interface Context {
  nodes: number;
  started: number;
  stopped: boolean;
  signal: AbortSignal;
  difficulty: Difficulty;
  runtime: SearchRuntime;
}
/** Material, activity, pawn advance and king shelter; no claimed playing rating. */
export function evaluate(game: Chess): number {
  let score = 0;
  for (const row of game.board())
    for (const piece of row) {
      if (!piece) continue;
      const file = piece.square.charCodeAt(0) - 97;
      const rank = Number(piece.square[1]) - 1;
      const advance = piece.color === 'w' ? rank : 7 - rank;
      const center = 7 - Math.abs(file - 3.5) - Math.abs(rank - 3.5);
      let position = piece.type === 'p' ? advance * 7 : center * 4;
      if (piece.type === 'k') position = advance < 2 && (file < 3 || file > 4) ? 22 : -advance * 7;
      if (piece.type === 'n' || piece.type === 'b') position += center * 6;
      score += (piece.color === 'w' ? 1 : -1) * (values[piece.type] + position);
    }
  if (game.isCheck()) score += game.turn() === 'w' ? -30 : 30;
  return score * (game.turn() === 'w' ? 1 : -1);
}
function order(moves: Move[]): Move[] {
  return moves.sort((a, b) => priority(b) - priority(a) || a.san.localeCompare(b.san));
}
function priority(move: Move): number {
  return (
    (move.captured ? values[move.captured] * 10 - values[move.piece] : 0) +
    (move.promotion ? values[move.promotion] : 0) +
    (move.san.includes('+') || move.san.includes('#') ? 50 : 0)
  );
}
async function negamax(
  game: Chess,
  depth: number,
  alphaStart: number,
  beta: number,
  context: Context,
  ply: number,
): Promise<number> {
  if (context.signal.aborted) throw new Error('Search cancelled.');
  context.nodes += 1;
  const limits = SEARCH_LIMITS[context.difficulty];
  if (context.nodes >= limits.nodes || context.runtime.now() - context.started >= limits.ms) {
    context.stopped = true;
    return evaluate(game);
  }
  if (context.nodes % 8 === 0) await context.runtime.yieldControl();
  if (game.isCheckmate()) return -MATE + ply;
  if (game.isStalemate() || game.isInsufficientMaterial() || game.isThreefoldRepetition() || game.isDrawByFiftyMoves())
    return 0;
  if (depth <= 0) return evaluate(game);
  let best = -MATE;
  let alpha = alphaStart;
  for (const move of order(game.moves({ verbose: true }))) {
    game.move(move.san);
    const score = -(await negamax(game, depth - 1, -beta, -alpha, context, ply + 1));
    game.undo();
    best = Math.max(best, score);
    alpha = Math.max(alpha, score);
    if (alpha >= beta || context.stopped) break;
  }
  return best;
}
/** Original cancellable bounded search, shared unchanged between browser worker and native scheduler. */
export async function search(
  gameRecord: GameRecord,
  difficulty: Difficulty,
  signal: AbortSignal,
  runtime: SearchRuntime = defaultRuntime,
): Promise<EngineResult> {
  if (signal.aborted) throw new Error('Search cancelled.');
  const view = viewGame(gameRecord);
  if (view.outcome || view.legal.length === 0) throw new Error('No legal moves are available.');
  const game = restoreChess(gameRecord);
  const moves = order(game.moves({ verbose: true }));
  const first = moves[0];
  if (!first) throw new Error('No legal moves are available.');
  if (difficulty === 'easy') {
    const weighted = moves.flatMap((move) => Array.from({ length: move.captured ? 3 : 2 }, () => move));
    const random = Math.min(0.999999, Math.max(0, runtime.random()));
    return { move: weighted[Math.floor(random * weighted.length)]?.san ?? first.san, nodes: moves.length, depth: 1 };
  }
  const context: Context = { nodes: 0, started: runtime.now(), stopped: false, signal, difficulty, runtime };
  let bestMove = first.san;
  let completedDepth = 0;
  for (let depth = 1; depth <= SEARCH_LIMITS[difficulty].depth; depth += 1) {
    let bestScore = -Infinity;
    let candidate = bestMove;
    for (const move of moves) {
      game.move(move.san);
      const score = -(await negamax(game, depth - 1, -MATE, MATE, context, 1));
      game.undo();
      if (score > bestScore) {
        bestScore = score;
        candidate = move.san;
      }
      if (context.stopped) break;
    }
    if (!context.stopped) {
      bestMove = candidate;
      completedDepth = depth;
    }
    if (bestScore >= MATE - 100 || context.stopped) break;
  }
  if (signal.aborted) throw new Error('Search cancelled.');
  return { move: bestMove, nodes: context.nodes, depth: completedDepth };
}
