import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { hapticLight } from '../utils/haptics';

function PayPalModeToggle({ styles, C, mode, onChange }) {
  return (
    <View style={styles.toggleContainer}>
      <TouchableOpacity
        onPress={() => { hapticLight(); onChange('net'); }}
        style={[styles.toggleButton, mode === 'net' && styles.toggleActive]}
        activeOpacity={0.7}
      >
        <Text style={[styles.toggleText, { color: mode === 'net' ? '#fff' : C.textSecondary }]}>
          Para recibir
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => { hapticLight(); onChange('gross'); }}
        style={[styles.toggleButton, mode === 'gross' && styles.toggleActive]}
        activeOpacity={0.7}
      >
        <Text style={[styles.toggleText, { color: mode === 'gross' ? '#fff' : C.textSecondary }]}>
          Para enviar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default PayPalModeToggle;
