import type { ReactNode } from 'react';
import { Component } from 'react';
import { View } from 'react-native';
import { copy } from '../core/content';
import type { UI } from '../design/controls';
import { Button, Label } from '../design/controls';
export class Boundary extends Component<{ children: ReactNode; ui: UI; board?: boolean }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <View>
        <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Label ui={this.props.ui}>{this.props.board ? copy.boardError : copy.errorText}</Label>
        </View>
        <Button label={copy.retry} ui={this.props.ui} onPress={() => this.setState({ failed: false })} />
      </View>
    ) : (
      this.props.children
    );
  }
}
