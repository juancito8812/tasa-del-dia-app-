import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { ACCOUNT_TYPES } from './BankAccountFormConfig';
import BankSearchField from './BankSearchField';

/**
 * Sección "Transferencia": tipo de cuenta, banco y número de cuenta.
 */
function TransferenciaFields({ C, styles, form, updateField, bankSearchTransfer, setBankSearchTransfer }) {
  return (
    <>
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

      <BankSearchField
        C={C}
        styles={styles}
        selectedCode={form.bancoTransferencia}
        search={bankSearchTransfer}
        onSearchChange={setBankSearchTransfer}
        onSelect={(code) => updateField('bancoTransferencia', code)}
      />

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
  );
}

export default TransferenciaFields;
