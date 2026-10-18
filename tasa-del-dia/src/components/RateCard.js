// Componente COMPARTIDO de tarjeta de tasa para los 4 estilos de UI.
// La versión base (original) es la fuente de verdad de lógica, accesibilidad y
// comportamiento; los temas solo aportan diferencias VISUALES deliberadas a
// través de THEME_STYLES (mapa local de tokens).
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
import { useFintechFonts } from '../ui/fintech/fonts';

const ICON_NAMES = {
  bank: 'business',
  'trending-up': 'trending-up',
  globe: 'globe',
  'logo-bitcoin': 'logo-bitcoin',
  calendar: 'calendar',
};

// Etiqueta corta del hero invertido (estilo terminal).
const TAGS = {
  bcv: 'BCV',
  paralelo: 'PAR',
  euro: 'EUR',
  gasolina: 'BNC',
  'bcv-lunes': 'LUN',
};

// Verde "EN VIVO" del punto .rc-live (estilo fintech).
const LIVE_DOT = '#58D488';

// Tokens por estilo de UI. `styles` recibe (C, F) y devuelve SOLO los estilos
// que difieren del base; el resto se hereda del componente compartido.
const THEME_STYLES = {
  original: {},
  editorial: {
    flat: true,
    neutralAccent: true,
    iconPill: 'secondary',
    liveTone: 'monochrome',
    shimmer: { marginBottom: 16, borderRadius: 12, height: { large: 140, medium: 110 } },
    styles: (C) => ({
      cardLarge: { borderRadius: 12, backgroundColor: C.cardBg, marginBottom: 16 },
      cardMedium: { borderRadius: 12, backgroundColor: C.cardBg, padding: 20, marginBottom: 16 },
      cardCompact: { borderRadius: 12, backgroundColor: C.cardBg, padding: 14, marginBottom: 0 },
      iconContainerLarge: { borderRadius: 10 },
      iconContainerMedium: { borderRadius: 8 },
      iconContainerCompact: { borderRadius: 6 },
      titleLarge: { fontSize: 16, fontWeight: '500' },
      titleMedium: { fontSize: 16, fontWeight: '500' },
      titleCompact: { fontSize: 13, fontWeight: '500' },
      subtitleLarge: { fontSize: 12, fontWeight: '400' },
      subtitleCompactFallback: { fontSize: 12, fontWeight: '400', marginTop: 1 },
      ratePrefixLarge: { fontSize: 18, fontWeight: '500', opacity: 0.6 },
      ratePrefixMedium: { fontSize: 14, fontWeight: '500', opacity: 0.6 },
      ratePrefixCompact: { fontSize: 12, fontWeight: '500', opacity: 0.6 },
      rateValueLarge: { fontSize: 32, fontWeight: '700' },
      rateValueMedium: { fontSize: 24, fontWeight: '700' },
      rateValueCompact: { fontSize: 22, fontWeight: '700' },
      rateMetaLarge: { marginTop: 12, paddingTop: 12 },
      rateMetaMedium: { marginTop: 8, paddingTop: 8 },
      liveChip: { borderRadius: 6 },
      liveText: { fontWeight: '700' },
      metaText: { fontSize: 12, fontWeight: '400' },
    }),
  },
  fintech: {
    flat: true,
    neutralAccent: true,
    iconPill: 'tinted',
    liveTone: 'fintech',
    shimmer: { marginBottom: 16, borderRadius: 13, height: { large: 140, medium: 110 } },
    styles: (C, F) => ({
      cardLarge: { borderRadius: 16, backgroundColor: C.cardBg, marginBottom: 16 },
      cardMedium: { borderRadius: 13, backgroundColor: C.cardBg, padding: 20, marginBottom: 16, flexGrow: 1 },
      cardCompact: { borderRadius: 13, backgroundColor: C.cardBg, padding: 14, marginBottom: 0, flexGrow: 1 },
      iconContainerLarge: { borderRadius: 12 },
      iconContainerMedium: { borderRadius: 8 },
      iconContainerCompact: { borderRadius: 7 },
      titleLarge: { fontSize: 16, fontWeight: '500', letterSpacing: -0.2, fontFamily: F.sansMedium },
      titleMedium: { fontSize: 16, fontWeight: '500', letterSpacing: -0.2, fontFamily: F.sansMedium },
      titleCompact: { fontSize: 13, fontWeight: '500', fontFamily: F.sansMedium },
      subtitleLarge: { fontSize: 12, fontWeight: '400', fontFamily: F.sans },
      subtitleCompactFallback: { fontSize: 12, fontWeight: '400', marginTop: 1, fontFamily: F.sans },
      ratePrefixLarge: { fontSize: 18, fontWeight: '500', opacity: 0.6, fontFamily: F.mono },
      ratePrefixMedium: { fontSize: 14, fontWeight: '500', opacity: 0.6, fontFamily: F.mono },
      ratePrefixCompact: { fontSize: 12, fontWeight: '500', opacity: 0.6, fontFamily: F.mono },
      rateValueLarge: { fontSize: 32, fontWeight: '600', fontFamily: F.monoSemiBold },
      rateValueMedium: { fontSize: 24, fontWeight: '600', fontFamily: F.monoSemiBold },
      rateValueCompact: { fontSize: 22, fontWeight: '600', fontFamily: F.monoSemiBold },
      rateMetaLarge: { marginTop: 12, paddingTop: 12 },
      rateMetaMedium: { marginTop: 8, paddingTop: 8 },
      liveChip: { paddingHorizontal: 10, borderRadius: 999 },
      liveDot: { width: 6, height: 6, borderRadius: 3 },
      liveText: { fontWeight: '600', fontFamily: F.monoMedium },
      metaText: { fontSize: 12, fontWeight: '400', fontFamily: F.mono },
    }),
  },
  // El estilo terminal reemplaza la tarjeta por un hero invertido + filas con
  // barra proporcional; sus estilos son un juego propio de claves.
  terminal: {
    variant: 'terminal',
    styles: (C) => ({
      hero: { backgroundColor: C.textPrimary, padding: 16, marginBottom: 10 },
      heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
      // liveChip base (pastilla con borde) se anula: en terminal es solo un punto + texto
      liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 0, paddingVertical: 0, borderRadius: 0, marginBottom: 0, borderWidth: 0, alignSelf: 'auto' },
      liveDot: { width: 7, height: 7, borderRadius: 3.5 },
      liveText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, fontFamily: 'monospace' },
      heroTime: { fontSize: 10, fontFamily: 'monospace', opacity: 0.6 },
      heroTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, fontFamily: 'monospace', marginBottom: 2 },
      heroRateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
      heroValue: { fontSize: 46, fontWeight: '900', letterSpacing: -1, fontFamily: 'monospace', fontVariant: ['tabular-nums'] },
      heroPrefix: { fontSize: 18, fontWeight: '700', fontFamily: 'monospace', opacity: 0.55 },
      heroSubtitle: { fontSize: 11, fontFamily: 'monospace', opacity: 0.6, marginTop: 2 },
      heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderStyle: 'dashed' },
      metaText: { fontSize: 10, fontFamily: 'monospace' },
      row: { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
      rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
      rowBracket: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', opacity: 0.5 },
      rowTitle: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'monospace', textTransform: 'uppercase' },
      rowValue: { fontSize: 19, fontWeight: '800', fontFamily: 'monospace', fontVariant: ['tabular-nums'] },
      rowBarTrack: { height: 8, marginTop: 6 },
      rowBarInner: { flexDirection: 'row', height: '100%' },
      rowBarFill: { height: '100%' },
      rowSub: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
      rowSubText: { fontSize: 9, fontFamily: 'monospace', letterSpacing: 0.5 },
      editButton: { padding: 4, marginLeft: 0 },
    }),
  },
};

function createStyles(C, F, t) {
  const table = {
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
    subtitleCompactFallback: {
      fontSize: 10,
      marginTop: 1,
    },
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
  };

  const styles = { ...table };

  // Estilos planos (editorial/fintech): sin sombra ni elevación.
  if (t.flat) {
    ['cardLarge', 'cardMedium'].forEach((key) => {
      const s = { ...styles[key] };
      delete s.shadowOffset;
      delete s.shadowOpacity;
      delete s.shadowRadius;
      delete s.elevation;
      styles[key] = s;
    });
  }


  // Overrides visuales deliberados del tema (reciben C y F).
  const extra = typeof t.styles === 'function' ? t.styles(C, F) : (t.styles || {});
  Object.keys(extra).forEach((key) => {
    styles[key] = { ...(styles[key] || {}), ...extra[key] };
  });

  return StyleSheet.create(/** @type {any} */ (styles));
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
 * @param {number} [props.ratio] Proporción de la barra (0..1) respecto a la tasa máxima. Solo estilo terminal.
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
  const { colors: C, isDark, uiStyle } = useTheme();
  const F = useFintechFonts();
  const t = THEME_STYLES[uiStyle] ?? {};
  const styles = useMemo(() => createStyles(C, F, t), [C, F, t]);

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
  const useBlur = !t.flat && (Platform.OS === 'ios' || isLarge);

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
  // Valor/acento: los temas monocromo pintan la cifra en texto primario.
  const accentColor = t.neutralAccent ? C.textPrimary : color;
  const softColor = t.neutralAccent ? C.textSecondary : color;
  // Estable entre renders (memo de AnimatedNumber): el color solo cambia con el tema
  const numberStyle = useMemo(() => [valueStyle, { color: accentColor }], [valueStyle, accentColor]);

  if (loading) {
    if (t.variant === 'terminal') {
      return <ShimmerEffect style={isCompact ? {} : { marginBottom: 10, height: isLarge ? 130 : 64 }} />;
    }
    return (
      <ShimmerEffect
        style={
          isCompact
            ? {}
            : t.shimmer
              ? { marginBottom: t.shimmer.marginBottom, borderRadius: t.shimmer.borderRadius, height: t.shimmer.height[size] }
              : { marginBottom: 8, borderRadius: isLarge ? 20 : isMedium ? 18 : 14, height: isLarge ? 140 : isMedium ? 110 : 80 }
        }
      />
    );
  }

  // === HERO INVERTIDO (estilo terminal: solo BCV) ===
  if (t.variant === 'terminal' && isLarge) {
    const heroBody = (
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          {isLive && rate != null ? (
            <View style={styles.liveChip}>
              <Animated.View style={[styles.liveDot, { backgroundColor: C.onAccent, opacity: livePulse }]} />
              <Text style={[styles.liveText, { color: C.onAccent }]}>EN VIVO</Text>
            </View>
          ) : (
            <Text style={[styles.liveText, { color: C.onAccent, opacity: 0.5 }]}>{`[${TAGS.bcv}]`}</Text>
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
            style={[styles.heroValue, { color: C.onAccent }]}
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

  const cardStyle = isLarge ? styles.cardLarge : isMedium ? styles.cardMedium : styles.cardCompact;
  const glowStyle = isLarge ? styles.glowAccentLarge : isMedium ? styles.glowAccentMedium : styles.glowAccentCompact;
  const headerStyle = isLarge ? styles.headerLarge : isMedium ? styles.headerMedium : styles.headerCompact;
  const iconContainerStyle = isLarge ? styles.iconContainerLarge : isMedium ? styles.iconContainerMedium : styles.iconContainerCompact;
  const iconSize = isLarge ? 22 : isMedium ? 16 : 13;
  const titleStyle = isLarge ? styles.titleLarge : isMedium ? styles.titleMedium : styles.titleCompact;
  const rateRowStyle = isLarge ? styles.rateRowLarge : isMedium ? styles.rateRowMedium : styles.rateRowCompact;
  const prefixStyle = isLarge ? styles.ratePrefixLarge : isMedium ? styles.ratePrefixMedium : styles.ratePrefixCompact;

  // === FILA TERMINAL (resto de tasas) ===
  if (t.variant === 'terminal') {
    const clampedRatio = Math.max(0.04, Math.min(1, ratio));

    const rowBody = (
      <View style={[styles.row, { borderBottomColor: C.cardBorder }]}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowBracket, { color: C.dimmed }]}>[</Text>
          <Text style={[styles.rowTitle, { color: C.textPrimary }]} numberOfLines={1}>{title}</Text>
          <Text style={[styles.rowBracket, { color: C.dimmed }]}>{']'}</Text>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={`Editar ${title}`}>
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

  const cardBody = (
    <View style={[cardStyle, !t.flat && { shadowColor: glowColor }, !t.flat && !useBlur && { backgroundColor: C.glassCard }]}>
      {useBlur && (
        <BlurView
          intensity={Platform.OS === 'android' ? 30 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      )}
      {!t.flat && <View style={[glowStyle, { backgroundColor: color }]} />}
      {/* Glass 2.0 — brillo especular superior (más sutil en tema claro) */}
      {!t.flat && (
        <LinearGradient
          colors={[isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={[styles.specularEdge, { borderRadius: isLarge ? 20 : isMedium ? 18 : 14 }]}
          pointerEvents="none"
        />
      )}

      {isLive && rate != null && (
        <View style={[styles.liveChip, t.liveTone ? { backgroundColor: C.cardBg, borderColor: C.cardBorder } : { backgroundColor: color + '12', borderColor: color + '30' }]}>
          <Animated.View style={[styles.liveDot, { backgroundColor: t.liveTone === 'fintech' ? LIVE_DOT : t.liveTone ? C.textPrimary : color, opacity: livePulse }]} />
          <Text style={[styles.liveText, { color: t.liveTone === 'fintech' ? C.textSecondary : t.liveTone ? C.textPrimary : color }]}>EN VIVO</Text>
        </View>
      )}

      <View style={headerStyle}>
        <View style={[iconContainerStyle, { backgroundColor: t.iconPill === 'secondary' ? C.secondary : t.iconPill === 'tinted' ? (color || C.textMuted) + '1A' : color.startsWith('#') ? color + '18' : color }]}>
          <Ionicons name={ICON_NAMES[icon] || 'ellipse'} size={iconSize} color={t.iconPill === 'secondary' ? C.textPrimary : color || C.textMuted} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[titleStyle, { color: C.textPrimary }]} numberOfLines={1}>{title}</Text>
          {subtitle && !isCompact && (
            <Text style={isLarge ? styles.subtitleLarge : [styles.subtitleCompactFallback, { color: C.textMuted }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel={`Editar ${title}`}>
            <Ionicons name="pencil" size={isLarge ? 16 : 12} color={softColor} />
          </TouchableOpacity>
        )}
      </View>
      <View style={rateRowStyle}>
        <Text style={[prefixStyle, { color: softColor }]}>Bs.</Text>
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
