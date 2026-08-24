// Variante TERMINAL del rediseño monocromo (fuente: feature/ui-monocromo).
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

function HistoryChartBase({ chartInfo, C, ratesCount }) {
  if (!chartInfo) return null;

  const { data, labels } = chartInfo;
  const allValues = data.flat().filter((v) => v > 0);
  if (allValues.length === 0) return null;

  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const range = maxVal - minVal || 1;
  const chartHeight = 160;
  const barGroupWidth = (screenWidth - 80) / labels.length;

  const colors = [C.textPrimary, C.dimmed];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.legendDot, { backgroundColor: C.success }]} />
            <Text style={[styles.legendLabel, { color: C.textSecondary }]}>BCV</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.legendDot, { backgroundColor: C.highlight }]} />
            <Text style={[styles.legendLabel, { color: C.textSecondary }]}>Paralelo</Text>
          </View>
        </View>
        <Text style={[styles.countText, { color: C.textMuted }]}>
          {ratesCount} registro{ratesCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Bars */}
      <View style={[styles.barsContainer, { height: chartHeight }]}>
        {labels.map((label, idx) => (
          <View key={label} style={[styles.barGroup, { width: barGroupWidth }]}>
            <View style={[styles.barsInner, { height: chartHeight - 20 }]}>
              {data.map((dataset, dIdx) => {
                const val = dataset[idx] || 0;
                const pct = val > 0 ? ((val - minVal) / range) * 0.8 + 0.2 : 0;
                const barHeight = Math.max(pct * (chartHeight - 40), val > 0 ? 8 : 0);
                return (
                  <View key={dIdx} style={styles.barColumn}>
                    {val > 0 && (
                      <Text style={[styles.barValue, { color: colors[dIdx] }]}>
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
            <Text style={[styles.barLabel, { color: C.textMuted }]}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Memoizado: solo se re-renderiza si cambia chartInfo (que ya está memoizado
// en el hook) o el tema. Evita re-renders al copiar campos, cambiar selección, etc.
const HistoryChart = React.memo(HistoryChartBase);

export default HistoryChart;

const styles = StyleSheet.create({
  container: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    position: 'absolute',
    right: 0,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  barGroup: {
    alignItems: 'center',
  },
  barsInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  barColumn: {
    alignItems: 'center',
  },
  barValue: {
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
  },
});
