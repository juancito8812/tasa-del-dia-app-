// Pantalla COMPARTIDA de Conversor para los 4 estilos de UI (original, editorial,
// fintech, terminal). La versión base (original) es la fuente de verdad de lógica,
// accesibilidad y comportamiento; cada tema sólo aporta diferencias VISUALES
// deliberadas vía THEME_STYLES (radios, gaps, tipografías, colores, casing).
// El estilo terminal además cambia algunos TEXTOS / composición (prompt ">",
// cursor, selector tipo radio, etiquetas [BCV]/[PAR]…), por eso conserva ramas
// puntuales de render.
import React, { useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, Platform, KeyboardAvoidingView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import ThemeToggleMini from '../components/ThemeToggleMini';
import useConverterData from '../hooks/useConverterData';
import { getRateTypes, formatCurrency, formatCurrencySmart } from '../utils/formatting';
import { hapticLight, hapticMedium, hapticSuccess, hapticSelection } from '../utils/haptics';
import { useFintechFonts } from '../ui/fintech/fonts';

const TAB_BAR_HEIGHT = 60;

// Tokens por estilo de UI.
const THEME_STYLES = {
  // original: sin overrides (bento glass + colores por tasa).
  original: {},
  editorial: {
    solid: true,
    offlineInk: true,
    statInk: 'editorial',
    styles: (C) => ({
      converterCard: { borderRadius: 12, padding: 20, shadowOpacity: 0, elevation: 0 },
      modeToggle: { backgroundColor: 'transparent', borderRadius: 8, padding: 0, gap: 8 },
      modeSide: { borderRadius: 8, borderWidth: 1, borderColor: C.cardBorder },
      modeSideActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
      modeTextActive: { color: C.onAccent, fontWeight: '700' },
      swapCircle: { backgroundColor: 'transparent', borderWidth: 0 },
      displayLabel: { fontSize: 12, fontWeight: '400', letterSpacing: 1 },
      displayValue: { fontSize: 32, fontWeight: '700' },
      displaySubtext: { fontSize: 12, fontWeight: '400' },
      copiedBadgeText: { color: C.textSecondary, fontWeight: '500' },
      inputContainer: { borderRadius: 8, borderColor: C.textPrimary, paddingHorizontal: 14, marginBottom: 16 },
      inputContainerFocused: { borderColor: C.textPrimary, borderWidth: 1.5, backgroundColor: C.inputBg },
      quickRow: { marginBottom: 16 },
      quickContent: { gap: 8 },
      quickChip: { borderRadius: 8, backgroundColor: 'transparent', borderColor: C.textPrimary },
      quickChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
      quickChipText: { fontWeight: '500', color: C.textPrimary },
      quickChipTextActive: { color: C.onAccent, fontWeight: '700' },
      convertButton: { borderRadius: 8, backgroundColor: C.textPrimary },
      convertButtonText: { fontSize: 15, fontWeight: '700', color: C.onAccent, letterSpacing: 1 },
      validationError: { color: C.textPrimary, fontWeight: '700' },
      inlineResult: { backgroundColor: C.textPrimary, borderRadius: 8, padding: 20, marginTop: 14 },
      resultDivider: { height: 0, marginVertical: 0 },
      resultLabel: { color: C.onAccent, fontSize: 12, fontWeight: '400', letterSpacing: 1.2, opacity: 0.7 },
      resultItemLabel: { color: C.onAccent, opacity: 0.7 },
      resultItemValue: { color: C.onAccent, fontWeight: '700' },
      resultArrow: { backgroundColor: 'transparent' },
      resultMeta: { color: C.onAccent, opacity: 0.8 },
      rateOption: { borderRadius: 8, padding: 14 },
      rateOptionActive: { borderColor: C.textPrimary, borderWidth: 1.5 },
      rateOptionLabel: { fontSize: 16, fontWeight: '500', color: C.textSecondary },
      rateOptionValue: { fontSize: 12, fontWeight: '400' },
      spreadCard: { borderRadius: 12, padding: 20 },
      spreadTitle: { fontSize: 12, fontWeight: '400', color: C.textMuted, letterSpacing: 0.3 },
      spreadPercent: { color: C.textPrimary },
      spreadBarBg: { backgroundColor: C.inputBg, borderRadius: 2 },
      spreadBarFill: { backgroundColor: C.textPrimary },
      spreadStat: { fontSize: 12, fontWeight: '400' },
      offlineBanner: { backgroundColor: C.textPrimary, borderRadius: 8 },
      offlineBannerText: { color: C.onAccent, fontSize: 12, fontWeight: '400' },
      errorBanner: { backgroundColor: C.dimmed },
      pasteInner: { borderRadius: 6, borderWidth: 1, borderColor: C.textPrimary },
      pasteText: { fontSize: 11, fontWeight: '600' },
    }),
  },
  fintech: {
    solid: true,
    offlineInk: true,
    statInk: 'fintech',
    styles: (C, F) => ({
      headerTitle: { fontSize: 18, fontWeight: '600', color: C.textPrimary, letterSpacing: -0.3, fontFamily: F.sansSemiBold },
      sectionLabel: { fontSize: 11, fontWeight: '500', color: C.textMuted, letterSpacing: 1.5, fontFamily: F.monoMedium },
      converterCard: { borderRadius: 16, padding: 20, shadowOpacity: 0, elevation: 0 },
      modeToggle: { backgroundColor: 'transparent', borderRadius: 13, padding: 0, gap: 8 },
      modeSide: { borderRadius: 13, borderWidth: 1, borderColor: C.cardBorder },
      modeSideActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
      modeText: { fontFamily: F.monoMedium },
      modeTextActive: { color: C.onAccent, fontWeight: '600', fontFamily: F.monoMedium },
      swapCircle: { backgroundColor: 'transparent', borderWidth: 0 },
      displayLabel: { fontWeight: '500', fontFamily: F.monoMedium },
      displayValue: { fontSize: 34, fontWeight: '600', fontFamily: F.monoSemiBold },
      displaySubtext: { fontFamily: F.mono },
      copiedBadge: { borderRadius: 999 },
      copiedBadgeText: { color: C.textSecondary, fontWeight: '500', fontFamily: F.sans },
      inputContainer: { borderRadius: 13, borderColor: C.textPrimary, paddingHorizontal: 14, marginBottom: 16 },
      inputContainerFocused: { borderColor: C.textPrimary, borderWidth: 1.5, backgroundColor: C.inputBg },
      input: { fontFamily: F.monoSemiBold },
      quickRow: { marginBottom: 16 },
      quickContent: { gap: 8 },
      quickChip: { borderRadius: 999, backgroundColor: 'transparent', borderColor: C.cardBorder },
      quickChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
      quickChipText: { fontWeight: '500', color: C.textPrimary, fontFamily: F.monoMedium },
      quickChipTextActive: { color: C.onAccent, fontWeight: '600' },
      convertButton: { borderRadius: 13, backgroundColor: C.textPrimary },
      convertButtonText: { fontSize: 15, fontWeight: '600', color: C.onAccent, fontFamily: F.sansSemiBold },
      validationError: { color: C.warning, fontWeight: '600', fontFamily: F.sans },
      inlineResult: { backgroundColor: C.textPrimary, borderRadius: 16, padding: 20, marginTop: 14 },
      resultDivider: { height: 0, marginVertical: 0 },
      resultLabel: { color: C.onAccent, opacity: 0.7, fontFamily: F.monoMedium },
      resultItemLabel: { color: C.onAccent, opacity: 0.7, fontFamily: F.monoMedium },
      resultItemValue: { color: C.onAccent, fontWeight: '600', fontFamily: F.monoSemiBold },
      resultArrow: { backgroundColor: 'transparent' },
      resultMeta: { color: C.onAccent, opacity: 0.8, fontFamily: F.mono },
      rateOption: { borderRadius: 13, padding: 14 },
      rateOptionActive: { borderColor: C.textPrimary, borderWidth: 1.5 },
      rateOptionLabel: { fontSize: 16, fontWeight: '500', color: C.textSecondary, fontFamily: F.sansSemiBold },
      rateOptionValue: { fontSize: 12, fontWeight: '400', fontFamily: F.mono },
      spreadCard: { borderRadius: 16, padding: 20 },
      spreadTitle: { fontSize: 12, fontWeight: '500', color: C.textMuted, fontFamily: F.monoMedium },
      spreadPercent: { color: C.textPrimary },
      spreadBarBg: { backgroundColor: C.inputBg, borderRadius: 2 },
      spreadBarFill: { backgroundColor: C.textPrimary },
      spreadStat: { fontSize: 12, fontWeight: '400', fontFamily: F.sans },
      offlineBanner: { backgroundColor: C.textPrimary, borderRadius: 8 },
      offlineBannerText: { color: C.onAccent, fontSize: 12, fontWeight: '400' },
      errorBanner: { backgroundColor: C.dimmed },
      pasteInner: { borderRadius: 999, borderWidth: 1, borderColor: C.textPrimary },
      pasteText: { fontSize: 11, fontWeight: '600' },
    }),
  },
  // Terminal: composición monoespaciada, mayúsculas, prompt ">" y cursor "▏".
  terminal: {
    variant: 'terminal',
    solid: true,
    uppercase: true,
    headerPrompt: '>',
    title: 'CONVERSOR',
    sectionLabelText: 'TASA A USAR:',
    convertText: '> CONVERTIR_',
    resultLabelText: '> RESULTADO',
    rateTags: { bcv: '[BCV]', paralelo: '[PAR]', binance_p2p: '[BNC]', euro: '[EUR]', bcv_lunes: '[LUN]' },
    refreshTint: (C) => C.textPrimary,
    styles: (C) => ({
      headerRow: { gap: 8, marginBottom: 10 },
      headerPrompt: { fontSize: 16, fontWeight: '800', color: C.textPrimary, fontFamily: 'monospace' },
      headerTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: C.textPrimary, letterSpacing: 1.5, fontFamily: 'monospace', textTransform: 'uppercase' },
      offlineBanner: { backgroundColor: C.textPrimary, borderRadius: 0, borderWidth: 1, borderColor: C.cardBorder },
      offlineBannerText: { color: C.onAccent, fontSize: 10, fontWeight: '600', fontFamily: 'monospace', letterSpacing: 0.5, flex: 1, textTransform: 'uppercase' },
      errorBanner: { backgroundColor: C.dimmed },
      converterCard: { borderRadius: 0, borderWidth: 1, borderColor: C.cardBorder, padding: 14, marginBottom: 12 },
      modeToggle: { backgroundColor: 'transparent', borderRadius: 0, padding: 0, gap: 7 },
      modeSide: { borderRadius: 0, borderWidth: 1, borderColor: C.cardBorder, paddingVertical: 6, paddingHorizontal: 12 },
      modeSideActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
      modeText: { fontFamily: 'monospace', letterSpacing: 0.5 },
      modeTextActive: { color: C.onAccent, fontWeight: '700', fontFamily: 'monospace' },
      swapCircle: { borderRadius: 0, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.cardBorder },
      sectionLabel: { fontFamily: 'monospace', letterSpacing: 1.5, color: C.textPrimary, fontWeight: '700' },
      displayContainer: { backgroundColor: C.textPrimary, borderRadius: 0, alignItems: 'flex-start', paddingHorizontal: 12, paddingVertical: 12 },
      displayLabel: { fontFamily: 'monospace', letterSpacing: 1, color: C.onAccent, textAlign: 'left', alignSelf: 'flex-start', opacity: 0.7 },
      displayValue: { fontFamily: 'monospace', color: C.onAccent, fontSize: 30, fontWeight: '700', alignSelf: 'flex-start' },
      displayCursor: { fontFamily: 'monospace', color: C.onAccent, fontSize: 30, fontWeight: '700' },
      displaySubtext: { fontFamily: 'monospace', color: C.onAccent, alignSelf: 'flex-start', opacity: 0.6, letterSpacing: 0.5 },
      inputContainer: { borderRadius: 0, borderColor: C.cardBorder },
      inputContainerFocused: { borderColor: C.textPrimary, backgroundColor: C.inputBg },
      input: { fontFamily: 'monospace', fontWeight: '700', letterSpacing: 0.5 },
      pasteInner: { borderRadius: 0, borderWidth: 1, borderColor: C.cardBorder },
      pasteText: { fontFamily: 'monospace', letterSpacing: 0.5 },
      quickChip: { borderRadius: 0, backgroundColor: 'transparent', borderColor: C.cardBorder },
      quickChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
      quickChipText: { fontFamily: 'monospace', color: C.textPrimary },
      quickChipTextActive: { color: C.onAccent, fontWeight: '700' },
      convertButton: { borderRadius: 0, backgroundColor: C.textPrimary },
      convertButtonText: { fontFamily: 'monospace', color: C.onAccent, letterSpacing: 1 },
      validationError: { fontFamily: 'monospace', color: C.warning, letterSpacing: 0.5, textTransform: 'uppercase' },
      inlineResult: { backgroundColor: C.textPrimary, borderRadius: 0, marginTop: 12, padding: 12 },
      resultDivider: { height: 0, marginVertical: 0 },
      resultLabel: { fontFamily: 'monospace', color: C.onAccent, letterSpacing: 1, textAlign: 'left' },
      resultContent: { justifyContent: 'flex-start' },
      resultItem: { alignItems: 'flex-start' },
      resultItemLabel: { fontFamily: 'monospace', color: C.onAccent, letterSpacing: 0.5 },
      resultItemValue: { fontFamily: 'monospace', color: C.onAccent, fontSize: 20 },
      resultArrow: { backgroundColor: 'transparent' },
      resultMeta: { fontFamily: 'monospace', color: C.onAccent, textAlign: 'left' },
      rateOption: { borderRadius: 0, borderColor: C.cardBorder, backgroundColor: C.cardBg },
      rateOptionActive: { borderColor: C.textPrimary },
      radioOuter: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
      radioInner: { width: 6, height: 6, borderRadius: 3 },
      rateTag: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
      rateOptionLabel: { fontFamily: 'monospace', letterSpacing: 0.3 },
      rateOptionValue: { fontFamily: 'monospace', letterSpacing: 0.3 },
      spreadCard: { borderRadius: 0, borderStyle: 'dashed', borderWidth: 1 },
      spreadTitle: { fontFamily: 'monospace', color: C.textPrimary, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
      spreadPercent: { fontFamily: 'monospace', color: C.textPrimary },
      spreadBarBg: { borderRadius: 0, backgroundColor: C.inputBg, height: 6 },
      spreadBarFill: { borderRadius: 0, backgroundColor: C.textPrimary },
      spreadStat: { fontFamily: 'monospace', color: C.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' },
      statValue: { fontFamily: 'monospace', color: C.textPrimary, fontWeight: '700' },
    }),
  },
};

function createStyles(C, F, t) {
  /** @type {any} */
  const table = {
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 12, paddingBottom: 40 },
    header: { marginBottom: 8 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerPrompt: { fontSize: 16, fontWeight: '800', color: C.textPrimary },
    logoContainer: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: C.textPrimary, letterSpacing: 0.5 },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
    converterCard: {
      backgroundColor: C.cardBg, borderRadius: 20, borderWidth: 1, borderColor: C.cardBorder,
      padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2, shadowRadius: 12, elevation: 8, overflow: 'hidden', marginBottom: 12,
    },
    cardGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 20, borderTopRightRadius: 20, opacity: 0.5 },
    modeToggle: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginBottom: 14, backgroundColor: C.inputBg, borderRadius: 12, padding: 4,
    },
    modeSide: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 18, borderRadius: 9, borderWidth: 1.5, borderColor: 'transparent' },
    modeSideActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    modeText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
    modeTextActive: { color: C.onAccent, fontWeight: '700' },
    swapCircle: {
      width: 24, height: 24, borderRadius: 12, backgroundColor: C.cardBg,
      justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder,
    },
    displayContainer: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
    displayLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    displayValue: { fontSize: 38, fontWeight: '800', letterSpacing: 1, fontVariant: ['tabular-nums'] },
    displayCursor: { fontSize: 38, fontWeight: '800' },
    displaySubtext: { fontSize: 12, color: C.textMuted, marginTop: 2, letterSpacing: 0.5 },
    copiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    copiedBadgeText: { fontSize: 11, color: C.success, fontWeight: '600' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.inputBorder, paddingHorizontal: 14, marginBottom: 10 },
    inputContainerFocused: { borderColor: C.highlight + '50', backgroundColor: C.secondary },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 12, fontSize: 18, fontWeight: '600', color: C.textPrimary, textAlign: 'left', fontVariant: ['tabular-nums'] },
    quickRow: { marginBottom: 12 },
    quickContent: { gap: 6, paddingRight: 4 },
    quickChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.cardBorder },
    quickChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    quickChipText: { fontSize: 12, fontWeight: '600', color: C.textSecondary, fontVariant: ['tabular-nums'] },
    quickChipTextActive: { color: C.onAccent, fontWeight: '700' },
    convertButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 14, gap: 8 },
    convertButtonText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
    validationError: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 },
    inlineResult: { marginTop: 0 },
    resultDivider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 14 },
    resultLabel: { fontSize: 10, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, textAlign: 'center' },
    resultContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
    resultItem: { alignItems: 'center', flex: 1 },
    resultItemLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 },
    resultItemValue: { fontSize: 22, fontWeight: '800', color: C.textPrimary, fontVariant: ['tabular-nums'] },
    resultArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.inputBg, justifyContent: 'center', alignItems: 'center' },
    resultMeta: { fontSize: 10, color: C.textMuted, textAlign: 'center', letterSpacing: 0.2 },
    rateSelector: { marginBottom: 12, gap: 6 },
    rateOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 12, gap: 10, overflow: 'hidden' },
    rateActiveBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
    rateDot: { width: 8, height: 8, borderRadius: 4 },
    radioOuter: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 6, height: 6, borderRadius: 3 },
    rateTag: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    rateOptionText: { flex: 1 },
    rateOptionLabel: { fontSize: 13, color: C.textSecondary, letterSpacing: 0.2 },
    rateOptionValue: { fontSize: 11, color: C.textMuted, marginTop: 1 },
    spreadCard: { backgroundColor: C.cardBg, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, padding: 12 },
    spreadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    spreadTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    spreadTitle: { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.3 },
    spreadPercent: { fontSize: 16, fontWeight: '800' },
    spreadBarBg: { height: 4, backgroundColor: C.inputBg, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
    spreadBarFill: { height: '100%', borderRadius: 2 },
    spreadStats: { gap: 4 },
    spreadStat: { fontSize: 11, color: C.textMuted, letterSpacing: 0.2 },
    statValue: { fontWeight: '700' },
    offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.warning, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6, marginTop: 6 },
    offlineBannerText: { color: '#fff', fontSize: 11, flex: 1 },
    errorBanner: {},
    pasteBtn: { paddingLeft: 8, paddingVertical: 4 },
    pasteInner: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
    pasteText: { fontSize: 11, fontWeight: '700' },
  };

  const cur = /** @type {any} */ (t);
  const extra = typeof cur.styles === 'function' ? cur.styles(C, F) : (cur.styles || {});
  Object.keys(extra).forEach((key) => {
    table[key] = { ...(table[key] || {}), ...extra[key] };
  });

  return StyleSheet.create(/** @type {any} */ (table));
}

export default function ConverterScreen() {
  const { colors: C, uiStyle } = useTheme();
  const F = useFintechFonts();
  const t = useMemo(() => /** @type {any} */ (THEME_STYLES[uiStyle] ?? {}), [uiStyle]);
  const styles = useMemo(() => createStyles(C, F, t), [C, F, t]);
  const isTerminal = t.variant === 'terminal';
  const solid = !!t.solid;
  const RATE_TYPES = useMemo(() => getRateTypes(C), [C]);
  const h = useConverterData();

  const getCurrentColor = () => RATE_TYPES.find((r) => r.key === h.selectedRate)?.color || C.accent;
  const getRateLabel = () => RATE_TYPES.find((r) => r.key === h.selectedRate)?.label || '';
  const getRateTag = () => (t.rateTags && t.rateTags[h.selectedRate]) || getRateLabel().split(' ')[0] || '';
  const currentColor = getCurrentColor();

  const getSpreadColor = (colorKey) => {
    if (colorKey === 'highlight') return C.highlight;
    if (colorKey === 'warning') return C.warning;
    return C.success;
  };

  // Tinta de los valores internos de cada spread según tema.
  const statInk = () => {
    if (isTerminal) return styles.statValue;
    if (t.statInk === 'fintech') return { color: C.textPrimary, fontWeight: '600', fontFamily: F.monoSemiBold };
    if (t.statInk === 'editorial') return { color: C.textPrimary, fontWeight: '700' };
    return null;
  };

  const renderSpread = (spread, title, icon, iconColor, lunesColor) => {
    if (!spread) return null;
    const barColor = solid ? C.textPrimary : getSpreadColor(spread.barColor);
    const ink = statInk();
    const titleText = t.uppercase ? title.toUpperCase() : title;
    const luneLabel = t.uppercase ? 'BCV (LUNES): ' : 'BCV (Lunes): ';
    return (
      <View style={[styles.spreadCard, title.includes('Lunes') && { marginTop: 8 }]}>
        <View style={styles.spreadHeader}>
          <View style={styles.spreadTitleRow}>
            <Ionicons name={icon} size={13} color={solid ? C.textSecondary : iconColor} />
            <Text style={styles.spreadTitle}>{titleText}</Text>
          </View>
          <Text style={[styles.spreadPercent, !solid && { color: barColor }]}>{isTerminal ? '+' : ''}{spread.diffPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.spreadBarBg}>
          <View style={[styles.spreadBarFill, { width: `${spread.barPercent}%`, backgroundColor: barColor }]} />
        </View>
        <View style={styles.spreadStats}>
          <Text style={styles.spreadStat}>
            {title.includes('Lunes') ? luneLabel : 'BCV: '}
            <Text style={ink || { color: title.includes('Lunes') ? lunesColor : C.success, fontWeight: '700' }}>
              Bs. {formatCurrency(title.includes('Lunes') ? h.rates.bcv_lunes : h.rates.bcv)}
            </Text>
          </Text>
          <Text style={styles.spreadStat}>
            {t.uppercase ? 'PARALELO: ' : 'Paralelo: '}
            <Text style={ink || { color: C.highlight, fontWeight: '700' }}>Bs. {formatCurrency(h.rates.paralelo)}</Text>
          </Text>
          <Text style={styles.spreadStat}>
            {t.uppercase ? 'DIFERENCIA: ' : 'Diferencia: '}
            <Text style={ink || { color: barColor, fontWeight: '700' }}>Bs. {formatCurrency(spread.diff)}</Text>
          </Text>
        </View>
      </View>
    );
  };

  const bannerFg = t.offlineInk ? C.onAccent : '#fff';

  return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} bounces={false}
            refreshControl={<RefreshControl refreshing={h.refreshing} onRefresh={() => h.loadRates(true)} tintColor={t.refreshTint ? t.refreshTint(C) : C.highlight} colors={[t.refreshTint ? t.refreshTint(C) : C.highlight]} progressBackgroundColor={C.secondary} />}>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                {isTerminal ? (
                  <Text style={styles.headerPrompt}>{t.headerPrompt}</Text>
                ) : (
                  <View style={[styles.logoContainer, { backgroundColor: C.highlight + '15' }]}>
                    <Ionicons name="swap-horizontal" size={18} color={C.highlight} />
                  </View>
                )}
                <Text style={styles.headerTitle}>{t.title || 'Conversor'}</Text>
                {!isTerminal && <View style={{ flex: 1 }} />}
                <ThemeToggleMini />
              </View>
              {h.offlineMode && (
                <View style={styles.offlineBanner}>
                  <Ionicons name="cloud-offline-outline" size={12} color={bannerFg} />
                  <Text style={styles.offlineBannerText}>
                    Sin conexión — Mostrando últimas tasas{h.offlineCachedAt ? ` (${new Date(h.offlineCachedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })})` : ''}
                  </Text>
                </View>
              )}
              {h.loadError && !h.offlineMode && (
                <View style={[styles.offlineBanner, { backgroundColor: C.flagRed }, styles.errorBanner]}>
                  <Ionicons name="alert-circle-outline" size={12} color={bannerFg} />
                  <Text style={styles.offlineBannerText}>{h.loadError}</Text>
                </View>
              )}
            </View>

            <View style={styles.converterCard}>
              {!solid && <View style={[styles.cardGlow, { backgroundColor: currentColor }]} />}
              {/* Mode Toggle */}
              <TouchableOpacity style={styles.modeToggle} onPress={() => { hapticSelection(); h.handleSwapMode(); }} activeOpacity={0.7}>
                <View style={[styles.modeSide, h.mode === 'usd-to-bs' && (solid ? styles.modeSideActive : { backgroundColor: currentColor + '20', borderColor: currentColor + '40' })]}>
                  <Ionicons name="logo-usd" size={16} color={h.mode === 'usd-to-bs' ? (solid ? C.onAccent : currentColor) : C.textMuted} />
                  <Text style={[styles.modeText, h.mode === 'usd-to-bs' && styles.modeTextActive]}>USD</Text>
                </View>
                <View style={styles.swapCircle}><Ionicons name="swap-horizontal" size={16} color={C.textMuted} /></View>
                <View style={[styles.modeSide, h.mode === 'bs-to-usd' && (solid ? styles.modeSideActive : { backgroundColor: currentColor + '20', borderColor: currentColor + '40' })]}>
                  <Text style={[styles.modeText, h.mode === 'bs-to-usd' && styles.modeTextActive]}>Bs.</Text>
                  <Ionicons name="cash" size={16} color={h.mode === 'bs-to-usd' ? (solid ? C.onAccent : currentColor) : C.textMuted} />
                </View>
              </TouchableOpacity>

              {/* Display */}
              <TouchableOpacity style={styles.displayContainer} activeOpacity={0.7} onPress={() => { if (h.rawAmount) { hapticSuccess(); h.handleCopy(formatCurrency(h.numericAmount), 'amount'); } }}>
                <Text style={styles.displayLabel}>
                  {h.copiedType === 'amount'
                    ? (t.uppercase ? '> ¡COPIADO!' : '¡Copiado!')
                    : isTerminal
                      ? (h.mode === 'usd-to-bs' ? 'MONTO USD' : 'MONTO BS.')
                      : (h.mode === 'usd-to-bs' ? 'Dólares (USD)' : 'Bolívares (Bs.)')}
                </Text>
                <Text style={[styles.displayValue, !solid && { color: h.copiedType === 'amount' ? C.success : currentColor }]}>
                  {h.rawAmount ? h.displayAmount : '0,00'}{isTerminal && <Text style={styles.displayCursor}>▏</Text>}
                </Text>
                {h.rawAmount.length > 0 && h.copiedType !== 'amount' && (
                  <Text style={styles.displaySubtext}>
                    {isTerminal ? getRateTag() : (h.mode === 'usd-to-bs' ? `× ${getRateLabel().split(' ')[0]} =` : `÷ ${getRateLabel().split(' ')[0]} =`)}
                  </Text>
                )}
                {!isTerminal && h.copiedType === 'amount' && (
                  <View style={[styles.copiedBadge, { backgroundColor: C.success + '15' }]}>
                    <Ionicons name="checkmark" size={12} color={C.success} />
                    <Text style={styles.copiedBadgeText}>Copiado al portapapeles</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Input */}
              <View style={[styles.inputContainer, h.isKeyboardVisible && styles.inputContainerFocused]}>
                <Ionicons name={h.mode === 'usd-to-bs' ? 'logo-usd' : 'cash'} size={16} color={C.textMuted} style={styles.inputIcon} />
                <TextInput ref={h.inputRef} style={[styles.input, !solid && { borderColor: currentColor + '30' }]} placeholder="0.00" placeholderTextColor={isTerminal ? C.dimmed : C.textMuted}
                  keyboardType="decimal-pad" value={h.rawAmount} onChangeText={h.handleChangeText}
                  returnKeyType="done" onSubmitEditing={h.handleConvert} />
                <TouchableOpacity onPress={() => { hapticLight(); h.handlePaste(); }} activeOpacity={0.6} style={styles.pasteBtn}>
                  <View style={[styles.pasteInner, solid ? (h.pasteFeedback && { backgroundColor: C.textPrimary }) : { backgroundColor: h.pasteFeedback ? C.success + '20' : currentColor + '20' }]}>
                    <Ionicons name={h.pasteFeedback ? 'checkmark-circle' : 'clipboard'} size={13} color={solid ? (h.pasteFeedback ? C.onAccent : C.textPrimary) : (h.pasteFeedback ? C.success : currentColor)} />
                    <Text style={[styles.pasteText, { color: solid ? (h.pasteFeedback ? C.onAccent : C.textPrimary) : (h.pasteFeedback ? C.success : currentColor) }]}>
                      {t.uppercase ? (h.pasteFeedback ? '¡PEGADO!' : 'PEGAR') : (h.pasteFeedback ? '¡Pegado!' : 'Pegar')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Quick amounts */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
                {h.quickAmounts.map((val) => (
                  <TouchableOpacity key={val} style={[styles.quickChip, h.numericAmount === val && (solid ? styles.quickChipActive : { backgroundColor: currentColor + '20', borderColor: currentColor })]}
                    onPress={() => { hapticSelection(); h.handleQuickAmount(val); }} activeOpacity={0.7}>
                    <Text style={[styles.quickChipText, h.numericAmount === val && styles.quickChipTextActive]}>
                      {isTerminal ? `[${val.toLocaleString('es-VE')}]` : val.toLocaleString('es-VE')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Convert button */}
              <TouchableOpacity style={[styles.convertButton, !solid && { backgroundColor: currentColor }]} onPress={() => { hapticMedium(); h.handleConvert(); }} activeOpacity={0.8}>
                {!isTerminal && <Ionicons name="calculator" size={18} color={solid ? C.onAccent : '#fff'} />}
                <Text style={styles.convertButtonText}>{t.convertText || 'Convertir'}</Text>
              </TouchableOpacity>

              {/* Validación inline (sin Alert nativo) */}
              {h.validationError && (
                <Text style={[styles.validationError, !solid && { color: C.flagRed }]}>
                  {t.uppercase ? `✗ ${h.validationError}` : h.validationError}
                </Text>
              )}

              {/* Result */}
              {h.result && (
                <View style={styles.inlineResult}>
                  <View style={styles.resultDivider} />
                  <Text style={styles.resultLabel}>{t.resultLabelText || 'Resultado'}</Text>
                  <View style={styles.resultContent}>
                    <TouchableOpacity style={styles.resultItem} activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrency(h.result.amount), 'result-source'); }}>
                      <Text style={styles.resultItemLabel}>{h.copiedType === 'result-source' ? '¡Copiado!' : (h.mode === 'usd-to-bs' ? 'USD' : 'Bs.')}</Text>
                      <Text style={[styles.resultItemValue, !solid && h.copiedType === 'result-source' && { color: C.success }]}>{formatCurrency(h.result.amount)}</Text>
                    </TouchableOpacity>
                    <View style={styles.resultArrow}><Ionicons name="arrow-forward" size={16} color={solid ? C.onAccent : C.textMuted} /></View>
                    <TouchableOpacity style={styles.resultItem} activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrencySmart(h.result.converted), 'result-target'); }}>
                      <Text style={styles.resultItemLabel}>{h.copiedType === 'result-target' ? '¡Copiado!' : (h.mode === 'usd-to-bs' ? 'Bs.' : 'USD')}</Text>
                      <Text style={[styles.resultItemValue, !solid && { color: h.copiedType === 'result-target' ? C.success : currentColor }]}>{formatCurrencySmart(h.result.converted)}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrency(h.result.rate), 'rate'); }}>
                    <Text style={styles.resultMeta}>{isTerminal ? `> TASA: ${getRateTag()}` : `Tasa: ${getRateLabel()}`} — <Text style={{ fontWeight: '700' }}>{h.copiedType === 'rate' ? '¡Copiado!' : `Bs. ${formatCurrency(h.result.rate)}`}</Text></Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Rate selector */}
            <Text style={styles.sectionLabel}>{t.sectionLabelText || 'Tasa a usar'}</Text>
            <View style={styles.rateSelector}>
              {RATE_TYPES.map((rt) => {
                const isActive = h.selectedRate === rt.key;
                const rateVal = h.rates[rt.key];
                if (isTerminal) {
                  return (
                    <TouchableOpacity key={rt.key} style={[styles.rateOption, isActive && styles.rateOptionActive]}
                      activeOpacity={0.7} onPress={() => { hapticSelection(); h.setSelectedRate(rt.key); h.setResult(null); }}>
                      <View style={[styles.radioOuter, { borderColor: isActive ? C.textPrimary : C.dimmed }]}>
                        {isActive && <View style={[styles.radioInner, { backgroundColor: C.textPrimary }]} />}
                      </View>
                      <Text style={[styles.rateTag, { color: isActive ? C.textPrimary : C.dimmed }]}>{(t.rateTags && t.rateTags[rt.key]) || `[${String(rt.key).slice(0, 3).toUpperCase()}]`}</Text>
                      <View style={styles.rateOptionText}>
                        <Text style={[styles.rateOptionLabel, isActive && { color: C.textPrimary, fontWeight: '700' }]}>{rt.label.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.rateOptionValue}>{rateVal ? formatCurrency(rateVal) : '...'}</Text>
                      {isActive && <Ionicons name="checkmark" size={16} color={C.textPrimary} />}
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity key={rt.key} style={[styles.rateOption, isActive && (solid ? styles.rateOptionActive : { backgroundColor: rt.color + '12', borderColor: rt.color })]}
                    activeOpacity={0.7} onPress={() => { hapticSelection(); h.setSelectedRate(rt.key); h.setResult(null); }}>
                    {!solid && isActive && <View style={[styles.rateActiveBar, { backgroundColor: rt.color }]} />}
                    <View style={[styles.rateDot, { backgroundColor: isActive ? (solid ? C.textPrimary : rt.color) : (solid ? C.cardBorder : 'rgba(255,255,255,0.15)') }]} />
                    <View style={styles.rateOptionText}>
                      <Text style={[styles.rateOptionLabel, isActive && { color: C.textPrimary, fontWeight: '700' }]}>{rt.label}</Text>
                      <Text style={styles.rateOptionValue}>{rateVal ? `Bs. ${formatCurrency(rateVal)}` : 'Cargando...'}</Text>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={18} color={solid ? C.textPrimary : rt.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Spreads */}
            {!h.loading && renderSpread(h.spreadBcv, 'Brecha BCV vs Paralelo', 'git-compare', C.textSecondary)}
            {!h.loading && renderSpread(h.spreadLunes, 'Brecha BCV (Lunes) vs Paralelo', 'calendar', C.bcvLunes)}

            {/* Gas calculator */}
            {h.rates.bcv !== null && (
              <View style={[styles.spreadCard, { marginTop: 8 }]}>
                <View style={styles.spreadHeader}>
                  {isTerminal ? (
                    <View style={styles.spreadTitleRow}>
                      <Ionicons name="flame" size={14} color={C.warning} />
                      <Text style={styles.spreadTitle}>GASOLINA // $0,50 USD/L</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.spreadTitleRow}>
                        <Ionicons name="flame" size={14} color={C.warning} />
                        <Text style={[styles.spreadTitle, { color: C.textPrimary, fontSize: 13, fontWeight: '700' }]}>Gasolina</Text>
                      </View>
                      <Text style={{ fontSize: 11, color: C.textMuted }}>$0,50 USD/L</Text>
                    </>
                  )}
                </View>
                <View style={[styles.inputContainer, { marginBottom: 10 }]}>
                  <Ionicons name="flame" size={16} color={C.warning} style={{ marginRight: 8 }} />
                  <TextInput style={[styles.input, { borderColor: 'transparent' }]} placeholder="Litros (ej: 3.4)" placeholderTextColor={C.textMuted}
                    keyboardType="decimal-pad" value={h.gasLitros} onChangeText={h.setGasLitros} />
                </View>
                {h.gasLitrosNum > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: C.textSecondary }}>{h.gasLitros}L</Text>
                    <TouchableOpacity onPress={() => { hapticSuccess(); h.handleCopy((h.gasLitrosNum * 0.50 * h.rates.bcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'gasolina'); }} activeOpacity={0.7}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: solid ? C.textPrimary : (h.copiedType === 'gasolina' ? C.success : C.warning), fontVariant: ['tabular-nums'] }}>
                        {h.copiedType === 'gasolina' ? 'Copiado!' : `Bs. ${(h.gasLitrosNum * 0.50 * h.rates.bcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
  );
}
