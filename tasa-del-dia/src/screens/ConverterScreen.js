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

const TAB_BAR_HEIGHT = 60;

function createStyles(C) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 12, paddingBottom: 40 },

    // Header
    header: { marginBottom: 10 },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingBottom: 8, borderBottomWidth: 1, borderStyle: 'dashed', borderBottomColor: C.cardBorder,
    },
    headerPrompt: { fontSize: 18, fontWeight: '700', color: C.dimmed, fontFamily: 'monospace' },
    headerTitle: {
      fontSize: 16, fontWeight: '800', color: C.textPrimary,
      letterSpacing: 1, fontFamily: 'monospace', flex: 1,
    },

    // Banner offline/error
    offlineBanner: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.textPrimary,
      paddingHorizontal: 10, paddingVertical: 6, gap: 6, marginTop: 8,
    },
    offlineBannerText: { color: C.onAccent, fontSize: 11, flex: 1, fontFamily: 'monospace' },

    // Tarjeta conversor (plana, cuadrada)
    converterCard: {
      borderWidth: 1, borderColor: C.cardBorder, padding: 14, marginBottom: 14,
    },

    // Mode toggle [USD] ⇄ [BS.]
    modeToggle: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      marginBottom: 12,
    },
    modeSide: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: C.cardBorder,
    },
    modeSideActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    modeText: {
      fontSize: 13, fontWeight: '700', color: C.textMuted, fontFamily: 'monospace',
    },
    modeTextActive: { color: C.onAccent },
    swapIcon: { fontSize: 14, color: C.dimmed, fontFamily: 'monospace', fontWeight: '700' },

    // Display invertido (monto)
    displayContainer: {
      backgroundColor: C.textPrimary, padding: 14, marginBottom: 10,
    },
    displayLabel: {
      fontSize: 10, fontWeight: '700', color: C.onAccent, textTransform: 'uppercase',
      letterSpacing: 1.5, marginBottom: 2, fontFamily: 'monospace', opacity: 0.7,
    },
    displayValue: {
      fontSize: 40, fontWeight: '800', letterSpacing: 0, fontVariant: ['tabular-nums'],
      color: C.onAccent, fontFamily: 'monospace',
    },
    displayCursor: { opacity: 0.35 },
    displaySubtext: {
      fontSize: 11, color: C.onAccent, marginTop: 2, letterSpacing: 0.5,
      fontFamily: 'monospace', opacity: 0.6,
    },

    // Input
    inputContainer: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg,
      borderWidth: 1, borderColor: C.inputBorder, paddingHorizontal: 12, marginBottom: 10,
    },
    inputContainerFocused: { borderColor: C.textPrimary, borderWidth: 1.5 },
    inputIcon: { marginRight: 8 },
    input: {
      flex: 1, paddingVertical: 11, fontSize: 17, fontWeight: '600', color: C.textPrimary,
      textAlign: 'left', fontVariant: ['tabular-nums'], fontFamily: 'monospace',
    },
    pasteBtn: { paddingLeft: 8, paddingVertical: 4 },
    pasteInner: { paddingHorizontal: 8, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: C.cardBorder },
    pasteText: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },

    // Quick amounts [100] [500]
    quickRow: { marginBottom: 12 },
    quickContent: { gap: 6, paddingRight: 4 },
    quickChip: {
      paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: C.cardBorder,
      flexDirection: 'row',
    },
    quickChipActive: { backgroundColor: C.textPrimary, borderColor: C.textPrimary },
    quickChipText: {
      fontSize: 12, fontWeight: '700', color: C.textSecondary,
      fontVariant: ['tabular-nums'], fontFamily: 'monospace',
    },
    quickChipTextActive: { color: C.onAccent },

    // Botón convertir "> CONVERTIR_"
    convertButton: {
      alignItems: 'center', justifyContent: 'center', paddingVertical: 13,
      backgroundColor: C.textPrimary,
    },
    convertButtonText: {
      fontSize: 15, fontWeight: '800', color: C.onAccent, letterSpacing: 3, fontFamily: 'monospace',
    },
    validationError: {
      fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 8,
      color: C.textPrimary, fontFamily: 'monospace', letterSpacing: 0.5,
    },

    // Resultado
    inlineResult: { marginTop: 12, borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: C.cardBorder, paddingTop: 10 },
    resultLabel: {
      fontSize: 10, fontWeight: '700', color: C.dimmed, letterSpacing: 1.5,
      marginBottom: 8, fontFamily: 'monospace',
    },
    resultContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
    resultItem: { alignItems: 'center', flex: 1 },
    resultItemLabel: {
      fontSize: 9, fontWeight: '600', color: C.dimmed, marginBottom: 3,
      textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'monospace',
    },
    resultItemValue: {
      fontSize: 21, fontWeight: '800', color: C.textPrimary,
      fontVariant: ['tabular-nums'], fontFamily: 'monospace',
    },
    resultArrow: { justifyContent: 'center', alignItems: 'center' },
    resultMeta: {
      fontSize: 10, color: C.dimmed, textAlign: 'center', letterSpacing: 0.3, fontFamily: 'monospace',
    },

    // Selector de tasa estilo radio
    sectionLabel: {
      fontSize: 10, fontWeight: '700', color: C.dimmed, textTransform: 'uppercase',
      letterSpacing: 1.5, marginBottom: 6, fontFamily: 'monospace',
    },
    rateSelector: { marginBottom: 14 },
    rateOption: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 10,
      borderBottomWidth: 1, gap: 8,
    },
    radioOuter: {
      width: 14, height: 14, borderRadius: 7, borderWidth: 1.5,
      justifyContent: 'center', alignItems: 'center',
    },
    radioInner: { width: 6, height: 6, borderRadius: 3 },
    rateTag: {
      fontSize: 11, fontWeight: '800', letterSpacing: 0.5,
      fontFamily: 'monospace', width: 46,
    },
    rateOptionText: { flex: 1 },
    rateOptionLabel: {
      fontSize: 12, color: C.textSecondary, letterSpacing: 0.3, fontFamily: 'monospace',
    },
    rateOptionValue: {
      fontSize: 15, fontWeight: '800', color: C.textPrimary,
      fontVariant: ['tabular-nums'], fontFamily: 'monospace',
    },

    // Spread / gasolina (cajas punteadas)
    spreadCard: { borderWidth: 1, borderStyle: 'dashed', borderColor: C.cardBorder, padding: 12, marginBottom: 10 },
    spreadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    spreadTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    spreadTitle: {
      fontSize: 10, fontWeight: '700', color: C.dimmed, letterSpacing: 1, fontFamily: 'monospace',
    },
    spreadPercent: {
      fontSize: 16, fontWeight: '800', color: C.textPrimary, fontFamily: 'monospace',
    },
    spreadBarBg: { height: 5, backgroundColor: C.barTrack, overflow: 'hidden', marginBottom: 8 },
    spreadBarFill: { height: '100%', backgroundColor: C.textPrimary },
    spreadStats: { gap: 3 },
    spreadStat: {
      fontSize: 11, color: C.dimmed, letterSpacing: 0.2, fontFamily: 'monospace',
    },
    statValue: { color: C.textPrimary, fontWeight: '700' },
  });
}

export default function ConverterScreen() {
  const { colors: C } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const RATE_TYPES = useMemo(() => getRateTypes(C), [C]);
  const h = useConverterData();

  const getRateTag = () => {
    const map = { bcv: '[BCV]', paralelo: '[PAR]', binance_p2p: '[BNC]', euro: '[EUR]', bcv_lunes: '[LUN]' };
    return map[h.selectedRate] || '[···]';
  };

  const renderSpread = (spread, title, icon) => {
    if (!spread) return null;
    return (
      <View style={styles.spreadCard}>
        <View style={styles.spreadHeader}>
          <View style={styles.spreadTitleRow}>
            <Ionicons name={icon} size={12} color={C.dimmed} />
            <Text style={styles.spreadTitle}>{title.toUpperCase()}</Text>
          </View>
          <Text style={styles.spreadPercent}>+{spread.diffPercent.toFixed(1)}%</Text>
        </View>
        <View style={styles.spreadBarBg}>
          <View style={[styles.spreadBarFill, { width: `${spread.barPercent}%` }]} />
        </View>
        <View style={styles.spreadStats}>
          <Text style={styles.spreadStat}>
            {title.includes('Lunes') ? 'BCV (LUN): ' : 'BCV: '}
            <Text style={styles.statValue}>
              Bs. {formatCurrency(title.includes('Lunes') ? h.rates.bcv_lunes : h.rates.bcv)}
            </Text>
          </Text>
          <Text style={styles.spreadStat}>
            PARALELO: <Text style={styles.statValue}>Bs. {formatCurrency(h.rates.paralelo)}</Text>
          </Text>
          <Text style={styles.spreadStat}>
            DIFERENCIA: <Text style={styles.statValue}>Bs. {formatCurrency(spread.diff)}</Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} bounces={false}
        refreshControl={<RefreshControl refreshing={h.refreshing} onRefresh={() => h.loadRates(true)} tintColor={C.textPrimary} colors={[C.textPrimary]} progressBackgroundColor={C.secondary} />}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerPrompt}>{'>'}</Text>
            <Text style={styles.headerTitle}>CONVERSOR</Text>
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
              <Ionicons name="logo-usd" size={14} color={h.mode === 'usd-to-bs' ? C.onAccent : C.textMuted} />
              <Text style={[styles.modeText, h.mode === 'usd-to-bs' && styles.modeTextActive]}>USD</Text>
            </View>
            <Text style={styles.swapIcon}>⇄</Text>
            <View style={[styles.modeSide, h.mode === 'bs-to-usd' && styles.modeSideActive]}>
              <Text style={[styles.modeText, h.mode === 'bs-to-usd' && styles.modeTextActive]}>BS.</Text>
              <Ionicons name="cash" size={14} color={h.mode === 'bs-to-usd' ? C.onAccent : C.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Display invertido */}
          <TouchableOpacity style={styles.displayContainer} activeOpacity={0.7} onPress={() => { if (h.rawAmount) { hapticSuccess(); h.handleCopy(formatCurrency(h.numericAmount), 'amount'); } }}>
            <Text style={styles.displayLabel}>{h.copiedType === 'amount' ? '> ¡COPIADO!' : h.mode === 'usd-to-bs' ? 'MONTO USD' : 'MONTO BS.'}</Text>
            <Text style={styles.displayValue}>
              {h.rawAmount ? h.displayAmount : '0,00'}
              <Text style={styles.displayCursor}>▏</Text>
            </Text>
            {h.rawAmount.length > 0 && h.copiedType !== 'amount' && <Text style={styles.displaySubtext}>{h.mode === 'usd-to-bs' ? `× ${getRateTag()} =` : `÷ ${getRateTag()} =`}</Text>}
          </TouchableOpacity>

          {/* Input */}
          <View style={[styles.inputContainer, h.isKeyboardVisible && styles.inputContainerFocused]}>
            <Ionicons name={h.mode === 'usd-to-bs' ? 'logo-usd' : 'cash'} size={15} color={C.dimmed} style={styles.inputIcon} />
            <TextInput ref={h.inputRef} style={styles.input} placeholder="0.00" placeholderTextColor={C.dimmed}
              keyboardType="decimal-pad" value={h.rawAmount} onChangeText={h.handleChangeText}
              returnKeyType="done" onSubmitEditing={h.handleConvert} />
            <TouchableOpacity onPress={() => { hapticLight(); h.handlePaste(); }} activeOpacity={0.6} style={styles.pasteBtn}>
              <View style={[styles.pasteInner, h.pasteFeedback && { backgroundColor: C.textPrimary }]}>
                <Ionicons name={h.pasteFeedback ? 'checkmark-circle' : 'clipboard'} size={12} color={h.pasteFeedback ? C.onAccent : C.textSecondary} />
                <Text style={[styles.pasteText, { color: h.pasteFeedback ? C.onAccent : C.textSecondary }]}>{h.pasteFeedback ? '¡PEGADO!' : 'PEGAR'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick amounts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
            {h.quickAmounts.map((val) => (
              <TouchableOpacity key={val} style={[styles.quickChip, h.numericAmount === val && styles.quickChipActive]}
                onPress={() => { hapticSelection(); h.handleQuickAmount(val); }} activeOpacity={0.7}>
                <Text style={styles.quickChipText}>[</Text>
                <Text style={[styles.quickChipText, h.numericAmount === val && styles.quickChipTextActive]}>{val.toLocaleString('es-VE')}</Text>
                <Text style={styles.quickChipText}>]</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Convert button */}
          <TouchableOpacity style={styles.convertButton} onPress={() => { hapticMedium(); h.handleConvert(); }} activeOpacity={0.8}>
            <Text style={styles.convertButtonText}>{'> CONVERTIR_'}</Text>
          </TouchableOpacity>

          {/* Validación inline (sin Alert nativo) */}
          {h.validationError && (
            <Text style={styles.validationError}>
              ✗ {h.validationError}
            </Text>
          )}

          {/* Result */}
          {h.result && (
            <View style={styles.inlineResult}>
              <Text style={styles.resultLabel}>{'> RESULTADO'}</Text>
              <View style={styles.resultContent}>
                <TouchableOpacity style={styles.resultItem} activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrency(h.result.amount), 'result-source'); }}>
                  <Text style={styles.resultItemLabel}>{h.copiedType === 'result-source' ? '¡Copiado!' : (h.mode === 'usd-to-bs' ? 'USD' : 'Bs.')}</Text>
                  <Text style={styles.resultItemValue}>{formatCurrency(h.result.amount)}</Text>
                </TouchableOpacity>
                <View style={styles.resultArrow}><Ionicons name="arrow-forward" size={16} color={C.dimmed} /></View>
                <TouchableOpacity style={styles.resultItem} activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrencySmart(h.result.converted), 'result-target'); }}>
                  <Text style={styles.resultItemLabel}>{h.copiedType === 'result-target' ? '¡Copiado!' : (h.mode === 'usd-to-bs' ? 'Bs.' : 'USD')}</Text>
                  <Text style={styles.resultItemValue}>{formatCurrencySmart(h.result.converted)}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { hapticSuccess(); h.handleCopy(formatCurrency(h.result.rate), 'rate'); }}>
                <Text style={styles.resultMeta}>TASA: {getRateTag()} — <Text style={{ fontWeight: '700', color: C.textPrimary }}>{h.copiedType === 'rate' ? '¡Copiado!' : `Bs. ${formatCurrency(h.result.rate)}`}</Text></Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Rate selector estilo radio */}
        <Text style={styles.sectionLabel}>Tasa a usar:</Text>
        <View style={styles.rateSelector}>
          {RATE_TYPES.map((rt, idx) => {
            const isActive = h.selectedRate === rt.key;
            const rateVal = h.rates[rt.key];
            const tagMap = { bcv: 'BCV', paralelo: 'PAR', binance_p2p: 'BNC', euro: 'EUR', bcv_lunes: 'LUN' };
            return (
              <TouchableOpacity key={rt.key}
                style={[styles.rateOption, idx === RATE_TYPES.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: C.cardBorder }]}
                activeOpacity={0.7} onPress={() => { hapticSelection(); h.setSelectedRate(rt.key); h.setResult(null); }}>
                <View style={[styles.radioOuter, { borderColor: isActive ? C.textPrimary : C.dimmed }]}>
                  {isActive && <View style={[styles.radioInner, { backgroundColor: C.textPrimary }]} />}
                </View>
                <Text style={[styles.rateTag, { color: isActive ? C.textPrimary : C.dimmed }]}>[{tagMap[rt.key]}]</Text>
                <View style={styles.rateOptionText}>
                  <Text style={[styles.rateOptionLabel, isActive && { color: C.textPrimary, fontWeight: '700' }]}>{rt.label}</Text>
                </View>
                <Text style={styles.rateOptionValue}>{rateVal ? formatCurrency(rateVal) : '—'}</Text>
                {isActive && <Ionicons name="checkmark" size={16} color={C.textPrimary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Spreads */}
        {!h.loading && renderSpread(h.spreadBcv, 'Brecha BCV vs Paralelo', 'git-compare')}
        {!h.loading && renderSpread(h.spreadLunes, 'Brecha BCV (Lunes) vs Paralelo', 'calendar')}

        {/* Gas calculator */}
        {h.rates.bcv !== null && (
          <View style={[styles.spreadCard, { marginTop: 2 }]}>
            <View style={styles.spreadHeader}>
              <View style={styles.spreadTitleRow}>
                <Ionicons name="flame" size={12} color={C.dimmed} />
                <Text style={styles.spreadTitle}>GASOLINA // $0,50 USD/L</Text>
              </View>
            </View>
            <View style={[styles.inputContainer, { marginBottom: 8 }]}>
              <Ionicons name="flame" size={14} color={C.dimmed} style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholder="Litros (ej: 3.4)" placeholderTextColor={C.dimmed}
                keyboardType="decimal-pad" value={h.gasLitros} onChangeText={h.setGasLitros} />
            </View>
            {h.gasLitrosNum > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: C.dimmed, fontFamily: 'monospace' }}>{h.gasLitros}L</Text>
                <TouchableOpacity onPress={() => { hapticSuccess(); h.handleCopy((h.gasLitrosNum * 0.50 * h.rates.bcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'gasolina'); }} activeOpacity={0.7}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: C.textPrimary, fontVariant: ['tabular-nums'], fontFamily: 'monospace' }}>
                    {h.copiedType === 'gasolina' ? '> ¡COPIADO!' : `> BS. ${(h.gasLitrosNum * 0.50 * h.rates.bcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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