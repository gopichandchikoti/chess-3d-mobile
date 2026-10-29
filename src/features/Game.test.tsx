import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Alert } from 'react-native';
import { createGame, importGame, moveGame, viewGame } from '../core/chess';
import { copy } from '../core/content';
import type { EnginePort, GameRecord, LibraryData, Square } from '../core/contracts';
import { emptyLibrary, withCurrent } from '../core/schema';
import { palettes } from '../core/tokens';
import { Game } from './Game';

const mockThink = jest.fn<ReturnType<EnginePort['think']>, Parameters<EnginePort['think']>>();
jest.mock('../platform/engine', () => ({
  nativeEngine: { think: (...args: Parameters<EnginePort['think']>) => mockThink(...args) },
}));
jest.mock('../rendering/NativeBoard', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View, Text, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    NativeBoard: ({ onSelect }: { onSelect: (square: Square) => void }) =>
      React.createElement(
        View,
        {},
        (['e2', 'e4', 'e7', 'e5', 'a7', 'a8', 'h8'] as const).map((square) =>
          React.createElement(
            Pressable,
            {
              key: square,
              accessibilityRole: 'button',
              accessibilityLabel: `Select ${square}`,
              onPress: () => onSelect(square),
            },
            React.createElement(Text, {}, `Select ${square}`),
          ),
        ),
      ),
  };
});
function Harness({ record }: { record: GameRecord }) {
  const [data, setData] = useState<LibraryData>(() => withCurrent(emptyLibrary(), record));
  return (
    <Game
      game={data.current ?? record}
      data={data}
      ui={{ palette: palettes.light, reduced: true }}
      update={setData}
      restart={() => setData(withCurrent(data, createGame('new', 0, 'local', 'medium')))}
    />
  );
}
function setup(fen?: string, mode: 'local' | 'robot' = 'local') {
  let record = createGame('native-focused', 0, mode, 'medium');
  if (fen) {
    const parsed = importGame(record, fen, 'fen');
    if (!parsed.ok) throw new Error(parsed.error);
    record = parsed.value;
  }
  return record;
}
const press = async (name: string) => {
  await fireEvent.press(screen.getByRole('button', { name }));
};
beforeEach(() => {
  mockThink.mockReset();
  mockThink.mockImplementation(async (record) => ({
    move: viewGame(record).legal[0]?.san ?? 'e4',
    nodes: 1,
    depth: 1,
  }));
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());
it('keeps selected native squares synchronized and explains failed hints without changing difficulty', async () => {
  await render(<Harness record={setup()} />);
  await press('Select h8');
  await screen.findByText(copy.illegal);
  await press('Select e2');
  await press('Select e4');
  await screen.findByRole('header', { name: 'Black to move' });
  await press('Select e7');
  await press('e5');
  await screen.findByRole('header', { name: 'White to move' });
  mockThink.mockRejectedValueOnce(new Error('failed'));
  await press(copy.hint);
  await screen.findByText(copy.engineError);
  await press(copy.hint);
  await waitFor(() => expect(mockThink).toHaveBeenCalledTimes(2));
  await press(copy.resign);
  const resign = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2]?.[1]?.onPress;
  if (!resign) throw new Error('Confirmation missing');
  await act(async () => resign());
  await screen.findByRole('header', { name: 'Black wins by resignation.' });
});
it('supports promotion cancellation, underpromotion and a valid draw claim', async () => {
  const first = await render(<Harness record={setup('7k/P7/8/8/8/8/8/7K w - - 0 1')} />);
  await press('Select a7');
  await press('Select a8');
  await press(copy.cancel);
  await press('Select a8');
  await press('rook');
  await screen.findByRole('header', { name: 'Black to move' });
  await first.unmount();
  await render(<Harness record={setup('7k/8/5K2/8/8/8/8/R7 w - - 100 1')} />);
  await press(copy.claim);
  await screen.findByRole('header', { name: 'Draw by a claimed draw.' });
});
it('offers explicit recovery when the native engine fails and ignores board input during robot turns', async () => {
  const moved = moveGame(setup(undefined, 'robot'), 'e4');
  if (!moved.ok) throw new Error(moved.error);
  mockThink.mockRejectedValueOnce(new Error('timeout'));
  await render(<Harness record={moved.value} />);
  await screen.findByRole('button', { name: copy.retry });
  await press('Select e7');
  await screen.findByRole('header', { name: 'Black to move' });
  await press(copy.retry);
  await screen.findByRole('header', { name: 'White to move' });
  expect(mockThink.mock.calls[1]?.[1]).toBe('medium');
});
it('imports PGN, exports selectable PGN and rejects invalid coordinates', async () => {
  await render(<Harness record={setup()} />);
  const format = screen.getAllByRole('button', { name: copy.pgn })[0];
  if (!format) throw new Error('PGN format missing');
  await fireEvent.press(format);
  await fireEvent.changeText(screen.getByLabelText(copy.importLabel), '1. e4 e5');
  await press(copy.importAction);
  await screen.findByRole('header', { name: 'White to move' });
  const exportButton = screen.getByRole('button', { name: copy.showPgn });
  if (!exportButton) throw new Error('PGN export missing');
  await fireEvent.press(exportButton);
  await screen.findByText(/1\. e4 e5/);
  await fireEvent.press(exportButton);
  await fireEvent.changeText(screen.getByLabelText(copy.from), 'zz');
  await press(copy.move);
  await screen.findByText(copy.illegal);
});

it('cancels a pending hint when a legal move changes its position', async () => {
  const signals: AbortSignal[] = [];
  mockThink.mockImplementationOnce((_record, _difficulty, signal) => {
    signals.push(signal);
    return new Promise(() => undefined);
  });
  await render(<Harness record={setup()} />);
  await press(copy.hint);
  await press(copy.move);
  await screen.findByRole('header', { name: 'Black to move' });
  expect(signals[0]?.aborted).toBe(true);
});
