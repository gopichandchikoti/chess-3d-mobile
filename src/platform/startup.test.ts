import { registerRootComponent } from 'expo';

jest.mock('expo', () => ({ registerRootComponent: jest.fn() }));
jest.mock('../App', () => ({ __esModule: true, default: () => null }));
it('registers a native root component without a WebView', () => {
  jest.requireActual<typeof import('../../index')>('../../index');
  expect(registerRootComponent).toHaveBeenCalledWith(expect.any(Function));
});
