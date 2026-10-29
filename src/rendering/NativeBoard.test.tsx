import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { AppStateStatus, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { AppState, PanResponder } from 'react-native';
import { createGame, viewGame } from '../core/chess';
import { copy } from '../core/content';
import { palettes } from '../core/tokens';
import { NativeBoard } from './NativeBoard';

const mockFrame: { value: string } = { value: '' };
jest.mock('@react-three/fiber/native', () => ({
  Canvas: ({ frameloop }: { frameloop: string; children: ReactNode }) => {
    mockFrame.value = frameloop;
    return null;
  },
}));
it('supports native orbit, pinch, zoom bounds and background cleanup', async () => {
  const remove = jest.fn();
  const lifecycle: { value: ((state: AppStateStatus) => void) | null } = { value: null };
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_name, listener) => {
    lifecycle.value = listener;
    return { remove };
  });
  jest.spyOn(PanResponder, 'create').mockImplementation((config) => ({
    getInteractionHandle: () => undefined,
    panHandlers: {
      onMoveShouldSetResponderCapture: () => false,
      onStartShouldSetResponderCapture: () => false,
      onStartShouldSetResponder: () => true,
      onResponderEnd: () => undefined,
      onResponderReject: () => undefined,
      onResponderRelease: () => undefined,
      onResponderStart: () => undefined,
      onResponderTerminate: () => undefined,
      onResponderTerminationRequest: () => true,
      onMoveShouldSetResponder: (event: GestureResponderEvent, state?: PanResponderGestureState) =>
        Boolean(state && config.onMoveShouldSetPanResponder?.(event, state)),
      onResponderGrant: (event: GestureResponderEvent, state?: PanResponderGestureState) => {
        if (state) config.onPanResponderGrant?.(event, state);
        return false;
      },
      onResponderMove: (event: GestureResponderEvent, state?: PanResponderGestureState) => {
        if (state) config.onPanResponderMove?.(event, state);
      },
    },
  }));
  const rendered = await render(
    <NativeBoard
      view={viewGame(createGame('gestures', 0, 'local', 'medium'))}
      ui={{ palette: palettes.light, reduced: true }}
      flipped
    />,
  );
  const board = screen.getByLabelText(copy.title);
  const one = { nativeEvent: { touches: [{ pageX: 0, pageY: 0 }] } };
  const two = {
    nativeEvent: {
      touches: [
        { pageX: 0, pageY: 0 },
        { pageX: 100, pageY: 0 },
      ],
    },
  };
  await fireEvent(board, 'moveShouldSetResponder', one, { dx: 0, dy: 0, numberActiveTouches: 1 });
  expect(await fireEvent(board, 'moveShouldSetResponder', one, { dx: 0, dy: 40, numberActiveTouches: 1 })).toBe(false);
  expect(await fireEvent(board, 'moveShouldSetResponder', one, { dx: 40, dy: 0, numberActiveTouches: 1 })).toBe(true);
  await fireEvent(board, 'moveShouldSetResponder', two, { dx: 20, dy: 0, numberActiveTouches: 2 });
  await fireEvent(board, 'responderGrant', one, { dx: 0, dy: 0, numberActiveTouches: 1 });
  await fireEvent(board, 'responderMove', one, { dx: 30, dy: 0, numberActiveTouches: 1 });
  await fireEvent(board, 'responderGrant', two, { dx: 0, dy: 0, numberActiveTouches: 2 });
  await fireEvent(
    board,
    'responderMove',
    {
      nativeEvent: {
        touches: [
          { pageX: 0, pageY: 0 },
          { pageX: 10, pageY: 0 },
        ],
      },
    },
    { dx: 20, dy: 0, numberActiveTouches: 2 },
  );
  for (const name of [copy.flip, copy.zoomIn, copy.zoomOut])
    await fireEvent.press(screen.getByRole('button', { name }));
  await act(async () => lifecycle.value?.('background'));
  expect(mockFrame.value).toBe('never');
  await act(async () => lifecycle.value?.('active'));
  expect(mockFrame.value).toBe('always');
  await rendered.unmount();
  expect(remove).toHaveBeenCalled();
  jest.restoreAllMocks();
});
