import React from 'react';
import { View, Text, TextInput } from 'react-native';

function PayPalAmountInput({ styles, C, label, prefix, value, onChangeText, placeholder }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputPrefix}>{prefix}</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          keyboardType="decimal-pad"
        />
      </View>
    </>
  );
}

export default PayPalAmountInput;
