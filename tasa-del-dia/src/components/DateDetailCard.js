import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDateKey } from '../hooks/useHistoryData';
import { getWeekDay, formatCurrency } from '../utils/formatting';

function DateDetailCard({ selectedData, C, copiedField, handleCopy, handleCopyAll, onClose }) {
  if (!selectedData) return null;

  const rates = [
    { key: 'bcv', label: 'BCV (Oficial)', color: C.success, value: selectedData.bcv },
    { key: 'paralelo', label: 'Paralelo', color: C.highlight, value: selectedData.paralelo },
    { key: 'binance_p2p', label: 'Binance P2P', color: C.warning, value: selectedData.binance_p2p },
    { key: 'euro', label: 'Euro (BCV)', color: C.info, value: selectedData.euro },
  ];

  return (
    <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={14} color={C.dimmed} />
          <Text style={[styles.date, { color: C.textPrimary }]}>{formatDateKey(selectedData.dateKey)}</Text>
          <Text style={[styles.badgeText, { color: C.dimmed }]}>·</Text>
          <Text style={[styles.badgeText, { color: C.dimmed }]}>{getWeekDay(selectedData.dateKey)}</Text>
          {selectedData.manual && (
            <Text style={[styles.badgeText, { color: C.dimmed }]}>·</Text>
          )}
          {selectedData.manual && (
            <Text style={[styles.badgeText, { color: C.dimmed }]}>Manual</Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <Ionicons name="close" size={20} color={C.dimmed} />
        </TouchableOpacity>
      </View>

      {rates.map((r) => (
        <View key={r.key} style={[styles.rateRow, { borderBottomColor: C.cardBorder }]}>
          <View style={styles.rateLeft}>
            <Text style={[styles.rateLabel, { color: C.dimmed }]}>{r.label.toUpperCase()}</Text>
          </View>
          <View style={styles.rateRight}>
            <Text style={[styles.rateValue, { color: r.value ? C.textPrimary : C.dimmed }]}>
              {r.value ? `Bs. ${formatCurrency(r.value)}` : '—'}
            </Text>
            {r.value != null && (
              <TouchableOpacity
                style={[styles.copyBtn, { backgroundColor: copiedField === r.key ? C.textPrimary : 'transparent', borderWidth: 1, borderColor: C.cardBorder }]}
                onPress={() => handleCopy(formatCurrency(r.value), r.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={copiedField === r.key ? 'checkmark' : 'copy-outline'} size={11} color={copiedField === r.key ? C.onAccent : C.dimmed} />
                <Text style={[styles.copyText, { color: copiedField === r.key ? C.onAccent : C.dimmed }]}>
                  {copiedField === r.key ? 'Copiado' : 'Copiar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.copyAll, { backgroundColor: copiedField === 'all' ? C.textPrimary : C.secondary, borderWidth: 1, borderColor: C.textPrimary }]}
        onPress={() => handleCopyAll(selectedData)}
        activeOpacity={0.8}
      >
        <Ionicons name={copiedField === 'all' ? 'checkmark-circle' : 'copy'} size={15} color={copiedField === 'all' ? C.onAccent : C.textPrimary} />
        <Text style={[styles.copyAllText, { color: copiedField === 'all' ? C.onAccent : C.textPrimary }]}>
          {copiedField === 'all' ? '¡Copiado al portapapeles!' : 'Copiar todo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(DateDetailCard);

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 14, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: {
    fontSize: 15, fontWeight: '800', letterSpacing: 0.5,
    fontFamily: 'monospace', fontVariant: ['tabular-nums'],
  },
  badgeText: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: 'monospace',
  },
  rateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1,
  },
  rateLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: 'monospace',
  },
  rateRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateValue: {
    fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'],
    fontFamily: 'monospace',
  },
  copyBtn: {
    paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 3,
  },
  copyText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'monospace' },
  copyAll: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, marginTop: 12,
  },
  copyAllText: {
    fontSize: 12, fontWeight: '800', letterSpacing: 1, fontFamily: 'monospace',
  },
});