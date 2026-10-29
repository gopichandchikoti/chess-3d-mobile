import { useEffect, useState } from 'react';
import { moveGame, viewGame } from '../core/chess';
import { copy } from '../core/content';
import type { EnginePort, GameRecord, LibraryData } from '../core/contracts';
import { withCurrent } from '../core/storage';
export function useRobot(
  game: GameRecord | null,
  engine: EnginePort,
  update: (change: (data: LibraryData) => LibraryData) => void,
) {
  const [thinking, setThinking] = useState(false);
  const [engineError, setEngineError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: retryCount is an intentional command to restart a failed search for the unchanged position.
  useEffect(() => {
    const abort = new AbortController();
    setEngineError('');
    if (game?.mode !== 'robot') {
      setThinking(false);
      return () => abort.abort();
    }
    const view = viewGame(game);
    if (view.outcome || view.turn === game.human) {
      setThinking(false);
      return () => abort.abort();
    }
    setThinking(true);
    engine
      .think(game, game.difficulty, abort.signal)
      .then(
        (result) => {
          if (abort.signal.aborted) return;
          const moved = moveGame(game, result.move);
          if (!moved.ok) {
            setEngineError(copy.engineError);
            return;
          }
          update((data) => (data.current === game ? withCurrent(data, moved.value) : data));
        },
        () => {
          if (!abort.signal.aborted) setEngineError(copy.engineError);
        },
      )
      .finally(() => {
        if (!abort.signal.aborted) setThinking(false);
      });
    return () => abort.abort();
  }, [game, engine, update, retryCount]);
  return { thinking, engineError, retry: () => setRetryCount((count) => count + 1) };
}
