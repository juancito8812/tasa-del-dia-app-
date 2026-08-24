import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ThemeToggleMini from './ThemeToggleMini';
import UiStyleToggle from './UiStyleToggle';

function RatesHeader({ C, error, offlineMode, offlineCachedAt }) {
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 2 }}>
      {/* Header row — fondo transparente */}
      <View style={styles.headerRow}>
        {/* Icono */}
        <View style={[styles.logoContainer, { borderColor: C.cardBorder }]}>
          <Ionicons name="trending-down" size={18} color={C.textPrimary} />
        </View>

        {/* Título */}
        <View style={styles.titleBlock}>
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Tasa del Día</Text>
          <Text style={[styles.headerSubtitle, { color: C.textMuted }]}>Venezuela</Text>
        </View>

        {/* Badge + Toggle */}
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
          <Text style={[styles.bannerText, { color: C.textPrimary }]}>{error}</Text>
        </View>
      )}
      {offlineMode && (
        <View style={[styles.banner, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
          <Ionicons name="cloud-offline-outline" size={13} color={C.textSecondary} />
          <Text style={[styles.bannerText, { color: C.textSecondary }]}>
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
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  titleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 1,
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
    borderRadius: 8,
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