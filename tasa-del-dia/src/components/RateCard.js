import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import AnimatedNumber from './AnimatedNumber';
import ShimmerEffect from './ShimmerEffect';
import PressableScale from './PressableScale';
import useReduceMotion from '../hooks/useReduceMotion';

const ICON_NAMES = {
  bank: 'bank',
  'trending-up': 'trending-up',
  globe: 'globe',
  'logo-bitcoin': 'logo-bitcoin',
  calendar: 'calendar',
};

function createStyles(C) {
  return StyleSheet.create({
    // === LARGE (hero card, 2 columns) ===
    cardLarge: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 20,
      marginBottom: 8,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
      overflow: 'hidden',
    },
    glowAccentLarge: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      opacity: 0.7,
    },
    headerLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconContainerLarge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    titleLarge: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    subtitleLarge: {
      fontSize: 12,
      marginTop: 2,
      letterSpacing: 0.2,
    },
    rateRowLarge: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    ratePrefixLarge: {
      fontSize: 20,
      fontWeight: '700',
      opacity: 0.7,
    },
    rateValueLarge: {
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: 0.5,
      fontVariant: ['tabular-nums'],
    },
    rateMetaLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
      paddingTop: 10,
      borderTopWidth: 1,
    },

    // === MEDIUM (1 column, standard) ===
    cardMedium: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 14,
      marginBottom: 8,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 6,
      overflow: 'hidden',
    },
    glowAccentMedium: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      opacity: 0.6,
    },
    headerMedium: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainerMedium: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    titleMedium: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    rateRowMedium: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    ratePrefixMedium: {
      fontSize: 14,
      fontWeight: '600',
      opacity: 0.7,
    },
    rateValueMedium: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: 0.3,
      fontVariant: ['tabular-nums'],
    },
    rateMetaMedium: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
    },

    // === COMPACT (small, inline) ===
    cardCompact: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 10,
      marginBottom: 0,
      overflow: 'hidden',
    },
    glowAccentCompact: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      opacity: 0.5,
    },
    headerCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconContainerCompact: {
      width: 24,
      height: 24,
      borderRadius: 7,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    },
    titleCompact: {
      fontSize: 11,
      fontWeight: '600',
    },
    rateRowCompact: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 3,
    },
    ratePrefixCompact: {
      fontSize: 12,
      fontWeight: '600',
      opacity: 0.7,
    },
    rateValueCompact: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: 0.3,
      fontVariant: ['tabular-nums'],
    },

    // Glass 2.0 — specular edge highlight (brillo superior)
    specularEdge: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1.5,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },

    // Chip EN VIVO
    liveChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 10,
      borderWidth: 1,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    liveText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
    },

    // Shared
    editButton: {
      padding: 4,
      marginLeft: 4,
    },
    metaText: {
      fontSize: 10,
    },
    usdIcon: {
      fontSize: 10,
    },
    titleBlock: {
      flex: 1,
    },
  });
}

/**
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
}) {
  const { colors: C, isDark } = useTheme();
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

  const glowColor = {
    bcv: C.glowBcv,
    paralelo: C.glowParalelo,
    euro: C.glowEuro,
    'bcv-lunes': C.glowBcvLunes,
    gasolina: C.glowGasolina,
  }[type] || 'rgba(255,255,255,0.05)';

  const isLarge = size === 'large';
  const isCompact = size === 'compact';
  const isMedium = size === 'medium';
  const reduceMotion = useReduceMotion();

  // BlurView es costoso en Android (render effect por instancia). Solo se usa
  // en la tarjeta hero (large); el resto usa glassCard (translúcido, ~costo cero).
  // En iOS el blur es nativo y barato, se mantiene en todas.
  const useBlur = Platform.OS === 'ios' || isLarge;

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

  const valueStyle = isLarge ? styles.rateValueLarge : isMedium ? styles.rateValueMedium : styles.rateValueCompact;
  // Estable entre renders (memo de AnimatedNumber): el color solo cambia con el tema
  const numberStyle = useMemo(() => [valueStyle, { color }], [valueStyle, color]);

  if (loading) {
    return <ShimmerEffect style={isCompact ? {} : { marginBottom: 8, borderRadius: isLarge ? 20 : isMedium ? 18 : 14, height: isLarge ? 140 : isMedium ? 110 : 80 }} />;
  }

  const cardStyle = isLarge ? styles.cardLarge : isMedium ? styles.cardMedium : styles.cardCompact;
  const glowStyle = isLarge ? styles.glowAccentLarge : isMedium ? styles.glowAccentMedium : styles.glowAccentCompact;
  const headerStyle = isLarge ? styles.headerLarge : isMedium ? styles.headerMedium : styles.headerCompact;
  const iconContainerStyle = isLarge ? styles.iconContainerLarge : isMedium ? styles.iconContainerMedium : styles.iconContainerCompact;
  const iconSize = isLarge ? 22 : isMedium ? 16 : 13;
  const titleStyle = isLarge ? styles.titleLarge : isMedium ? styles.titleMedium : styles.titleCompact;
  const rateRowStyle = isLarge ? styles.rateRowLarge : isMedium ? styles.rateRowMedium : styles.rateRowCompact;
  const prefixStyle = isLarge ? styles.ratePrefixLarge : isMedium ? styles.ratePrefixMedium : styles.ratePrefixCompact;

  const cardBody = (
    <View style={[cardStyle, { shadowColor: glowColor }, !useBlur && { backgroundColor: C.glassCard }]}>
      {useBlur && (
        <BlurView
          intensity={Platform.OS === 'android' ? 30 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[glowStyle, { backgroundColor: color }]} />
      {/* Glass 2.0 — brillo especular superior (más sutil en tema claro) */}
      <LinearGradient
        colors={[isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.specularEdge, { borderRadius: isLarge ? 20 : isMedium ? 18 : 14 }]}
        pointerEvents="none"
      />

      {isLive && rate != null && (
        <View style={[styles.liveChip, { backgroundColor: color + '12', borderColor: color + '30' }]}>
          <Animated.View style={[styles.liveDot, { backgroundColor: color, opacity: livePulse }]} />
          <Text style={[styles.liveText, { color }]}>EN VIVO</Text>
        </View>
      )}

      <View style={headerStyle}>
        <View style={[iconContainerStyle, { backgroundColor: color.startsWith('#') ? color + '18' : color }]}>
          <Ionicons name={ICON_NAMES[icon] || 'ellipse'} size={iconSize} color={color} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[titleStyle, { color: C.textPrimary }]} numberOfLines={1}>{title}</Text>
          {subtitle && !isCompact && (
            <Text style={isLarge ? styles.subtitleLarge : { fontSize: 10, color: C.textMuted, marginTop: 1 }}>
              {subtitle}
            </Text>
          )}
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="pencil" size={isLarge ? 16 : 12} color={color} />
          </TouchableOpacity>
        )}
      </View>
      <View style={rateRowStyle}>
        <Text style={[prefixStyle, { color }]}>Bs.</Text>
        <AnimatedNumber
          value={rate}
          style={numberStyle}
          format={formatRate}
          duration={isLarge ? 1200 : 800}
          // Solo la tarjeta hero (large) anima el conteo: las 4 restantes
          // muestran el valor directo (menos trabajo JS en el arranque/refresh)
          animate={isLarge}
        />
      </View>
      {updatedAt && !isCompact && (
        <View style={[isLarge ? styles.rateMetaLarge : styles.rateMetaMedium, { borderTopColor: C.cardBorder }]}>
          <Ionicons name="time-outline" size={isLarge ? 12 : 10} color={C.textMuted} />
          <Text style={[styles.metaText, { color: C.textMuted }]}>
            {formatTime(updatedAt)}
          </Text>
          {isLarge && (
            <>
              <Ionicons name="logo-usd" size={10} color={C.textMuted} style={{ marginLeft: 8 }} />
              <Text style={[styles.metaText, { color: C.textMuted }]}>
                1 USD = {formatRate(rate)} Bs.
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );

  // Solo las tarjetas con acción (onEdit) son presionables; el resto
  // (hero, paralelo, euro, etc.) se renderiza plano para no sugerir
  // interactividad inexistente.
  return onEdit
    ? (
      <PressableScale onPress={onEdit} scaleTo={0.98}>
        {cardBody}
      </PressableScale>
    )
    : cardBody;
}

export default React.memo(RateCard);
