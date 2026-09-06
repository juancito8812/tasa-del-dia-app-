import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DOCUMENT_TYPES } from '../constants/documentTypes';
import { BANKS } from '../constants/banks';
import { saveAccount } from '../services/bankData';
import { hapticLight } from '../utils/haptics';

const ACCOUNT_TYPES = [
  { key: 'ahorro', label: 'Ahorro' },
  { key: 'corriente', label: 'Corriente' },
];

const INITIAL_FORM = {
  tipoDocumento: 'V',
  numeroDocumento: '',
  titular: '',
  banco: '0134',
  telefono: '',
  tipoCuenta: 'ahorro',
  numeroCuenta: '',
  email: '',
  walletAddress: '',
};

/**
 * @param {{ visible: boolean, onClose: () => void, onSave: () => void, account: Object|null, colors: Object }} props
 */
function BankAccountForm({ visible, onClose, onSave, account, colors }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(/** @type {any} */ ({}));

  useEffect(() => {
    if (account) {
      setForm({ ...INITIAL_FORM, ...account });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
  }, [account, visible]);

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.numeroDocumento.trim()) {
      newErrors.numeroDocumento = 'Requerido';
    }
    if (!form.titular.trim()) {
      newErrors.titular = 'Requerido';
    }

    const hasPagoMovil = form.banco && form.telefono;
    const hasTransferencia = form.banco && form.numeroCuenta;
    const hasDigital = form.email;

    if (!hasPagoMovil && !hasTransferencia && !hasDigital) {
      newErrors.general = 'Agrega al menos un método de pago (Pago Móvil, Transferencia o Digital)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => {
    hapticLight();
    if (!validate()) return;

    await saveAccount({
      ...form,
      id: account?.id,
    });

    onSave?.();
    onClose?.();
  }, [form, account, validate, onSave, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {account ? 'Editar cuenta' : 'Nueva cuenta'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={[styles.saveButtonText, { color: colors.highlight }]}>Guardar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {errors.general && (
            <View style={[styles.errorBanner, { backgroundColor: '#e53e3e20' }]}>
              <Text style={[styles.errorText, { color: '#e53e3e' }]}>{errors.general}</Text>
            </View>
          )}

          {/* Datos Personales */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DATOS PERSONALES</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de documento</Text>
          <View style={styles.chipRow}>
            {DOCUMENT_TYPES.map((doc) => (
              <TouchableOpacity
                key={doc.key}
                onPress={() => updateField('tipoDocumento', doc.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: form.tipoDocumento === doc.key ? colors.highlight : colors.card,
                    borderColor: form.tipoDocumento === doc.key ? colors.highlight : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: form.tipoDocumento === doc.key ? '#fff' : colors.textPrimary },
                  ]}
                >
                  {doc.key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Número de documento</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: errors.numeroDocumento ? '#e53e3e' : colors.border }]}
            value={form.numeroDocumento}
            onChangeText={(v) => updateField('numeroDocumento', v)}
            placeholder="Ej: 12345678"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />
          {errors.numeroDocumento && <Text style={styles.errorField}>{errors.numeroDocumento}</Text>}

          <Text style={[styles.label, { color: colors.textSecondary }]}>Titular</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: errors.titular ? '#e53e3e' : colors.border }]}
            value={form.titular}
            onChangeText={(v) => updateField('titular', v)}
            placeholder="Nombre completo"
            placeholderTextColor={colors.textMuted}
          />
          {errors.titular && <Text style={styles.errorField}>{errors.titular}</Text>}

          {/* Pago Móvil */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>PAGO MÓVIL</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Banco</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankScroll}>
            {BANKS.map((bank) => (
              <TouchableOpacity
                key={bank.code}
                onPress={() => updateField('banco', bank.code)}
                style={[
                  styles.bankChip,
                  {
                    backgroundColor: form.banco === bank.code ? colors.highlight : colors.card,
                    borderColor: form.banco === bank.code ? colors.highlight : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.bankChipText,
                    { color: form.banco === bank.code ? '#fff' : colors.textPrimary },
                  ]}
                >
                  {bank.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Teléfono</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.border }]}
            value={form.telefono}
            onChangeText={(v) => updateField('telefono', v)}
            placeholder="0412-1234567"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          {/* Transferencia */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>TRANSFERENCIA</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de cuenta</Text>
          <View style={styles.chipRow}>
            {ACCOUNT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.key}
                onPress={() => updateField('tipoCuenta', type.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: form.tipoCuenta === type.key ? colors.highlight : colors.card,
                    borderColor: form.tipoCuenta === type.key ? colors.highlight : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: form.tipoCuenta === type.key ? '#fff' : colors.textPrimary },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Número de cuenta</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.border }]}
            value={form.numeroCuenta}
            onChangeText={(v) => updateField('numeroCuenta', v)}
            placeholder="0134-12-1234567890"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />

          {/* Digital */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 20 }]}>DIGITAL (Zelle / PayPal / Binance)</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.border }]}
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Wallet address (opcional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.textPrimary, borderColor: colors.border }]}
            value={form.walletAddress}
            onChangeText={(v) => updateField('walletAddress', v)}
            placeholder="TRC20 / BEP20 / ERC20"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default React.memo(BankAccountForm);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bankScroll: {
    marginBottom: 12,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  bankChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorField: {
    fontSize: 12,
    color: '#e53e3e',
    marginTop: -8,
    marginBottom: 8,
  },
});
