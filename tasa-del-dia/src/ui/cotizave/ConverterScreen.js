// Estilo COTIZAVE — conversor: cifras en JetBrains Mono, pastillas 999px para
// montos rápidos, botones radio 13px y tarjetas blancas/filas oscuras del sitio.
import React, { useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, Platform, KeyboardAvoidingView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggleMini from '../../components/ThemeToggleMini';
import useConverterData from '../../hooks/useConverterData';
import { getRateTypes, formatCurrency, formatCurrencySmart } from '../../utils/formatting';
import { hapticLight, hapticMedium, hapticSuccess, hapticSelection } from '../../utils/haptics';
import { useCotizaveFonts } from './fonts';

const TAB_BAR_HEIGHT = 60;

function createStyles(C, F) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 12, paddingBottom: 40 },
    header: { marginBottom: 8 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoContainer: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: C.textPrimary, letterSpacing: -0.3, fontFamily: F.sansSemiBold },
    sectionLabel: { fontSize: 11, fontWeight: '500', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, fontFamily: F.monoMedium },
    converterCard: {
      backgroundColor: C.cardBg, borderRadius: 16, borderWidth: 1, borderColor: C.cardBorder,
      padding: 20, overflow: 'hidden', marginBottom: 16,
    },
    modeToggle: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      marginBottom: 14, backgroundColor: 'transparent', borderRadius: 13, padding: 0,
    },
    modeSide: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 18, borderRadius: 13, borderWidth: 1, borderColor: C.cardBorder },
    modeSideActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    modeText: { fontSize: 13, fontWeight: '500', color: C.textSecondary, fontFamily: F.monoMedium },
    swapCircle: {
      width: 24, height: 24, borderRadius: 12, backgroundColor: 'transparent',
      justifyContent: 'center', alignItems: 'center', borderWidth: 0,
    },
    displayContainer: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
    displayLabel: { fontSize: 12, fontWeight: '500', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, fontFamily: F.monoMedium },
    displayValue: { fontSize: 34, fontWeight: '600', letterSpacing: 0.5, fontVariant: ['tabular-nums'], fontFamily: F.monoSemiBold },
    displaySubtext: { fontSize: 12, fontWeight: '400', color: C.textMuted, marginTop: 2, letterSpacing: 0.5, fontFamily: F.mono },
    copiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
    copiedBadgeText: { fontSize: 11, color: C.textSecondary, fontWeight: '500', fontFamily: F.sans },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 13, borderWidth: 1, borderColor: C.textPrimary, paddingHorizontal: 14, marginBottom: 16 },
    inputContainerFocused: { borderColor: C.textPrimary, borderWidth: 1.5, backgroundColor: C.inputBg },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 12, fontSize: 18, fontWeight: '600', color: C.textPrimary, textAlign: 'left', fontVariant: ['tabular-nums'], fontFamily: F.monoSemiBold },
    quickRow: { marginBottom: 16 },
    quickContent: { gap: 8, paddingRight: 4 },
    quickChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'transparent', borderWidth: 1, borderColor: C.cardBorder },
    quickChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    quickChipText: { fontSize: 12, fontWeight: '500', color: C.textPrimary, fontVariant: ['tabular-nums'], fontFamily: F.monoMedium },
    quickChipTextActive: { color: C.onAccent, fontWeight: '600' },
    convertButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 13, paddingVertical: 14, gap: 8, backgroundColor: C.textPrimary },
    convertButtonText: { fontSize: 15, fontWeight: '600', color: C.onAccent, letterSpacing: 0.3, fontFamily: F.sansSemiBold },
    validationError: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8, color: C.warning, fontFamily: F.sans },
    inlineResult: {
      marginTop: 14, backgroundColor: C.textPrimary, borderRadius: 16, padding: 20,
    },
    resultDivider: { height: 0 },
    resultLabel: { fontSize: 11, fontWeight: '500', color: C.onAccent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, textAlign: 'center', opacity: 0.7, fontFamily: F.monoMedium },
    resultContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
    resultItem: { alignItems: 'center', flex: 1 },
    resultItemLabel: { fontSize: 11, fontWeight: '500', color: C.onAccent, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8, opacity: 0.7, fontFamily: F.monoMedium },
    resultItemValue: { fontSize: 22, fontWeight: '600', color: C.onAccent, fontVariant: ['tabular-nums'], fontFamily: F.monoSemiBold },
    resultArrow: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    resultMeta: { fontSize: 12, fontWeight: '400', color: C.onAccent, textAlign: 'center', letterSpacing: 0.2, opacity: 0.8, fontFamily: F.mono },
    rateSelector: { marginBottom: 16, gap: 8 },
    rateOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 13, borderWidth: 1, borderColor: C.cardBorder, padding: 14, gap: 10, overflow: 'hidden' },
    rateOptionActive: { borderColor: C.textPrimary, borderWidth: 1.5 },
    rateDot: { width: 8, height: 8, borderRadius: 4 },
    rateOptionText: { flex: 1 },
    rateOptionLabel: { fontSize: 16, fontWeight: '500', color: C.textSecondary, letterSpacing: -0.2, fontFamily: F.sansMedium },
    rateOptionValue: { fontSize: 12, fontWeight: '400', color: C.textMuted, marginTop: 1, fontFamily: F.mono },
    spreadCard: { backgroundColor: C.cardBg, borderRadius: 13, borderWidth: 1, borderColor: C.cardBorder, padding: 20 },
    spreadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    spreadTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    spreadTitle: { fontSize: 12, fontWeight: '500', color: C.textMuted, letterSpacing: 0.3, fontFamily: F.monoMedium },
    spreadPercent: { fontSize: 16, fontWeight: '600', color: C.textPrimary, fontFamily: F.monoSemiBold },
    spreadBarBg: { height: 4, backgroundColor: C.barTrack || C.inputBg, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
    spreadBarFill: { height: '100%', borderRadius: 2, backgroundColor: C.textPrimary },
    spreadStats: { gap: 4 },
    spreadStat: { fontSize: 12, fontWeight: '400', color: C.textMuted, letterSpacing: 0.2, fontFamily: F.sans },
    offlineBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.warning, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 6, gap: 6, marginTop: 6 },
    offlineBannerText: { color: C.onAccent, fontSize: 12, fontWeight: '400', flex: 1, fontFamily: F.sans },
    pasteBtn: { paddingLeft: 8, paddingVertical: 4 },
    pasteInner: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: C.textPrimary },
    pasteText: { fontSize: 11, fontWeight: '600', fontFamily: F.sansMedium },
  });
}

export default function ConverterScreen() {
  const { colors: C } = useTheme();
  const F = useCotizaveFonts();
  const styles = useMemo(() => createStyles(C, F), [C, F]);
  const RATE_TYPES = useMemo(() => getRateTypes(C), [C]);
  const h = useConverterData();

  const getCurrentColor = () => RATE_TYPES.find((r) => r.key === h.selectedRate)?.color || C.textPrimary;
  const getRateLabel = () => RATE_TYPES.find((r) => r.key === h.selectedRate)?.label || '';
  const currentColor = getCurrentColor();

  const renderSpread = (spread, title, icon, iconColor, lunesColor) => {
    if (!spread) return null;
    return (
      <View style={[styles.spreadCard, title.includes('Lunes') && { marginTop: 8 }]}>
        <View style={styles.spreadHeader}>
          <View style={styles.spreadTitleRow}>
            <Ionicons name={icon} size={13} color={C.textSecondary} />
            <Text style={styles.spreadTitle}>{title}</Text>
          </View>
          <Text style={styles.spreadPercent}>{spread.diffPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.spreadBarBg}>
          <View style={[styles.spreadBarFill, { width: `${spread.barPercent}%` }]} />
        </View>
        <View style={styles.spreadStats}>
          <Text style={styles.spreadStat}>
            {title.includes('Lunes') ? 'BCV (Lunes): ' : 'BCV: '}
            <Text style={{ color: C.textPrimary, fontWeight: '600', fontFamily: F.monoSemiBold }}>
              Bs. {formatCurrency(title.includes('Lunes') ? h.rates.bcv_lunes : h.rates.bcv)}
            </Text>
          </Text>
          <Text style={styles.spreadStat}>
            Paralelo: <Text style={{ color: C.textPrimary, fontWeight: '600', fontFamily: F.monoSemiBold }}>Bs. {formatCurrency(h.rates.paralelo)}</Text>
          </Text>
          <Text style={styles.spreadStat}>
            Diferencia: <Text style={{ color: C.textPrimary, fontWeight: '600', fontFamily: F.monoSemiBold }}>Bs. {formatCurrency(spread.diff)}</Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} bounces={false}
            refreshControl={<RefreshControl refreshing={h.refreshing} onRefresh={() => h.loadRates(true)} tintColor={C.highlight} colors={[C.highlight]} progressBackgroundColor={C.secondary} />}>
            <View style={styles.header}>
              <View style={styles.headerRow}>
                <View style={[styles.logoContainer, { backgroundColor: C.highlight + '15' }]}>
                  <Ionicons name="swap-horizontal" size={18} color={C.highlight} />
                </View>
                <Text style={styles.headerTitle}>Conversor</Text>
                <View style={{ flex: 1 }} />
                <ThemeToggleMini />
              </View>
              {h.offlineMode && (
                <View style={styles.offlineBanner}>
                  <Ionicons name="cloud-offline-outline" size={12} color={C.onAccent} />
                  <Text style={styles.offlineBannerText}>
                    Sin conexión — Mostrando últimas tasas{h.offlineCachedAt ? ` (${new Date(h.offlineCachedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })})` : ''}
                  </Text>
                </View>
              )}
              {h.loadError && !h.offlineMode && (
                <View style={[styles.offlineBanner, { backgroundColor: C.dimmed }]}>
                  <Ionicons name="alert-circle-outline" size={12} color={C.onAccent} />
                  <Text style={styles.offlineBannerText}>{h.loadError}</Text>
                </View>
              )}
            </View>

            <View style={styles.converterCard}>
              {/* Mode Toggle */}
              <TouchableOpacity style={styles.modeToggle} onPress={() => { hapticSelection(); h.handleSwapMode(); }} activeOpacity={0.7}>
                <View style={[styles.modeSide, h.mode === 'usd-to-bs' && styles.modeSideActive]}>
                  <Ionicons name="logo-usd" size={16} color={h.mode === 'usd-to-bs' ? C.onAccent : C.textMuted} />
                  <Text style={[styles.modeText, h.mode === 'usd-to-bs' && { color: C.onAccent, fontWeight: '600' }]}>USD</Text>
                </View>
                <View style={styles.swapCircle}><Ionicons name="swap-horizontal" size={16} color={C.textMuted} /></View>
                <View style={[styles.modeSide, h.mode === 'bs-to-usd' && styles.modeSideActive]}>
                  <Text style={[styles.modeText, h.mode === 'bs-to-usd' && { color: C.onAccent, fontWeight: '600' }]}>Bs.</Text>
                  <Ionicons name="cash" size={16} color={h.mode === 'bs-to-usd' ? C.onAccent : C.textMuted} />
                </View>
              </TouchableOpacity>

              {/* Display */}
              <TouchableOpacity style={styles.displayContainer} activeOpacity={0.7} onPress={() => { if (h.rawAmount) { hapticSuccess(); h.handleCopy(formatCurrency(h.numericAmount), 'amount'); } }}>
                <Text style={styles.displayLabel}>{h.copiedType === 'amount' ? '¡Copiado!' : h.mode === 'usd-to-bs' ? 'Dólares (USD)' : 'Bolívares (Bs.)'}</Text>
                <Text style={[styles.displayValue, { color: h.copiedType === 'amount' ? C.success : currentColor }]}>{h.rawAmount ? h.displayAmount : '0,00'}</Text>
                {h.rawAmount.length > 0 && h.copiedType !== 'amount' && <Text style={styles.displaySubtext}>{h.mode === 'usd-to-bs' ? `× ${getRateLabel().split(' ')[0]} =` : `÷ ${getRateLabel().split(' ')[0]} =`}</Text>}
                {h.copiedType === 'amount' && (
                  <View style={[styles.copiedBadge, { backgroundColor: C.success + '15' }]}>
                    <Ionicons name="checkmark" size={12} color={C.success} />
                    <Text style={styles.copiedBadgeText}>Copiado al portapapeles</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Input */}
              <View style={[styles.inputContainer, h.isKeyboardVisible && styles.inputContainerFocused]}>
                <Ionicons name={h.mode === 'usd-to-bs' ? 'logo-usd' : 'cash'} size={16} color={C.textMuted} style={styles.inputIcon} />
                <TextInput ref={h.inputRef} style={styles.input} placeholder="0.00" placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad" value={h.rawAmount} onChangeText={h.handleChangeText}
                  returnKeyType="done" onSubmitEditing={h.handleConvert} />
                <TouchableOpacity onPress={() => { hapticLight(); h.handlePaste(); }} activeOpacity={0.6} style={styles.pasteBtn}>
                  <View style={[styles.pasteInner, h.pasteFeedback && { backgroundColor: C.textPrimary }]}>
                    <Ionicons name={h.pasteFeedback ? 'checkmark-circle' : 'clipboard'} size={13} color={h.pasteFeedback ? C.onAccent : C.textPrimary} />
                    <Text style={[styles.pasteText, { color: h.pasteFeedback ? C.onAccent : C.textPrimary }]}>{h.pasteFeedback ? '¡Pegado!' : 'Pegar'}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Quick amounts — pastillas como los chips del sitio */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
                {h.quickAmounts.map((val) => (
                  <TouchableOpacity key={val} style={[styles.quickChip, h.numericAmount === val && styles.quickChipActive]}
                    onPress={() => { hapticSelection(); h.handleQuickAmount(val); }} activeOpacity={0.7}>
                    <Text style={[styles.quickChipText, h.numericAmount === val && styles.quickChipTextActive]}>{val.toLocaleString('es-VE')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Convert button */}
              <TouchableOpacity style={[styles.convertButton, { backgroundColor: currentColor }]} onPress={() => { hapticMedium(); h.handleConvert(); }} activeOpacity={0.8}>
                <Ionicons name="calculator" size={18} color={C.onAccent} />
                <Text style={styles.convertButtonText}>Convertir</Text>
              </TouchableOpacity>

              {/* Validación inline (sin Alert nativo) */}
              {h.validationError && (
                <Text style={styles.validationError}>
                  {h.validationError}
                </Text>
              )}

              {/* Result — caja invertida (fondo ink/blanco, texto contrastado) */}
              {h.result && (
                <View style={styles.inlineResult}>
                  <Text style={styles.resultLabel}>Resultado</Text>
                  <View style={styles.resultContent}>
                    <TouchableOpacity style={styles.resultItem} activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrency(h.result.amount), 'result-source'); }}>
                      <Text style={styles.resultItemLabel}>{h.copiedType === 'result-source' ? '¡Copiado!' : (h.mode === 'usd-to-bs' ? 'USD' : 'Bs.')}</Text>
                      <Text style={styles.resultItemValue}>{formatCurrency(h.result.amount)}</Text>
                    </TouchableOpacity>
                    <View style={styles.resultArrow}><Ionicons name="arrow-forward" size={16} color={C.onAccent} /></View>
                    <TouchableOpacity style={styles.resultItem} activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrencySmart(h.result.converted), 'result-target'); }}>
                      <Text style={styles.resultItemLabel}>{h.copiedType === 'result-target' ? '¡Copiado!' : (h.mode === 'usd-to-bs' ? 'Bs.' : 'USD')}</Text>
                      <Text style={[styles.resultItemValue, h.copiedType === 'result-target' && { opacity: 0.7 }]}>{formatCurrencySmart(h.result.converted)}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrency(h.result.rate), 'rate'); }}>
                    <Text style={styles.resultMeta}>Tasa: {getRateLabel()} — <Text style={{ fontWeight: '600' }}>{h.copiedType === 'rate' ? '¡Copiado!' : `Bs. ${formatCurrency(h.result.rate)}`}</Text></Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Rate selector */}
            <Text style={styles.sectionLabel}>Tasa a usar</Text>
            <View style={styles.rateSelector}>
              {RATE_TYPES.map((rt) => {
                const isActive = h.selectedRate === rt.key;
                const rateVal = h.rates[rt.key];
                return (
                  <TouchableOpacity key={rt.key} style={[styles.rateOption, isActive && styles.rateOptionActive]}
                    activeOpacity={0.7} onPress={() => { hapticSelection(); h.setSelectedRate(rt.key); h.setResult(null); }}>
                    <View style={[styles.rateDot, { backgroundColor: isActive ? rt.color || C.textPrimary : C.cardBorder }]} />
                    <View style={styles.rateOptionText}>
                      <Text style={[styles.rateOptionLabel, isActive && { color: C.textPrimary, fontWeight: '600' }]}>{rt.label}</Text>
                      <Text style={styles.rateOptionValue}>{rateVal ? `Bs. ${formatCurrency(rateVal)}` : 'Cargando...'}</Text>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={18} color={rt.color || C.textPrimary} />}
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
                  <View style={styles.spreadTitleRow}>
                    <Ionicons name="flame" size={14} color={C.warning} />
                    <Text style={[styles.spreadTitle, { color: C.textPrimary, fontSize: 13, fontFamily: F.sansSemiBold }]}>Gasolina</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: C.textMuted, fontFamily: F.mono }}>$0,50 USD/L</Text>
                </View>
                <View style={[styles.inputContainer, { marginBottom: 10 }]}>
                  <Ionicons name="flame" size={16} color={C.warning} style={{ marginRight: 8 }} />
                  <TextInput style={[styles.input, { borderColor: 'transparent' }]} placeholder="Litros (ej: 3.4)" placeholderTextColor={C.textMuted}
                    keyboardType="decimal-pad" value={h.gasLitros} onChangeText={h.setGasLitros} />
                </View>
                {h.gasLitrosNum > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: C.textSecondary, fontFamily: F.sans }}>{h.gasLitros}L</Text>
                    <TouchableOpacity onPress={() => { hapticSuccess(); h.handleCopy((h.gasLitrosNum * 0.50 * h.rates.bcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'gasolina'); }} activeOpacity={0.7}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: h.copiedType === 'gasolina' ? C.success : C.warning, fontVariant: ['tabular-nums'], fontFamily: F.monoSemiBold }}>
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
