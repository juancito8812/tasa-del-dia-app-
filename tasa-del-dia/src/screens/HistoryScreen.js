import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { getHistoricalRates, formatDateKey, parseDateDDMMYYYY } from '../services/api';

const screenWidth = Dimensions.get("window").width;

// --- Simple Bar Chart built with native Views (no SVG needed) ---
function NativeBarChart({ data, labels, colors, legendLabels, C }) {
  if (!data || data.length === 0) return null;

  const allValues = data.flat().filter(v => v > 0);
  if (allValues.length === 0) return null;

  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const range = maxVal - minVal || 1;
  const chartHeight = 160;
  const barGroupWidth = (screenWidth - 80) / labels.length;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
        {legendLabels.map((label, i) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors[i] }} />
            <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: chartHeight, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingHorizontal: 4 }}>
        {labels.map((label, idx) => (
          <View key={label} style={{ alignItems: 'center', width: barGroupWidth }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: chartHeight - 20 }}>
              {data.map((dataset, dIdx) => {
                const val = dataset[idx] || 0;
                const pct = val > 0 ? ((val - minVal) / range) * 0.8 + 0.2 : 0;
                const barHeight = Math.max(pct * (chartHeight - 40), val > 0 ? 8 : 0);
                return (
                  <View key={dIdx} style={{ alignItems: 'center' }}>
                    {val > 0 && (
                      <Text style={{ color: colors[dIdx], fontSize: 8, fontWeight: '700', marginBottom: 2 }}>
                        {val.toFixed(1)}
                      </Text>
                    )}
                    <View
                      style={{
                        width: barGroupWidth / data.length - 6,
                        minWidth: 12,
                        maxWidth: 24,
                        height: barHeight,
                        backgroundColor: colors[dIdx],
                        borderRadius: 4,
                        opacity: 0.85,
                      }}
                    />
                  </View>
                );
              })}
            </View>
            <Text style={{ color: C.textMuted, fontSize: 9, fontWeight: '600', marginTop: 4 }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(C) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: C.primary,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
      flex: 1,
      backgroundColor: C.primary,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 16,
      paddingBottom: 24,
    },
    // Date selector
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    chipRow: {
      gap: 8,
      paddingRight: 4,
      marginBottom: 12,
    },
    dateChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      minWidth: 72,
      alignItems: 'center',
    },
    dateChipDay: {
      fontSize: 14,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    dateChipMonth: {
      fontSize: 9,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginTop: 1,
    },
    dateChipActive: {
      borderColor: C.info,
      backgroundColor: C.info + '15',
    },
    dateChipInactive: {
      borderColor: C.cardBorder,
      backgroundColor: C.cardBg,
    },
    customDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    customDateInput: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: C.cardBorder,
      backgroundColor: C.inputBg || C.cardBg,
      fontSize: 15,
      fontWeight: '600',
      color: C.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    customDateButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: C.info,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    customDateButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
    },
    // Detail card
    detailCard: {
      backgroundColor: C.cardBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      marginBottom: 16,
      overflow: 'hidden',
    },
    detailCardGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      opacity: 0.5,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    detailDate: {
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    detailDateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    detailDateBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    copyAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 12,
      paddingVertical: 12,
      marginTop: 12,
    },
    copyAllText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.3,
    },
    rateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 6,
    },
    rateRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rateDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    rateLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    rateValue: {
      fontSize: 16,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
      letterSpacing: 0.3,
    },
    rateCopyBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rateCopyText: {
      fontSize: 10,
      fontWeight: '700',
    },
    // Chart container
    chartContainer: {
      backgroundColor: C.cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    // List
    listContainer: {
      gap: 12,
    },
    listItem: {
      backgroundColor: C.cardBg,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    dateText: {
      fontSize: 14,
      fontWeight: '700',
    },
    ratesRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    rateCol: {
      flex: 1,
      minWidth: '45%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    rateColLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    rateColValue: {
      fontSize: 14,
      fontWeight: '800',
    },
    emptyState: {
      alignItems: 'center',
      padding: 30,
      marginTop: 20,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: '600',
      marginTop: 12,
      textAlign: 'center',
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────

function getWeekDay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[date.getDay()];
}

function getMonthAbbr(dateKey) {
  const [, m] = dateKey.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months[parseInt(m, 10) - 1] || m;
}

function getDay(dateKey) {
  return dateKey.split('-')[2];
}

function formatCurrency(v) {
  if (v == null) return '—';
  return Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Component ────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  const [ratesData, setRatesData] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [customDateText, setCustomDateText] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const copyTimeoutRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const loadHistory = async () => {
    const data = await getHistoricalRates();
    const arr = Object.keys(data).map(key => ({
      dateKey: key,
      ...data[key]
    })).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    setRatesData(arr);
  };

  // Last 5 dates
  const last5 = ratesData.slice(0, 5);

  // Chart data (last 5 days, ascending)
  const chartInfo = React.useMemo(() => {
    if (ratesData.length === 0) return null;
    const reversed = [...ratesData].reverse().slice(-5);
    if (reversed.length < 2) return null;
    const labels = reversed.map(item => item.dateKey.slice(5).replace('-', '/'));
    const bcvData = reversed.map(item => item.bcv || 0);
    const paraleloData = reversed.map(item => item.paralelo || 0);
    if (bcvData.every(v => v === 0) && paraleloData.every(v => v === 0)) return null;
    return {
      labels,
      data: [bcvData, paraleloData],
      colors: [C.success, C.highlight],
      legendLabels: ['BCV', 'Paralelo'],
    };
  }, [ratesData, C]);

  // Selected date data
  const selectedData = selectedDateKey
    ? ratesData.find(r => r.dateKey === selectedDateKey)
    : null;

  const handleSelectDate = (dateKey) => {
    setSelectedDateKey(dateKey === selectedDateKey ? null : dateKey);
    setShowCustomInput(false);
    setCustomDateText('');
  };

  const handleCustomDate = () => {
    Keyboard.dismiss();
    const parsed = parseDateDDMMYYYY(customDateText);
    if (!parsed) {
      Alert.alert('Fecha inválida', 'Ingresa la fecha en formato DD/MM/AAAA (ej: 13/06/2026)');
      return;
    }
    const exists = ratesData.find(r => r.dateKey === parsed);
    if (!exists) {
      Alert.alert('Sin datos', `No hay tasas guardadas para el ${formatDateKey(parsed)}`);
      return;
    }
    setSelectedDateKey(parsed);
    setShowCustomInput(false);
    setCustomDateText('');
  };

  const handleCopy = async (text, field) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(field);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedField(null), 1500);
    } catch {}
  };

  const handleCopyAll = async (data) => {
    const lines = [
      `📅 Fecha: ${formatDateKey(data.dateKey)}`,
      `🏦 BCV: Bs. ${formatCurrency(data.bcv)}`,
      `💵 Paralelo: Bs. ${formatCurrency(data.paralelo)}`,
      `📊 Binance P2P: Bs. ${formatCurrency(data.binance_p2p)}`,
      `💶 Euro: Bs. ${formatCurrency(data.euro)}`,
    ];
    if (data.manual) lines.push('📝 Ingreso manual');
    const text = lines.join('\n');
    handleCopy(text, 'all');
  };

  // ─── Render helpers ─────────────────────────────────────────

  const renderCopyBtn = (fieldKey, value) => {
    const isCopied = copiedField === fieldKey;
    return (
      <TouchableOpacity
        style={[styles.rateCopyBtn, { backgroundColor: isCopied ? (C.success + '20') : (C.inputBg || C.secondary) }]}
        onPress={() => handleCopy(`Bs. ${formatCurrency(value)}`, fieldKey)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isCopied ? 'checkmark' : 'copy-outline'}
          size={12}
          color={isCopied ? C.success : C.textMuted}
        />
        <Text style={[styles.rateCopyText, { color: isCopied ? C.success : C.textMuted }]}>
          {isCopied ? 'Copiado' : 'Copiar'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDateDetail = () => {
    if (!selectedData) return null;
    const rates = [
      { key: 'bcv', label: 'BCV (Oficial)', color: C.success, value: selectedData.bcv },
      { key: 'paralelo', label: 'Paralelo', color: C.highlight, value: selectedData.paralelo },
      { key: 'binance_p2p', label: 'Binance P2P', color: C.warning, value: selectedData.binance_p2p },
      { key: 'euro', label: 'Euro (BCV)', color: C.info, value: selectedData.euro },
    ];

    return (
      <View style={styles.detailCard}>
        <View style={[styles.detailCardGlow, { backgroundColor: C.info }]} />
        <View style={styles.detailHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="calendar" size={16} color={C.info} />
            <Text style={[styles.detailDate, { color: C.textPrimary }]}>
              {formatDateKey(selectedData.dateKey)}
            </Text>
            <View style={[styles.detailDateBadge, { backgroundColor: getWeekDay(selectedData.dateKey) === 'Sáb' || getWeekDay(selectedData.dateKey) === 'Dom' ? C.warning + '20' : C.info + '15' }]}>
              <Text style={[styles.detailDateBadgeText, { color: getWeekDay(selectedData.dateKey) === 'Sáb' || getWeekDay(selectedData.dateKey) === 'Dom' ? C.warning : C.info }]}>
                {getWeekDay(selectedData.dateKey)}
              </Text>
            </View>
            {selectedData.manual && (
              <View style={[styles.detailDateBadge, { backgroundColor: C.textMuted + '15' }]}>
                <Ionicons name="create-outline" size={10} color={C.textMuted} />
                <Text style={[styles.detailDateBadgeText, { color: C.textMuted }]}>Manual</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setSelectedDateKey(null)}
            activeOpacity={0.7}
            style={{ padding: 4 }}
          >
            <Ionicons name="close-circle" size={22} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {rates.map((r) => (
          <View key={r.key} style={[styles.rateRow, { backgroundColor: (r.color || C.textMuted) + '08' }]}>
            <View style={styles.rateRowLeft}>
              <View style={[styles.rateDot, { backgroundColor: r.color }]} />
              <Text style={[styles.rateLabel, { color: C.textSecondary }]}>{r.label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.rateValue, { color: r.value ? r.color : C.textMuted }]}>
                {r.value ? `Bs. ${formatCurrency(r.value)}` : '—'}
              </Text>
              {renderCopyBtn(r.key, r.value)}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.copyAllButton, { backgroundColor: copiedField === 'all' ? C.success : C.info }]}
          onPress={() => handleCopyAll(selectedData)}
          activeOpacity={0.8}
        >
          <Ionicons name={copiedField === 'all' ? 'checkmark-circle' : 'copy'} size={16} color="#fff" />
          <Text style={styles.copyAllText}>
            {copiedField === 'all' ? '¡Copiado al portapapeles!' : 'Copiar todo'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRateCol = (label, value, color) => (
    <TouchableOpacity
      style={styles.rateCol}
      activeOpacity={0.7}
      onPress={() => value && handleCopy(`Bs. ${formatCurrency(value)}`, `${label}-${value}`)}
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

  // ─── Main render ────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.primary} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: C.info + '15' }]}>
            <Ionicons name="stats-chart" size={18} color={C.info} />
          </View>
          <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Historial</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* ── Date selector ── */}
          {last5.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Seleccionar fecha</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {last5.map((item) => {
                  const isActive = item.dateKey === selectedDateKey;
                  return (
                    <TouchableOpacity
                      key={item.dateKey}
                      style={[
                        styles.dateChip,
                        isActive ? styles.dateChipActive : styles.dateChipInactive,
                      ]}
                      onPress={() => handleSelectDate(item.dateKey)}
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

                {/* "Otra fecha" chip */}
                <TouchableOpacity
                  style={[styles.dateChip, showCustomInput ? styles.dateChipActive : styles.dateChipInactive]}
                  onPress={() => setShowCustomInput(!showCustomInput)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="search" size={16} color={showCustomInput ? C.info : C.textMuted} />
                  <Text style={[styles.dateChipMonth, { color: showCustomInput ? C.info : C.textMuted, marginTop: 4 }]}>
                    Buscar
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Custom date input */}
              {showCustomInput && (
                <View style={styles.customDateRow}>
                  <TextInput
                    style={styles.customDateInput}
                    placeholder="DD/MM/AAAA (ej: 13/06/2026)"
                    placeholderTextColor={C.textMuted}
                    value={customDateText}
                    onChangeText={setCustomDateText}
                    keyboardType="number-pad"
                    maxLength={8}
                    returnKeyType="search"
                    onSubmitEditing={handleCustomDate}
                  />
                  <TouchableOpacity
                    style={styles.customDateButton}
                    onPress={handleCustomDate}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                    <Text style={styles.customDateButtonText}>Ver</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── Detail view (when a date is selected) ── */}
          {selectedDateKey && renderDateDetail()}

          {/* ── Chart (only when no date selected) ── */}
          {!selectedDateKey && chartInfo && (
            <View style={styles.chartContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="trending-up" size={16} color={C.textPrimary} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary }}>
                    Últimos 5 días
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: '600' }}>
                  {ratesData.length} registro{ratesData.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <NativeBarChart
                data={chartInfo.data}
                labels={chartInfo.labels}
                colors={chartInfo.colors}
                legendLabels={chartInfo.legendLabels}
                C={C}
              />
            </View>
          )}

          {/* ── List (only when no date selected) ── */}
          {!selectedDateKey && (
            <View style={styles.listContainer}>
              {ratesData.length > 0 ? (
                ratesData.map((item) => (
                  <TouchableOpacity
                    key={item.dateKey}
                    style={styles.listItem}
                    activeOpacity={0.7}
                    onPress={() => handleSelectDate(item.dateKey)}
                  >
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar" size={14} color={C.info} />
                      <Text style={[styles.dateText, { color: C.textPrimary }]}>
                        {formatDateKey(item.dateKey)}
                      </Text>
                      {item.manual && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 4 }}>
                          <Ionicons name="create-outline" size={12} color={C.textMuted} />
                          <Text style={{ fontSize: 10, color: C.textMuted }}>Manual</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.ratesRow}>
                      {renderRateCol("BCV", item.bcv, C.success)}
                      {renderRateCol("Paralelo", item.paralelo, C.highlight)}
                      {renderRateCol("Binance", item.binance_p2p, C.warning)}
                      {renderRateCol("Euro", item.euro, C.info)}
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
    </SafeAreaView>
  );
}
