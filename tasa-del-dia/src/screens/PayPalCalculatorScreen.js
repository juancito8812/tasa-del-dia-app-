import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import useRatesData from '../hooks/useRatesData';
import { PAYPAL_FEES, calculateNet, calculateGross, calculateBsPurchase } from '../constants/paypalFees';
import { hapticLight } from '../utils/haptics';

/**
 * Normaliza un input numérico es-VE: "1.234,56" → 1234.56, "37,5" → 37.5.
 * La coma es separador decimal; los puntos antes de una coma son miles.
 * @param {string} value
 * @returns {number}
 */
function parseNumericInput(value) {
  if (!value) return 0;
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value.replace(',', '.');
  return parseFloat(normalized) || 0;
}

function PayPalCalculatorScreen() {
  const { colors: C } = useTheme();
  const { data } = useRatesData();

  const [mode, setMode] = useState('net'); // 'net' = ¿Cuánto recibo?, 'gross' = ¿Cuánto cobro?
  const [amount, setAmount] = useState('');
  const [bsAmount, setBsAmount] = useState(''); // Pagar compras en BS: monto
  const [bsRate, setBsRate] = useState(''); // Pagar compras en BS: tasa

  const styles = useMemo(() => createStyles(C), [C]);

  const parsedAmount = useMemo(() => parseNumericInput(amount), [amount]);

  const feeType = 'receive';

  const result = useMemo(() => {
    if (parsedAmount <= 0) return null;
    if (mode === 'net') {
      return calculateGross(parsedAmount, feeType);
    }
    return calculateNet(parsedAmount, feeType);
  }, [parsedAmount, feeType, mode]);

  const equivalents = useMemo(() => {
    if (!result) return null;
    const usdAmount = result.gross ?? result.net;
    if (usdAmount <= 0) return null;

    const bcv = data.tasaBCV ? usdAmount * Number(data.tasaBCV) : null;
    const paralelo = data.tasaParalelo ? usdAmount * Number(data.tasaParalelo) : null;
    const binance = data.tasaBinanceP2P ? usdAmount * Number(data.tasaBinanceP2P) : null;
    const euro = data.tasaEuro ? usdAmount * Number(data.tasaEuro) : null;

    return { bcv, paralelo, binance, euro };
  }, [result, data]);

  // --- Pagar compras en BS ---
  const parsedBsAmount = useMemo(() => parseNumericInput(bsAmount), [bsAmount]);
  const parsedBsRate = useMemo(() => parseNumericInput(bsRate), [bsRate]);

  const bsPurchase = useMemo(
    () => calculateBsPurchase(parsedBsAmount, parsedBsRate),
    [parsedBsAmount, parsedBsRate]
  );

  const rateChips = useMemo(() => {
    /** @type {Array<{ label: string, rate: number, icon: React.ComponentProps<typeof Ionicons>['name'] }>} */
    const chips = [];
    if (data.tasaBCV) chips.push({ label: 'Tasa BCV', rate: Number(data.tasaBCV), icon: 'business' });
    if (data.tasaParalelo) chips.push({ label: 'Tasa Paralelo', rate: Number(data.tasaParalelo), icon: 'cash' });
    if (data.tasaBinanceP2P) chips.push({ label: 'Tasa Binance', rate: Number(data.tasaBinanceP2P), icon: 'logo-bitcoin' });
    return chips;
  }, [data]);

  const formatBs = useCallback((value) => {
    if (value == null) return 'N/A';
    return `Bs ${value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const formatUsd = useCallback((value) => {
    if (value == null) return 'N/A';
    return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const handleCopyBsPurchase = useCallback(async () => {
    hapticLight();
    if (!bsPurchase) return;
    const lines = [
      'Pagar compras en BS',
      `Monto a pagar: ${formatBs(parsedBsAmount)}`,
      `Tasa: ${parsedBsRate.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs/USD`,
      '',
      `Transferir en PayPal: ${formatUsd(bsPurchase.pagoExactoUsd)}`,
      `Comisión incluida: ${formatUsd(bsPurchase.pagoExactoUsd - bsPurchase.netoUsd)}`,
      `Recomendado: ${formatUsd(bsPurchase.pagoRecomendadoUsd)}`,
      `Equivale a: ${formatBs(bsPurchase.equivalenteBs)}`,
      `Vuelto: ${formatBs(bsPurchase.vueltoBs)}`,
    ];
    await Clipboard.setStringAsync(lines.join('\n'));
    Alert.alert('Copiado', 'Resultado copiado al portapapeles');
  }, [bsPurchase, parsedBsAmount, parsedBsRate, formatBs, formatUsd]);

  const buildResultText = useCallback(() => {
    const usdAmount = result.gross ?? result.net;
    const lines = [
      `PayPal (${PAYPAL_FEES[feeType].label})`,
      `Monto: $${parsedAmount.toFixed(2)}`,
      `Comisión: $${result.fee.toFixed(2)}`,
      `${mode === 'net' ? 'Recibo' : 'Cobro'}: $${usdAmount.toFixed(2)}`,
      '',
    ];
    if (equivalents.bcv != null) lines.push(`BCV: ${formatBs(equivalents.bcv)}`);
    if (equivalents.paralelo != null) lines.push(`Paralelo: ${formatBs(equivalents.paralelo)}`);
    if (equivalents.binance != null) lines.push(`Binance: ${formatBs(equivalents.binance)}`);
    if (equivalents.euro != null) lines.push(`Euro: ${formatBs(equivalents.euro)}`);
    return lines.join('\n');
  }, [result, equivalents, feeType, parsedAmount, mode, formatBs]);

  const handleCopy = useCallback(async () => {
    hapticLight();
    if (!result || !equivalents) return;
    await Clipboard.setStringAsync(buildResultText());
    Alert.alert('Copiado', 'Resultado copiado al portapapeles');
  }, [result, equivalents, buildResultText]);

  const handleShare = useCallback(async () => {
    hapticLight();
    if (!result || !equivalents) return;
    await Share.share({ message: buildResultText() });
  }, [result, equivalents, buildResultText]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="logo-paypal" size={18} color={C.highlight} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Calculadora PayPal</Text>
            <Text style={styles.headerSubtitle}>Comisiones oficiales Venezuela</Text>
          </View>
        </View>
      </View>

      {/* Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => { hapticLight(); setMode('net'); }}
          style={[styles.toggleButton, mode === 'net' && styles.toggleActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: mode === 'net' ? '#fff' : C.textSecondary }]}>
            Para recibir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { hapticLight(); setMode('gross'); }}
          style={[styles.toggleButton, mode === 'gross' && styles.toggleActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: mode === 'gross' ? '#fff' : C.textSecondary }]}>
            Para enviar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <Text style={styles.label}>
        {mode === 'net' ? 'Monto a recibir' : 'Monto a enviar'}
      </Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputPrefix}>$</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={C.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Result */}
      {result && parsedAmount > 0 && (
        <View style={styles.resultCard}>
          {/* Glow bar */}
          <View style={[styles.glowBar, { backgroundColor: C.highlight }]} />

          <View style={styles.resultHeader}>
            <View style={[styles.resultIcon, { backgroundColor: C.highlight + '20' }]}>
              <Ionicons name="checkmark-circle" size={18} color={C.highlight} />
            </View>
            <Text style={styles.resultTitle}>
              {mode === 'net' ? 'Monto a enviar' : 'Monto neto'}
            </Text>
          </View>

          <Text style={[styles.resultAmount, { color: C.highlight }]}>
            {formatUsd(result.gross ?? result.net)}
          </Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Comisión PayPal</Text>
            <Text style={styles.resultValue}>{formatUsd(result.fee)}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Tipo</Text>
            <Text style={styles.resultValue}>{result.breakdown ?? ''}</Text>
          </View>

          {/* Equivalents */}
          {equivalents && (
            <>
              <Text style={styles.sectionTitle}>EQUIVALENTE EN DIVISAS</Text>

              {equivalents.bcv != null && (
                <View style={styles.resultRow}>
                  <View style={styles.resultLabelRow}>
                    <Ionicons name="business" size={14} color={C.textSecondary} />
                    <Text style={styles.resultLabel}>BCV</Text>
                  </View>
                  <Text style={styles.resultValue}>{formatBs(equivalents.bcv)}</Text>
                </View>
              )}

              {equivalents.paralelo != null && (
                <View style={styles.resultRow}>
                  <View style={styles.resultLabelRow}>
                    <Ionicons name="cash" size={14} color={C.textSecondary} />
                    <Text style={styles.resultLabel}>Paralelo</Text>
                  </View>
                  <Text style={styles.resultValue}>{formatBs(equivalents.paralelo)}</Text>
                </View>
              )}

              {equivalents.binance != null && (
                <View style={styles.resultRow}>
                  <View style={styles.resultLabelRow}>
                    <Ionicons name="logo-bitcoin" size={14} color={C.textSecondary} />
                    <Text style={styles.resultLabel}>Binance P2P</Text>
                  </View>
                  <Text style={styles.resultValue}>{formatBs(equivalents.binance)}</Text>
                </View>
              )}

              {equivalents.euro != null && (
                <View style={styles.resultRow}>
                  <View style={styles.resultLabelRow}>
                    <Ionicons name="globe" size={14} color={C.textSecondary} />
                    <Text style={styles.resultLabel}>Euro</Text>
                  </View>
                  <Text style={styles.resultValue}>{formatBs(equivalents.euro)}</Text>
                </View>
              )}
            </>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCopy} style={styles.actionButton} activeOpacity={0.7}>
              <Ionicons name="copy" size={16} color={C.highlight} />
              <Text style={styles.actionText}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton} activeOpacity={0.7}>
              <Ionicons name="share" size={16} color={C.highlight} />
              <Text style={styles.actionText}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pagar compras en BS */}
      <View style={styles.bsSectionCard}>
        <View style={styles.bsSectionHeader}>
          <View style={styles.bsSectionIcon}>
            <Ionicons name="card" size={16} color={C.highlight} />
          </View>
          <View>
            <Text style={styles.bsSectionTitle}>Pagar compras en BS</Text>
            <Text style={styles.bsSectionSubtitle}>Calcula el envío PayPal que cubre tu compra</Text>
          </View>
        </View>

        <Text style={styles.label}>Monto a pagar (BS)</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputPrefix}>Bs</Text>
          <TextInput
            style={styles.input}
            value={bsAmount}
            onChangeText={setBsAmount}
            placeholder="0,00"
            placeholderTextColor={C.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.label}>Tasa de cambio (BS/USD)</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputPrefix}>Bs</Text>
          <TextInput
            style={styles.input}
            value={bsRate}
            onChangeText={setBsRate}
            placeholder="0,00"
            placeholderTextColor={C.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        {rateChips.length > 0 && (
          <View style={styles.bsChipsRow}>
            {rateChips.map((chip) => (
              <TouchableOpacity
                key={chip.label}
                style={styles.bsChip}
                activeOpacity={0.7}
                onPress={() => {
                  hapticLight();
                  setBsRate(String(Math.round(chip.rate * 100) / 100));
                }}
              >
                <Ionicons name={chip.icon} size={12} color={C.textSecondary} />
                <Text style={styles.bsChipLabel}>{chip.label}</Text>
                <Text style={styles.bsChipValue}>
                  {chip.rate.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {bsPurchase && (
          <View style={styles.bsResultBlock}>
            <View style={styles.bsResultRow}>
              <Text style={styles.bsResultLabel}>Equivalente de la compra</Text>
              <Text style={styles.bsResultValue}>{formatUsd(bsPurchase.netoUsd)}</Text>
            </View>

            <View style={styles.bsResultMain}>
              <Text style={styles.bsResultMainLabel}>Monto a transferir en PayPal (USD)</Text>
              <Text style={styles.bsResultMainValue}>{formatUsd(bsPurchase.pagoExactoUsd)}</Text>
            </View>

            <View style={styles.bsResultRow}>
              <Text style={styles.bsResultLabel}>Comisión PayPal incluida</Text>
              <Text style={styles.bsResultValue}>
                {formatUsd(bsPurchase.pagoExactoUsd - bsPurchase.netoUsd)}
              </Text>
            </View>
          </View>
        )}

        {bsPurchase && (
          <View style={styles.bsRecoCard}>
            <View style={styles.bsRecoHeader}>
              <Ionicons name="bulb" size={14} color={C.highlight} />
              <Text style={styles.bsRecoTitle}>Recomendación para enviar completo</Text>
            </View>
            <Text style={styles.bsRecoAmount}>{formatUsd(bsPurchase.pagoRecomendadoUsd)}</Text>
            <View style={styles.bsRecoRow}>
              <Text style={styles.bsRecoLabel}>Equivale a</Text>
              <Text style={styles.bsRecoValue}>{formatBs(bsPurchase.equivalenteBs)}</Text>
            </View>
            <View style={styles.bsRecoRow}>
              <Text style={styles.bsRecoLabel}>Vuelto / saldo a favor</Text>
              <Text style={styles.bsRecoValue}>{formatBs(bsPurchase.vueltoBs)}</Text>
            </View>
            <TouchableOpacity style={styles.bsCopyButton} activeOpacity={0.7} onPress={handleCopyBsPurchase}>
              <Ionicons name="copy" size={14} color={C.highlight} />
              <Text style={styles.bsCopyText}>Copiar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={16} color={C.textMuted} />
        <Text style={styles.infoText}>
          Tarifas oficiales PayPal Venezuela: 5.4% + $0.30 USD. Las tasas de cambio son las que muestra la app en tiempo real.
        </Text>
      </View>
    </ScrollView>
  );
}

export default PayPalCalculatorScreen;

const createStyles = (C) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.primary,
  },
  content: {
    padding: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.highlight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: C.inputBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: C.highlight,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: C.textMuted,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textMuted,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    paddingVertical: 14,
  },
  resultCard: {
    backgroundColor: C.glassCard,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  glowBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    opacity: 0.5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  resultIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textSecondary,
  },
  resultLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: C.textMuted,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: C.highlight + '18',
    borderWidth: 1,
    borderColor: C.highlight + '30',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.highlight,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.glassCard,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  // --- Pagar compras en BS ---
  bsSectionCard: {
    backgroundColor: C.glassCard,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  bsSectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.highlight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  bsSectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 1,
  },
  bsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.highlight + '30',
    backgroundColor: C.highlight + '12',
  },
  bsChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
  },
  bsChipValue: {
    fontSize: 11,
    fontWeight: '800',
    color: C.highlight,
    fontVariant: ['tabular-nums'],
  },
  bsResultBlock: {
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    paddingTop: 4,
    marginTop: 2,
  },
  bsResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  bsResultLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textSecondary,
  },
  bsResultValue: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  bsResultMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: C.highlight + '15',
    borderWidth: 1,
    borderColor: C.highlight + '35',
  },
  bsResultMainLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    flex: 1,
    lineHeight: 17,
    marginRight: 8,
  },
  bsResultMainValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.highlight,
    fontVariant: ['tabular-nums'],
  },
  bsRecoCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.inputBg,
  },
  bsRecoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  bsRecoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSecondary,
    flex: 1,
  },
  bsRecoAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: C.highlight,
    marginBottom: 8,
    fontVariant: ['tabular-nums'],
  },
  bsRecoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  bsRecoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textSecondary,
  },
  bsRecoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  bsCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.highlight + '18',
    borderWidth: 1,
    borderColor: C.highlight + '30',
  },
  bsCopyText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.highlight,
  },
});
