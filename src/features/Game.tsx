import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, TextInput, View } from 'react-native';
import { coordinateMove, endGame, importGame, isSquare, moveGame, undoGame, viewGame } from '../core/chess';
import { assistantText, copy, names, outcomeText, sideName } from '../core/content';
import type { GameRecord, LibraryData, Promotion, Square } from '../core/contracts';
import { withCurrent } from '../core/storage';
import type { UI } from '../design/controls';
import { Button, Label, Panel, Row } from '../design/controls';
import { nativeEngine } from '../platform/engine';
import { NativeBoard } from '../rendering/NativeBoard';
import { useRobot } from '../state/useRobot';
import { Boundary } from './Boundary';

interface Props {
  game: GameRecord;
  data: LibraryData;
  ui: UI;
  update: (change: (data: LibraryData) => LibraryData) => void;
  restart: () => void;
}
export function Game({ game, data, ui, update, restart }: Props) {
  const view = viewGame(game);
  const [selected, setSelected] = useState<Square | null>(null);
  const [message, setMessage] = useState('');
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [hint, setHint] = useState('');
  const [hinting, setHinting] = useState(false);
  const [from, setFrom] = useState('e2');
  const [to, setTo] = useState('e4');
  const hintAbort = useRef<AbortController | null>(null);
  const { thinking, engineError, retry } = useRobot(game, nativeEngine, update);
  const playable = !view.outcome && !thinking && (game.mode === 'local' || view.turn === game.human);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Every immutable game update invalidates position-specific hints and selection.
  useEffect(() => {
    setSelected(null);
    setMessage('');
    setHint('');
    hintAbort.current?.abort();
    setHinting(false);
    return () => hintAbort.current?.abort();
  }, [game]);
  const change = (next: GameRecord) =>
    update((current) => (current.current === game ? withCurrent(current, next) : current));
  const play = (san: string) => {
    if (!playable) return;
    const result = moveGame(game, san);
    if (result.ok) change(result.value);
    else setMessage(result.error);
  };
  const attempt = (origin: Square, target: Square, promote?: Promotion) => {
    if (!playable) return;
    if (!promote && view.legal.some((move) => move.from === origin && move.to === target && move.promotion)) {
      setPromotion({ from: origin, to: target });
      return;
    }
    const result = coordinateMove(game, origin, target, promote);
    if (result.ok) {
      change(result.value);
      setPromotion(null);
    } else setMessage(result.error);
  };
  const select = (square: Square) => {
    if (!playable) return;
    if (selected && view.legal.some((move) => move.from === selected && move.to === square)) {
      attempt(selected, square);
      return;
    }
    if (view.pieces.some((piece) => piece.square === square && piece.color === view.turn)) setSelected(square);
    else setMessage(copy.illegal);
  };
  const finish = (reason: 'resignation' | 'agreement' | 'claim') => {
    const result = endGame(game, reason);
    if (result.ok) change(result.value);
    else setMessage(result.error);
  };
  const confirm = (title: string, action: () => void, description = '') =>
    Alert.alert(title, description, [
      { text: copy.cancel, style: 'cancel' },
      { text: copy.confirm, onPress: action },
    ]);
  const askHint = () => {
    if (!playable || hinting) return;
    const abort = new AbortController();
    hintAbort.current = abort;
    setHinting(true);
    nativeEngine
      .think(game, 'medium', abort.signal)
      .then(
        (result) => {
          if (!abort.signal.aborted) setHint(result.move);
        },
        () => {
          if (!abort.signal.aborted) setMessage(copy.engineError);
        },
      )
      .finally(() => {
        if (!abort.signal.aborted) setHinting(false);
      });
  };
  const inputStyle = {
    color: ui.palette.ink,
    borderColor: ui.palette.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 44,
    minWidth: 80,
  };
  const flipped = data.settings.autoRotate && game.mode === 'local' ? view.turn === 'b' : game.human === 'b';
  return (
    <View>
      <Label heading ui={ui}>
        {view.outcome ? outcomeText(view.outcome) : `${sideName(view.turn)} ${copy.turn}`}
      </Label>
      <View accessibilityLiveRegion="polite">
        <Label ui={ui}>{thinking ? copy.thinking : assistantText(view, game.difficulty)}</Label>
      </View>
      <Boundary ui={ui} board>
        <NativeBoard
          key={game.id}
          view={view}
          ui={ui}
          selected={selected}
          destinations={
            data.settings.showLegal ? view.legal.filter((move) => move.from === selected).map((move) => move.to) : []
          }
          onSelect={select}
          flipped={flipped}
        />
      </Boundary>
      <Row>
        <Button label={copy.undo} ui={ui} disabled={!game.moves.length} onPress={() => change(undoGame(game))} />
        <Button label={copy.restart} ui={ui} onPress={() => confirm(copy.restartQuestion, restart)} />
        <Button
          label={copy.resign}
          ui={ui}
          disabled={!!view.outcome}
          onPress={() => confirm(copy.resignQuestion, () => finish('resignation'))}
        />
        <Button
          label={copy.draw}
          ui={ui}
          disabled={!!view.outcome}
          onPress={() =>
            confirm(
              copy.drawQuestion,
              () => finish('agreement'),
              game.mode === 'robot' ? copy.robotDraw : copy.drawDescription,
            )
          }
        />
        {view.claimable && <Button label={copy.claim} ui={ui} disabled={!playable} onPress={() => finish('claim')} />}
      </Row>
      <Panel ui={ui}>
        <View
          style={{
            borderWidth: 2,
            borderColor: ui.palette.primary,
            borderRadius: 16,
            width: 48,
            height: 36,
            marginBottom: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Label ui={ui}>· ·</Label>
        </View>
        <Label heading ui={ui}>
          {copy.assistant}
        </Label>
        <Label ui={ui}>{copy.assistantIntro}</Label>
        <Button label={copy.hint} ui={ui} disabled={!playable || hinting} onPress={askHint} />
        {hint && <Label ui={ui}>{hint}</Label>}
        {engineError && (
          <View accessibilityRole="alert">
            <Label ui={ui}>{engineError}</Label>
            <Button label={copy.retry} ui={ui} onPress={retry} />
          </View>
        )}
      </Panel>
      <Panel ui={ui}>
        <Label heading ui={ui}>
          {copy.legal}
        </Label>
        <Label ui={ui} muted>
          {copy.selectPiece}
        </Label>
        <Row>
          <View>
            <Label ui={ui}>{copy.from}</Label>
            <TextInput
              accessibilityLabel={copy.from}
              value={from}
              autoCapitalize="none"
              maxLength={2}
              style={inputStyle}
              onChangeText={setFrom}
            />
          </View>
          <View>
            <Label ui={ui}>{copy.to}</Label>
            <TextInput
              accessibilityLabel={copy.to}
              value={to}
              autoCapitalize="none"
              maxLength={2}
              style={inputStyle}
              onChangeText={setTo}
            />
          </View>
          <Button
            label={copy.move}
            ui={ui}
            disabled={!playable}
            onPress={() => {
              if (isSquare(from) && isSquare(to)) attempt(from, to);
              else setMessage(copy.illegal);
            }}
          />
        </Row>
        {message && (
          <View accessibilityRole="alert">
            <Label ui={ui}>{message}</Label>
          </View>
        )}
        <Row>
          {view.legal
            .filter((move) => !selected || move.from === selected)
            .map((move) => (
              <Button key={move.san} label={move.san} ui={ui} disabled={!playable} onPress={() => play(move.san)} />
            ))}
        </Row>
      </Panel>
      <Panel ui={ui}>
        <Label heading ui={ui}>
          {copy.history}
        </Label>
        <Label ui={ui}>{view.history.length ? view.history.join(' · ') : copy.noMoves}</Label>
        <Label heading ui={ui}>
          {copy.captured}
        </Label>
        <Label ui={ui}>
          {view.captures.length
            ? view.captures.map((piece) => `${sideName(piece.color)} ${names[piece.kind]}`).join(', ')
            : copy.none}
        </Label>
      </Panel>
      <ImportExport game={game} onLoad={change} ui={ui} />
      <Modal
        visible={promotion !== null}
        transparent
        animationType={ui.reduced ? 'none' : 'fade'}
        onRequestClose={() => setPromotion(null)}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,.6)' }}>
          <View accessibilityViewIsModal style={{ backgroundColor: ui.palette.surface, borderRadius: 24, padding: 24 }}>
            <Label heading ui={ui}>
              {copy.promotion}
            </Label>
            <Label ui={ui}>{copy.promotionDescription}</Label>
            <Row>
              {(['q', 'r', 'b', 'n'] as const).map((kind) => (
                <Button
                  key={kind}
                  label={names[kind]}
                  ui={ui}
                  onPress={() => {
                    if (promotion) attempt(promotion.from, promotion.to, kind);
                  }}
                />
              ))}
            </Row>
            <Button label={copy.cancel} ui={ui} onPress={() => setPromotion(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
function ImportExport({ game, onLoad, ui }: { game: GameRecord; onLoad: (record: GameRecord) => void; ui: UI }) {
  const [text, setText] = useState('');
  const [format, setFormat] = useState<'fen' | 'pgn'>('fen');
  const [message, setMessage] = useState('');
  const [exported, setExported] = useState(false);
  return (
    <Panel ui={ui}>
      <Label heading ui={ui}>
        {copy.importTitle}
      </Label>
      <Row>
        <Button label={copy.fen} ui={ui} selected={format === 'fen'} onPress={() => setFormat('fen')} />
        <Button label={copy.pgn} ui={ui} selected={format === 'pgn'} onPress={() => setFormat('pgn')} />
      </Row>
      <TextInput
        accessibilityLabel={copy.importLabel}
        value={text}
        maxLength={32768}
        multiline
        autoCapitalize="none"
        onChangeText={setText}
        style={{ minHeight: 100, color: ui.palette.ink, borderColor: ui.palette.border, borderWidth: 1, padding: 12 }}
      />
      <Row>
        <Button
          label={copy.importAction}
          ui={ui}
          onPress={() => {
            const result = importGame(game, text, format);
            if (result.ok) {
              onLoad(result.value);
              setText('');
              setMessage('');
            } else setMessage(result.error);
          }}
        />
        <Button label={copy.showPgn} ui={ui} onPress={() => setExported((value) => !value)} />
      </Row>
      {message && <Label ui={ui}>{message}</Label>}
      {exported && <Label ui={ui}>{viewGame(game).pgn}</Label>}
    </Panel>
  );
}
