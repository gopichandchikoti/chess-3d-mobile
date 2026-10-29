import type { Piece, Square } from '../core/contracts';
export interface AnimatedPiece extends Piece {
  id: string;
  alive: boolean;
}
export const coordinates = (square: Square): [number, number, number] => [
  square.charCodeAt(0) - 100.5,
  0,
  4.5 - Number(square[1]),
];
/** Retain the moved piece's identity so its mesh travels rather than remounting. */
export function reconcilePieces(
  previous: AnimatedPiece[],
  next: Piece[],
  last: { from: Square; to: Square } | null,
): AnimatedPiece[] {
  const used = new Set<string>();
  const result = next.map((piece) => {
    const moving =
      last?.to === piece.square
        ? previous.find((item) => item.alive && item.square === last.from && item.color === piece.color)
        : undefined;
    const existing =
      moving ??
      previous.find(
        (item) => item.alive && item.square === piece.square && item.color === piece.color && item.kind === piece.kind,
      );
    const id = existing?.id ?? piece.color + piece.kind + piece.square;
    used.add(id);
    return { ...piece, id, alive: true };
  });
  return [...result, ...previous.filter((piece) => !used.has(piece.id)).map((piece) => ({ ...piece, alive: false }))];
}

/** Fit the near edge of the perspective board inside portrait canvases. */
export function cameraDistance(zoom: number, aspect: number): number {
  return zoom * Math.max(1, 1.25 / Math.max(0.1, aspect));
}
