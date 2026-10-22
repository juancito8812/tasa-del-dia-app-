import React from 'react';
import { Text, TextInput } from 'react-native';

/**
 * Label + input estándar del formulario.
 * `keyboardType` y `autoCapitalize` se omiten en los campos que no los usan
 * (igual que en el original: quedan en el default de TextInput).
 */
function LabeledInput({ C, styles, label, value, onChangeText, placeholder, error, keyboardType = undefined, autoCapitalize = undefined }) {
  return (
    <>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: C.inputBg,
            color: C.textPrimary,
            borderColor: error ? C.highlight : C.inputBorder,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {error && <Text style={[styles.errorField, { color: C.highlight }]}>{error}</Text>}
    </>
  );
}

/**
 * Sección "Digital": Zelle, PayPal, Binance, Facebank, Zinli y Wally.
 */
function DigitalFields({ C, styles, form, errors, updateField }) {
  return (
    <>
      {/* Zelle */}
      <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>ZELLE</Text>

      <LabeledInput
        C={C}
        styles={styles}
        label="Email"
        value={form.email}
        onChangeText={(v) => updateField('email', v)}
        placeholder="correo@ejemplo.com"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* PayPal */}
      <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>PAYPAL</Text>

      <LabeledInput
        C={C}
        styles={styles}
        label="Email"
        value={form.emailPayPal}
        onChangeText={(v) => updateField('emailPayPal', v)}
        placeholder="correo@paypal.com"
        error={errors.emailPayPal}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Binance */}
      <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>BINANCE</Text>

      <LabeledInput
        C={C}
        styles={styles}
        label="Wallet address"
        value={form.walletAddress}
        onChangeText={(v) => updateField('walletAddress', v)}
        placeholder="TRC20 / BEP20 / ERC20"
        autoCapitalize="none"
      />

      <LabeledInput
        C={C}
        styles={styles}
        label="Email"
        value={form.emailBinance}
        onChangeText={(v) => updateField('emailBinance', v)}
        placeholder="correo@binance.com"
        error={errors.emailBinance}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <LabeledInput
        C={C}
        styles={styles}
        label="Binance ID"
        value={form.binanceId}
        onChangeText={(v) => updateField('binanceId', v)}
        placeholder="123456789"
        keyboardType="numeric"
      />

      {/* Facebank */}
      <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>FACEBANK</Text>

      <LabeledInput
        C={C}
        styles={styles}
        label="Email"
        value={form.facebankEmail}
        onChangeText={(v) => updateField('facebankEmail', v)}
        placeholder="correo@facebank.com"
        error={errors.facebankEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <LabeledInput
        C={C}
        styles={styles}
        label="Número de cuenta"
        value={form.facebankAccount}
        onChangeText={(v) => updateField('facebankAccount', v)}
        placeholder="0134-12-1234567890"
        keyboardType="numeric"
      />

      {/* Zinli */}
      <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>ZINLI</Text>

      <LabeledInput
        C={C}
        styles={styles}
        label="Email"
        value={form.zinliEmail}
        onChangeText={(v) => updateField('zinliEmail', v)}
        placeholder="correo@zinli.com"
        error={errors.zinliEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Wally */}
      <Text style={[styles.sectionLabel, { color: C.textMuted, marginTop: 20 }]}>WALLY</Text>

      <LabeledInput
        C={C}
        styles={styles}
        label="Email"
        value={form.wallyEmail}
        onChangeText={(v) => updateField('wallyEmail', v)}
        placeholder="correo@wally.tech"
        error={errors.wallyEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
    </>
  );
}

export default DigitalFields;
