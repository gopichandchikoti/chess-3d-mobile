import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { springs } from '../core/tokens';
/** Each native screen enters with a restrained opacity spring; reduced motion renders immediately. */
export function ScreenTransition({ children, reduced }: { children: ReactNode; reduced: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      return;
    }
    opacity.setValue(0);
    const { response, damping } = springs.smooth;
    const animation = Animated.spring(opacity, {
      toValue: 1,
      mass: 1,
      stiffness: ((2 * Math.PI) / response) ** 2,
      damping: (4 * Math.PI * damping) / response,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [opacity, reduced]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
