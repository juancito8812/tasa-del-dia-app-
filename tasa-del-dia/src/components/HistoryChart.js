// HistoryChart ÚNICO para todos los estilos de UI (Q1).
//
// La BASE (`original`) es la fuente de verdad. Las copias por tema
// (`ui/editorial/HistoryChart.js`, `ui/fintech/HistoryChart.js`,
// `ui/terminal/HistoryChart.js`) se eliminaron y de ellas solo se conservan sus
// diferencias VISUALES deliberadas, codificadas como tokens en THEME_STYLES.
//
// Color de las series (diferencia deliberada, cubierta por test):
//  - original / fintech: colores semánticos de la paleta → [success, highlight]
//  - editorial: monocromo premium → [textPrimary, textMuted]
//  - terminal: monocromo → [textPrimary, dimmed]
// La LEYENDA mantiene SIEMPRE los colores con significado (success/highlight).
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useFintechFonts } from '../ui/fintech/fonts';

const screenWidth = Dimensions.get('window').width;

/** Par de colores con significado de la leyenda (no cambia por tema). */
export const LEGEND_TOKENS = ['success', 'highlight'];

/**
 * Deltas visuales por estilo (Q1). Solo lo que difiere del estilo `original`.
 *  - `series`: claves de paleta del par de series del gráfico.
 *  - `fonts`: nombre de familia en FONT (fintech) → fontFamily.
 *  - `fontWeights`: pesos que el estilo adelgaza respecto al base.
 * @type {Record<string, any>}
 */
export const THEME_STYLES = {
  original: {
    series: LEGEND_TOKENS,
  },

  editorial: {
    // Monocromo: el par de series usa los grises premium del tema…
    series: ['textPrimary', 'textMuted'],
  },

  fintech: {
    series: LEGEND_TOKENS,
    fonts: {
      legendLabel: 'monoMedium',
      countText: 'monoMedium',
      barValue: 'monoMedium',
      barLabel: 'monoMedium',
    },
    fontWeights: { legendLabel: '500', countText: '500', barValue: '600', barLabel: '500' },
  },

  terminal: {
    // Monocromo: series en blanco apagado, leyenda aún con color.
    series: ['textPrimary', 'dimmed'],
  },
};

/** Resuelve las claves de serie de un estilo a colores de la paleta. */
export function getSeriesColors(uiStyle, C) {
  const tokens = THEME_STYLES[uiStyle]?.series ?? LEGEND_TOKENS;
  return tokens.map((token) => C[token]);
}

function HistoryChartBase({ chartInfo, C, ratesCount }) {
  const { uiStyle } = useTheme();
  const t = THEME_STYLES[uiStyle] ?? {};
  const F = useFintechFonts();

  if (!chartInfo) return null;

  const { data, labels } = chartInfo;
  const allValues = data.flat().filter((v) => v > 0);
  if (allValues.length === 0) return null;

  const maxVal = Math.max(...allValues);
  const minVal = Math.min(...allValues);
  const range = maxVal - minVal || 1;
  const chartHeight = 160;
  const barGroupWidth = (screenWidth - 80) / labels.length;

  const colors = getSeriesColors(uiStyle, C);
  /** Familia tipográfica del tema (`undefined` → fuente del sistema). */
  const font = (key) => (t.fonts?.[key] && F ? F[t.fonts[key]] : undefined);
  const weight = (key) => t.fontWeights?.[key];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.legendDot, { backgroundColor: C[LEGEND_TOKENS[0]] }]} />
            <Text style={[styles.legendLabel, { color: C.textSecondary, fontFamily: font('legendLabel'), fontWeight: weight('legendLabel') || '600' }]}>BCV</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={[styles.legendDot, { backgroundColor: C[LEGEND_TOKENS[1]] }]} />
            <Text style={[styles.legendLabel, { color: C.textSecondary, fontFamily: font('legendLabel'), fontWeight: weight('legendLabel') || '600' }]}>Paralelo</Text>
          </View>
        </View>
        <Text style={[styles.countText, { color: C.textMuted, fontFamily: font('countText'), fontWeight: weight('countText') || '600' }]}>
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
                      <Text style={[styles.barValue, { color: colors[dIdx], fontFamily: font('barValue'), fontWeight: weight('barValue') || '700' }]}>
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
            <Text style={[styles.barLabel, { color: C.textMuted, fontFamily: font('barLabel'), fontWeight: weight('barLabel') || '600' }]}>{label}</Text>
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
