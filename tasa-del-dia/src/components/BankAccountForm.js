import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import useReduceMotion from '../hooks/useReduceMotion';
import { saveAccount } from '../services/bankData';
import { hapticLight } from '../utils/haptics';
import { createStyles } from './bank/BankAccountFormStyles';
import { INITIAL_FORM, validateAccountForm } from './bank/BankAccountFormConfig';
import PersonalFields from './bank/PersonalFields';
import PagoMovilFields from './bank/PagoMovilFields';
import TransferenciaFields from './bank/TransferenciaFields';
import DigitalFields from './bank/DigitalFields';

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

  const validate = useCallback(() => {
    const newErrors = validateAccountForm(form);
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
              <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Cerrar">
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

              <PersonalFields C={C} styles={styles} form={form} errors={errors} updateField={updateField} />

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

              {formTab === 'banks' && (
                <>
                  <PagoMovilFields
                    C={C}
                    styles={styles}
                    form={form}
                    errors={errors}
                    updateField={updateField}
                    bankSearch={bankSearch}
                    setBankSearch={setBankSearch}
                  />
                  <TransferenciaFields
                    C={C}
                    styles={styles}
                    form={form}
                    errors={errors}
                    updateField={updateField}
                    bankSearchTransfer={bankSearchTransfer}
                    setBankSearchTransfer={setBankSearchTransfer}
                  />
                </>
              )}

              {formTab === 'digital' && (
                <DigitalFields C={C} styles={styles} form={form} errors={errors} updateField={updateField} />
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
