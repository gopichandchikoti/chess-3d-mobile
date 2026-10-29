jest.mock('@react-three/fiber/native', () =>
  jest.requireActual<typeof import('@react-three/fiber')>('@react-three/fiber'),
);

import ReactThreeTestRenderer from '@react-three/test-renderer';
import { createGame, moveGame, viewGame } from '../core/chess';
import type { Square } from '../core/contracts';
import { palettes } from '../core/tokens';
import { BoardScene } from './BoardScene';
import { cameraDistance, coordinates, reconcilePieces } from './pieces';

describe('procedural 3D board behavior', () => {
  it('renders all silhouettes, selection and legal destinations, and animates a legal move', async () => {
    const initial = createGame('scene', 0, 'local', 'medium');
    const selected: Square[] = [];
    const props = {
      view: viewGame(initial),
      palette: palettes.light,
      selected: 'e2' as const,
      destinations: ['e4' as const],
      reduced: false,
      onSelect: (square: Square) => selected.push(square),
      yaw: 0,
      zoom: 9.2,
    };
    const renderer = await ReactThreeTestRenderer.create(<BoardScene {...props} />);
    expect(renderer.scene.children.length).toBeGreaterThan(64);
    expect(renderer.toGraph()).toBeDefined();
    await renderer.advanceFrames(5, 1 / 60);
    const target = renderer.scene.findAll(
      (instance) => instance.type === 'Mesh' && typeof instance.props.onClick === 'function',
    )[1];
    if (!target) throw new Error('Interactive square missing');
    await renderer.fireEvent(target, 'click');
    expect(selected.length).toBe(1);
    const result = moveGame(initial, 'e4');
    if (!result.ok) throw new Error(result.error);
    await renderer.update(
      <BoardScene
        {...props}
        view={viewGame(result.value)}
        palette={palettes.dark}
        selected={null}
        reduced
        yaw={Math.PI}
        zoom={8}
      />,
    );
    await renderer.advanceFrames(2, 1 / 60);
    await renderer.unmount();
  });
  it('retains identities, removes captured meshes and handles new squares and promotion', () => {
    const before = reconcilePieces(
      [],
      [
        { square: 'e2', color: 'w', kind: 'p' },
        { square: 'd3', color: 'b', kind: 'p' },
      ],
      null,
    );
    const after = reconcilePieces(before, [{ square: 'd3', color: 'w', kind: 'p' }], { from: 'e2', to: 'd3' });
    expect(after.find((piece) => piece.alive)?.id).toBe(before[0]?.id);
    expect(after.filter((piece) => !piece.alive)).toHaveLength(1);
    expect(coordinates('a1')).toEqual([-3.5, 0, 3.5]);
    const promoted = reconcilePieces(after, [{ square: 'd3', color: 'w', kind: 'q' }], { from: 'd3', to: 'd3' });
    expect(promoted[0]?.kind).toBe('q');
  });
});

it('fits the board in both landscape and narrow portrait cameras', () => {
  expect(cameraDistance(9, 2)).toBe(9);
  expect(cameraDistance(9, 0.8)).toBeGreaterThan(9);
  expect(Number.isFinite(cameraDistance(9, 0))).toBe(true);
});
