import type { GameRecord, LibraryData, StringStorage } from './contracts';
export const STORAGE_KEY = 'chess-3d.library';
export const MAX_STORAGE_LENGTH = 524288;
export const MAX_HISTORY = 50;
export function emptyLibrary(): LibraryData {
  return {
    schemaVersion: 2,
    settings: { theme: 'system', reducedMotion: false, showLegal: true, autoRotate: false },
    current: null,
    history: [],
    lessons: [],
  };
}
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function withCurrent(data: LibraryData, game: GameRecord): LibraryData {
  const prior = data.history.filter((entry) => entry.id !== game.id);
  return { ...data, current: game, history: game.outcome ? [game, ...prior].slice(0, MAX_HISTORY) : prior };
}
/** Serial writes prevent an older AsyncStorage operation replacing a newer position. */
export function serialStorage(storage: StringStorage): StringStorage {
  let pending = Promise.resolve();
  const enqueue = (operation: () => Promise<void>): Promise<void> => {
    const next = pending.then(operation, operation);
    pending = next;
    return next;
  };
  return {
    get: () => storage.get(),
    set: (value) => enqueue(() => storage.set(value)),
    remove: () => enqueue(() => storage.remove()),
  };
}
