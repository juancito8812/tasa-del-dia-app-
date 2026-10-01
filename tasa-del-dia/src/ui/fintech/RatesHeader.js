// Estilo FINTECH — cabecera de Tasas: título en Space Grotesk con tracking
// negativo (como el h1 del sitio), subtítulo mono y pastilla de bandera.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ThemeToggleMini from '../../components/ThemeToggleMini';
import UiStyleToggle from '../../components/UiStyleToggle';
import { useFintechFonts } from './fonts';

function RatesHeader({ C, error, offlineMode, offlineCachedAt }) {
  const F = useFintechFonts();
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 2 }}>
      {/* Header row — fondo transparente */}
      <View style={styles.headerRow}>
        {/* Pastilla tintada amarilla, como la fila BCV del sitio */}
        <View style={[styles.logoContainer, { backgroundColor: C.success + '14', borderColor: C.success + '2E' }]}>
          <Ionicons name="trending-up" size={18} color={C.success} />
        </View>

        {/* Título */}
        <View style={styles.titleBlock}>
          <Text style={[styles.headerTitle, { color: C.textPrimary, fontFamily: F.sansSemiBold }]}>Tasa del Día</Text>
          <Text style={[styles.headerSubtitle, { color: C.textMuted, fontFamily: F.monoMedium }]}>Venezuela</Text>
        </View>

        {/* Badge + Toggles */}
        <View style={[styles.badge, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
          <Text style={styles.badgeText}>🇻🇪</Text>
        </View>
        <ThemeToggleMini />
        <UiStyleToggle />
      </View>

      {/* Error / offline banner */}
      {error && !offlineMode && (
        <View style={[styles.banner, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
          <Ionicons name="alert-circle" size={13} color={C.textPrimary} />
          <Text style={[styles.bannerText, { color: C.textPrimary, fontFamily: F.sans }]}>{error}</Text>
        </View>
      )}
      {offlineMode && (
        <View style={[styles.banner, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
          <Ionicons name="cloud-offline-outline" size={13} color={C.textSecondary} />
          <Text style={[styles.bannerText, { color: C.textSecondary, fontFamily: F.sans }]}>
            Sin conexión — Mostrando últimas tasas disponibles
            {offlineCachedAt ? ` (${new Date(offlineCachedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })})` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export default React.memo(RatesHeader);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
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
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 14,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 6,
    borderWidth: 1,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
  },
});
