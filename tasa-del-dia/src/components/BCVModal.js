// Componente COMPARTIDO — BCVModal para los 4 estilos de UI.
// La versión base (sheet redondeado, tendencia 2026) es la fuente de verdad de
// lógica y comportamiento; los temas solo aportan diferencias VISUALES
// deliberadas vía THEME_STYLES.
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import useReduceMotion from '../hooks/useReduceMotion';
import { hapticSuccess } from '../utils/haptics';
import { useTheme } from '../context/ThemeContext';
import { useFintechFonts } from '../ui/fintech/fonts';

// Tokens por estilo de UI.
const THEME_STYLES = {
  original: {},
  editorial: {},
  fintech: {
    fonts: true,
    styles: {
      sheet: { borderRadius: 18 },
      title: { fontWeight: '600' },
      button: { borderRadius: 13 },
    },
  },
  // Terminal: hoja sin radios, prompt '>' en el título y textos en mayúsculas.
  terminal: {
    variant: 'terminal',
    hideHandle: true,
    prompt: true,
    subtitleText: 'TASA PUBLICADA POR EL BCV PARA EL LUNES:',
    subtitleTone: (C) => C.dimmed,
    placeholderTone: (C) => C.dimmed,
    cancelTone: (C) => ({
      button: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.cardBorder },
      text: C.dimmed,
    }),
    saveTone: (C) => ({ button: { backgroundColor: C.textPrimary }, textWeight: '800' }),
    styles: {
      sheet: { borderRadius: 0, padding: 20 },
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
        fontWeight: '700',
        fontFamily: 'monospace',
      },
      buttons: { marginTop: 14 },
      button: { borderRadius: 0 },
      buttonText: { fontSize: 14, fontFamily: 'monospace' },
    },
  },
};

function createStyles(t) {
  const table = {
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
      borderRadius: 24,
      padding: 22,
      borderWidth: 1,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 14,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titlePrompt: {
      fontFamily: 'monospace',
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
  };

  const extra = typeof t.styles === 'function' ? t.styles() : (t.styles || {});
  Object.keys(extra).forEach((key) => {
    table[key] = { ...(table[key] || {}), ...extra[key] };
  });

  return StyleSheet.create(/** @type {any} */ (table));
}

/**
 * BCVModal — hoja deslizante desde abajo (bottom sheet, tendencia 2026).
 * Al abrir: el panel entra con spring físico y el fondo se funde.
 */
function BCVModal({
  visible, onClose, editValue, onChangeText, onSave, bcvLunesColor, C,
}) {
  const { uiStyle } = useTheme();
  const F = useFintechFonts();
  const t = THEME_STYLES[uiStyle] ?? {};
  const styles = createStyles(t);

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
      const t2 = setTimeout(() => setBackdropActive(true), reduceMotion ? 0 : 260);
      return () => clearTimeout(t2);
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

  // Tintes por tema (con fallback al base)
  const cancelTone = t.cancelTone ? t.cancelTone(C) : { button: { backgroundColor: C.inputBg }, text: C.textMuted };
  const saveTone = t.saveTone
    ? t.saveTone(C)
    : { button: { backgroundColor: bcvLunesColor }, textWeight: '700' };
  const subtitleColor = t.subtitleTone ? t.subtitleTone(C) : C.textMuted;
  const placeholderColor = t.placeholderTone ? t.placeholderTone(C) : C.textMuted;

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
            {/* Handle */}
            {!t.hideHandle && <View style={[styles.handle, { backgroundColor: C.textMuted + '40' }]} />}
            {t.prompt ? (
              <View style={styles.titleRow}>
                <Text style={[styles.titlePrompt, { color: C.dimmed }]}>{'>'}</Text>
                <Text style={[styles.title, { color: C.textPrimary }, t.fonts && { fontFamily: F.sansSemiBold }]}>
                  BCV (Lunes)
                </Text>
              </View>
            ) : (
              <Text style={[styles.title, { color: C.textPrimary }, t.fonts && { fontFamily: F.sansSemiBold }]}>
                BCV (Lunes)
              </Text>
            )}
            <Text style={[styles.subtitle, { color: subtitleColor }, t.fonts && { fontFamily: F.sans }]}>
              {t.subtitleText || 'Ingresa la tasa publicada por el BCV para el lunes'}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: C.inputBg,
                  color: C.textPrimary,
                  borderColor: C.inputBorder,
                },
                t.fonts && { fontFamily: F.monoSemiBold },
              ]}
              placeholder="0,00"
              placeholderTextColor={placeholderColor}
              keyboardType="decimal-pad"
              value={editValue}
              onChangeText={onChangeText}
              autoFocus
            />
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[styles.button, cancelTone.button]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: cancelTone.text }, t.fonts && { fontFamily: F.sansMedium }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, saveTone.button]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, { color: C.onAccent, fontWeight: saveTone.textWeight }, t.fonts && { fontFamily: F.sansSemiBold }]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default React.memo(BCVModal);
