import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { getHistoricalRates, formatDateKey } from '../services/api';

const screenWidth = Dimensions.get("window").width;

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
      padding: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignItems: 'center',
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
  
  const chartData = React.useMemo(() => {
    if (ratesData.length === 0) return null;
    
    // For chart, we need ascending order (oldest to newest)
    const reversed = [...ratesData].reverse().slice(-7); // Last 7 days
    
    // If we have less than 2 data points, we can't draw a line chart nicely
    if (reversed.length < 2) return null;
    
    const labels = reversed.map(item => item.dateKey.slice(5).replace('-', '/')); // MM/DD
    const bcvData = reversed.map(item => item.bcv || 0);
    const paraleloData = reversed.map(item => item.paralelo || 0);
    
    // Check if we actually have non-zero data
    if (bcvData.every(v => v === 0) && paraleloData.every(v => v === 0)) return null;

    return {
      labels,
      datasets: [
        {
          data: bcvData,
          color: (opacity = 1) => C.success, // BCV color
          strokeWidth: 2
        },
        {
          data: paraleloData,
          color: (opacity = 1) => C.highlight, // Paralelo color
          strokeWidth: 2
        }
      ],
      legend: ["BCV", "Paralelo"]
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
          {chartData && (
            <View style={styles.chartContainer}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary, marginBottom: 12, alignSelf: 'flex-start', marginLeft: 10 }}>
                Últimos 7 días
              </Text>
              <LineChart
                data={chartData}
                width={screenWidth - 46}
                height={220}
                chartConfig={{
                  backgroundColor: C.cardBg,
                  backgroundGradientFrom: C.cardBg,
                  backgroundGradientTo: C.cardBg,
                  decimalPlaces: 2,
                  color: (opacity = 1) => C.textPrimary,
                  labelColor: (opacity = 1) => C.textMuted,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: C.cardBg }
                }}
                bezier
                style={{ borderRadius: 16 }}
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
