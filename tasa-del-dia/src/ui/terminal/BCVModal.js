// Variante TERMINAL del rediseño monocromo (fuente: feature/ui-monocromo).
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import useReduceMotion from '../../hooks/useReduceMotion';
import { hapticSuccess } from '../../utils/haptics';

/**
 * BCVModal — hoja deslizante desde abajo (bottom sheet, tendencia 2026).
 * Al abrir: el panel entra con spring físico y el fondo se funde.
 */
function BCVModal({
  visible, onClose, editValue, onChangeText, onSave, bcvLunesColor, C,
}) {
  const reduceMotion = useReduceMotion();
  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);
  const [backdropActive, setBackdropActive] = useState(false);

  useEffect(() => {
    if (visible) {
      translateY.value = reduceMotion ? 0 : withSpring(0, { damping: 22, stiffness: 240 });
      backdropOpacity.value = withTiming(1, { duration: 220 });
      // El backdrop solo debe responder al tap tras terminar el slide-in,
      // para no cerrar el modal con un toque accidental durante la entrada.
      const t = setTimeout(() => setBackdropActive(true), reduceMotion ? 0 : 260);
      return () => clearTimeout(t);
    }
    setBackdropActive(false);
    translateY.value = 600;
    backdropOpacity.value = 0;
    return undefined;
  }, [visible, reduceMotion, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleSave = () => {
    // Solo dar feedback de éxito si hay un valor real que guardar
    const normalized = editValue.replace(',', '.');
    if (normalized && !Number.isNaN(Number(normalized))) {
      hapticSuccess();
    }
    onSave();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        // Android: el Modal de RN no se redimensiona con windowSoftInputMode
        // (adjustResize no aplica a ventanas de Modal); "height" recorta el
        // overlay por la altura del teclado para que la hoja quede encima.
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
      >
        {/* Backdrop — tocar fuera cierra (activo tras el slide-in) */}
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents={backdropActive ? 'auto' : 'none'}>
          <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        {/* Hoja inferior */}
        <Animated.View style={[styles.sheetWrap, sheetStyle]}>
          <View style={[styles.sheet, { backgroundColor: C.secondary, borderColor: C.cardBorder }]}>
            <View style={styles.titleRow}>
              <Text style={[styles.titlePrompt, { color: C.dimmed }]}>{'>'}</Text>
              <Text style={[styles.title, { color: C.textPrimary }]}>BCV (Lunes)</Text>
            </View>
            <Text style={[styles.subtitle, { color: C.dimmed }]}>
              TASA PUBLICADA POR EL BCV PARA EL LUNES:
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
              placeholderTextColor={C.dimmed}
              keyboardType="decimal-pad"
              value={editValue}
              onChangeText={onChangeText}
              autoFocus
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.cardBorder }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: C.dimmed }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: C.textPrimary }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: C.onAccent, fontWeight: '800' }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default React.memo(BCVModal);

const styles = StyleSheet.create({
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
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  sheet: {
    borderRadius: 0,
    padding: 20,
    borderWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  titlePrompt: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 10,
    marginBottom: 14,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  input: {
    borderRadius: 0,
    padding: 13,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    fontVariant: ['tabular-nums'],
    fontFamily: 'monospace',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 0,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
