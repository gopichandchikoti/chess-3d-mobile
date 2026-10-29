import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from '../core/tokens';
import { fontSizes, radii, spacing } from '../core/tokens';
export interface UI {
  palette: Palette;
  reduced: boolean;
}
export function Label({
  children,
  ui,
  heading = false,
  muted = false,
  style,
}: {
  children: ReactNode;
  ui: UI;
  heading?: boolean;
  muted?: boolean;
  style?: TextStyle;
}) {
  return (
    <Text
      selectable
      accessibilityRole={heading ? 'header' : undefined}
      style={[
        {
          color: muted ? ui.palette.muted : ui.palette.ink,
          fontSize: heading ? fontSizes.heading : fontSizes.body,
          lineHeight: heading ? 36 : 25,
          fontFamily: heading ? 'serif' : undefined,
          marginBottom: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  label,
  onPress,
  ui,
  primary = false,
  disabled = false,
  selected = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  ui: UI;
  primary?: boolean;
  disabled?: boolean;
  selected?: boolean;
  danger?: boolean;
}) {
  const filled = primary || selected;
  let color = filled ? ui.palette.onPrimary : ui.palette.ink;
  if (danger) color = ui.palette.error;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 44,
          minWidth: 44,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.control,
          borderWidth: 1,
          borderColor: ui.palette.border,
          backgroundColor: filled ? ui.palette.primary : ui.palette.surface,
          opacity: disabled ? 0.55 : 1,
        },
        pressed && { borderColor: ui.palette.primary },
      ]}
    >
      <Text style={{ color, fontSize: fontSizes.caption, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}
export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}
export function Panel({ children, ui }: { children: ReactNode; ui: UI }) {
  return (
    <View style={{ paddingVertical: spacing.xl, borderBottomWidth: 1, borderColor: ui.palette.border }}>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.lg },
});
