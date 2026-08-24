// Variante TERMINAL del rediseño monocromo (fuente: feature/ui-monocromo).
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import AnimatedNumber from '../../components/AnimatedNumber';
import ShimmerEffect from '../../components/ShimmerEffect';
import PressableScale from '../../components/PressableScale';
import useReduceMotion from '../../hooks/useReduceMotion';

function createStyles(C) {
  return StyleSheet.create({
    // === HERO (BCV, bloque invertido) ===
    hero: {
      backgroundColor: C.textPrimary,
      padding: 16,
      marginBottom: 10,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    liveChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    liveText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
      fontFamily: 'monospace',
    },
    heroTime: {
      fontSize: 10,
      fontFamily: 'monospace',
      opacity: 0.6,
    },
    heroTitle: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 1,
      fontFamily: 'monospace',
      marginBottom: 2,
    },
    heroRateRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 8,
    },
    heroPrefix: {
      fontSize: 18,
      fontWeight: '700',
      fontFamily: 'monospace',
      opacity: 0.55,
    },
    heroValue: {
      fontSize: 46,
      fontWeight: '900',
      letterSpacing: -1,
      fontFamily: 'monospace',
      fontVariant: ['tabular-nums'],
    },
    heroSubtitle: {
      fontSize: 11,
      fontFamily: 'monospace',
      opacity: 0.6,
      marginTop: 2,
    },
    heroMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderStyle: 'dashed',
    },
    metaText: {
      fontSize: 10,
      fontFamily: 'monospace',
    },

    // === FILA (paralelo / euro / binance / lunes) ===
    row: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderBottomWidth: 1,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    rowBracket: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'monospace',
      opacity: 0.5,
    },
    rowTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
      fontFamily: 'monospace',
      textTransform: 'uppercase',
    },
    rowValue: {
      fontSize: 19,
      fontWeight: '800',
      fontFamily: 'monospace',
      fontVariant: ['tabular-nums'],
    },
    rowBarTrack: {
      height: 8,
      marginTop: 6,
    },
    rowBarInner: {
      flexDirection: 'row',
      height: '100%',
    },
    rowBarFill: {
      height: '100%',
    },
    rowSub: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    rowSubText: {
      fontSize: 9,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    editButton: {
      padding: 4,
    },
  });
}

const TAGS = {
  bcv: 'BCV',
  paralelo: 'PAR',
  euro: 'EUR',
  gasolina: 'BNC',
  'bcv-lunes': 'LUN',
};

/**
 * Tarjeta de tasa estilo terminal.
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {number|null} [props.rate]
 * @param {string} [props.icon]
 * @param {string} [props.color]
 * @param {boolean} [props.loading]
 * @param {string} [props.updatedAt]
 * @param {'large'|'medium'|'compact'} [props.size]
 * @param {() => void} [props.onEdit]
 * @param {string} [props.type]
 * @param {number} [props.ratio] Proporción de la barra (0..1) respecto a la tasa máxima visible.
 */
function RateCard({
  title,
  subtitle,
  rate,
  icon,
  color,
  loading,
  updatedAt,
  size = 'medium',
  onEdit,
  type,
  ratio = 1,
}) {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  const formatRate = useCallback((value) => {
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const isLarge = size === 'large';
  const isCompact = size === 'compact';
  const reduceMotion = useReduceMotion();

  // Chip EN VIVO — pulso del punto (solo en el hero BCV)
  const livePulse = useRef(new Animated.Value(1)).current;
  const isLive = isLarge && type === 'bcv';
  useEffect(() => {
    if (!isLive || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.25, duration: 900, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, reduceMotion, livePulse]);

  if (loading) {
    return <ShimmerEffect style={isCompact ? {} : { marginBottom: 10, height: isLarge ? 130 : 64 }} />;
  }

  // === HERO INVERTIDO (solo BCV) ===
  if (isLarge) {
    const heroBody = (
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          {isLive && rate != null ? (
            <View style={styles.liveChip}>
              <Animated.View style={[styles.liveDot, { backgroundColor: C.onAccent, opacity: livePulse }]} />
              <Text style={[styles.liveText, { color: C.onAccent }]}>EN VIVO</Text>
            </View>
          ) : (
            <Text style={[styles.liveText, { color: C.onAccent, opacity: 0.5 }]}>[{TAGS.bcv}]</Text>
          )}
          {updatedAt ? (
            <Text style={[styles.heroTime, { color: C.onAccent }]}>{formatTime(updatedAt)}</Text>
          ) : null}
        </View>
        <Text style={[styles.heroTitle, { color: C.onAccent }]} numberOfLines={1}>{title}</Text>
        <View style={styles.heroRateRow}>
          <Text style={[styles.heroPrefix, { color: C.onAccent }]}>Bs.</Text>
          <AnimatedNumber
            value={rate}
            style={{ color: C.onAccent }}
            format={formatRate}
            duration={1200}
            animate
          />
        </View>
        {subtitle ? (
          <Text style={[styles.heroSubtitle, { color: C.onAccent }]}>{subtitle}</Text>
        ) : null}
        {updatedAt && (
          <View style={[styles.heroMeta, { borderTopColor: C.onAccent }]}>
            <Ionicons name="logo-usd" size={10} color={C.onAccent} />
            <Text style={[styles.metaText, { color: C.onAccent }]}>
              1 USD = {formatRate(rate)} Bs.
            </Text>
          </View>
        )}
      </View>
    );
    return heroBody;
  }

  // === FILA TERMINAL (resto de tasas) ===
  const clampedRatio = Math.max(0.04, Math.min(1, ratio));

  const rowBody = (
    <View style={[styles.row, { borderBottomColor: C.cardBorder }]}>
      <View style={styles.rowTop}>
        <Text style={[styles.rowBracket, { color: C.dimmed }]}>[</Text>
        <Text style={[styles.rowTitle, { color: C.textPrimary }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.rowBracket, { color: C.dimmed }]}>{']'}</Text>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="pencil" size={12} color={C.textPrimary} />
          </TouchableOpacity>
        )}
        <AnimatedNumber
          value={rate}
          style={[styles.rowValue, { color: C.textPrimary }]}
          format={formatRate}
          duration={800}
          animate={false}
        />
      </View>
      <View style={[styles.rowBarTrack, { backgroundColor: C.barTrack }]}>
        <View style={styles.rowBarInner}>
          <View style={[styles.rowBarFill, { flexGrow: clampedRatio, backgroundColor: C.textPrimary }]} />
          <View style={{ flexGrow: 1 - clampedRatio }} />
        </View>
      </View>
      {(subtitle || updatedAt) && !isCompact && (
        <View style={styles.rowSub}>
          {subtitle ? (
            <Text style={[styles.rowSubText, { color: C.textMuted }]}>{subtitle}</Text>
          ) : null}
          {updatedAt ? (
            <Text style={[styles.rowSubText, { color: C.dimmed }]}>{formatTime(updatedAt)}</Text>
          ) : null}
        </View>
      )}
    </View>
  );

  // Solo las filas con acción (onEdit) son presionables.
  return onEdit
    ? (
      <PressableScale onPress={onEdit} scaleTo={0.98}>
        {rowBody}
      </PressableScale>
    )
    : rowBody;
}

export default React.memo(RateCard);