import type { Color, Difficulty, GameView, Outcome } from './contracts';
export const names = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' } as const;
export const sideName = (color: Color): string => (color === 'w' ? 'White' : 'Black');
export const copy = {
  offlineReady: 'Ready for offline play.',
  offlineUnavailable: 'Offline caching is unavailable. Keep this tab open to continue playing offline.',
  updateReady: 'An app update is ready.',
  applyUpdate: 'Load update',
  removeOffline: 'Remove offline cache',
  offlineDisabled: 'Offline caching is disabled. Reload without offline=off to enable it again.',
  pending: 'Pending',
  robotDraw: 'Rook accepts friendly draw offers.',
  openBoard: 'Open the 3D board',
  previewIntro: 'Explore the board before starting a game.',
  title: 'Chess 3D',
  eyebrow: 'Offline chess on this device',
  enter: 'Enter the Game',
  welcome: 'Play a game of chess.',
  intro: 'Settle in for a game at your own pace. Play a friend, meet your offline robot, or learn one move at a time.',
  local: 'Two players',
  robot: 'Play the robot',
  learn: 'Learn chess',
  progress: 'Your progress',
  settings: 'Settings',
  welcomeLink: 'Welcome',
  resume: 'Continue your game',
  setup: 'Make it your game',
  start: 'Start game',
  mode: 'Players',
  difficulty: 'Robot difficulty',
  color: 'Your pieces',
  white: 'White',
  black: 'Black',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  engineNote: 'An original offline engine. Difficulty is relative; no rating is claimed.',
  loading: 'Opening your local library…',
  boardLoading: 'Setting up the 3D board…',
  boardError: 'The 3D board could not start. You can still play using the legal move controls.',
  retry: 'Try again',
  turn: 'to move',
  assistant: 'Meet Rook, your offline robot',
  assistantIntro:
    'I am Rook, an offline robot. I explain the position using local chess rules. No messages leave your device.',
  hint: 'Show a hint',
  thinking: 'Rook is considering a move…',
  engineError:
    'The robot could not find a move. Retry, change difficulty in a new game, or play two players. No weaker engine was substituted.',
  legal: 'Legal moves',
  selectPiece: 'Choose a piece on the board, or choose a legal move below.',
  from: 'From square',
  to: 'Destination',
  move: 'Play move',
  illegal: 'That move is not legal. Choose a highlighted destination or a legal move.',
  history: 'Move history',
  noMoves: 'The first move is yours.',
  captured: 'Captured pieces',
  none: 'None yet',
  undo: 'Undo',
  restart: 'Restart game',
  resign: 'Resign',
  draw: 'Offer a draw',
  claim: 'Claim a draw',
  drawQuestion: 'Agree to a draw?',
  drawDescription: 'Pass the device to the other player. The other player must accept the draw.',
  accept: 'Accept draw',
  decline: 'Keep playing',
  resignQuestion: 'Resign this game?',
  restartQuestion: 'Start this game again?',
  resetQuestion: 'Erase your local progress?',
  resetDescription: 'This removes games, settings and learning progress from this device. This cannot be undone.',
  confirm: 'Confirm',
  cancel: 'Cancel',
  promotion: 'Choose a promotion',
  promotionDescription: 'Choose the piece your pawn becomes.',
  flip: 'Turn board',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  camera: 'Drag to orbit. Use the zoom controls.',
  newGame: 'New game',
  completed: 'Completed games',
  wins: 'Wins against Rook',
  lessonsDone: 'Lessons completed',
  achievement: 'Milestones',
  firstGame: 'Finish your first game',
  firstWin: 'Win against the robot',
  student: 'Complete all six lessons',
  noHistory: 'Your finished games will appear here.',
  completeLesson: 'Mark lesson complete',
  lessonComplete: 'Lesson completed',
  theme: 'Appearance',
  system: 'Use device theme',
  light: 'Light',
  dark: 'Dark',
  reduced: 'Reduce motion',
  showLegal: 'Show legal destinations',
  autoRotate: 'Turn board after each move in two-player games',
  reset: 'Reset local data',
  storageNote:
    'Games stay on this device. Clearing browser or app storage deletes your progress. There is no cloud backup.',
  storageError:
    'Local data could not be read or saved. You can keep playing, but changes may not survive closing the app.',
  corrupt:
    'Saved data could not be restored safely. Your current session starts fresh. Reset local data to clear the damaged copy.',
  close: 'Return to welcome',
  exitMessage: 'You are at the welcome screen. To exit, close this browser tab or leave the app.',
  privacy: 'Privacy',
  terms: 'Terms',
  notFound: 'This page is not on the board.',
  back: 'Back to welcome',
  privacyText:
    'Chess 3D stores settings, move histories and lesson progress only in this browser or app. It has no accounts, analytics, remote game service or runtime API keys. Your host may receive ordinary static-file requests on web. The native app uses bundled assets and local storage. Reset local data removes this app’s stored progress; clearing device storage also deletes it. No game data is synchronized.',
  termsText:
    'Use Chess 3D for offline play and learning. The original app and engine are MIT licensed. Third-party components retain their own MIT, BSD, Apache and font licenses. The engine is a bounded original search with no claimed rating. Chess education and hints may be limited. Software is provided without warranty. You control local data deletion. Review the bundled LICENSE and THIRD_PARTY_NOTICES before redistribution.',
  importTitle: 'Load a position or game',
  importLabel: 'FEN or PGN',
  importAction: 'Load game',
  showPgn: 'View PGN',
  exportAction: 'Copy PGN',
  copied: 'PGN copied.',
  copyFailed: 'PGN could not be copied. Select the move history instead.',
  format: 'Format',
  fen: 'FEN position',
  pgn: 'PGN game',
  errorTitle: 'Something interrupted the game',
  errorText: 'Return to welcome and try opening the game again.',
  unknown: 'Unknown result',
  completedLabel: 'Complete',
} as const;
export const lessons = [
  {
    id: 'lesson-1',
    title: 'The board and the goal',
    body: 'White moves first. Players alternate turns on 64 squares. Win by checking the enemy king so it has no legal escape. The king is never captured.',
    task: 'Start a two-player game and identify e4. A light square belongs on each player’s right.',
  },
  {
    id: 'lesson-2',
    title: 'How the pieces move',
    body: 'Rooks travel straight. Bishops travel diagonally. Queens combine both. Knights jump in an L. Kings move one square. Pawns move forward and capture diagonally.',
    task: 'Open a game and compare the legal moves of a pawn and a knight.',
  },
  {
    id: 'lesson-3',
    title: 'Check and king safety',
    body: 'A checked king must escape, capture the attacker, or block the attack. You cannot leave your king in check. Two kings can never stand next to each other.',
    task: 'Use legal move highlights to see which moves keep your king safe.',
  },
  {
    id: 'lesson-4',
    title: 'Three special moves',
    body: 'Castle only when the king and rook have not moved, the path is clear, and the king is not in, through or into check. En passant is available only immediately after a two-square pawn move. A pawn on the last rank must promote to a queen, rook, bishop or knight.',
    task: 'Try an underpromotion when a pawn reaches the final rank.',
  },
  {
    id: 'lesson-5',
    title: 'When a game is drawn',
    body: 'Stalemate means no legal moves without check. Insufficient material is drawn. Claim threefold repetition or 50 moves by each side without a pawn move or capture. Fivefold repetition and 75 moves are automatic. Checkmate on the final move takes priority. Players may agree to a draw.',
    task: 'A FEN alone cannot carry earlier repetition history. Import PGN or resume a saved game to preserve it.',
  },
  {
    id: 'lesson-6',
    title: 'A practical opening plan',
    body: 'Control the center, develop knights and bishops, protect your king and avoid moving the same piece repeatedly without a reason. Look for checks, captures and threats before every move.',
    task: 'Play the robot on Easy and ask Rook for a hint. A hint is a suggestion, never a guarantee.',
  },
] as const;
export function outcomeText(outcome: Outcome): string {
  const reasons = {
    checkmate: 'checkmate',
    stalemate: 'stalemate',
    material: 'insufficient material',
    fivefold: 'fivefold repetition',
    'seventy-five': 'the 75-move rule',
    claim: 'a claimed draw',
    agreement: 'agreement',
    resignation: 'resignation',
  };
  return outcome.winner
    ? `${sideName(outcome.winner)} wins by ${reasons[outcome.reason]}.`
    : `Draw by ${reasons[outcome.reason]}.`;
}
const commentary = {
  easy: 'Choose a legal destination. Try developing a knight or bishop and protecting your king.',
  medium: 'Compare checks, captures and threats before choosing a move.',
  hard: 'Calculate your opponent’s strongest reply before committing to a forcing line.',
} satisfies Record<Difficulty, string>;
function explainLastMove(view: GameView, san: string): string {
  const move = view.lastMove;
  if (!move) return `The last move was ${san}.`;
  const color = sideName(view.turn === 'w' ? 'b' : 'w');
  if (san.startsWith('O-O')) return color + (san.startsWith('O-O-O') ? ' castled queenside.' : ' castled kingside.');
  const piece = view.pieces.find((item) => item.square === move.to)?.kind ?? 'p';
  const action = san.includes('=') ? ` promoted a pawn to a ${names[piece]}` : ` moved the ${names[piece]}`;
  return (
    color +
    ' played ' +
    san +
    ' and' +
    action +
    ' from ' +
    move.from +
    ' to ' +
    move.to +
    (san.includes('x') ? ', capturing an opposing piece.' : '.')
  );
}
export function assistantText(view: GameView, difficulty: Difficulty = 'medium'): string {
  if (view.outcome) return outcomeText(view.outcome);
  if (view.check)
    return `${sideName(view.turn)} is in check. Move the king, capture the attacker, or block the attack.`;
  if (view.claimable) return 'You may claim a draw now, or continue playing.';
  const last = view.history.at(-1);
  const explanation = last
    ? explainLastMove(view, last)
    : 'Begin by controlling the center and developing your pieces.';
  return `${sideName(view.turn)} to move. ${explanation} ${commentary[difficulty]}`;
}
