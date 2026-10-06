// Estilo FINTECH — tarjetas de tasa al estilo de las filas .rc-row:
// radios 13px, chip "EN VIVO" con punto verde, icono en pastilla tintada y
// cifras en JetBrains Mono (la --font-mono del sitio).
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import AnimatedNumber from '../../components/AnimatedNumber';
import ShimmerEffect from '../../components/ShimmerEffect';
import PressableScale from '../../components/PressableScale';
import useReduceMotion from '../../hooks/useReduceMotion';
import { useFintechFonts } from './fonts';

const ICON_NAMES = {
  bank: 'business',
  'trending-up': 'trending-up',
  globe: 'globe',
  'logo-bitcoin': 'logo-bitcoin',
  calendar: 'calendar',
};

// Verde "EN VIVO" del punto .rc-live
const LIVE_DOT = '#58D488';

function createStyles(C, F) {
  return StyleSheet.create({
    // === LARGE (hero card, 2 columnas) ===
    cardLarge: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.cardBg,
      padding: 20,
      marginBottom: 16,
    },
    headerLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconContainerLarge: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    titleLarge: {
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: -0.2,
      fontFamily: F.sansMedium,
    },
    subtitleLarge: {
      fontSize: 12,
      fontWeight: '400',
      marginTop: 2,
      fontFamily: F.sans,
    },
    subtitleCompactFallback: {
      fontSize: 12,
      fontWeight: '400',
      marginTop: 1,
      fontFamily: F.sans,
    },
    rateRowLarge: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    ratePrefixLarge: {
      fontSize: 18,
      fontWeight: '500',
      opacity: 0.6,
      fontFamily: F.mono,
    },
    rateValueLarge: {
      fontSize: 32,
      fontWeight: '600',
      letterSpacing: 0.5,
      fontVariant: ['tabular-nums'],
      fontFamily: F.monoSemiBold,
    },
    rateMetaLarge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
    },

    // === MEDIUM (1 columna) ===
    cardMedium: {
      borderRadius: 13,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.cardBg,
      padding: 20,
      marginBottom: 16,
      // Dentro de bentoHalf (columna) la altura es eje main: sin flexGrow la
      // tarjeta queda a altura natural y las parejas del bento se desigualan.
      flexGrow: 1,
    },
    headerMedium: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainerMedium: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    titleMedium: {
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: -0.2,
      fontFamily: F.sansMedium,
    },
    rateRowMedium: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    ratePrefixMedium: {
      fontSize: 14,
      fontWeight: '500',
      opacity: 0.6,
      fontFamily: F.mono,
    },
    rateValueMedium: {
      // 24 = cabe en la columna media del bento (~120dp); 32 desbordaba a 360dp
      fontSize: 24,
      fontWeight: '600',
      letterSpacing: 0.3,
      fontVariant: ['tabular-nums'],
      fontFamily: F.monoSemiBold,
    },
    rateMetaMedium: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
    },

    // === COMPACT ===
    cardCompact: {
      borderRadius: 13,
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.cardBg,
      padding: 14,
      marginBottom: 0,
      flexGrow: 1,
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
      fontSize: 13,
      fontWeight: '500',
      fontFamily: F.sansMedium,
    },
    rateRowCompact: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 3,
    },
    ratePrefixCompact: {
      fontSize: 12,
      fontWeight: '500',
      opacity: 0.6,
      fontFamily: F.mono,
    },
    rateValueCompact: {
      fontSize: 22,
      fontWeight: '600',
      letterSpacing: 0.3,
      fontVariant: ['tabular-nums'],
      fontFamily: F.monoSemiBold,
    },

    // Chip EN VIVO — pastilla del sitio (punto verde + mono)
    liveChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 10,
      borderWidth: 1,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    liveText: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 1.2,
      fontFamily: F.monoMedium,
    },

    // Shared
    editButton: {
      padding: 4,
      marginLeft: 4,
    },
    metaText: {
      fontSize: 12,
      fontWeight: '400',
      fontFamily: F.mono,
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
  const { colors: C } = useTheme();
  const F = useFintechFonts();
  const styles = useMemo(() => createStyles(C, F), [C, F]);

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
  const isMedium = size === 'medium';
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

  const valueStyle = isLarge ? styles.rateValueLarge : isMedium ? styles.rateValueMedium : styles.rateValueCompact;
  // Estable entre renders (memo de AnimatedNumber): el color solo cambia con el tema
  const numberStyle = useMemo(
    () => [valueStyle, { color: C.textPrimary }],
    [valueStyle, C.textPrimary]
  );

  if (loading) {
    return <ShimmerEffect style={isCompact ? {} : { marginBottom: 16, borderRadius: 13, height: isLarge ? 140 : 110 }} />;
  }

  const cardStyle = isLarge ? styles.cardLarge : isMedium ? styles.cardMedium : styles.cardCompact;
  const headerStyle = isLarge ? styles.headerLarge : isMedium ? styles.headerMedium : styles.headerCompact;
  const iconContainerStyle = isLarge ? styles.iconContainerLarge : isMedium ? styles.iconContainerMedium : styles.iconContainerCompact;
  const iconSize = isLarge ? 22 : isMedium ? 16 : 13;
  const titleStyle = isLarge ? styles.titleLarge : isMedium ? styles.titleMedium : styles.titleCompact;
  const rateRowStyle = isLarge ? styles.rateRowLarge : isMedium ? styles.rateRowMedium : styles.rateRowCompact;
  const prefixStyle = isLarge ? styles.ratePrefixLarge : isMedium ? styles.ratePrefixMedium : styles.ratePrefixCompact;

  const cardBody = (
    <View style={cardStyle}>
      {isLive && rate != null && (
        <View style={[styles.liveChip, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
          <Animated.View style={[styles.liveDot, { backgroundColor: LIVE_DOT, opacity: livePulse }]} />
          <Text style={[styles.liveText, { color: C.textSecondary }]}>EN VIVO</Text>
        </View>
      )}

      <View style={headerStyle}>
        {/* Pastilla tintada con el color del mercado, como los badges .b del sitio */}
        <View style={[iconContainerStyle, { backgroundColor: (color || C.textMuted) + '1A' }]}>
          <Ionicons name={ICON_NAMES[icon] || 'ellipse'} size={iconSize} color={color || C.textMuted} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[titleStyle, { color: C.textPrimary }]} numberOfLines={1}>{title}</Text>
          {subtitle && !isCompact && (
            <Text style={[isLarge ? styles.subtitleLarge : styles.subtitleCompactFallback, { color: C.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="pencil" size={isLarge ? 16 : 12} color={C.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={rateRowStyle}>
        <Text style={[prefixStyle, { color: C.textSecondary }]}>Bs.</Text>
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

  // Solo las tarjetas con acción (onEdit) son presionables; el resto se
  // renderiza plano para no sugerir interactividad inexistente.
  return onEdit
    ? (
      <PressableScale onPress={onEdit} scaleTo={0.98}>
        {cardBody}
      </PressableScale>
    )
    : cardBody;
}

export default React.memo(RateCard);
