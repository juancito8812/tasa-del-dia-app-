import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatBs, formatUsd } from '../utils/paypalCalculator';
import { hapticLight } from '../utils/haptics';
import PayPalAmountInput from './PayPalAmountInput';

function PayPalBsPurchaseCard({
  styles,
  C,
  bsAmount,
  bsRate,
  onChangeBsAmount,
  onChangeBsRate,
  rateChips,
  onSelectRate,
  bsPurchase,
  onCopy,
}) {
  return (
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

      <PayPalAmountInput
        styles={styles}
        C={C}
        label="Monto a pagar (BS)"
        prefix="Bs"
        value={bsAmount}
        onChangeText={onChangeBsAmount}
        placeholder="0,00"
      />

      <PayPalAmountInput
        styles={styles}
        C={C}
        label="Tasa de cambio (BS/USD)"
        prefix="Bs"
        value={bsRate}
        onChangeText={onChangeBsRate}
        placeholder="0,00"
      />

      {rateChips.length > 0 && (
        <View style={styles.bsChipsRow}>
          {rateChips.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              style={styles.bsChip}
              activeOpacity={0.7}
              onPress={() => {
                hapticLight();
                onSelectRate(chip.rate);
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
            <Text style={styles.bsRecoLabel}>
              {bsPurchase.vueltoBs < 0 ? 'Faltante por cubrir' : 'Vuelto / saldo a favor'}
            </Text>
            <Text style={styles.bsRecoValue}>{formatBs(Math.abs(bsPurchase.vueltoBs))}</Text>
          </View>
          <TouchableOpacity style={styles.bsCopyButton} activeOpacity={0.7} onPress={onCopy}>
            <Ionicons name="copy" size={14} color={C.highlight} />
            <Text style={styles.bsCopyText}>Copiar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default PayPalBsPurchaseCard;
