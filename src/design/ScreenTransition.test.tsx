import { render, screen } from '@testing-library/react-native';
import { Animated, Text } from 'react-native';
import { ScreenTransition } from './ScreenTransition';

it('renders reduced-motion screens immediately and stops a replaced screen animation', async () => {
  const start = jest.fn();
  const stop = jest.fn();
  const spring = jest.spyOn(Animated, 'spring').mockReturnValue({ start, stop, reset: jest.fn() });
  const page = await render(
    <ScreenTransition reduced>
      <Text>Native screen</Text>
    </ScreenTransition>,
  );
  expect(screen.getByText('Native screen')).toBeVisible();
  expect(spring).not.toHaveBeenCalled();
  await page.rerender(
    <ScreenTransition reduced={false}>
      <Text>Next screen</Text>
    </ScreenTransition>,
  );
  expect(start).toHaveBeenCalledTimes(1);
  await page.unmount();
  expect(stop).toHaveBeenCalledTimes(1);
  spring.mockRestore();
});
