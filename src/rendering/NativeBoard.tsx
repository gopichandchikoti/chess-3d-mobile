import { Canvas } from '@react-three/fiber/native';
import { useEffect, useRef, useState } from 'react';
import { AppState, PanResponder, View } from 'react-native';
import { copy } from '../core/content';
import type { GameView, Square } from '../core/contracts';
import type { UI } from '../design/controls';
import { Button, Label, Row } from '../design/controls';
import { BoardScene } from './BoardScene';
export function NativeBoard({
  view,
  ui,
  selected = null,
  destinations = [],
  onSelect = () => undefined,
  flipped = false,
}: {
  view: GameView;
  ui: UI;
  selected?: Square | null;
  destinations?: Square[];
  onSelect?: (square: Square) => void;
  flipped?: boolean;
}) {
  const [yaw, setYaw] = useState(0);
  const [zoom, setZoom] = useState(9.2);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const orbit = useRef(0);
  const start = useRef({ yaw: 0, distance: 0, zoom: 9.2 });
  const currentZoom = useRef(zoom);
  currentZoom.current = zoom;
  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        (Math.abs(gesture.dx) > 10 && Math.abs(gesture.dx) > Math.abs(gesture.dy)) || gesture.numberActiveTouches > 1,
      onPanResponderGrant: (event) => {
        const first = event.nativeEvent.touches[0];
        const second = event.nativeEvent.touches[1];
        start.current = {
          yaw: orbit.current,
          zoom: currentZoom.current,
          distance: first && second ? Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY) : 0,
        };
      },
      onPanResponderMove: (event, gesture) => {
        orbit.current = start.current.yaw + gesture.dx * 0.008;
        setYaw(orbit.current);
        const first = event.nativeEvent.touches[0];
        const second = event.nativeEvent.touches[1];
        if (first && second && start.current.distance > 0) {
          const distance = Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY);
          setZoom(Math.max(6.8, Math.min(13, (start.current.zoom * start.current.distance) / Math.max(distance, 1))));
        }
      },
    }),
  ).current;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  return (
    <View>
      <View style={{ height: 360 }} {...responder.panHandlers} accessibilityLabel={copy.title}>
        <Canvas frameloop={active ? 'always' : 'never'} camera={{ position: [0, 9, 9], fov: 42 }}>
          <BoardScene
            view={view}
            palette={ui.palette}
            selected={selected}
            destinations={destinations}
            reduced={ui.reduced}
            onSelect={onSelect}
            yaw={yaw + (flipped ? Math.PI : 0)}
            zoom={zoom}
          />
        </Canvas>
      </View>
      <Row>
        <Button
          label={copy.flip}
          ui={ui}
          onPress={() => {
            orbit.current += Math.PI;
            setYaw(orbit.current);
          }}
        />
        <Button label={copy.zoomIn} ui={ui} onPress={() => setZoom((value) => Math.max(6.8, value - 0.8))} />
        <Button label={copy.zoomOut} ui={ui} onPress={() => setZoom((value) => Math.min(13, value + 0.8))} />
      </Row>
      <Label ui={ui} muted>
        {copy.camera}
      </Label>
    </View>
  );
}
