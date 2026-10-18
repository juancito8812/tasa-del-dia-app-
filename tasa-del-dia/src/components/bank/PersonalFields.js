import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { DOCUMENT_TYPES } from '../../constants/documentTypes';

/**
 * Sección "Datos Personales": tipo de documento, número y titular.
 */
function PersonalFields({ C, styles, form, errors, updateField }) {
  return (
    <>
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
    </>
  );
}

export default PersonalFields;
