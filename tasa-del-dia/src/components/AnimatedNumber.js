import React, { useEffect, useRef, useState } from 'react';
import { Animated, InteractionManager, Text } from 'react-native';
import useReduceMotion from '../hooks/useReduceMotion';

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
 *  - animate: boolean — si false, muestra el valor final sin animación (default true)
 */
function AnimatedNumber({
  value,
  style,
  duration = 800,
  format,
  prefix = '',
  animate = true,
}) {
  const [isFirstRender, setIsFirstRender] = useState(true);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayText, setDisplayText] = useState('—');
  const lastTarget = useRef(0);
  const mountedRef = useRef(true);
  const formatRef = useRef(format);
  const reduceMotion = useReduceMotion();

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

    // Accesibilidad + rendimiento: con "reducir movimiento" o `animate=false`
    // (tarjetas no-hero), mostrar el valor final sin animación JS por frame.
    if (reduceMotion || !animate) {
      lastTarget.current = value;
      const formatted = formatRef.current ? formatRef.current(value) : value.toFixed(2);
      setDisplayText(prefix + formatted);
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

    let cancelled = false;
    let animation = null;
    let listenerId = null;

    const startAnimation = () => {
      if (cancelled) return;
      animatedValue.setValue(lastTarget.current);
      lastTarget.current = value;
      listenerId = animatedValue.addListener(({ value: v }) => {
        if (!mountedRef.current || cancelled) return;
        const formatted = formatRef.current ? formatRef.current(v) : v.toFixed(2);
        setDisplayText(prefix + formatted);
      });
      animation = Animated.timing(animatedValue, {
        toValue: value,
        duration,
        useNativeDriver: false,
      });
      animation.start();
    };

    // Posponer el conteo hasta que el hilo JS quede libre: en el arranque,
    // 5 tarjetas animan a la vez justo tras el primer render (jank del cold
    // start). El conteo arranca cuando no haya interacciones pendientes;
    // mientras tanto el display conserva el valor anterior sin saltos.
    const task = InteractionManager.runAfterInteractions(startAnimation);

    return () => {
      cancelled = true;
      task.cancel();
      if (animation) animation.stop();
      if (listenerId != null) animatedValue.removeListener(listenerId);
    };
  }, [value, duration, animatedValue, prefix, reduceMotion, animate]);

  if (value === null || value === undefined) {
    return <Text style={style}>—</Text>;
  }

  return <Text style={style}>{displayText}</Text>;
}

export default React.memo(AnimatedNumber);
