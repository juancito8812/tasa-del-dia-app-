import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AnimatedNumber from './AnimatedNumber';
import ShimmerEffect from './ShimmerEffect';

const ICON_NAMES = {
  bank: 'bank',
  'trending-up': 'trending-up',
  globe: 'globe',
  'logo-bitcoin': 'logo-bitcoin',
  calendar: 'calendar',
};

function createStyles(C) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.cardBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 18,
      marginBottom: 12,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
      overflow: 'hidden',
    },
    compactCard: {
      padding: 10,
      marginBottom: 0,
      borderRadius: 14,
    },
    glowAccent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      opacity: 0.6,
    },
    glowAccentCompact: {
      height: 2,
      opacity: 0.5,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    headerCompact: {
      marginBottom: 8,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    iconContainerCompact: {
      width: 28,
      height: 28,
      borderRadius: 8,
      marginRight: 8,
    },
    titleBlock: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: C.textPrimary,
      letterSpacing: 0.3,
    },
    compactTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: C.textPrimary,
    },
    subtitle: {
      fontSize: 11,
      color: C.textSecondary,
      marginTop: 2,
      letterSpacing: 0.2,
    },
    rateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 0,
    },
    ratePrefix: {
      fontSize: 18,
      fontWeight: '600',
      opacity: 0.7,
      color: C.textPrimary,
    },
    ratePrefixCompact: {
      fontSize: 13,
    },
    rateValue: {
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: 0.5,
      fontVariant: ['tabular-nums'],
    },
    rateValueCompact: {
      fontSize: 20,
      fontWeight: '700',
    },
    editButton: {
      padding: 4,
      marginLeft: 4,
    },
    usdRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: C.cardBorder,
    },
    usdText: {
      fontSize: 11,
      color: C.textMuted,
      letterSpacing: 0.3,
    },
  });
}

export default function RateCard({
  title,
  subtitle,
  rate,
  icon,
  color,
  loading,
  updatedAt,
  compact = false,
  onEdit,
}) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  const formatRate = (value) => {
    return Number(value).toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return <ShimmerEffect style={compact ? styles.compactCard : undefined} />;
  }

  return (
    <View style={[styles.card, compact && styles.compactCard, { shadowColor: color }]}>
      <View style={[styles.glowAccent, compact && styles.glowAccentCompact, { backgroundColor: color }]} />
      <View style={[styles.header, compact && styles.headerCompact]}>
        <View style={[styles.iconContainer, compact && styles.iconContainerCompact, { backgroundColor: color + '18' }]}>
          <Ionicons name={ICON_NAMES[icon] || 'ellipse'} size={compact ? 14 : 20} color={color} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, compact && styles.compactTitle]} numberOfLines={1}>{title}</Text>
          {subtitle && !compact && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.rateRow}>
        <Text style={[styles.ratePrefix, compact && styles.ratePrefixCompact, { color }]}>Bs.</Text>
        <AnimatedNumber value={rate} style={[styles.rateValue, compact && styles.rateValueCompact, { color }]} format={formatRate} duration={1000} />
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="pencil" size={compact ? 12 : 16} color={color} />
          </TouchableOpacity>
        )}
      </View>
      {rate !== null && rate !== undefined && !compact && (
        <View style={styles.usdRow}>
          <Ionicons name="logo-usd" size={11} color={C.textMuted} />
          <Text style={styles.usdText}>1 USD = {formatRate(rate)} Bs.</Text>
        </View>
      )}
    </View>
  );
}
