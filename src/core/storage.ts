import { MAX_PLIES, parseFen, restoreChess } from './chess';
import type { GameRecord, LibraryData, Outcome } from './contracts';
import { emptyLibrary, isObject, MAX_HISTORY, MAX_STORAGE_LENGTH } from './schema';

export {
  emptyLibrary,
  isObject,
  MAX_HISTORY,
  MAX_STORAGE_LENGTH,
  STORAGE_KEY,
  serialStorage,
  withCurrent,
} from './schema';

function isOutcome(value: unknown): value is Outcome | null {
  if (value === null) return true;
  return (
    isObject(value) &&
    (value.winner === null || value.winner === 'w' || value.winner === 'b') &&
    ['checkmate', 'stalemate', 'material', 'fivefold', 'seventy-five', 'claim', 'agreement', 'resignation'].includes(
      String(value.reason),
    )
  );
}
/** Only validated move histories cross the storage and worker boundaries. Unknown properties are ignored. */
export function readRecord(value: unknown): GameRecord | null {
  if (!isObject(value) || typeof value.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(value.id)) return null;
  if (
    typeof value.createdAt !== 'number' ||
    !Number.isFinite(value.createdAt) ||
    value.createdAt < 0 ||
    value.createdAt > 8640000000000000
  )
    return null;
  if (!parseFen(value.initialFen).ok || typeof value.initialFen !== 'string') return null;
  if (
    !Array.isArray(value.moves) ||
    value.moves.length > MAX_PLIES ||
    !value.moves.every((move: unknown) => typeof move === 'string' && move.length <= 16)
  )
    return null;
  if (value.mode !== 'local' && value.mode !== 'robot') return null;
  if (value.difficulty !== 'easy' && value.difficulty !== 'medium' && value.difficulty !== 'hard') return null;
  if (value.human !== 'w' && value.human !== 'b') return null;
  if (!isOutcome(value.outcome)) return null;
  const moves: string[] = value.moves.filter((move: unknown): move is string => typeof move === 'string');
  const record: GameRecord = {
    id: value.id,
    createdAt: value.createdAt,
    initialFen: value.initialFen,
    moves,
    mode: value.mode,
    difficulty: value.difficulty,
    human: value.human,
    outcome: value.outcome,
  };
  try {
    restoreChess(record);
  } catch {
    return null;
  }
  return record;
}
export type StorageIssue = 'corrupt' | 'oversized' | 'unsupported' | null;
export function decodeLibrary(raw: string | null): { data: LibraryData; issue: StorageIssue } {
  const fallback = emptyLibrary();
  if (raw === null) return { data: fallback, issue: null };
  if (raw.length > MAX_STORAGE_LENGTH) return { data: fallback, issue: 'oversized' };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { data: fallback, issue: 'corrupt' };
  }
  if (!isObject(value)) return { data: fallback, issue: 'corrupt' };
  if (value.schemaVersion === 1 && (value.theme === 'light' || value.theme === 'dark' || value.theme === 'system')) {
    return { data: { ...fallback, settings: { ...fallback.settings, theme: value.theme } }, issue: null };
  }
  if (value.schemaVersion !== 2) return { data: fallback, issue: 'unsupported' };
  const settings = value.settings;
  if (
    !isObject(settings) ||
    !['system', 'light', 'dark'].includes(String(settings.theme)) ||
    typeof settings.reducedMotion !== 'boolean' ||
    typeof settings.showLegal !== 'boolean' ||
    typeof settings.autoRotate !== 'boolean'
  )
    return { data: fallback, issue: 'corrupt' };
  if (
    !Array.isArray(value.history) ||
    value.history.length > MAX_HISTORY ||
    !Array.isArray(value.lessons) ||
    value.lessons.length > 12
  )
    return { data: fallback, issue: 'corrupt' };
  const current = value.current === null ? null : readRecord(value.current);
  const history = value.history.map(readRecord);
  if ((value.current !== null && !current) || history.some((record) => record === null || record.outcome === null))
    return { data: fallback, issue: 'corrupt' };
  const lessons = value.lessons.filter(
    (lesson: unknown): lesson is string => typeof lesson === 'string' && /^lesson-[1-6]$/.test(lesson),
  );
  if (lessons.length !== value.lessons.length) return { data: fallback, issue: 'corrupt' };
  const theme = settings.theme;
  if (theme !== 'system' && theme !== 'light' && theme !== 'dark') return { data: fallback, issue: 'corrupt' };
  return {
    data: {
      schemaVersion: 2,
      settings: {
        theme,
        reducedMotion: settings.reducedMotion,
        showLegal: settings.showLegal,
        autoRotate: settings.autoRotate,
      },
      current,
      history: history.filter((record): record is GameRecord => record !== null),
      lessons: [...new Set(lessons)],
    },
    issue: null,
  };
}
