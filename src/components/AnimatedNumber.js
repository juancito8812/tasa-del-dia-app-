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
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayText, setDisplayText] = useState('—');
  const lastTarget = useRef(0);

  useEffect(() => {
    if (value === null || value === undefined) {
      setDisplayText('—');
      return;
    }

    animatedValue.setValue(lastTarget.current);
    lastTarget.current = value;

    const listenerId = animatedValue.addListener(({ value: v }) => {
      const formatted = format ? format(v) : v.toFixed(2);
      setDisplayText(prefix + formatted);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value, duration, animatedValue, format, prefix]);

  if (value === null || value === undefined) {
    return <Text style={style}>—</Text>;
  }

  return <Text style={style}>{displayText}</Text>;
}
