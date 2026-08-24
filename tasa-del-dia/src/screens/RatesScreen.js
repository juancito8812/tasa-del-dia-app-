import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import useRatesData from '../hooks/useRatesData';
import RateCard from '../components/RateCard';
import RatesHeader from '../components/RatesHeader';
import BCVModal from '../components/BCVModal';
import { formatCurrency } from '../utils/formatting';

function createStyles(C) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 8 },

    // Bento Grid
    bentoCols: { gap: 16 },
    bentoRow: { flexDirection: 'row', gap: 16 },
    bentoHalf: { flex: 1 },

    // Brecha chips row
    chipsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    chipsLeft: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      flex: 1,
    },
    brechaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
    },
    brechaText: { fontSize: 11, fontWeight: '700' },
    updateText: { fontSize: 10 },

    // Reminder inline
    reminderChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
    },
    reminderLabel: { fontSize: 10, fontWeight: '600' },

    // Gasolina card
    gasCard: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 20,
      marginTop: 16,
      overflow: 'hidden',
    },
    gasHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    gasTitle: { fontSize: 14, fontWeight: '700' },
    gasSubtext: { fontSize: 11, marginBottom: 8 },
    gasItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    gasItemL: { fontSize: 13, fontWeight: '600' },
    gasItemR: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  });
}

export default function RatesScreen() {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const hook = useRatesData();

  const [modalVisible, setModalVisible] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Desestructurado: deps estables para los useCallback (evita re-crearlos por render)
  const { tasaBCVLunes, handleSaveBCVLunes: saveBcvLunes } = hook;

  const bcvLunesColor = C.bcvLunes;

  const brechaColor = hook.brecha !== null
    ? hook.brecha > 15 ? C.highlight : hook.brecha > 8 ? C.warning : C.success
    : C.textMuted;
  const brechaLunesColor = hook.brechaLunes !== null
    ? hook.brechaLunes > 15 ? C.highlight : hook.brechaLunes > 8 ? C.warning : C.success
    : C.textMuted;

  // Handlers estables: se pasan a RateCard/BCVModal (memoizados)
  const handleEditBCVLunes = useCallback(() => {
    // Prefill en formato local es-VE (780,50) en vez del raw float (780.5)
    setEditValue(tasaBCVLunes ? formatCurrency(tasaBCVLunes) : '');
    setModalVisible(true);
  }, [tasaBCVLunes]);

  const handleSaveBCVLunes = useCallback(() => {
    saveBcvLunes(editValue);
    setModalVisible(false);
  }, [saveBcvLunes, editValue]);

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
        {/* === BENTO GRID === */}

        {/* 🥇 BCV — Hero card, full width (2 cols) */}
        <RateCard
          title="BCV (Oficial)"
          subtitle="Banco Central de Venezuela"
          rate={hook.data.tasaBCV}
          icon="bank"
          color={C.success}
          loading={hook.loading}
          updatedAt={hook.data.usdFetchedAt}
          size="large"
          type="bcv"
        />

        {/* 🥈 Paralelo + Euro side by side */}
        <View style={styles.bentoRow}>
          <View style={styles.bentoHalf}>
            <RateCard
              title="Dólar Paralelo"
              subtitle="Mercado promedio"
              rate={hook.data.tasaParalelo}
              icon="trending-up"
              color={C.highlight}
              loading={hook.loading}
              updatedAt={hook.data.usdFetchedAt}
              size="medium"
              type="paralelo"
            />
          </View>
          <View style={styles.bentoHalf}>
            <RateCard
              title="Euro (BCV)"
              subtitle="Banco Central"
              rate={hook.data.tasaEuro}
              icon="globe"
              color={C.info}
              loading={hook.loading}
              updatedAt={hook.data.eurCapturedAt}
              size="medium"
              type="euro"
            />
          </View>
        </View>

        {/* 🥉 Binance P2P + BCV Lunes side by side */}
        <View style={styles.bentoRow}>
          <View style={styles.bentoHalf}>
            <RateCard
              title="Binance P2P"
              subtitle="Paralelo crypto"
              rate={hook.data.tasaBinanceP2P}
              icon="logo-bitcoin"
              color={C.warning}
              loading={hook.loading}
              updatedAt={hook.data.usdFetchedAt}
              size="compact"
              type="gasolina"
            />
          </View>
          <View style={styles.bentoHalf}>
            <RateCard
              title="BCV (Lunes)"
              subtitle="Tasa del lunes"
              rate={hook.tasaBCVLunes}
              icon="calendar"
              color={bcvLunesColor}
              loading={false}
              size="compact"
              type="bcv-lunes"
              onEdit={handleEditBCVLunes}
            />
          </View>
        </View>

        {/* === CHIPS ROW: Brechas + Recordatorio + Update time === */}
        <View style={styles.chipsRow}>
          <View style={styles.chipsLeft}>
            {hook.brecha !== null && (
              <View style={[styles.brechaChip, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <Ionicons name="git-compare-outline" size={11} color={brechaColor} />
                <Text style={[styles.brechaText, { color: brechaColor }]}>BCV: {hook.brecha.toFixed(1)}%</Text>
              </View>
            )}
            {hook.brechaLunes !== null && (
              <View style={[styles.brechaChip, { backgroundColor: C.cardBg, borderColor: bcvLunesColor + '30' }]}>
                <Ionicons name="calendar" size={11} color={bcvLunesColor} />
                <Text style={[styles.brechaText, { color: brechaLunesColor }]}>Lunes: {hook.brechaLunes.toFixed(1)}%</Text>
              </View>
            )}
          </View>

          {/* Reminder toggle inline */}
          <View style={[styles.reminderChip, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
            <Ionicons name="alarm-outline" size={12} color={hook.reminderEnabled ? bcvLunesColor : C.textMuted} />
            <Text style={[styles.reminderLabel, { color: hook.reminderEnabled ? bcvLunesColor : C.textMuted }]}>
              {hook.reminderEnabled ? 'Vie 6PM' : 'Off'}
            </Text>
            <Switch
              value={hook.reminderEnabled}
              onValueChange={hook.handleToggleReminder}
              trackColor={{ false: C.inputBg, true: bcvLunesColor + '50' }}
              thumbColor={hook.reminderEnabled ? bcvLunesColor : C.textMuted}
              style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
            />
          </View>
        </View>

        {/* ⛽ Gasolina — Full width */}
        {hook.data.tasaBCV !== null && (
          <View style={[styles.gasCard, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
            <View style={styles.gasHeader}>
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

        {/* Update time footer */}
        <Text style={[styles.updateText, { color: C.textMuted, textAlign: 'center', marginTop: 8 }]}>
          Última actualización: {hook.data.usdFetchedAt
            ? new Date(hook.data.usdFetchedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </Text>
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
