import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from './App';
import { createGame, viewGame as mockViewGame } from './core/chess';
import { copy } from './core/content';
import type { EnginePort } from './core/contracts';
import { emptyLibrary } from './core/schema';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
    clear: jest.fn(async () => values.clear()),
  };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SafeAreaProvider: View, SafeAreaView: View };
});
jest.mock('./rendering/NativeBoard', () => ({ NativeBoard: () => null }));
jest.mock('./platform/engine', () => ({
  nativeEngine: {
    think: jest.fn<ReturnType<EnginePort['think']>, Parameters<EnginePort['think']>>(async (game) => ({
      move: mockViewGame(game).legal[0]?.san ?? 'e4',
      nodes: 1,
      depth: 1,
    })),
  },
}));
const press = async (name: string) => {
  const button = screen.getAllByRole('button', { name })[0];
  if (!button) throw new Error(`Control missing: ${name}`);
  await fireEvent.press(button);
};
async function confirm() {
  const call = jest.mocked(Alert.alert).mock.calls.at(-1);
  const action = call?.[2]?.[1]?.onPress;
  if (!action) throw new Error('Confirmation missing');
  await act(async () => action());
}
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());
it('uses real native controls for setup, local moves, undo, draw, restart, resignation and progress', async () => {
  await render(<App />);
  await screen.findByText(copy.welcome);
  await press(copy.local);
  await press(copy.start);
  await screen.findByText('White to move');
  await press('e4');
  await screen.findByText('Black to move');
  await press(copy.undo);
  await screen.findByText('White to move');
  await fireEvent.changeText(screen.getByLabelText(copy.to), 'e5');
  await press(copy.move);
  await screen.findByText(/That move is not legal/);
  await press(copy.draw);
  await confirm();
  await screen.findByRole('header', { name: 'Draw by agreement.' });
  await press(copy.restart);
  await confirm();
  await screen.findByText('White to move');
  await press(copy.resign);
  await confirm();
  await screen.findByRole('header', { name: 'Black wins by resignation.' });
  await press(copy.progress);
  await screen.findByText(`${copy.completed}: 2`);
});
it('supports robot difficulty, theme settings, learning completion, legal pages and reset', async () => {
  await render(<App />);
  await screen.findByText(copy.welcome);
  await press(copy.enter);
  await press(copy.hard);
  await press(copy.black);
  await press(copy.start);
  await screen.findByText('Black to move');
  await press(copy.hint);
  await waitFor(() => expect(screen.queryByText(copy.engineError)).toBeNull());
  await press(copy.learn);
  await press(copy.completeLesson);
  expect(await screen.findByRole('button', { name: copy.lessonComplete })).toBeDisabled();
  await press(copy.settings);
  await press(copy.dark);
  await fireEvent(screen.getByLabelText(copy.reduced), 'valueChange', true);
  await fireEvent(screen.getByLabelText(copy.showLegal), 'valueChange', false);
  await fireEvent(screen.getByLabelText(copy.autoRotate), 'valueChange', true);
  await press(copy.privacy);
  await screen.findByText(copy.privacyText);
  await press(copy.terms);
  await screen.findByText(copy.termsText);
  await press(copy.settings);
  await press(copy.reset);
  await confirm();
  await screen.findByText(copy.welcome);
});
it('imports a position, offers native promotion choices and renders game-over safely', async () => {
  await AsyncStorage.setItem(
    'chess-3d.library',
    JSON.stringify({ ...emptyLibrary(), current: createGame('native-ui', 0, 'local', 'medium') }),
  );
  await render(<App />);
  await screen.findByRole('button', { name: copy.resume });
  await press(copy.resume);
  await fireEvent.changeText(screen.getByLabelText(copy.importLabel), 'bad');
  await press(copy.importAction);
  await screen.findByText('The position is not a valid FEN.');
  await fireEvent.changeText(screen.getByLabelText(copy.importLabel), '7k/P7/8/8/8/8/8/7K w - - 0 1');
  await press(copy.importAction);
  await fireEvent.changeText(screen.getByLabelText(copy.from), 'a7');
  await fireEvent.changeText(screen.getByLabelText(copy.to), 'a8');
  await press(copy.move);
  await screen.findByText(copy.promotion);
  await press('knight');
  await screen.findByRole('header', { name: 'Draw by insufficient material.' });
});
it('recovers from corrupted local data without crashing', async () => {
  await AsyncStorage.setItem('chess-3d.library', '{');
  await render(<App />);
  await screen.findByText(copy.corrupt);
  await press(copy.close);
  await screen.findByText(copy.exitMessage);
});
