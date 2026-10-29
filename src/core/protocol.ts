import { viewGame } from './chess';
import type { Difficulty, EngineResult, GameRecord } from './contracts';
import { isObject, readRecord } from './storage';
export interface EngineRequest {
  id: number;
  game: GameRecord;
  difficulty: Difficulty;
}
export function readRequest(value: unknown): EngineRequest | null {
  if (!isObject(value) || typeof value.id !== 'number' || !Number.isSafeInteger(value.id) || value.id < 0) return null;
  if (value.difficulty !== 'easy' && value.difficulty !== 'medium' && value.difficulty !== 'hard') return null;
  const game = readRecord(value.game);
  return game ? { id: value.id, game, difficulty: value.difficulty } : null;
}
export function readEngineResult(value: unknown, game: GameRecord): EngineResult | null {
  if (!isObject(value) || typeof value.move !== 'string' || value.move.length > 16) return null;
  if (typeof value.nodes !== 'number' || !Number.isInteger(value.nodes) || value.nodes < 0 || value.nodes > 20000)
    return null;
  if (typeof value.depth !== 'number' || !Number.isInteger(value.depth) || value.depth < 0 || value.depth > 4)
    return null;
  if (!viewGame(game).legal.some((move) => move.san === value.move)) return null;
  return { move: value.move, nodes: value.nodes, depth: value.depth };
}
