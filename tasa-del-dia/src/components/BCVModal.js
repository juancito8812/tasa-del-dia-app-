import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';

export default function BCVModal({
  visible, onClose, editValue, onChangeText, onSave, bcvLunesColor, C,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.card, { backgroundColor: C.secondary, borderColor: C.cardBorder }]}>
          <Text style={[styles.title, { color: C.textPrimary }]}>BCV (Lunes)</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>
            Ingresa la tasa publicada por el BCV para el lunes
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: C.inputBg,
                color: C.textPrimary,
                borderColor: C.inputBorder,
              },
            ]}
            placeholder="0,00"
            placeholderTextColor={C.textMuted}
            keyboardType="decimal-pad"
            value={editValue}
            onChangeText={onChangeText}
            autoFocus
          />
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.inputBg }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: C.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: bcvLunesColor }]}
              onPress={onSave}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: '#fff', fontWeight: '700' }]}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    fontVariant: ['tabular-nums'],
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
