import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getHistoricalRates, formatDateKey } from '../services/api';

const screenWidth = Dimensions.get("window").width;

// --- Simple Bar Chart built with native Views (no SVG needed) ---
function NativeBarChart({ data, labels, colors, legendLabels, C }) {
  if (!data || data.length === 0) return null;

  // data is an array of arrays: [[bcv1, bcv2, ...], [par1, par2, ...]]
  const allValues = data.flat().filter(v => v > 0);
  if (allValues.length === 0) return null;

  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const range = maxVal - minVal || 1;
  const chartHeight = 160;
  const barGroupWidth = (screenWidth - 80) / labels.length;

  return (
    <View>
      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
        {legendLabels.map((label, i) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors[i] }} />
            <Text style={{ color: C.textSecondary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Chart Area */}
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
    chartContainer: {
      backgroundColor: C.cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
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
    rateLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    rateValue: {
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
    }
  });
}

export default function HistoryScreen() {
  const { colors: C, isDark } = useTheme();
  const styles = createStyles(C);
  
  const [ratesData, setRatesData] = useState([]);
  
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );
  
  const loadHistory = async () => {
    const data = await getHistoricalRates();
    // Convert object to array and sort by date descending
    const arr = Object.keys(data).map(key => ({
      dateKey: key,
      ...data[key]
    })).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    setRatesData(arr);
  };
  
  const chartInfo = React.useMemo(() => {
    if (ratesData.length === 0) return null;
    
    // For chart, we need ascending order (oldest to newest)
    const reversed = [...ratesData].reverse().slice(-7); // Last 7 days
    
    // If we have less than 2 data points, we can't draw a chart nicely
    if (reversed.length < 2) return null;
    
    const labels = reversed.map(item => item.dateKey.slice(5).replace('-', '/'));
    const bcvData = reversed.map(item => item.bcv || 0);
    const paraleloData = reversed.map(item => item.paralelo || 0);
    
    // Check if we actually have non-zero data
    if (bcvData.every(v => v === 0) && paraleloData.every(v => v === 0)) return null;

    return {
      labels,
      data: [bcvData, paraleloData],
      colors: [C.success, C.highlight],
      legendLabels: ['BCV', 'Paralelo'],
    };
  }, [ratesData, C]);

  const renderRate = (label, value, color) => (
    <View style={styles.rateCol}>
      <View style={{ width: 3, height: 16, borderRadius: 1.5, backgroundColor: color }} />
      <View>
        <Text style={[styles.rateLabel, { color: C.textSecondary }]}>{label}</Text>
        {value ? (
          <Text style={[styles.rateValue, { color, fontVariant: ['tabular-nums'] }]}>Bs. {Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        ) : (
          <Text style={[styles.rateValue, { color: C.textMuted }]}>—</Text>
        )}
      </View>
    </View>
  );

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
          {chartInfo && (
            <View style={styles.chartContainer}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 12 }}>
                Últimos 7 días
              </Text>
              <NativeBarChart
                data={chartInfo.data}
                labels={chartInfo.labels}
                colors={chartInfo.colors}
                legendLabels={chartInfo.legendLabels}
                C={C}
              />
            </View>
          )}

          <View style={styles.listContainer}>
            {ratesData.length > 0 ? (
              ratesData.map((item) => (
                <View key={item.dateKey} style={styles.listItem}>
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
                    {renderRate("BCV", item.bcv, C.success)}
                    {renderRate("Paralelo", item.paralelo, C.highlight)}
                    {renderRate("Binance", item.binance_p2p, C.warning)}
                    {renderRate("Euro", item.euro, C.info)}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={C.textMuted} />
                <Text style={[styles.emptyText, { color: C.textMuted }]}>
                  No hay tasas guardadas aún.{"\n"}Se guardarán automáticamente cuando obtengas las tasas del día.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
