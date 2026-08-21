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

    // Footer terminal: brechas + recordatorio
    footerBox: {
      borderWidth: 1,
      borderStyle: 'dashed',
      padding: 10,
      marginTop: 10,
      gap: 8,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brechaText: {
      fontSize: 11,
      fontWeight: '700',
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    reminderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    reminderLabel: {
      fontSize: 10,
      fontWeight: '600',
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },

    // Gasolina
    gasCard: {
      borderWidth: 1,
      borderStyle: 'dashed',
      padding: 12,
      marginTop: 10,
    },
    gasHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    gasTitle: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1,
      fontFamily: 'monospace',
      textTransform: 'uppercase',
    },
    gasSubtext: {
      fontSize: 10,
      marginBottom: 8,
      fontFamily: 'monospace',
    },
    gasItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      borderBottomWidth: 1,
    },
    gasItemL: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'monospace',
    },
    gasItemR: {
      fontSize: 13,
      fontWeight: '700',
      fontFamily: 'monospace',
      fontVariant: ['tabular-nums'],
    },
    updateText: {
      fontSize: 9,
      textAlign: 'center',
      marginTop: 8,
      fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
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

  // Barras proporcionales: ratio de cada tasa respecto a la máxima visible
  const maxRate = useMemo(() => {
    const rates = [
      hook.data.tasaBCV,
      hook.data.tasaParalelo,
      hook.data.tasaEuro,
      hook.data.tasaBinanceP2P,
      hook.tasaBCVLunes,
    ].filter((r) => typeof r === 'number' && r > 0);
    return rates.length ? Math.max(...rates) : 1;
  }, [hook.data, hook.tasaBCVLunes]);

  const ratioOf = useCallback(
    (rate) => (typeof rate === 'number' && rate > 0 && maxRate > 0 ? rate / maxRate : 0),
    [maxRate]
  );

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
            tintColor={C.textPrimary}
            colors={[C.textPrimary]}
            progressBackgroundColor={C.secondary}
          />
        }
      >
        {/* === HERO: BCV (bloque invertido) === */}
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

        {/* === FILAS TERMINALES === */}
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
          ratio={ratioOf(hook.data.tasaParalelo)}
        />
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
          ratio={ratioOf(hook.data.tasaEuro)}
        />
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
          ratio={ratioOf(hook.data.tasaBinanceP2P)}
        />
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
          ratio={ratioOf(hook.tasaBCVLunes)}
        />

        {/* === FOOTER: brechas + recordatorio (borde punteado) === */}
        <View style={[styles.footerBox, { borderColor: C.cardBorder }]}>
          <View style={styles.footerRow}>
            {hook.brecha !== null && (
              <Text style={[styles.brechaText, { color: C.textPrimary }]}>
                BRECHA BCV↔PAR: +{hook.brecha.toFixed(1)}%
              </Text>
            )}
            {hook.brechaLunes !== null && (
              <Text style={[styles.brechaText, { color: C.dimmed }]}>
                LUN: +{hook.brechaLunes.toFixed(1)}%
              </Text>
            )}
          </View>
          <View style={styles.footerRow}>
            <View style={styles.reminderRow}>
              <Ionicons
                name="alarm-outline"
                size={12}
                color={hook.reminderEnabled ? C.textPrimary : C.dimmed}
              />
              <Text style={[styles.reminderLabel, { color: hook.reminderEnabled ? C.textPrimary : C.dimmed }]}>
                {hook.reminderEnabled ? 'REC: VIE 6PM ●' : 'REC: OFF ○'}
              </Text>
            </View>
            <Switch
              value={hook.reminderEnabled}
              onValueChange={hook.handleToggleReminder}
              trackColor={{ false: C.barTrack, true: C.dimmed }}
              thumbColor={hook.reminderEnabled ? C.textPrimary : C.textMuted}
              style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
            />
          </View>
        </View>

        {/* ⛽ GASOLINA */}
        {hook.data.tasaBCV !== null && (
          <View style={[styles.gasCard, { borderColor: C.cardBorder }]}>
            <View style={styles.gasHeader}>
              <Ionicons name="flame" size={14} color={C.textPrimary} />
              <Text style={[styles.gasTitle, { color: C.textPrimary }]}>Gasolina</Text>
            </View>
            <Text style={[styles.gasSubtext, { color: C.dimmed }]}>$0,50 USD/L — TASA BCV</Text>
            {[1, 5, 10, 20, 30].map((litros, idx, arr) => {
              const precioBs = litros * 0.50 * hook.data.tasaBCV;
              return (
                <View
                  key={litros}
                  style={[
                    styles.gasItem,
                    idx === arr.length - 1 && { borderBottomWidth: 0 },
                    { borderBottomColor: C.cardBorder },
                  ]}
                >
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
        <Text style={[styles.updateText, { color: C.dimmed }]}>
          ÚLTIMA ACTUALIZACIÓN: {hook.data.usdFetchedAt
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