import { fireEvent, render, screen } from '@testing-library/react-native';
import { copy } from '../core/content';
import { palettes } from '../core/tokens';
import { Boundary } from './Boundary';

function Broken(): never {
  throw new Error('render failed');
}
it('keeps errors safe and provides retry for both page and board failures', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  for (const board of [true, false]) {
    const page = await render(
      <Boundary ui={{ palette: palettes.light, reduced: true }} board={board}>
        <Broken />
      </Boundary>,
    );
    await screen.findByText(board ? copy.boardError : copy.errorText);
    await fireEvent.press(screen.getByRole('button', { name: copy.retry }));
    expect(screen.getByRole('alert')).toBeVisible();
    await page.unmount();
  }
  error.mockRestore();
});
