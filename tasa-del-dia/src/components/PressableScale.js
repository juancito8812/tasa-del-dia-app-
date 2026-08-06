import React, { useMemo, useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import useReduceMotion from '../hooks/useReduceMotion';

/**
 * PressableScale — contenedor presionable con "spring" físico al tocar.
 * Fase 2 del rediseño 2026: la diferencia entre "funciona" y "se siente premium".
 *
 * Respeta la preferencia de accesibilidad "reducir movimiento" (se desactiva sola).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {() => void} [props.onPress]
 * @param {object} [props.style]
 * @param {number} [props.scaleTo] - escala al presionar (default 0.97)
 */
export default function PressableScale({ children, onPress, style, scaleTo = 0.97, ...rest }) {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : scale.value }],
  }), [reduceMotion]);

  // Worklet que aplica el spring. Los shared values de reanimated son mutables
  // por diseño dentro de worklets — la regla react-hooks/immutability no lo entiende.
  const animateTo = useCallback((toValue, config) => {
    'worklet';
    // eslint-disable-next-line react-hooks/immutability -- shared value mutable por diseño
    scale.value = withSpring(toValue, config);
  }, [scale]);

  const pressConfig = useMemo(() => {
    if (reduceMotion) {
      return {
        onPressIn: undefined,
        onPressOut: undefined,
      };
    }
    return {
      onPressIn: () => {
        animateTo(scaleTo, { damping: 18, stiffness: 300 });
      },
      onPressOut: () => {
        animateTo(1, { damping: 16, stiffness: 260 });
      },
    };
  }, [reduceMotion, scaleTo, animateTo]);

  return (
    <Pressable onPress={onPress} style={style} {...pressConfig} {...rest}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}
