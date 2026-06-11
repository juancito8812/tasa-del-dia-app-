import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { API_CONFIG } from '../constants';

const TOTAL_SECONDS = API_CONFIG.REFRESH_INTERVAL / 1000;

function createStyles(C) {
  return StyleSheet.create({
    container: {
      marginHorizontal: 20,
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: C.cardBg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    containerCompact: {
      marginHorizontal: 12,
      marginBottom: 4,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    iconCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: C.glassOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCircleCompact: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
    iconCircleLow: {
      backgroundColor: C.warning + '18',
    },
    label: {
      fontSize: 11,
      color: C.textMuted,
      fontWeight: '500',
      letterSpacing: 0.3,
    },
    labelCompact: {
      fontSize: 10,
    },
    labelLow: {
      color: C.warning,
      fontWeight: '600',
    },
    barBg: {
      height: 3,
      backgroundColor: C.inputBg,
      borderRadius: 1.5,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 1.5,
    },
  });
}

export default function AutoRefreshBar({ countdown, compact = false }) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fillPercent = ((1 - countdown / TOTAL_SECONDS) * 100).toFixed(1);
  const isLow = countdown < 60;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.content, compact && { marginBottom: 4 }]}>
        <View style={[styles.iconCircle, compact && styles.iconCircleCompact, isLow && styles.iconCircleLow]}>
          <Ionicons name="refresh" size={compact ? 10 : 12} color={isLow ? C.warning : C.textMuted} />
        </View>
        <Text style={[styles.label, compact && styles.labelCompact, isLow && styles.labelLow]}>
          {isLow ? `Actualizando en ${countdown}s…` : `Próxima actualización en ${formatTime(countdown)}`}
        </Text>
      </View>
      {!compact && (
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${fillPercent}%`, backgroundColor: isLow ? C.warning : C.accent }]} />
        </View>
      )}
    </View>
  );
}
