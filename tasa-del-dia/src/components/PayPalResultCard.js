import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatBs, formatUsd } from '../utils/paypalCalculator';

function PayPalResultCard({ styles, C, mode, result, equivalents, parsedAmount, onCopy, onShare }) {
  if (!(result && parsedAmount > 0)) return null;

  return (
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
        <TouchableOpacity onPress={onCopy} style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name="copy" size={16} color={C.highlight} />
          <Text style={styles.actionText}>Copiar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={styles.actionButton} activeOpacity={0.7}>
          <Ionicons name="share" size={16} color={C.highlight} />
          <Text style={styles.actionText}>Compartir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default PayPalResultCard;
