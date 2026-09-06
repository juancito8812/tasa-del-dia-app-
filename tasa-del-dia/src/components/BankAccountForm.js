import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import useReduceMotion from '../hooks/useReduceMotion';
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
  bancoTransferencia: '',
  telefono: '',
  tipoCuenta: 'ahorro',
  numeroCuenta: '',
  email: '',
  emailPayPal: '',
  walletAddress: '',
  emailBinance: '',
  binanceId: '',
};

/**
 * @param {{ visible: boolean, onClose: () => void, onSave: () => void, account: Object|null, colors: Object }} props
 */
function BankAccountForm({ visible, onClose, onSave, account, colors }) {
  const C = colors;
  const reduceMotion = useReduceMotion();
  const translateY = useSharedValue(800);
  const backdropOpacity = useSharedValue(0);
  const [backdropActive, setBackdropActive] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(/** @type {any} */ ({}));
  const [bankSearch, setBankSearch] = useState('');
  const [bankSearchTransfer, setBankSearchTransfer] = useState('');
  const [formTab, setFormTab] = useState('banks'); // 'banks' | 'digital'

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
    setBankSearch('');
    setBankSearchTransfer('');
    setFormTab('banks');
  }, []);

  const styles = useMemo(() => createStyles(C), [C]);

  useEffect(() => {
    if (visible) {
      translateY.value = reduceMotion ? 0 : withSpring(0, { damping: 22, stiffness: 240 });
      backdropOpacity.value = withTiming(1, { duration: 220 });
      const t = setTimeout(() => setBackdropActive(true), reduceMotion ? 0 : 260);
      return () => clearTimeout(t);
    }
    setBackdropActive(false);
    translateY.value = 800;
    backdropOpacity.value = 0;
    return undefined;
  }, [visible, reduceMotion, translateY, backdropOpacity]);

  useEffect(() => {
    if (account) {
      setForm({ ...INITIAL_FORM, ...account });
    } else {
      resetForm();
    }
    setErrors({});
  }, [account, visible, resetForm]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const filteredBanks = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) return BANKS;
    return BANKS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.code.includes(q),
    );
  }, [bankSearch]);

  const filteredBanksTransfer = useMemo(() => {
    const q = bankSearchTransfer.trim().toLowerCase();
    if (!q) return BANKS;
    return BANKS.filter(
      (b) => b.name.toLowerCase().includes(q) || b.code.includes(q),
    );
  }, [bankSearchTransfer]);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.numeroDocumento.trim()) {
      newErrors.numeroDocumento = 'Requerido';
    }
    if (!form.titular.trim()) {
      newErrors.titular = 'Requerido';
    }

    const hasPagoMovil = form.banco && form.telefono;
    const hasTransferencia = form.bancoTransferencia && form.numeroCuenta;
    const hasDigital = form.email || form.emailPayPal || form.walletAddress || form.emailBinance || form.binanceId;

    if (!hasPagoMovil && !hasTransferencia && !hasDigital) {
      newErrors.general = 'Agrega al menos un método de pago';
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents={backdropActive ? 'auto' : 'none'}>
          <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View style={[styles.sheetWrap, sheetStyle]}>
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: C.textMuted + '40' }]} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: C.cardBorder }]}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={22} color={C.textMuted} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: C.textPrimary }]}>
                {account ? 'Editar cuenta' : 'Nueva cuenta'}
              </Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={[styles.saveButtonText, { color: C.highlight }]}>Guardar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              {errors.general && (
                <View style={[styles.errorBanner, { backgroundColor: C.highlight + '18', borderColor: C.highlight + '30' }]}>
                  <Ionicons name="alert-circle" size={16} color={C.highlight} />
                  <Text style={[styles.errorText, { color: C.highlight }]}>{errors.general}</Text>
                </View>
              )}

              {/* Datos Personales */}
              <Text style={[styles.sectionLabel, { color: C.textMuted }]}>DATOS PERSONALES</Text>

              <Text style={[styles.label, { color: C.textSecondary }]}>Tipo de documento</Text>
              <View style={styles.chipRow}>
                {DOCUMENT_TYPES.map((doc) => (
                  <TouchableOpacity
                    key={doc.key}
                    onPress={() => updateField('tipoDocumento', doc.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.tipoDocumento === doc.key ? C.highlight + '20' : C.inputBg,
                        borderColor: form.tipoDocumento === doc.key ? C.highlight : C.inputBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: form.tipoDocumento === doc.key ? C.highlight : C.textPrimary },
                      ]}
                    >
                      {doc.key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: C.textSecondary }]}>Número de documento</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: errors.numeroDocumento ? C.highlight : C.inputBorder,
                  },
                ]}
                value={form.numeroDocumento}
                onChangeText={(v) => updateField('numeroDocumento', v)}
                placeholder="Ej: 12345678"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
              />
              {errors.numeroDocumento && <Text style={[styles.errorField, { color: C.highlight }]}>{errors.numeroDocumento}</Text>}

              <Text style={[styles.label, { color: C.textSecondary }]}>Titular</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: errors.titular ? C.highlight : C.inputBorder,
                  },
                ]}
                value={form.titular}
                onChangeText={(v) => updateField('titular', v)}
                placeholder="Nombre completo"
                placeholderTextColor={C.textMuted}
              />
              {errors.titular && <Text style={[styles.errorField, { color: C.highlight }]}>{errors.titular}</Text>}

              {/* Segmented control */}
              <View style={[styles.segmentedControl, { backgroundColor: C.inputBg, borderColor: C.inputBorder, marginTop: 20 }]}>
                <TouchableOpacity
                  onPress={() => setFormTab('banks')}
                  style={[styles.segment, formTab === 'banks' && { backgroundColor: C.highlight + '20', borderColor: C.highlight }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="card" size={14} color={formTab === 'banks' ? C.highlight : C.textMuted} />
                  <Text style={[styles.segmentText, { color: formTab === 'banks' ? C.highlight : C.textMuted }]}>Bancos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFormTab('digital')}
                  style={[styles.segment, formTab === 'digital' && { backgroundColor: C.highlight + '20', borderColor: C.highlight }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="globe" size={14} color={formTab === 'digital' ? C.highlight : C.textMuted} />
                  <Text style={[styles.segmentText, { color: formTab === 'digital' ? C.highlight : C.textMuted }]}>Digital</Text>
                </TouchableOpacity>
              </View>

              {/* Pago Móvil */}
              {formTab === 'banks' && (
              <>
              <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>PAGO MÓVIL</Text>

              <Text style={[styles.label, { color: C.textSecondary }]}>Banco</Text>
              <View style={[styles.searchRow, { backgroundColor: C.inputBg, borderColor: form.banco && !bankSearch ? C.highlight : C.inputBorder }]}>
                <Ionicons name="search" size={16} color={C.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: C.textPrimary }]}
                  value={bankSearch}
                  onChangeText={setBankSearch}
                  placeholder={form.banco ? `${BANKS.find((b) => b.code === form.banco)?.name || form.banco} — tocar para cambiar` : 'Buscar banco...'}
                  placeholderTextColor={form.banco ? C.highlight : C.textMuted}
                  autoCorrect={false}
                />
                {(bankSearch.length > 0 || form.banco) && (
                  <TouchableOpacity onPress={() => { setBankSearch(''); updateField('banco', ''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color={C.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {bankSearch.length > 0 && filteredBanks.length > 0 && (
                <View style={[styles.bankResults, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
                  {filteredBanks.slice(0, 3).map((bank) => (
                    <TouchableOpacity
                      key={bank.code}
                      onPress={() => { updateField('banco', bank.code); setBankSearch(''); }}
                      style={[styles.bankResultItem]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.bankResultName, { color: C.textPrimary }]}>{bank.name}</Text>
                      <Text style={[styles.bankResultCode, { color: C.textMuted }]}>{bank.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {bankSearch.length > 0 && filteredBanks.length === 0 && (
                <Text style={[styles.bankNoResults, { color: C.textMuted }]}>No se encontraron bancos</Text>
              )}

              <Text style={[styles.label, { color: C.textSecondary }]}>Teléfono</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: C.inputBorder,
                  },
                ]}
                value={form.telefono}
                onChangeText={(v) => updateField('telefono', v)}
                placeholder="0412-1234567"
                placeholderTextColor={C.textMuted}
                keyboardType="phone-pad"
              />

              {/* Transferencia */}
              <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>TRANSFERENCIA</Text>

              <Text style={[styles.label, { color: C.textSecondary }]}>Tipo de cuenta</Text>
              <View style={styles.chipRow}>
                {ACCOUNT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    onPress={() => updateField('tipoCuenta', type.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.tipoCuenta === type.key ? C.highlight + '20' : C.inputBg,
                        borderColor: form.tipoCuenta === type.key ? C.highlight : C.inputBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: form.tipoCuenta === type.key ? C.highlight : C.textPrimary },
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: C.textSecondary }]}>Banco</Text>
              <View style={[styles.searchRow, { backgroundColor: C.inputBg, borderColor: form.bancoTransferencia && !bankSearchTransfer ? C.highlight : C.inputBorder }]}>
                <Ionicons name="search" size={16} color={C.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: C.textPrimary }]}
                  value={bankSearchTransfer}
                  onChangeText={setBankSearchTransfer}
                  placeholder={form.bancoTransferencia ? `${BANKS.find((b) => b.code === form.bancoTransferencia)?.name || form.bancoTransferencia} — tocar para cambiar` : 'Buscar banco...'}
                  placeholderTextColor={form.bancoTransferencia ? C.highlight : C.textMuted}
                  autoCorrect={false}
                />
                {(bankSearchTransfer.length > 0 || form.bancoTransferencia) && (
                  <TouchableOpacity onPress={() => { setBankSearchTransfer(''); updateField('bancoTransferencia', ''); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color={C.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {bankSearchTransfer.length > 0 && filteredBanksTransfer.length > 0 && (
                <View style={[styles.bankResults, { backgroundColor: C.inputBg, borderColor: C.inputBorder }]}>
                  {filteredBanksTransfer.slice(0, 3).map((bank) => (
                    <TouchableOpacity
                      key={bank.code}
                      onPress={() => { updateField('bancoTransferencia', bank.code); setBankSearchTransfer(''); }}
                      style={[styles.bankResultItem]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.bankResultName, { color: C.textPrimary }]}>{bank.name}</Text>
                      <Text style={[styles.bankResultCode, { color: C.textMuted }]}>{bank.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {bankSearchTransfer.length > 0 && filteredBanksTransfer.length === 0 && (
                <Text style={[styles.bankNoResults, { color: C.textMuted }]}>No se encontraron bancos</Text>
              )}

              <Text style={[styles.label, { color: C.textSecondary }]}>Número de cuenta</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: C.inputBorder,
                  },
                ]}
                value={form.numeroCuenta}
                onChangeText={(v) => updateField('numeroCuenta', v)}
                placeholder="0134-12-1234567890"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
              />
              </>
              )}

              {/* Digital */}
              {formTab === 'digital' && (
              <>
              {/* Zelle */}
              <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>ZELLE</Text>

              <Text style={[styles.label, { color: C.textSecondary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: C.inputBorder,
                  },
                ]}
                value={form.email}
                onChangeText={(v) => updateField('email', v)}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* PayPal */}
              <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>PAYPAL</Text>

              <Text style={[styles.label, { color: C.textSecondary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: C.inputBorder,
                  },
                ]}
                value={form.emailPayPal}
                onChangeText={(v) => updateField('emailPayPal', v)}
                placeholder="correo@paypal.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {/* Binance */}
              <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>BINANCE</Text>

              <Text style={[styles.label, { color: C.textSecondary }]}>Wallet address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: C.inputBorder,
                  },
                ]}
                value={form.walletAddress}
                onChangeText={(v) => updateField('walletAddress', v)}
                placeholder="TRC20 / BEP20 / ERC20"
                placeholderTextColor={C.textMuted}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: C.textSecondary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: C.inputBorder,
                  },
                ]}
                value={form.emailBinance}
                onChangeText={(v) => updateField('emailBinance', v)}
                placeholder="correo@binance.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: C.textSecondary }]}>Binance ID</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: C.inputBg,
                    color: C.textPrimary,
                    borderColor: C.inputBorder,
                  },
                ]}
                value={form.binanceId}
                onChangeText={(v) => updateField('binanceId', v)}
                placeholder="123456789"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
              />
              </>
              )}

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default React.memo(BankAccountForm);

const createStyles = (C) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  backdropTouch: {
    flex: 1,
  },
  sheetWrap: {
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: C.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: C.cardBorder,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    padding: 6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollView: {
    flexGrow: 0,
    maxHeight: '80%',
  },
  scrollContent: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 6,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 10,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    borderRadius: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bankScroll: {
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  bankResults: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  bankResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  bankResultName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bankResultCode: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  bankNoResults: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  errorField: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
});
