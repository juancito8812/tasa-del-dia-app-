import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

/**
 * Animated number that counts up from its previous value to the target value.
 * Re-triggers animation whenever `value` changes.
 *
 * Props:
 *  - value: number | null  — target number
 *  - style: Text style
 *  - duration: animation duration in ms (default 800)
 *  - format: (n: number) => string — formatter function
 *  - prefix: string to prepend (e.g. "Bs. ")
 */
export default function AnimatedNumber({
  value,
  style,
  duration = 800,
  format,
  prefix = '',
}) {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayText, setDisplayText] = useState('—');
  const lastTarget = useRef(0);
  const mountedRef = useRef(true);
  const formatRef = useRef(format);

  useEffect(() => {
    mountedRef.current = true;
    formatRef.current = format;
    return () => { mountedRef.current = false; };
  }, [format]);

  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplayText('—');
      return;
    }

    if (value === lastTarget.current && !isFirstRender) return;

    if (isFirstRender) {
      lastTarget.current = value;
      animatedValue.setValue(value);
      const formatted = formatRef.current ? formatRef.current(value) : value.toFixed(2);
      setDisplayText(prefix + formatted);
      setIsFirstRender(false);
      return;
    }

    animatedValue.setValue(lastTarget.current);
    lastTarget.current = value;

    const listenerId = animatedValue.addListener(({ value: v }) => {
      if (!mountedRef.current) return;
      const formatted = formatRef.current ? formatRef.current(v) : v.toFixed(2);
      setDisplayText(prefix + formatted);
    });

    const animation = Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    });
    animation.start();

    return () => {
      animation.stop();
      animatedValue.removeListener(listenerId);
    };
  }, [value, duration, animatedValue, prefix]);

  if (value === null || value === undefined) {
    return <Text style={style}>—</Text>;
  }

  return <Text style={style}>{displayText}</Text>;
}
