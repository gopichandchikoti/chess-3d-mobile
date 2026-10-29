import { useState } from 'react';
import { View } from 'react-native';
import { copy } from '../core/content';
import type { Color, Difficulty, Mode } from '../core/contracts';
import type { UI } from '../design/controls';
import { Button, Label, Panel, Row } from '../design/controls';
export function Setup({
  ui,
  mode: initial,
  onStart,
}: {
  ui: UI;
  mode: Mode;
  onStart: (mode: Mode, difficulty: Difficulty, color: Color) => void;
}) {
  const [mode, setMode] = useState(initial);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [color, setColor] = useState<Color>('w');
  return (
    <View>
      <Label heading ui={ui}>
        {copy.setup}
      </Label>
      <Panel ui={ui}>
        <Label ui={ui}>{copy.mode}</Label>
        <Row>
          {(['robot', 'local'] as const).map((value) => (
            <Button key={value} label={copy[value]} ui={ui} selected={mode === value} onPress={() => setMode(value)} />
          ))}
        </Row>
      </Panel>
      {mode === 'robot' && (
        <>
          <Panel ui={ui}>
            <Label ui={ui}>{copy.difficulty}</Label>
            <Row>
              {(['easy', 'medium', 'hard'] as const).map((value) => (
                <Button
                  key={value}
                  label={copy[value]}
                  ui={ui}
                  selected={difficulty === value}
                  onPress={() => setDifficulty(value)}
                />
              ))}
            </Row>
            <Label ui={ui} muted>
              {copy.engineNote}
            </Label>
          </Panel>
          <Panel ui={ui}>
            <Label ui={ui}>{copy.color}</Label>
            <Row>
              <Button label={copy.white} ui={ui} selected={color === 'w'} onPress={() => setColor('w')} />
              <Button label={copy.black} ui={ui} selected={color === 'b'} onPress={() => setColor('b')} />
            </Row>
          </Panel>
        </>
      )}
      <Button label={copy.start} ui={ui} primary onPress={() => onStart(mode, difficulty, color)} />
    </View>
  );
}
