// Componente COMPARTIDO de cabecera de Tasas para los 4 estilos de UI.
// La versión base (original, con degradado de bandera) es la fuente de verdad;
// los temas solo aportan diferencias VISUALES deliberadas vía THEME_STYLES.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemeToggleMini from './ThemeToggleMini';
import UiStyleToggle from './UiStyleToggle';
import { useTheme } from '../context/ThemeContext';
import { useFintechFonts } from '../ui/fintech/fonts';

// Tokens por estilo de UI. `logo: null` = sin pastilla de icono (terminal).
const THEME_STYLES = {
  original: {},
  editorial: {
    flat: true,
    logoIcon: 'trending-down',
    logo: (C) => ({ container: { borderColor: C.cardBorder }, icon: C.textPrimary }),
    badge: (C) => ({ backgroundColor: C.cardBg, borderColor: C.cardBorder }),
    error: (C) => ({ bg: C.cardBg, border: C.cardBorder, fg: C.textPrimary }),
    offline: (C) => ({ bg: C.cardBg, border: C.cardBorder, fg: C.textSecondary }),
    styles: {
      logoContainer: { borderRadius: 10 },
      headerTitle: { fontWeight: '600' },
      headerSubtitle: { fontSize: 12, fontWeight: '400' },
      banner: { borderRadius: 8 },
      bannerText: { fontSize: 12, fontWeight: '400' },
      headerRow: { paddingVertical: 8 },
    },
  },
  fintech: {
    flat: true,
    fonts: true,
    logoIcon: 'trending-up',
    logo: (C) => ({
      container: { backgroundColor: C.success + '14', borderColor: C.success + '2E' },
      icon: C.success,
    }),
    badge: (C) => ({ backgroundColor: C.cardBg, borderColor: C.cardBorder }),
    error: (C) => ({ bg: C.cardBg, border: C.cardBorder, fg: C.textPrimary }),
    offline: (C) => ({ bg: C.cardBg, border: C.cardBorder, fg: C.textSecondary }),
    styles: (C, F) => ({
      headerTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
      headerSubtitle: { fontSize: 11, fontWeight: '500', letterSpacing: 0.8 },
      badge: { borderRadius: 999, paddingHorizontal: 7 },
      banner: { borderRadius: 13 },
      bannerText: { fontSize: 12, fontWeight: '400' },
      headerRow: { paddingVertical: 8 },
    }),
  },
  // Terminal: fila de prompt sin pastilla, subtítulo con datos y banners
  // transparentes de borde punteado.
  terminal: {
    variant: 'terminal',
    flat: true,
    prompt: true,
    logo: null,
    subtitleText: 'VENEZUELA // BCV · PARALELO · EURO',
    badge: () => ({}),
    error: (C) => ({ bg: 'transparent', border: C.textPrimary, fg: C.textPrimary }),
    offline: (C) => ({ bg: 'transparent', border: C.dimmed, fg: C.dimmed }),
    styles: {
      headerRow: { gap: 8, paddingHorizontal: 4, paddingBottom: 10, borderBottomWidth: 1, borderStyle: 'dashed' },
      prompt: { fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
      headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1, fontFamily: 'monospace' },
      headerSubtitle: { fontSize: 8, fontWeight: '600', letterSpacing: 1.5, fontFamily: 'monospace', marginTop: 2 },
      badge: { borderRadius: 0, borderWidth: 0, paddingHorizontal: 6, paddingVertical: 3 },
      banner: { borderRadius: 0, marginTop: 8, borderStyle: 'dashed' },
      bannerText: { fontFamily: 'monospace' },
    },
  },
};

function createStyles(C, F, t) {
  const table = {
    wrap: {
      paddingHorizontal: 14,
      paddingTop: 6,
      paddingBottom: 2,
    },
    headerBg: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logoContainer: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    titleBlock: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    headerSubtitle: {
      fontSize: 10,
      fontWeight: '500',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginTop: 1,
    },
    prompt: {
      fontFamily: 'monospace',
    },
    badge: {
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: 14,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 6,
      marginTop: 6,
      borderWidth: 1,
    },
    bannerText: {
      fontSize: 11,
      flex: 1,
    },
  };

  const extra = typeof t.styles === 'function' ? t.styles(C, F) : (t.styles || {});
  Object.keys(extra).forEach((key) => {
    table[key] = { ...(table[key] || {}), ...extra[key] };
  });

  return StyleSheet.create(/** @type {any} */ (table));
}

const errorToneOf = (t, C) => (t.error ? t.error(C) : { bg: C.highlight + '20', border: C.highlight + '30', fg: C.highlight });
const offlineToneOf = (t, C) => (t.offline ? t.offline(C) : { bg: C.warning + '20', border: C.warning + '30', fg: C.warning });

function RatesHeader({ C, error, offlineMode, offlineCachedAt }) {
  const { uiStyle } = useTheme();
  const F = useFintechFonts();
  const t = THEME_STYLES[uiStyle] ?? {};
  const styles = createStyles(C, F, t);

  const logo = t.logo ? t.logo(C) : null;
  const badgeTone = t.badge ? t.badge(C) : { backgroundColor: C.cardBg, borderColor: C.cardBorder };
  const errorTone = errorToneOf(t, C);
  const offlineTone = offlineToneOf(t, C);

  /* Header row */
  const headerRow = (
    <View style={[styles.headerRow, { borderBottomColor: C.cardBorder }]}>
      {t.prompt && <Text style={[styles.prompt, { color: C.dimmed }]}>{'>'}</Text>}

      {/* Icono */}
      {t.logo !== null && (
        t.flat ? (
          <View style={[styles.logoContainer, logo.container]}>
            <Ionicons name={t.logoIcon || 'trending-down'} size={18} color={logo.icon} />
          </View>
        ) : (
          <LinearGradient
            colors={[C.highlight + '30', C.highlight + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.logoContainer, { borderColor: C.highlight + '30' }]}
          >
            <Ionicons name="trending-down" size={18} color={C.highlight} />
          </LinearGradient>
        )
      )}

      {/* Título */}
      <View style={styles.titleBlock}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }, t.fonts && { fontFamily: F.sansSemiBold }]}>
          Tasa del Día
        </Text>
        <Text style={[styles.headerSubtitle, { color: C.textMuted }, t.fonts && { fontFamily: F.monoMedium }]}>
          {t.subtitleText || 'Venezuela'}
        </Text>
      </View>

      {/* Badge + Toggle */}
      <View style={[styles.badge, badgeTone]}>
        <Text style={styles.badgeText}>🇻🇪</Text>
      </View>
      <ThemeToggleMini />
      <UiStyleToggle />
    </View>
  );

  return (
    <View style={styles.wrap}>
      {t.flat ? (
        headerRow
      ) : (
        <LinearGradient
          colors={[C.flagYellow + '12', C.flagBlue + '10', C.flagRed + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBg}
        >
          {headerRow}
        </LinearGradient>
      )}

      {/* Error / offline banner */}
      {error && !offlineMode && (
        <View style={[styles.banner, { backgroundColor: errorTone.bg, borderColor: errorTone.border }]}>
          <Ionicons name="alert-circle" size={13} color={errorTone.fg} />
          <Text style={[styles.bannerText, { color: errorTone.fg }, t.fonts && { fontFamily: F.sans }]}>{error}</Text>
        </View>
      )}
      {offlineMode && (
        <View style={[styles.banner, { backgroundColor: offlineTone.bg, borderColor: offlineTone.border }]}>
          <Ionicons name="cloud-offline-outline" size={13} color={offlineTone.fg} />
          <Text style={[styles.bannerText, { color: offlineTone.fg }, t.fonts && { fontFamily: F.sans }]}>
            Sin conexión — Mostrando últimas tasas disponibles
            {offlineCachedAt ? ` (${new Date(offlineCachedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })})` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export default React.memo(RatesHeader);
