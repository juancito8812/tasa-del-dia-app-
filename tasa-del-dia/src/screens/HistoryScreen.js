import React, { useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import useHistoryData, { formatDateKey } from '../hooks/useHistoryData';
import { getMonthAbbr, getDay, formatCurrency } from '../utils/formatting';
import HistoryChart from '../components/HistoryChart';
import DateDetailCard from '../components/DateDetailCard';

function createStyles(C) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8,
      flexDirection: 'row', alignItems: 'center', gap: 8,
      borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: C.cardBorder,
      marginHorizontal: 12,
    },
    headerPrompt: { fontSize: 18, fontWeight: '700', color: C.dimmed, fontFamily: 'monospace' },
    headerTitle: {
      fontSize: 16, fontWeight: '800', letterSpacing: 1, flex: 1,
      color: C.textPrimary, fontFamily: 'monospace',
    },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 24 },
    sectionLabel: {
      fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5,
      marginBottom: 8, color: C.dimmed, fontFamily: 'monospace',
    },
    chipRow: { gap: 6, paddingRight: 4, marginBottom: 12 },
    dateChip: {
      paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1,
      minWidth: 64, alignItems: 'center', flexDirection: 'row', gap: 3,
    },
    dateChipBracket: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
    dateChipDay: {
      fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'], fontFamily: 'monospace',
    },
    dateChipMonth: {
      fontSize: 9, fontWeight: '600', textTransform: 'uppercase',
      fontFamily: 'monospace',
    },
    dateChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    dateChipInactive: { borderColor: C.cardBorder },
    customDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    customDateInput: {
      flex: 1, paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1,
      borderColor: C.cardBorder, backgroundColor: C.inputBg || C.cardBg,
      fontSize: 14, fontWeight: '600', color: C.textPrimary,
      fontVariant: ['tabular-nums'], fontFamily: 'monospace',
    },
    customDateButton: {
      paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.textPrimary,
      flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    customDateButtonText: {
      fontSize: 13, fontWeight: '700', color: C.onAccent, fontFamily: 'monospace',
    },
    chartContainer: {
      padding: 12, marginBottom: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: C.cardBorder,
    },
    listContainer: { gap: 10 },
    listItem: { padding: 12, borderWidth: 1, borderColor: C.cardBorder },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    dateText: {
      fontSize: 13, fontWeight: '800', color: C.textPrimary, fontFamily: 'monospace',
      letterSpacing: 0.5,
    },
    manualText: {
      fontSize: 9, color: C.dimmed, fontFamily: 'monospace', letterSpacing: 0.5,
    },
    ratesRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
    rateCol: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    rateColBar: { width: 3, height: 15 },
    rateColLabel: {
      fontSize: 9, fontWeight: '600', color: C.dimmed, letterSpacing: 0.8,
      textTransform: 'uppercase', fontFamily: 'monospace',
    },
    rateColValue: {
      fontSize: 14, fontWeight: '800', color: C.textPrimary,
      fontVariant: ['tabular-nums'], fontFamily: 'monospace',
    },
    emptyState: { alignItems: 'center', padding: 30, marginTop: 20 },
    emptyText: {
      fontSize: 13, fontWeight: '600', marginTop: 12, textAlign: 'center',
      color: C.dimmed, fontFamily: 'monospace',
    },
  });
}

/**
 * Item de la lista de historial, memoizado: solo se re-renderiza cuando cambia
 * el dato, el tema o sus handlers (que son estables). Al teclear en el buscador,
 * cambiar la selección o copiar, los 10 items NO se re-renderizan.
 */
function HistoryListItemView({ item, C, onPress, handleCopy }) {
  const styles = useMemo(() => createStyles(C), [C]);

  const renderRateCol = (label, value) => (
    <TouchableOpacity
      style={styles.rateCol}
      activeOpacity={0.7}
      onPress={() => value && handleCopy(formatCurrency(value), `${label}-${value}`)}
    >
      <View style={[styles.rateColBar, { backgroundColor: value ? C.textPrimary : C.barTrack }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rateColLabel}>{label}</Text>
        {value ? (
          <Text style={styles.rateColValue}>
            Bs. {formatCurrency(value)}
          </Text>
        ) : (
          <Text style={[styles.rateColValue, { color: C.dimmed }]}>—</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableOpacity
      style={styles.listItem}
      activeOpacity={0.7}
      onPress={() => onPress(item.dateKey)}
    >
      <View style={styles.dateRow}>
        <Text style={{ color: C.dimmed, fontFamily: 'monospace', fontSize: 11 }}>■</Text>
        <Text style={styles.dateText}>{formatDateKey(item.dateKey)}</Text>
        {item.manual && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 4 }}>
            <Ionicons name="create-outline" size={11} color={C.dimmed} />
            <Text style={styles.manualText}>MANUAL</Text>
          </View>
        )}
      </View>
      <View style={styles.ratesRow}>
        {renderRateCol('BCV', item.bcv)}
        {renderRateCol('Paralelo', item.paralelo)}
        {renderRateCol('Binance', item.binance_p2p)}
        {renderRateCol('Euro', item.euro)}
      </View>
    </TouchableOpacity>
  );
}

const HistoryListItem = React.memo(HistoryListItemView);

export default function HistoryScreen() {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const h = useHistoryData();
  const { handleSelectDate, selectedDateKey } = h;

  // Handlers estables para los componentes memoizados de la lista/detalle
  const handleSelectItem = useCallback((dateKey) => handleSelectDate(dateKey), [handleSelectDate]);
  const handleCloseDetail = useCallback(() => handleSelectDate(selectedDateKey), [handleSelectDate, selectedDateKey]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerPrompt}>{'>'}</Text>
        <Text style={styles.headerTitle}>HISTORIAL</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {h.last10.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Últimos 10 días:</Text>
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
                    <Text style={[styles.dateChipBracket, { color: isActive ? C.onAccent : C.dimmed }]}>[</Text>
                    <Text style={[styles.dateChipDay, { color: isActive ? C.onAccent : C.textPrimary }]}>
                      {getDay(item.dateKey)}
                    </Text>
                    <Text style={[styles.dateChipMonth, { color: isActive ? C.onAccent : C.dimmed }]}>
                      {getMonthAbbr(item.dateKey)}
                    </Text>
                    <Text style={[styles.dateChipBracket, { color: isActive ? C.onAccent : C.dimmed }]}>{']'}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.dateChip, h.showCustomInput ? styles.dateChipActive : styles.dateChipInactive]}
                onPress={() => h.setShowCustomInput(!h.showCustomInput)}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={13} color={h.showCustomInput ? C.onAccent : C.dimmed} />
                <Text style={[styles.dateChipMonth, { color: h.showCustomInput ? C.onAccent : C.dimmed }]}>Buscar</Text>
              </TouchableOpacity>
            </ScrollView>

            {h.showCustomInput && (
              <View style={styles.customDateRow}>
                <TextInput
                  style={styles.customDateInput}
                  placeholder="DD/MM/AAAA (ej: 13/06/2026)"
                  placeholderTextColor={C.dimmed}
                  value={h.customDateText}
                  onChangeText={h.setCustomDateText}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="search"
                  onSubmitEditing={h.handleCustomDate}
                />
                <TouchableOpacity style={styles.customDateButton} onPress={h.handleCustomDate} activeOpacity={0.8}>
                  <Ionicons name="arrow-forward" size={14} color={C.onAccent} />
                  <Text style={styles.customDateButtonText}>{'> VER'}</Text>
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
            onClose={handleCloseDetail}
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
                <HistoryListItem
                  key={item.dateKey}
                  item={item}
                  C={C}
                  onPress={handleSelectItem}
                  handleCopy={h.handleCopy}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={44} color={C.dimmed} />
                <Text style={styles.emptyText}>
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