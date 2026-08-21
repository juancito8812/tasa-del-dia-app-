import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ThemeToggleMini from './ThemeToggleMini';

function RatesHeader({ C, error, offlineMode, offlineCachedAt }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.headerRow, { borderBottomColor: C.cardBorder }]}>
        <Text style={[styles.prompt, { color: C.dimmed }]}>{'>'}</Text>
        <View style={styles.titleBlock}>
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Tasa del Día</Text>
          <Text style={[styles.headerSubtitle, { color: C.textMuted }]}>VENEZUELA // BCV · PARALELO · EURO</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🇻🇪</Text>
        </View>
        <ThemeToggleMini />
      </View>

      {/* Error / offline banner */}
      {error && !offlineMode && (
        <View style={[styles.banner, { borderColor: C.textPrimary }]}>
          <Ionicons name="alert-circle" size={13} color={C.textPrimary} />
          <Text style={[styles.bannerText, { color: C.textPrimary }]}>{error}</Text>
        </View>
      )}
      {offlineMode && (
        <View style={[styles.banner, { borderColor: C.dimmed }]}>
          <Ionicons name="cloud-offline-outline" size={13} color={C.dimmed} />
          <Text style={[styles.bannerText, { color: C.dimmed }]}>
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
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  prompt: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  titleBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  headerSubtitle: {
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 14,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  bannerText: {
    fontSize: 11,
    flex: 1,
    fontFamily: 'monospace',
  },
});