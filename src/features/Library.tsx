import { Alert, Switch, View } from 'react-native';
import { copy, lessons, outcomeText } from '../core/content';
import type { LibraryData } from '../core/contracts';
import type { UI } from '../design/controls';
import { Button, Label, Panel, Row } from '../design/controls';

type Update = (change: (data: LibraryData) => LibraryData) => void;
export function Learn({ data, update, ui }: { data: LibraryData; update: Update; ui: UI }) {
  return (
    <View>
      <Label heading ui={ui}>
        {copy.learn}
      </Label>
      {lessons.map((lesson) => (
        <Panel ui={ui} key={lesson.id}>
          <Label heading ui={ui}>
            {lesson.title}
          </Label>
          <Label ui={ui}>{lesson.body}</Label>
          <Label ui={ui} muted>
            {lesson.task}
          </Label>
          <Button
            ui={ui}
            label={data.lessons.includes(lesson.id) ? copy.lessonComplete : copy.completeLesson}
            disabled={data.lessons.includes(lesson.id)}
            onPress={() =>
              update((current) => ({ ...current, lessons: [...new Set([...current.lessons, lesson.id])] }))
            }
          />
        </Panel>
      ))}
    </View>
  );
}
export function Progress({ data, ui }: { data: LibraryData; ui: UI }) {
  const wins = data.history.filter((game) => game.mode === 'robot' && game.outcome?.winner === game.human).length;
  return (
    <View>
      <Label heading ui={ui}>
        {copy.progress}
      </Label>
      <Panel ui={ui}>
        <Label ui={ui}>{`${copy.completed}: ${data.history.length}`}</Label>
        <Label ui={ui}>{`${copy.wins}: ${wins}`}</Label>
        <Label ui={ui}>{`${copy.lessonsDone}: ${data.lessons.length}/${lessons.length}`}</Label>
      </Panel>
      <Label heading ui={ui}>
        {copy.achievement}
      </Label>
      {[
        [copy.firstGame, data.history.length > 0],
        [copy.firstWin, wins > 0],
        [copy.student, data.lessons.length === lessons.length],
      ].map(([label, done]) => (
        <Label ui={ui} key={String(label)}>
          {String(label) + (done ? ` · ${copy.completedLabel}` : '')}
        </Label>
      ))}
      <Label heading ui={ui}>
        {copy.history}
      </Label>
      {data.history.length ? (
        data.history.map((game) => (
          <Panel ui={ui} key={game.id}>
            <Label ui={ui}>{game.outcome ? outcomeText(game.outcome) : copy.unknown}</Label>
            <Label ui={ui} muted>
              {new Date(game.createdAt).toLocaleDateString()}
            </Label>
          </Panel>
        ))
      ) : (
        <Label ui={ui}>{copy.noHistory}</Label>
      )}
    </View>
  );
}
export function Settings({
  data,
  update,
  reset,
  ui,
}: {
  data: LibraryData;
  update: Update;
  reset: () => Promise<void>;
  ui: UI;
}) {
  const requestReset = () =>
    Alert.alert(copy.resetQuestion, copy.resetDescription, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.confirm,
        style: 'destructive',
        onPress: () => {
          void reset();
        },
      },
    ]);
  return (
    <View>
      <Label heading ui={ui}>
        {copy.settings}
      </Label>
      <Panel ui={ui}>
        <Label ui={ui}>{copy.theme}</Label>
        <Row>
          {(['system', 'light', 'dark'] as const).map((theme) => (
            <Button
              key={theme}
              label={copy[theme]}
              selected={data.settings.theme === theme}
              ui={ui}
              onPress={() => update((current) => ({ ...current, settings: { ...current.settings, theme } }))}
            />
          ))}
        </Row>
      </Panel>
      {(['reducedMotion', 'showLegal', 'autoRotate'] as const).map((key) => {
        const label = key === 'reducedMotion' ? copy.reduced : key === 'showLegal' ? copy.showLegal : copy.autoRotate;
        return (
          <Panel ui={ui} key={key}>
            <Label ui={ui}>{label}</Label>
            <Switch
              accessibilityLabel={label}
              value={data.settings[key]}
              onValueChange={(value) =>
                update((current) => ({ ...current, settings: { ...current.settings, [key]: value } }))
              }
            />
          </Panel>
        );
      })}
      <Label ui={ui} muted>
        {copy.storageNote}
      </Label>
      <Button label={copy.reset} ui={ui} danger onPress={requestReset} />
    </View>
  );
}
