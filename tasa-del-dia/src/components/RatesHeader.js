import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemeToggleMini from './ThemeToggleMini';

export default function RatesHeader({ C, error, offlineMode, offlineCachedAt }) {
  return (
    <View style={[styles.header, { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }]}>
      <View style={styles.headerRow}>
        <View style={[styles.logoContainer, { backgroundColor: C.highlight + '15' }]}>
          <Ionicons name="trending-down" size={18} color={C.highlight} />
        </View>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Tasa del Día</Text>
        <ThemeToggleMini />
        <View style={[styles.badge, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
          <Text style={styles.badgeText}>🇻🇪</Text>
        </View>
      </View>
      {error && !offlineMode && (
        <View style={[styles.banner, { backgroundColor: C.highlight }]}>
          <Ionicons name="alert-circle" size={12} color="#fff" />
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      )}
      {offlineMode && (
        <View style={[styles.banner, { backgroundColor: C.warning }]}>
          <Ionicons name="cloud-offline-outline" size={12} color="#fff" />
          <Text style={styles.bannerText}>
            Sin conexión — Mostrando últimas tasas disponibles
            {offlineCachedAt ? ` (${new Date(offlineCachedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })})` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  },
  bannerText: {
    color: '#fff',
    fontSize: 11,
    flex: 1,
  },
});
