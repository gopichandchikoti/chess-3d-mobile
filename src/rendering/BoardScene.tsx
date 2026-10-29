import { useFrame } from '@react-three/fiber/native';
import { useEffect, useState } from 'react';
import { squares } from '../core/chess';
import type { GameView, Square } from '../core/contracts';
import type { Palette } from '../core/tokens';
import { PieceMesh } from './PieceMesh';
import type { AnimatedPiece } from './pieces';
import { cameraDistance, coordinates, reconcilePieces } from './pieces';
export interface SceneProps {
  view: GameView;
  palette: Palette;
  selected: Square | null;
  destinations: Square[];
  reduced: boolean;
  onSelect: (square: Square) => void;
  yaw: number;
  zoom: number;
}
function Camera({ yaw, zoom }: { yaw: number; zoom: number }) {
  useFrame(({ camera, size }) => {
    const distance = cameraDistance(zoom, size.width / Math.max(1, size.height));
    camera.position.set(Math.sin(yaw) * distance, distance * 0.95, Math.cos(yaw) * distance);
    camera.lookAt(0, 0, 0);
  });
  return null;
}
export function BoardScene({ view, palette, selected, destinations, reduced, onSelect, yaw, zoom }: SceneProps) {
  const [pieces, setPieces] = useState<AnimatedPiece[]>(() => reconcilePieces([], view.pieces, null));
  useEffect(() => {
    setPieces((previous) => reconcilePieces(previous, view.pieces, view.lastMove));
    const timeout = setTimeout(
      () => setPieces((previous) => previous.filter((piece) => piece.alive)),
      reduced ? 0 : 300,
    );
    return () => clearTimeout(timeout);
  }, [view.pieces, view.lastMove, reduced]);
  return (
    <>
      <Camera yaw={yaw} zoom={zoom} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[-5, 10, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[5, 4, -4]} intensity={1} />
      <mesh receiveShadow position={[0, -0.25, 0]}>
        <boxGeometry args={[8.6, 0.4, 8.6]} />
        <meshStandardMaterial color={palette.pieceDark} roughness={0.45} />
      </mesh>
      {squares.map((square) => {
        const [x, , z] = coordinates(square);
        const isLegal = destinations.includes(square);
        const active = selected === square;
        const checked = view.check === square;
        const last = view.lastMove?.from === square || view.lastMove?.to === square;
        const file = square.charCodeAt(0) - 97;
        const rank = Number(square[1]);
        let color = (file + rank) % 2 === 0 ? palette.boardLight : palette.boardDark;
        if (last) color = palette.brass;
        if (active) color = palette.primary;
        if (checked) color = palette.error;
        return (
          <group key={square} position={[x, 0, z]}>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Three.js mesh events are paired with labelled move controls outside the canvas. */}
            <mesh
              receiveShadow
              onClick={(event) => {
                event.stopPropagation();
                onSelect(square);
              }}
            >
              <boxGeometry args={[0.99, 0.1, 0.99]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
            {isLegal && (
              <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.23, 0.3, 24]} />
                <meshBasicMaterial color={last || (file + rank) % 2 === 0 ? palette.pieceDark : palette.pieceLight} />
              </mesh>
            )}
          </group>
        );
      })}
      {pieces.map((piece) => (
        <PieceMesh key={piece.id} piece={piece} palette={palette} reduced={reduced} onSelect={onSelect} />
      ))}
    </>
  );
}
