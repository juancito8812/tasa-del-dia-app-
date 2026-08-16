import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import ThemeToggleMini from './ThemeToggleMini';

function RatesHeader({ C, error, offlineMode, offlineCachedAt }) {
  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 2 }}>
      {/* Header row */}
      <LinearGradient
        colors={[C.flagYellow + '12', C.flagBlue + '10', C.flagRed + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBg}
      >
        <View style={styles.headerRow}>
          {/* Icono */}
          <LinearGradient
            colors={[C.highlight + '30', C.highlight + '10']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.logoContainer, { borderColor: C.highlight + '30' }]}
          >
            <Ionicons name="trending-down" size={18} color={C.highlight} />
          </LinearGradient>

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
        </View>
      </LinearGradient>

      {/* Error / offline banner */}
      {error && !offlineMode && (
        <View style={[styles.banner, { backgroundColor: C.highlight + '20', borderColor: C.highlight + '30' }]}>
          <Ionicons name="alert-circle" size={13} color={C.highlight} />
          <Text style={[styles.bannerText, { color: C.highlight }]}>{error}</Text>
        </View>
      )}
      {offlineMode && (
        <View style={[styles.banner, { backgroundColor: C.warning + '20', borderColor: C.warning + '30' }]}>
          <Ionicons name="cloud-offline-outline" size={13} color={C.warning} />
          <Text style={[styles.bannerText, { color: C.warning }]}>
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
});
