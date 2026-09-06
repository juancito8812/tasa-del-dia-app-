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
import { PAYPAL_FEES, calculateNet, calculateGross } from '../constants/paypalFees';
import { hapticLight } from '../utils/haptics';

const FEE_TYPES = Object.values(PAYPAL_FEES);

function PayPalCalculatorScreen() {
  const { colors: C } = useTheme();
  const { data } = useRatesData();

  const [mode, setMode] = useState('net'); // 'net' = ¿Cuánto recibo?, 'gross' = ¿Cuánto cobro?
  const [feeType, setFeeType] = useState('send_friends');
  const [amount, setAmount] = useState('');

  const parsedAmount = useMemo(() => {
    const normalized = amount.includes(',')
      ? amount.replace(/\./g, '').replace(',', '.')
      : amount.replace(',', '.');
    return parseFloat(normalized) || 0;
  }, [amount]);

  const result = useMemo(() => {
    if (parsedAmount <= 0) return null;
    if (mode === 'net') {
      return calculateNet(parsedAmount, feeType);
    }
    return calculateGross(parsedAmount, feeType);
  }, [parsedAmount, feeType, mode]);

  const equivalents = useMemo(() => {
    if (!result) return null;
    const usdAmount = result.gross ?? result.net;
    if (usdAmount <= 0) return null;

    const bcv = data.tasaBCV ? usdAmount * Number(data.tasaBCV) : null;
    const paralelo = data.tasaParalelo ? usdAmount * Number(data.tasaParalelo) : null;
    const binance = data.tasaBinanceP2P ? usdAmount * Number(data.tasaBinanceP2P) : null;
    const euro = data.tasaEuro ? usdAmount / Number(data.tasaEuro) : null;

    return { bcv, paralelo, binance, euro };
  }, [result, data]);

  const formatBs = useCallback((value) => {
    if (value == null) return 'N/A';
    return `Bs ${value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const formatUsd = useCallback((value) => {
    if (value == null) return 'N/A';
    return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const formatEur = useCallback((value) => {
    if (value == null) return 'N/A';
    return `€ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

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
    if (equivalents.euro != null) lines.push(`Euro: ${formatEur(equivalents.euro)}`);
    return lines.join('\n');
  }, [result, equivalents, feeType, parsedAmount, mode, formatBs, formatEur]);

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
    <ScrollView style={[styles.container, { backgroundColor: C.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Calculadora PayPal</Text>
        <Text style={[styles.headerSubtitle, { color: C.textSecondary }]}>Comisiones oficiales Venezuela</Text>
      </View>

      {/* Mode Toggle */}
      <View style={[styles.toggleContainer, { backgroundColor: C.card, borderColor: C.border }]}>
        <TouchableOpacity
          onPress={() => { hapticLight(); setMode('net'); }}
          style={[styles.toggleButton, mode === 'net' && { backgroundColor: C.highlight }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: mode === 'net' ? '#fff' : C.textPrimary }]}>
            ¿Cuánto recibo?
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { hapticLight(); setMode('gross'); }}
          style={[styles.toggleButton, mode === 'gross' && { backgroundColor: C.highlight }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.toggleText, { color: mode === 'gross' ? '#fff' : C.textPrimary }]}>
            ¿Cuánto cobro?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fee Type Selector */}
      <Text style={[styles.label, { color: C.textSecondary }]}>Tipo de transacción</Text>
      <View style={styles.chipRow}>
        {FEE_TYPES.map((fee) => (
          <TouchableOpacity
            key={fee.key}
            onPress={() => { hapticLight(); setFeeType(fee.key); }}
            style={[
              styles.chip,
              {
                backgroundColor: feeType === fee.key ? C.highlight : C.card,
                borderColor: feeType === fee.key ? C.highlight : C.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: feeType === fee.key ? '#fff' : C.textPrimary }]}>
              {fee.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount Input */}
      <Text style={[styles.label, { color: C.textSecondary }]}>
        {mode === 'net' ? 'Monto a enviar' : 'Monto neto a recibir'}
      </Text>
      <View style={[styles.inputContainer, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.inputPrefix, { color: C.textSecondary }]}>$</Text>
        <TextInput
          style={[styles.input, { color: C.textPrimary }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={C.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Result */}
      {result && parsedAmount > 0 && (
        <View style={[styles.resultCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={20} color={C.highlight} />
            <Text style={[styles.resultTitle, { color: C.textPrimary }]}>
              {mode === 'net' ? 'Monto neto' : 'Monto a cobrar'}
            </Text>
          </View>

          <Text style={[styles.resultAmount, { color: C.highlight }]}>
            {formatUsd(result.gross ?? result.net)}
          </Text>

          <View style={[styles.resultRow, { borderTopColor: C.border }]}>
            <Text style={[styles.resultLabel, { color: C.textSecondary }]}>Comisión PayPal</Text>
            <Text style={[styles.resultValue, { color: C.textPrimary }]}>{formatUsd(result.fee)}</Text>
          </View>

          <View style={[styles.resultRow, { borderTopColor: C.border }]}>
            <Text style={[styles.resultLabel, { color: C.textSecondary }]}>Tipo</Text>
            <Text style={[styles.resultValue, { color: C.textPrimary }]}>{result.breakdown ?? ''}</Text>
          </View>

          {/* Equivalents */}
          {equivalents && (
            <>
              <Text style={[styles.sectionTitle, { color: C.textSecondary, borderTopColor: C.border }]}>
                Equivalente en divisas
              </Text>

              {equivalents.bcv != null && (
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: C.textSecondary }]}>🏦 BCV</Text>
                  <Text style={[styles.resultValue, { color: C.textPrimary }]}>{formatBs(equivalents.bcv)}</Text>
                </View>
              )}

              {equivalents.paralelo != null && (
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: C.textSecondary }]}>💵 Paralelo</Text>
                  <Text style={[styles.resultValue, { color: C.textPrimary }]}>{formatBs(equivalents.paralelo)}</Text>
                </View>
              )}

              {equivalents.binance != null && (
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: C.textSecondary }]}>₿ Binance P2P</Text>
                  <Text style={[styles.resultValue, { color: C.textPrimary }]}>{formatBs(equivalents.binance)}</Text>
                </View>
              )}

              {equivalents.euro != null && (
                <View style={styles.resultRow}>
                  <Text style={[styles.resultLabel, { color: C.textSecondary }]}>🇪🇺 Euro</Text>
                  <Text style={[styles.resultValue, { color: C.textPrimary }]}>{formatEur(equivalents.euro)}</Text>
                </View>
              )}
            </>
          )}

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: C.border }]}>
            <TouchableOpacity onPress={handleCopy} style={[styles.actionButton, { backgroundColor: C.highlight + '20' }]} activeOpacity={0.7}>
              <Ionicons name="copy" size={16} color={C.highlight} />
              <Text style={[styles.actionText, { color: C.highlight }]}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={[styles.actionButton, { backgroundColor: C.highlight + '20' }]} activeOpacity={0.7}>
              <Ionicons name="share" size={16} color={C.highlight} />
              <Text style={[styles.actionText, { color: C.highlight }]}>Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: C.card, borderColor: C.border }]}>
        <Ionicons name="information-circle" size={16} color={C.textSecondary} />
        <Text style={[styles.infoText, { color: C.textSecondary }]}>
          Tarifas oficiales PayPal Venezuela (actualizado mayo 2026). Las tasas de cambio son las que muestra la app en tiempo real.
        </Text>
      </View>
    </ScrollView>
  );
}

export default PayPalCalculatorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 12,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});
