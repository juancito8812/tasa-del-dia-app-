import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import useRatesData from '../hooks/useRatesData';
import RateCard from '../components/RateCard';
import RatesHeader from '../components/RatesHeader';
import BCVModal from '../components/BCVModal';

function createStyles(C) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 },
    grid: { gap: 6 },
    gridRow: { flexDirection: 'row', gap: 6 },
    gridCell: { flex: 1 },
    bottomBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 6, paddingHorizontal: 4,
    },
    brechaChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,
    },
    brechaText: { fontSize: 11, fontWeight: '700' },
    updateText: { fontSize: 11 },
    reminderCard: {
      flex: 1, borderRadius: 14, borderWidth: 1, padding: 10,
      justifyContent: 'center', minHeight: 80,
    },
    reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reminderLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
    reminderSub: { fontSize: 9, marginTop: 1 },
    gasCard: {
      borderRadius: 14, borderWidth: 1, padding: 12, marginTop: 8,
    },
    gasRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    gasTitle: { fontSize: 14, fontWeight: '700' },
    gasSubtext: { fontSize: 11, marginBottom: 10 },
    gasItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    gasItemL: { fontSize: 14, fontWeight: '600' },
    gasItemR: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
    bcvLunesMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 1, gap: 4 },
    bcvLunesTime: { fontSize: 9 },
  });
}

export default function RatesScreen() {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const hook = useRatesData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editValue, setEditValue] = useState('');

  const bcvLunesColor = C.bcvLunes;

  const brechaColor = hook.brecha !== null
    ? hook.brecha > 15 ? C.highlight : hook.brecha > 8 ? C.warning : C.success
    : C.textMuted;
  const brechaLunesColor = hook.brechaLunes !== null
    ? hook.brechaLunes > 15 ? C.highlight : hook.brechaLunes > 8 ? C.warning : C.success
    : C.textMuted;

  const handleEditBCVLunes = () => {
    setEditValue(hook.tasaBCVLunes ? String(hook.tasaBCVLunes) : '');
    setModalVisible(true);
  };

  const handleSaveBCVLunes = () => {
    hook.handleSaveBCVLunes(editValue);
    setModalVisible(false);
  };

  return (
      <View style={styles.container}>
          <RatesHeader
            C={C}
            error={hook.error}
            offlineMode={hook.offlineMode}
            offlineCachedAt={hook.offlineCachedAt}
          />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            refreshControl={
              <RefreshControl
                refreshing={hook.refreshing}
                onRefresh={hook.onRefresh}
                tintColor={C.highlight}
                colors={[C.highlight]}
                progressBackgroundColor={C.secondary}
              />
            }
          >
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <RateCard title="BCV (Oficial)" rate={hook.data.tasaBCV} icon="bank" color={C.success} loading={hook.loading} updatedAt={hook.data.usdFetchedAt} compact />
                </View>
                <View style={styles.gridCell}>
                  <RateCard title="Paralelo" rate={hook.data.tasaParalelo} icon="trending-up" color={C.highlight} loading={hook.loading} updatedAt={hook.data.usdFetchedAt} compact />
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <RateCard title="Euro (BCV)" rate={hook.data.tasaEuro} icon="globe" color={C.info} loading={hook.loading} updatedAt={hook.data.eurCapturedAt} compact />
                </View>
                <View style={styles.gridCell}>
                  <RateCard title="Binance P2P" rate={hook.data.tasaBinanceP2P} icon="logo-bitcoin" color={C.warning} loading={hook.loading} updatedAt={hook.data.usdFetchedAt} compact />
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <View style={{ flex: 1 }}>
                    <RateCard title="BCV (Lunes)" rate={hook.tasaBCVLunes} icon="calendar" color={bcvLunesColor} loading={false} compact onEdit={handleEditBCVLunes} />
                    {hook.bcvLunesUpdatedAt && (
                      <View style={styles.bcvLunesMeta}>
                        <Ionicons name="time-outline" size={8} color={C.textMuted} />
                        <Text style={[styles.bcvLunesTime, { color: C.textMuted }]}>{hook.formatEditTime(hook.bcvLunesUpdatedAt)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.gridCell}>
                  <View style={[styles.reminderCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                    <View style={styles.reminderRow}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.reminderLabel, { color: C.textPrimary }]}>Recordatorio</Text>
                        <Text style={[styles.reminderSub, { color: C.textMuted }]}>Vie 6:00 PM</Text>
                      </View>
                      <Switch
                        value={hook.reminderEnabled}
                        onValueChange={hook.handleToggleReminder}
                        trackColor={{ false: C.inputBg, true: bcvLunesColor + '60' }}
                        thumbColor={hook.reminderEnabled ? bcvLunesColor : C.textMuted}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.bottomBar}>
              <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                {hook.brecha !== null && (
                  <View style={[styles.brechaChip, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                    <Ionicons name="git-compare-outline" size={12} color={brechaColor} />
                    <Text style={[styles.brechaText, { color: brechaColor }]}>BCV: {hook.brecha.toFixed(1)}%</Text>
                  </View>
                )}
                {hook.brechaLunes !== null && (
                  <View style={[styles.brechaChip, { backgroundColor: C.cardBg, borderColor: bcvLunesColor + '40' }]}>
                    <Ionicons name="calendar" size={12} color={bcvLunesColor} />
                    <Text style={[styles.brechaText, { color: brechaLunesColor }]}>Lunes: {hook.brechaLunes.toFixed(1)}%</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.updateText, { color: C.textMuted }]}>
                {hook.data.usdFetchedAt
                  ? new Date(hook.data.usdFetchedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </Text>
            </View>

            {hook.data.tasaBCV !== null && (
              <View style={[styles.gasCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <View style={styles.gasRow}>
                  <Ionicons name="flame" size={16} color={C.warning} />
                  <Text style={[styles.gasTitle, { color: C.textPrimary }]}>Gasolina (BCV)</Text>
                </View>
                <Text style={[styles.gasSubtext, { color: C.textMuted }]}>$0,50 USD/L — Tasa BCV</Text>
                {[1, 5, 10, 20, 30].map((litros) => {
                  const precioBs = litros * 0.50 * hook.data.tasaBCV;
                  return (
                    <View key={litros} style={styles.gasItem}>
                      <Text style={[styles.gasItemL, { color: C.textSecondary }]}>{litros}L</Text>
                      <Text style={[styles.gasItemR, { color: C.textPrimary }]}>
                        Bs. {precioBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <BCVModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            editValue={editValue}
            onChangeText={setEditValue}
            onSave={handleSaveBCVLunes}
            bcvLunesColor={bcvLunesColor}
            C={C}
          />
      </View>
  );
}
