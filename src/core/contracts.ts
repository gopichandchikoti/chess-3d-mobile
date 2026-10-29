export type Color = 'w' | 'b';
export type PieceKind = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Square = import('chess.js').Square;
export type Promotion = 'q' | 'r' | 'b' | 'n';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Mode = 'local' | 'robot';
export type Theme = 'system' | 'light' | 'dark';
export type Screen = 'welcome' | 'setup' | 'game' | 'learn' | 'progress' | 'settings' | 'privacy' | 'terms';
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export type EndReason =
  | 'checkmate'
  | 'stalemate'
  | 'material'
  | 'fivefold'
  | 'seventy-five'
  | 'claim'
  | 'agreement'
  | 'resignation';
export interface Outcome {
  winner: Color | null;
  reason: EndReason;
}
export interface GameRecord {
  id: string;
  createdAt: number;
  initialFen: string;
  moves: string[];
  mode: Mode;
  difficulty: Difficulty;
  human: Color;
  outcome: Outcome | null;
}
export interface Piece {
  square: Square;
  color: Color;
  kind: PieceKind;
}
export interface LegalMove {
  from: Square;
  to: Square;
  san: string;
  promotion?: Promotion;
}
export interface GameView {
  fen: string;
  turn: Color;
  pieces: Piece[];
  legal: LegalMove[];
  history: string[];
  captures: { color: Color; kind: PieceKind }[];
  lastMove: { from: Square; to: Square } | null;
  check: Square | null;
  outcome: Outcome | null;
  claimable: boolean;
  pgn: string;
}
export interface Settings {
  theme: Theme;
  reducedMotion: boolean;
  showLegal: boolean;
  autoRotate: boolean;
}
export interface LibraryData {
  schemaVersion: 2;
  settings: Settings;
  current: GameRecord | null;
  history: GameRecord[];
  lessons: string[];
}
export interface StringStorage {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
  remove(): Promise<void>;
}
export interface EngineResult {
  move: string;
  nodes: number;
  depth: number;
}
export interface EnginePort {
  think(game: GameRecord, difficulty: Difficulty, signal: AbortSignal): Promise<EngineResult>;
}
