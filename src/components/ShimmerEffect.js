import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

function createStyles(C) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.cardBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 18,
      marginBottom: 12,
      overflow: 'hidden',
    },
    shimmer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.06)',
      marginRight: 12,
    },
    textBlock: {
      flex: 1,
      gap: 6,
    },
    titleLine: {
      height: 16,
      width: '60%',
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    subtitleLine: {
      height: 10,
      width: '40%',
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    rateLine: {
      height: 32,
      width: '50%',
      borderRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.06)',
      marginBottom: 10,
    },
    usdLine: {
      height: 12,
      width: '35%',
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
  });
}

export default function ShimmerEffect({ style }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.card, style]}>
      <Animated.View style={[styles.shimmer, { opacity }]} />
      <View style={styles.row}>
        <View style={styles.iconPlaceholder} />
        <View style={styles.textBlock}>
          <View style={styles.titleLine} />
          <View style={styles.subtitleLine} />
        </View>
      </View>
      <View style={styles.rateLine} />
      <View style={styles.usdLine} />
    </View>
  );
}
