// Estilo FINTECH — detalle del día: filas tintadas con el color de cada tasa
// (como las .rc-row del sitio), valores mono y botones pastilla.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatCurrency, getWeekDay } from '../../utils/formatting';
import { formatDateKey } from '../../hooks/useHistoryData';
import { useFintechFonts } from './fonts';

function DateDetailCard({ selectedData, C, copiedField, handleCopy, handleCopyAll, onClose }) {
  const F = useFintechFonts();
  if (!selectedData) return null;

  const rates = [
    { key: 'bcv', label: 'BCV (Oficial)', color: C.success, value: selectedData.bcv },
    { key: 'paralelo', label: 'Paralelo', color: C.highlight, value: selectedData.paralelo },
    { key: 'binance_p2p', label: 'Binance P2P', color: C.warning, value: selectedData.binance_p2p },
    { key: 'euro', label: 'Euro (BCV)', color: C.info, value: selectedData.euro },
  ];

  const isWeekend = getWeekDay(selectedData.dateKey) === 'Sáb' || getWeekDay(selectedData.dateKey) === 'Dom';

  return (
    <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
      <View style={[styles.glow, { backgroundColor: C.success }]} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={16} color={C.info} />
          <Text style={[styles.date, { color: C.textPrimary, fontFamily: F.sansSemiBold }]}>{formatDateKey(selectedData.dateKey)}</Text>
          <View style={[styles.badge, { backgroundColor: isWeekend ? C.warning + '20' : C.info + '15' }]}>
            <Text style={[styles.badgeText, { color: isWeekend ? C.warning : C.info, fontFamily: F.monoMedium }]}>
              {getWeekDay(selectedData.dateKey)}
            </Text>
          </View>
          {selectedData.manual && (
            <View style={[styles.badge, { backgroundColor: C.textMuted + '15' }]}>
              <Ionicons name="create-outline" size={10} color={C.textMuted} />
              <Text style={[styles.badgeText, { color: C.textMuted, fontFamily: F.monoMedium }]}>Manual</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <Ionicons name="close-circle" size={22} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {rates.map((r) => (
        <View key={r.key} style={[styles.rateRow, { backgroundColor: (r.color || C.textMuted) + '0D' }]}>
          <View style={styles.rateLeft}>
            <View style={[styles.dot, { backgroundColor: r.color }]} />
            <Text style={[styles.rateLabel, { color: C.textSecondary, fontFamily: F.sans }]}>{r.label}</Text>
          </View>
          <View style={styles.rateRight}>
            <Text style={[styles.rateValue, { color: r.value ? r.color : C.textMuted, fontFamily: F.monoSemiBold }]}>
              {r.value ? `Bs. ${formatCurrency(r.value)}` : '—'}
            </Text>
            {r.value != null && (
              <TouchableOpacity
                style={[styles.copyBtn, { backgroundColor: copiedField === r.key ? C.success + '20' : (C.inputBg || C.secondary) }]}
                onPress={() => handleCopy(formatCurrency(r.value), r.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={copiedField === r.key ? 'checkmark' : 'copy-outline'} size={12} color={copiedField === r.key ? C.success : C.textMuted} />
                <Text style={[styles.copyText, { color: copiedField === r.key ? C.success : C.textMuted, fontFamily: F.monoMedium }]}>
                  {copiedField === r.key ? 'Copiado' : 'Copiar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.copyAll, { backgroundColor: copiedField === 'all' ? C.success : C.highlight }]}
        onPress={() => handleCopyAll(selectedData)}
        activeOpacity={0.8}
      >
        <Ionicons name={copiedField === 'all' ? 'checkmark-circle' : 'copy'} size={16} color={C.onAccent} />
        <Text style={[styles.copyAllText, { color: C.onAccent, fontFamily: F.sansSemiBold }]}>
          {copiedField === 'all' ? '¡Copiado al portapapeles!' : 'Copiar todo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(DateDetailCard);

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, overflow: 'hidden' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16, opacity: 0.6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 13, marginBottom: 6 },
  rateLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rateLabel: { fontSize: 12, fontWeight: '500' },
  rateRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rateValue: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: 0.3 },
  copyBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText: { fontSize: 10, fontWeight: '600' },
  copyAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 13, paddingVertical: 12, marginTop: 12 },
  copyAllText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
});
