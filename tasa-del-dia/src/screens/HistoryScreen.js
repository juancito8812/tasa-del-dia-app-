import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, TextInput,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import useHistoryData, { formatDateKey, getMonthAbbr, getDay, formatCurrency } from '../hooks/useHistoryData';
import HistoryChart from '../components/HistoryChart';
import DateDetailCard from '../components/DateDetailCard';

function createStyles(C) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoContainer: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 24 },
    sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
    chipRow: { gap: 8, paddingRight: 4, marginBottom: 12 },
    dateChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, minWidth: 72, alignItems: 'center' },
    dateChipDay: { fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
    dateChipMonth: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', marginTop: 1 },
    dateChipActive: { borderColor: C.info, backgroundColor: C.info + '15' },
    dateChipInactive: { borderColor: C.cardBorder, backgroundColor: C.cardBg },
    customDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    customDateInput: {
      flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5,
      borderColor: C.cardBorder, backgroundColor: C.inputBg || C.cardBg,
      fontSize: 15, fontWeight: '600', color: C.textPrimary, fontVariant: ['tabular-nums'],
    },
    customDateButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: C.info, flexDirection: 'row', alignItems: 'center', gap: 6 },
    customDateButtonText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    chartContainer: {
      backgroundColor: C.cardBg, borderRadius: 16, padding: 14, marginBottom: 20,
      borderWidth: 1, borderColor: C.cardBorder,
    },
    listContainer: { gap: 12 },
    listItem: { backgroundColor: C.cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    dateText: { fontSize: 14, fontWeight: '700' },
    ratesRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    rateCol: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    rateColLabel: { fontSize: 11, fontWeight: '600' },
    rateColValue: { fontSize: 14, fontWeight: '800' },
    emptyState: { alignItems: 'center', padding: 30, marginTop: 20 },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  });
}

export default function HistoryScreen() {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const h = useHistoryData();

  const renderRateCol = (label, value, color) => (
    <TouchableOpacity
      style={styles.rateCol}
      activeOpacity={0.7}
      onPress={() => value && h.handleCopy(`Bs. ${formatCurrency(value)}`, `${label}-${value}`)}
    >
      <View style={{ width: 3, height: 16, borderRadius: 1.5, backgroundColor: color }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rateColLabel, { color: C.textSecondary }]}>{label}</Text>
        {value ? (
          <Text style={[styles.rateColValue, { color, fontVariant: ['tabular-nums'] }]}>
            Bs. {formatCurrency(value)}
          </Text>
        ) : (
          <Text style={[styles.rateColValue, { color: C.textMuted }]}>—</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: C.info + '15' }]}>
              <Ionicons name="stats-chart" size={18} color={C.info} />
            </View>
            <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Historial</Text>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {h.last10.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Últimos 10 días</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {h.last10.map((item) => {
                    const isActive = item.dateKey === h.selectedDateKey;
                    return (
                      <TouchableOpacity
                        key={item.dateKey}
                        style={[styles.dateChip, isActive ? styles.dateChipActive : styles.dateChipInactive]}
                        onPress={() => h.handleSelectDate(item.dateKey)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dateChipDay, { color: isActive ? C.info : C.textPrimary }]}>
                          {getDay(item.dateKey)}
                        </Text>
                        <Text style={[styles.dateChipMonth, { color: isActive ? C.info : C.textMuted }]}>
                          {getMonthAbbr(item.dateKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.dateChip, h.showCustomInput ? styles.dateChipActive : styles.dateChipInactive]}
                    onPress={() => h.setShowCustomInput(!h.showCustomInput)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="search" size={16} color={h.showCustomInput ? C.info : C.textMuted} />
                    <Text style={[styles.dateChipMonth, { color: h.showCustomInput ? C.info : C.textMuted, marginTop: 4 }]}>Buscar</Text>
                  </TouchableOpacity>
                </ScrollView>

                {h.showCustomInput && (
                  <View style={styles.customDateRow}>
                    <TextInput
                      style={styles.customDateInput}
                      placeholder="DD/MM/AAAA (ej: 13/06/2026)"
                      placeholderTextColor={C.textMuted}
                      value={h.customDateText}
                      onChangeText={h.setCustomDateText}
                      keyboardType="number-pad"
                      maxLength={10}
                      returnKeyType="search"
                      onSubmitEditing={h.handleCustomDate}
                    />
                    <TouchableOpacity style={styles.customDateButton} onPress={h.handleCustomDate} activeOpacity={0.8}>
                      <Ionicons name="arrow-forward" size={14} color="#fff" />
                      <Text style={styles.customDateButtonText}>Ver</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {h.selectedDateKey && (
              <DateDetailCard
                selectedData={h.selectedData}
                C={C}
                copiedField={h.copiedField}
                handleCopy={h.handleCopy}
                handleCopyAll={h.handleCopyAll}
                onClose={() => h.handleSelectDate(h.selectedDateKey)}
              />
            )}

            {!h.selectedDateKey && h.chartInfo && (
              <View style={styles.chartContainer}>
                <HistoryChart chartInfo={h.chartInfo} C={C} ratesCount={h.ratesData.length} />
              </View>
            )}

            {!h.selectedDateKey && (
              <View style={styles.listContainer}>
                {h.ratesData.length > 0 ? (
                  h.ratesData.slice(0, 10).map((item) => (
                    <TouchableOpacity
                      key={item.dateKey}
                      style={styles.listItem}
                      activeOpacity={0.7}
                      onPress={() => h.handleSelectDate(item.dateKey)}
                    >
                      <View style={styles.dateRow}>
                        <Ionicons name="calendar" size={14} color={C.info} />
                        <Text style={[styles.dateText, { color: C.textPrimary }]}>{formatDateKey(item.dateKey)}</Text>
                        {item.manual && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 4 }}>
                            <Ionicons name="create-outline" size={12} color={C.textMuted} />
                            <Text style={{ fontSize: 10, color: C.textMuted }}>Manual</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.ratesRow}>
                        {renderRateCol('BCV', item.bcv, C.success)}
                        {renderRateCol('Paralelo', item.paralelo, C.highlight)}
                        {renderRateCol('Binance', item.binance_p2p, C.warning)}
                        {renderRateCol('Euro', item.euro, C.info)}
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color={C.textMuted} />
                    <Text style={[styles.emptyText, { color: C.textMuted }]}>
                      No hay tasas guardadas aún.{'\n'}Se guardarán automáticamente cuando obtengas las tasas del día.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
      </View>
  );
}
