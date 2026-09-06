import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDocument } from '../constants/documentTypes';
import { formatBankDisplay } from '../constants/banks';
import { formatAccountText, formatSectionText, hasPagoMovil, hasTransferencia, hasDigital } from '../services/bankData';
import { hapticLight } from '../utils/haptics';

function BankAccountCard({ account, onEdit, onDelete, colors }) {
  const handleCopyAll = useCallback(async () => {
    hapticLight();
    const text = formatAccountText(account);
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', 'Todos los datos se copiaron al portapapeles');
  }, [account]);

  const handleShareAll = useCallback(async () => {
    hapticLight();
    const text = formatAccountText(account);
    await Share.share({ message: text });
  }, [account]);

  const handleCopySection = useCallback(async (section) => {
    hapticLight();
    const text = formatSectionText(account, section);
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', 'Datos de la sección copiados');
  }, [account]);

  const handleEdit = useCallback(() => {
    hapticLight();
    onEdit?.(account);
  }, [account, onEdit]);

  const handleDelete = useCallback(() => {
    hapticLight();
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro de que quieres eliminar esta cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete?.(account.id) },
      ]
    );
  }, [account, onDelete]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{account.titular}</Text>
          <Text style={[styles.document, { color: colors.textSecondary }]}>
            {formatDocument(account.tipoDocumento, account.numeroDocumento)}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="pencil" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="trash" size={16} color={colors.danger || '#e53e3e'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pago Móvil */}
      {hasPagoMovil(account) && (
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>📱 Pago Móvil</Text>
            <TouchableOpacity onPress={() => handleCopySection('pago_movil')} activeOpacity={0.7}>
              <Ionicons name="copy" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionValue, { color: colors.textPrimary }]}>
            {formatBankDisplay(account.banco)}
          </Text>
          <Text style={[styles.sectionValue, { color: colors.textPrimary }]}>
            {account.telefono}
          </Text>
        </View>
      )}

      {/* Transferencia */}
      {hasTransferencia(account) && (
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>🏦 Transferencia</Text>
            <TouchableOpacity onPress={() => handleCopySection('transferencia')} activeOpacity={0.7}>
              <Ionicons name="copy" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionValue, { color: colors.textPrimary }]}>
            {formatBankDisplay(account.banco)}
          </Text>
          <Text style={[styles.sectionValue, { color: colors.textPrimary }]}>
            Cta: {account.numeroCuenta}
          </Text>
          <Text style={[styles.sectionValue, { color: colors.textPrimary }]}>
            Tipo: {account.tipoCuenta === 'corriente' ? 'Corriente' : 'Ahorro'}
          </Text>
        </View>
      )}

      {/* Digital */}
      {hasDigital(account) && (
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>📧 Digital</Text>
            <TouchableOpacity onPress={() => handleCopySection('digital')} activeOpacity={0.7}>
              <Ionicons name="copy" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionValue, { color: colors.textPrimary }]}>
            {account.email}
          </Text>
          {account.walletAddress && (
            <Text style={[styles.sectionValue, { color: colors.textPrimary }]}>
              Wallet: {account.walletAddress}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={[styles.actions, { borderTopColor: colors.border }]}>
        <TouchableOpacity onPress={handleCopyAll} style={[styles.actionButton, { backgroundColor: colors.highlight + '20' }]} activeOpacity={0.7}>
          <Ionicons name="copy" size={16} color={colors.highlight} />
          <Text style={[styles.actionText, { color: colors.highlight }]}>Copiar todo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShareAll} style={[styles.actionButton, { backgroundColor: colors.highlight + '20' }]} activeOpacity={0.7}>
          <Ionicons name="share" size={16} color={colors.highlight} />
          <Text style={[styles.actionText, { color: colors.highlight }]}>Compartir todo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default React.memo(BankAccountCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  document: {
    fontSize: 13,
  },
  iconButton: {
    padding: 4,
  },
  section: {
    borderTopWidth: 1,
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 14,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 12,
    gap: 12,
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
});
