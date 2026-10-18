import React from 'react';
import { Text, TextInput } from 'react-native';
import BankSearchField from './BankSearchField';

/**
 * Sección "Pago Móvil": banco + teléfono.
 */
function PagoMovilFields({ C, styles, form, updateField, bankSearch, setBankSearch }) {
  return (
    <>
      <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>PAGO MÓVIL</Text>

      <BankSearchField
        C={C}
        styles={styles}
        selectedCode={form.banco}
        search={bankSearch}
        onSearchChange={setBankSearch}
        onSelect={(code) => updateField('banco', code)}
      />

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
    </>
  );
}

export default PagoMovilFields;
