import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createGame, viewGame } from './core/chess';
import { copy } from './core/content';
import type { Color, Difficulty, Mode, Screen } from './core/contracts';
import { withCurrent } from './core/storage';
import { palettes, spacing } from './core/tokens';
import { Button, Label, Panel, Row } from './design/controls';
import { ScreenTransition } from './design/ScreenTransition';
import { Boundary } from './features/Boundary';
import { Game } from './features/Game';
import { Learn, Progress, Settings } from './features/Library';
import { Setup } from './features/Setup';
import { nativeStorage } from './platform/storage';
import { NativeBoard } from './rendering/NativeBoard';
import { useLibrary } from './state/useLibrary';

let serial = 0;
const opening = viewGame(createGame('preview', 0, 'local', 'medium'));
export default function App() {
  const { data, ready, update, reset, storageError } = useLibrary(nativeStorage);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [mode, setMode] = useState<Mode>('robot');
  const system = useColorScheme();
  const [reduced, setReduced] = useState(false);
  const [exit, setExit] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'welcome') return false;
      setScreen('welcome');
      return true;
    });
    return () => listener.remove();
  }, [screen]);
  const theme = data.settings.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : data.settings.theme;
  const ui = { palette: palettes[theme], reduced: reduced || data.settings.reducedMotion };
  const setup = (next: Mode) => {
    setMode(next);
    setScreen('setup');
  };
  const start = (nextMode: Mode, difficulty: Difficulty, color: Color) => {
    const now = Date.now();
    const game = createGame(`${String(now)}-${String(serial++)}`, now, nextMode, difficulty, color);
    update((current) => withCurrent(current, game));
    setScreen('game');
  };
  let content: ReactNode = null;
  if (!ready)
    content = (
      <View accessibilityLiveRegion="polite">
        <Label ui={ui}>{copy.loading}</Label>
      </View>
    );
  else
    switch (screen) {
      case 'welcome':
        content = (
          <View>
            <Label ui={ui} muted>
              {copy.eyebrow}
            </Label>
            <Label heading ui={ui} style={{ fontSize: 40, lineHeight: 46 }}>
              {copy.welcome}
            </Label>
            <Label ui={ui}>{copy.intro}</Label>
            <Button
              primary
              label={data.current ? copy.resume : copy.enter}
              ui={ui}
              onPress={() => (data.current ? setScreen('game') : setup('robot'))}
            />
            <Panel ui={ui}>
              <Row>
                <Button label={copy.robot} ui={ui} onPress={() => setup('robot')} />
                <Button label={copy.local} ui={ui} onPress={() => setup('local')} />
                <Button label={copy.learn} ui={ui} onPress={() => setScreen('learn')} />
              </Row>
            </Panel>
            <Boundary ui={ui} board>
              <NativeBoard view={data.current ? viewGame(data.current) : opening} ui={ui} />
            </Boundary>
            <Label ui={ui} muted>
              {copy.engineNote}
            </Label>
          </View>
        );
        break;
      case 'setup':
        content = <Setup key={mode} mode={mode} ui={ui} onStart={start} />;
        break;
      case 'game':
        content = data.current ? (
          <Game
            game={data.current}
            data={data}
            ui={ui}
            update={update}
            restart={() => {
              if (data.current) start(data.current.mode, data.current.difficulty, data.current.human);
            }}
          />
        ) : (
          <Setup mode={mode} ui={ui} onStart={start} />
        );
        break;
      case 'learn':
        content = <Learn data={data} update={update} ui={ui} />;
        break;
      case 'progress':
        content = <Progress data={data} ui={ui} />;
        break;
      case 'settings':
        content = (
          <Settings
            data={data}
            update={update}
            ui={ui}
            reset={async () => {
              await reset();
              setScreen('welcome');
            }}
          />
        );
        break;
      case 'privacy':
      case 'terms':
        content = (
          <View>
            <Label heading ui={ui}>
              {copy[screen]}
            </Label>
            <Label ui={ui}>{screen === 'privacy' ? copy.privacyText : copy.termsText}</Label>
          </View>
        );
        break;
    }
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: ui.palette.background }}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ padding: spacing.lg, borderBottomWidth: 1, borderColor: ui.palette.border }}>
            <Row>
              <Label heading ui={ui} style={{ flex: 1, marginBottom: 0, fontSize: 24 }}>
                {copy.title}
              </Label>
              <Button
                label={theme === 'dark' ? copy.light : copy.dark}
                ui={ui}
                onPress={() =>
                  update((current) => ({
                    ...current,
                    settings: { ...current.settings, theme: theme === 'dark' ? 'light' : 'dark' },
                  }))
                }
              />
              <Button
                label={copy.close}
                ui={ui}
                onPress={() => {
                  if (screen === 'welcome') setExit(true);
                  else setScreen('welcome');
                }}
              />
            </Row>
            <Row>
              {(['welcome', 'learn', 'progress', 'settings'] as const).map((target) => (
                <Button
                  key={target}
                  label={target === 'welcome' ? copy.welcomeLink : copy[target]}
                  selected={screen === target}
                  ui={ui}
                  onPress={() => setScreen(target)}
                />
              ))}
            </Row>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.section }}
            keyboardShouldPersistTaps="handled"
          >
            <Boundary ui={ui}>
              <ScreenTransition key={screen} reduced={ui.reduced}>
                {content}
              </ScreenTransition>
            </Boundary>
            {storageError && (
              <View accessibilityRole="alert">
                <Label ui={ui}>{storageError}</Label>
              </View>
            )}
            {exit && <Label ui={ui}>{copy.exitMessage}</Label>}
            <Panel ui={ui}>
              <Label ui={ui} muted>
                {copy.storageNote}
              </Label>
              <Row>
                <Button label={copy.privacy} ui={ui} onPress={() => setScreen('privacy')} />
                <Button label={copy.terms} ui={ui} onPress={() => setScreen('terms')} />
              </Row>
            </Panel>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
