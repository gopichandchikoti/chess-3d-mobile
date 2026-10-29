import type { ThreeEvent } from '@react-three/fiber/native';
import { useFrame } from '@react-three/fiber/native';
import { useEffect, useRef } from 'react';
import { type Group, Shape, Vector2 } from 'three';
import type { Square } from '../core/contracts';
import type { Palette } from '../core/tokens';
import { springs } from '../core/tokens';
import type { AnimatedPiece } from './pieces';
import { coordinates } from './pieces';

const horse = new Shape();
horse.moveTo(-0.22, 0);
horse.lineTo(0.22, 0);
horse.lineTo(0.12, 0.35);
horse.lineTo(0.34, 0.48);
horse.lineTo(0.27, 0.75);
horse.lineTo(0.07, 0.88);
horse.lineTo(-0.06, 1.04);
horse.lineTo(-0.14, 0.79);
horse.lineTo(-0.25, 0.57);
horse.closePath();
const profile = [
  new Vector2(0.24, 0.13),
  new Vector2(0.25, 0.22),
  new Vector2(0.14, 0.3),
  new Vector2(0.1, 0.58),
  new Vector2(0.21, 0.69),
  new Vector2(0.2, 0.75),
];
export function PieceMesh({
  piece,
  palette,
  reduced,
  onSelect,
}: {
  piece: AnimatedPiece;
  palette: Palette;
  reduced: boolean;
  onSelect: (square: Square) => void;
}) {
  const group = useRef<Group>(null);
  const target = coordinates(piece.square);
  const velocity = useRef([0, 0, 0, 0]);
  const initial = useRef(target);
  const color = piece.color === 'w' ? palette.pieceLight : palette.pieceDark;
  useEffect(() => {
    if (group.current) group.current.scale.setScalar(reduced ? 1 : piece.kind === 'p' ? 0.6 : 0.65);
  }, [piece.kind, reduced]);
  useFrame((_, delta) => {
    const mesh = group.current;
    if (!mesh) return;
    const dt = Math.min(delta, 1 / 60);
    const omega = (2 * Math.PI) / springs.snappy.response;
    for (const axis of [0, 1, 2] as const) {
      const key = (['x', 'y', 'z'] as const)[axis];
      const destination = target[axis];
      if (reduced) {
        mesh.position[key] = destination;
        continue;
      }
      const speed = velocity.current[axis] ?? 0;
      const nextSpeed =
        speed + (omega * omega * (destination - mesh.position[key]) - 2 * springs.snappy.damping * omega * speed) * dt;
      velocity.current[axis] = nextSpeed;
      mesh.position[key] += nextSpeed * dt;
    }
    const desired = piece.alive ? 1 : 0;
    mesh.scale.setScalar(reduced ? desired : mesh.scale.x + (desired - mesh.scale.x) * Math.min(1, dt * 18));
  });
  const choose = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (piece.alive) onSelect(piece.square);
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Three.js objects are not DOM elements; labelled move controls provide the accessible interaction path.
    <group ref={group} position={initial.current} onClick={choose}>
      <mesh castShadow receiveShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.31, 0.34, 0.16, 20]} />
        <meshStandardMaterial color={color} roughness={0.32} />
      </mesh>
      <mesh castShadow>
        <latheGeometry args={[profile, 20]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      {piece.kind === 'p' && (
        <mesh castShadow position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.18, 16, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      {piece.kind === 'n' && (
        <mesh castShadow position={[0, 0.26, -0.09]} rotation={[0, piece.color === 'b' ? Math.PI : 0, 0]}>
          <extrudeGeometry
            args={[
              horse,
              { depth: 0.18, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.025, bevelThickness: 0.025 },
            ]}
          />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      {piece.kind === 'b' && (
        <group>
          <mesh castShadow position={[0, 0.91, 0]}>
            <coneGeometry args={[0.2, 0.42, 20]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.065, 10, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}
      {piece.kind === 'r' && (
        <group>
          <mesh castShadow position={[0, 0.86, 0]}>
            <cylinderGeometry args={[0.26, 0.2, 0.25, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {[0, 1, 2, 3].map((index) => (
            <mesh
              key={index}
              castShadow
              position={[Math.cos((index * Math.PI) / 2) * 0.19, 1.04, Math.sin((index * Math.PI) / 2) * 0.19]}
            >
              <boxGeometry args={[0.13, 0.16, 0.13]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </group>
      )}
      {piece.kind === 'q' && (
        <group>
          <mesh castShadow position={[0, 0.88, 0]}>
            <coneGeometry args={[0.24, 0.32, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {[0, 1, 2, 3, 4].map((index) => (
            <mesh
              key={index}
              position={[Math.cos(index * Math.PI * 0.4) * 0.18, 1.09, Math.sin(index * Math.PI * 0.4) * 0.18]}
            >
              <sphereGeometry args={[0.065, 8, 6]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </group>
      )}
      {piece.kind === 'k' && (
        <group>
          <mesh castShadow position={[0, 0.91, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 0.36, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[0, 1.23, 0]}>
            <boxGeometry args={[0.1, 0.33, 0.1]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh castShadow position={[0, 1.27, 0]}>
            <boxGeometry args={[0.3, 0.09, 0.1]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}
    </group>
  );
}
