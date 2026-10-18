// HistoryScreen ÚNICA para todos los estilos de UI (Q1).
//
// La BASE (`original`) es la fuente de verdad de lógica, accesibilidad y
// comportamiento. Las copias por tema (`ui/editorial/HistoryScreen.js`,
// `ui/fintech/HistoryScreen.js`, `ui/terminal/HistoryScreen.js`) se eliminaron y
// de ellas solo se conservan sus diferencias VISUALES deliberadas, codificadas
// como tokens en THEME_STYLES.
//
// OJO (paridad): las copias editorial y terminal construían su propio stylesheet
// dentro de cada item (`useMemo` por item, y `styles` no viajaba como prop); la
// base lo memoiza UNA vez en la pantalla y lo pasa a los items — gana el base.
import React, { useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import useHistoryData, { formatDateKey } from '../hooks/useHistoryData';
import { getMonthAbbr, getDay, formatCurrency } from '../utils/formatting';
import { useFintechFonts } from '../ui/fintech/fonts';
import HistoryChart from '../components/HistoryChart';
import DateDetailCard from '../components/DateDetailCard';

/**
 * Deltas visuales por estilo (Q1). Solo lo que difiere del estilo `original`.
 *
 * Convenciones:
 *  - `*Token`: clave de la paleta del tema para un color (el base usa la suya).
 *  - `styles(C, F)`: parche por clave sobre el stylesheet base (`mergeStyles`);
 *    lleva tipografía/layout/radios/bordes (nunca colores que ya tengan token).
 *  - `fonts`: nombre de familia en FONT (fintech) → fontFamily.
 * @type {Record<string, any>}
 */
export const THEME_STYLES = {
  // original = base, sin deltas.
  original: {},

  // editorial: monocromo premium → el CTA usa el acento del tema (base: blanco).
  editorial: {
    accent: 'onAccent',
  },

  // fintech: radios de fila del sitio, pesos medios, CTA en highlight y
  // tipografías geométricas (Space Grotesk / JetBrains Mono).
  fintech: {
    accent: 'onAccent',
    buttonBgToken: 'highlight',
    fonts: {
      headerTitle: 'sansSemiBold',
      sectionLabel: 'monoMedium',
      dateChipDay: 'monoSemiBold',
      dateChipMonth: 'monoMedium',
      customDateInput: 'monoMedium',
      customDateButtonText: 'sansSemiBold',
      dateText: 'sansSemiBold',
      rateColLabel: 'sans',
      rateColValue: 'monoSemiBold',
      manualText: 'mono',
      emptyText: 'sans',
    },
    styles: () => ({
      headerTitle: { fontWeight: '600', letterSpacing: -0.3 },
      sectionLabel: { fontWeight: '500', letterSpacing: 1.5 },
      dateChip: { borderRadius: 13, borderWidth: 1 },
      dateChipDay: { fontWeight: '600' },
      dateChipMonth: { fontWeight: '500' },
      customDateInput: { borderRadius: 13, borderWidth: 1, fontWeight: '500' },
      customDateButton: { borderRadius: 13 },
      customDateButtonText: { fontWeight: '600' },
      listItem: { borderRadius: 13 },
      dateText: { fontWeight: '600' },
      rateColLabel: { fontWeight: '500' },
      rateColValue: { fontWeight: '600', fontVariant: ['tabular-nums'] },
      emptyText: { fontWeight: '500' },
    }),
  },

  // terminal: consola monocroma → prompt en el header, chips entre corchetes
  // (el activo se rellena), bordes punteados, glifo `■` y todo en `monospace`.
  terminal: {
    headerPrompt: '>',
    headerTitleText: 'HISTORIAL',
    sectionLabelText: 'Últimos 10 días:',
    sectionLabelColorToken: 'dimmed',
    accent: 'onAccent',
    buttonBgToken: 'textPrimary',
    buttonLabel: '> VER',
    placeholderToken: 'dimmed',
    chipBrackets: true,
    chipActiveTextToken: 'onAccent',
    chipIdleTextToken: 'dimmed',
    searchIconSize: 13,
    searchIdleToken: 'dimmed',
    searchMarginTop: 0,
    rateBarMode: 'mono',
    rateLabelColorToken: 'dimmed',
    rateValueMutedToken: 'dimmed',
    manualLabel: 'MANUAL',
    manualIconSize: 11,
    dateGlyph: '■',
    dateGlyphToken: 'dimmed',
    emptyIconSize: 44,
    emptyColorToken: 'dimmed',
    styles: (C) => ({
      header: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        borderBottomColor: C.cardBorder,
        marginHorizontal: 12,
      },
      headerPrompt: { fontSize: 18, fontWeight: '700', color: C.dimmed, fontFamily: 'monospace' },
      headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1, fontFamily: 'monospace' },
      scrollContent: { paddingTop: 14 },
      sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 8, fontFamily: 'monospace' },
      chipRow: { gap: 6 },
      dateChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 0, borderWidth: 1, minWidth: 64, flexDirection: 'row', gap: 3 },
      dateChipBracket: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
      dateChipDay: { fontFamily: 'monospace' },
      dateChipMonth: { fontFamily: 'monospace' },
      dateChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
      dateChipInactive: { backgroundColor: 'transparent' },
      customDateRow: { marginBottom: 14 },
      customDateInput: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 0, borderWidth: 1, fontSize: 14, fontFamily: 'monospace' },
      customDateButton: { paddingHorizontal: 14, borderRadius: 0 },
      customDateButtonText: { fontWeight: '700', fontFamily: 'monospace' },
      chartContainer: { backgroundColor: 'transparent', padding: 12, marginBottom: 18, borderStyle: 'dashed' },
      listContainer: { gap: 10 },
      listItem: { backgroundColor: 'transparent', borderRadius: 0, padding: 12 },
      dateText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'monospace' },
      manualText: { fontSize: 9, color: C.dimmed, letterSpacing: 0.5, fontFamily: 'monospace' },
      rateColBar: { height: 15, borderRadius: 0 },
      rateColLabel: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'monospace' },
      rateColValue: { fontSize: 14, fontWeight: '800', color: C.textPrimary, fontVariant: ['tabular-nums'], fontFamily: 'monospace' },
      emptyText: { fontSize: 13, fontFamily: 'monospace' },
    }),
  },
};

/** Stylesheet base (= estilo `original`). @returns {Record<string, any>} */
function baseStyleSheet(C, F) {
  return {
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
    customDateButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
    customDateButtonText: { fontSize: 13, fontWeight: '700' },
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
    rateColBar: { width: 3, height: 16, borderRadius: 1.5 },
    rateColLabel: { fontSize: 11, fontWeight: '600' },
    rateColValue: { fontSize: 14, fontWeight: '800' },
    manualText: { fontSize: 10, color: C.textMuted },
    emptyState: { alignItems: 'center', padding: 30, marginTop: 20 },
    emptyText: { fontSize: 14, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  };
}

/** Stylesheet base + parches visuales del estilo activo. */
function createStyles(C, t, F) {
  const base = StyleSheet.create(baseStyleSheet(C, F));
  const patch = t.styles ? t.styles(C, F) : null;
  if (!patch) return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    out[key] = [base[key], patch[key]];
  }
  return out;
}

/** Familia tipográfica del tema (`undefined` → fuente del sistema). */
function themeFont(t, F, key) {
  return t.fonts?.[key] && F ? F[t.fonts[key]] : undefined;
}

/**
 * Item de la lista de historial, memoizado: solo se re-renderiza cuando cambia
 * el dato, el tema o sus handlers (que son estables). Al teclear en el buscador,
 * cambiar la selección o copiar, los 10 items NO se re-renderizan.
 */
function HistoryListItemView({ item, C, t, styles, onPress, handleCopy }) {
  const mono = t.rateBarMode === 'mono';

  const renderRateCol = (label, value, color) => (
    <TouchableOpacity
      style={styles.rateCol}
      activeOpacity={0.7}
      onPress={() => value && handleCopy(formatCurrency(value), `${label}-${value}`)}
    >
      <View style={[styles.rateColBar, { backgroundColor: mono ? (value ? C.textPrimary : C.barTrack) : color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rateColLabel, { color: C[t.rateLabelColorToken || 'textSecondary'] }]}>{label}</Text>
        {value ? (
          <Text
            style={
              mono
                ? styles.rateColValue
                : [styles.rateColValue, { color, fontVariant: ['tabular-nums'] }]
            }
          >
            Bs. {formatCurrency(value)}
          </Text>
        ) : (
          <Text style={[styles.rateColValue, { color: C[t.rateValueMutedToken || 'textMuted'] }]}>—</Text>
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
        {t.dateGlyph ? (
          <Text style={{ color: C[t.dateGlyphToken || 'textMuted'], fontFamily: 'monospace', fontSize: 11 }}>{t.dateGlyph}</Text>
        ) : (
          <Ionicons name="calendar" size={14} color={C.info} />
        )}
        <Text style={[styles.dateText, { color: C.textPrimary }]}>{formatDateKey(item.dateKey)}</Text>
        {item.manual && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 4 }}>
            <Ionicons name="create-outline" size={t.manualIconSize || 12} color={C[t.manualColorToken || 'textMuted']} />
            <Text style={styles.manualText}>{t.manualLabel || 'Manual'}</Text>
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
  );
}

const HistoryListItem = React.memo(HistoryListItemView);

export default function HistoryScreen() {
  const { colors: C, uiStyle } = useTheme();
  const t = useMemo(() => THEME_STYLES[uiStyle] ?? {}, [uiStyle]);
  const F = useFintechFonts();
  const styles = useMemo(() => createStyles(C, t, F), [C, t, F]);
  const h = useHistoryData();
  const { handleSelectDate, selectedDateKey } = h;

  // Handlers estables para los componentes memoizados de la lista/detalle
  const handleSelectItem = useCallback((dateKey) => handleSelectDate(dateKey), [handleSelectDate]);
  const handleCloseDetail = useCallback(() => handleSelectDate(selectedDateKey), [handleSelectDate, selectedDateKey]);

  const chipActive = C[t.chipActiveTextToken || 'info'];
  const chipIdle = C[t.chipIdleTextToken || 'textMuted'];
  const buttonAccent = t.accent && C[t.accent] != null ? C[t.accent] : '#fff';

  return (
        <View style={styles.container}>
          <View style={styles.header}>
            {t.headerPrompt ? (
              <Text style={styles.headerPrompt}>{t.headerPrompt}</Text>
            ) : (
              <View style={[styles.logoContainer, { backgroundColor: C.info + '15' }]}>
                <Ionicons name="stats-chart" size={18} color={C.info} />
              </View>
            )}
            <Text style={[styles.headerTitle, { color: C.textPrimary, fontFamily: themeFont(t, F, 'headerTitle') }]}>
              {t.headerTitleText || 'Historial'}
            </Text>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {h.last10.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: C[t.sectionLabelColorToken || 'textMuted'], fontFamily: themeFont(t, F, 'sectionLabel') }]}>
                  {t.sectionLabelText || 'Últimos 10 días'}
                </Text>
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
                        {t.chipBrackets && (
                          <Text style={[styles.dateChipBracket, { color: isActive ? chipActive : chipIdle }]}>[</Text>
                        )}
                        <Text style={[styles.dateChipDay, { color: isActive ? chipActive : C.textPrimary, fontFamily: themeFont(t, F, 'dateChipDay') }]}>
                          {getDay(item.dateKey)}
                        </Text>
                        <Text style={[styles.dateChipMonth, { color: isActive ? chipActive : chipIdle, fontFamily: themeFont(t, F, 'dateChipMonth') }]}>
                          {getMonthAbbr(item.dateKey)}
                        </Text>
                        {t.chipBrackets && (
                          <Text style={[styles.dateChipBracket, { color: isActive ? chipActive : chipIdle }]}>]</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.dateChip, h.showCustomInput ? styles.dateChipActive : styles.dateChipInactive]}
                    onPress={() => h.setShowCustomInput(!h.showCustomInput)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="search" size={t.searchIconSize || 16} color={h.showCustomInput ? chipActive : C[t.searchIdleToken || 'textMuted']} />
                    <Text style={[styles.dateChipMonth, { color: h.showCustomInput ? chipActive : C[t.searchIdleToken || 'textMuted'], marginTop: t.searchMarginTop ?? 4, fontFamily: themeFont(t, F, 'dateChipMonth') }]}>Buscar</Text>
                  </TouchableOpacity>
                </ScrollView>

                {h.showCustomInput && (
                  <View style={styles.customDateRow}>
                    <TextInput
                      style={styles.customDateInput}
                      placeholder="DD/MM/AAAA (ej: 13/06/2026)"
                      placeholderTextColor={C[t.placeholderToken || 'textMuted']}
                      value={h.customDateText}
                      onChangeText={h.setCustomDateText}
                      keyboardType="number-pad"
                      maxLength={10}
                      returnKeyType="search"
                      onSubmitEditing={h.handleCustomDate}
                    />
                    <TouchableOpacity
                      style={[styles.customDateButton, { backgroundColor: C[t.buttonBgToken || 'info'] }]}
                      onPress={h.handleCustomDate}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="arrow-forward" size={14} color={buttonAccent} />
                      <Text style={[styles.customDateButtonText, { color: buttonAccent, fontFamily: themeFont(t, F, 'customDateButtonText') }]}>
                        {t.buttonLabel || 'Ver'}
                      </Text>
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
                      t={t}
                      styles={styles}
                      onPress={handleSelectItem}
                      handleCopy={h.handleCopy}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={t.emptyIconSize || 48} color={C[t.emptyColorToken || 'textMuted']} />
                    <Text style={[styles.emptyText, { color: C[t.emptyColorToken || 'textMuted'], fontFamily: themeFont(t, F, 'emptyText') }]}>
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
