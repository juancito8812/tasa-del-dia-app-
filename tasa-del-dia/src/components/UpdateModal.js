// Componente COMPARTIDO — UpdateModal para los 4 estilos de UI.
// La BASE (`original`) es la fuente de verdad de lógica y comportamiento; los
// temas solo aportan diferencias VISUALES deliberadas vía THEME_STYLES.
// Las copias ui/{editorial,fintech,terminal}/UpdateModal.js se eliminaron y de
// ellas solo se conservan aquí sus deltas.
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { downloadAndInstall, skipVersion } from '../services/autoUpdate';
import { useTheme } from '../context/ThemeContext';
import { useFintechFonts } from '../ui/fintech/fonts';

/**
 * Deltas visuales por estilo (solo lo que difiere de `original`).
 *  - `onAccent`: el texto del botón primario y el spinner usan C.onAccent
 *    (original usa el literal '#fff').
 *  - `accentTone(C)`: color de acento del botón "Descargar APK" y la nueva
 *    versión (fintech: `highlight` en vez de `info`).
 *  - `errorTone(C)`: color del texto de error (fintech: `warning`).
 *  - `onAccentWeight`: peso del texto sobre el acento (original/genérico '700').
 *  - `newVersionWeight`: peso del número de la nueva versión (genérico '700').
 *  - `fonts`: clave de FONT por bloque de texto (fintech).
 *  - `styles`: merge aditivo sobre los estilos base.
 * @type {Record<string, any>}
 */
const THEME_STYLES = {
  original: {},

  editorial: {
    onAccent: true,
  },

  terminal: {
    onAccent: true,
    styles: {
      card: { borderRadius: 0 },
      iconCircle: { borderRadius: 0 },
      button: { borderRadius: 0 },
    },
  },

  fintech: {
    onAccent: true,
    accentTone: (C) => C.highlight,
    errorTone: (C) => C.warning,
    onAccentWeight: '600',
    newVersionWeight: '600',
    fonts: {
      title: 'sansSemiBold',
      versionLabel: 'sans',
      versionValue: 'monoSemiBold',
      notes: 'sans',
      errorText: 'sans',
      skipButtonText: 'sansMedium',
      progressText: 'monoSemiBold',
      downloadButtonText: 'sansSemiBold',
      laterText: 'sans',
    },
    styles: {
      card: { borderRadius: 18 },
      title: { fontWeight: '600' },
      button: { borderRadius: 13 },
    },
  },
};

function UpdateModal({
  visible, onClose, currentVersion, latestVersion, apkUrl, notes, C,
}) {
  const { uiStyle } = useTheme();
  const F = useFintechFonts();
  const t = THEME_STYLES[uiStyle] ?? {};
  const styles = createStyles(t);

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  const font = (key) => (t.fonts?.[key] && F ? F[t.fonts[key]] : undefined);
  const accent = t.accentTone ? t.accentTone(C) : C.info;
  const errorColor = t.errorTone ? t.errorTone(C) : C.highlight;
  const onAccentText = t.onAccent ? C.onAccent : '#fff';
  const onAccentWeight = t.onAccentWeight ?? '700';
  const newVersionWeight = t.newVersionWeight ?? '700';

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    setProgress(0);
    const ok = await downloadAndInstall(apkUrl, setProgress);
    if (ok) {
      setDownloading(false);
      onClose();
    } else {
      setError('No se pudo iniciar la descarga. Intenta de nuevo.');
      setDownloading(false);
    }
  };

  const handleSkip = async () => {
    await skipVersion(latestVersion);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: C.secondary, borderColor: C.cardBorder }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: C.info + '20' }]}>
              <Ionicons name="cloud-download" size={28} color={C.info} />
            </View>
            <Text style={[styles.title, { color: C.textPrimary, fontFamily: font('title') }]}>Actualización disponible</Text>
          </View>

          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: C.textMuted, fontFamily: font('versionLabel') }]}>Versión actual:</Text>
            <Text style={[styles.versionValue, { color: C.textSecondary, fontFamily: font('versionValue') }]}>v{currentVersion}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: C.textMuted, fontFamily: font('versionLabel') }]}>Nueva versión:</Text>
            <Text style={[styles.versionValue, { color: accent, fontWeight: newVersionWeight, fontFamily: font('versionValue') }]}>v{latestVersion}</Text>
          </View>

          {notes ? (
            <Text style={[styles.notes, { color: C.textSecondary, fontFamily: font('notes') }]} numberOfLines={4}>
              {notes}
            </Text>
          ) : null}

          {error ? (
            <Text style={[styles.errorText, { color: errorColor, fontFamily: font('errorText') }]}>{error}</Text>
          ) : null}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.inputBg, borderColor: C.cardBorder, borderWidth: 1 }]}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={downloading}
            >
              <Text style={[styles.buttonText, { color: C.textMuted, fontFamily: font('skipButtonText') }]}>Saltar esta versión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: accent }]}
              onPress={handleDownload}
              activeOpacity={0.8}
              disabled={downloading}
            >
              {downloading ? (
                <View style={styles.downloadingRow}>
                  <ActivityIndicator color={onAccentText} size="small" />
                  {progress > 0 ? (
                    <Text style={[styles.buttonText, { color: onAccentText, fontWeight: onAccentWeight, fontFamily: font('progressText') }]}>
                      {` ${Math.round(progress / 1024 / 1024)} MB`}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={[styles.buttonText, { color: onAccentText, fontWeight: onAccentWeight, fontFamily: font('downloadButtonText') }]}>Descargar APK</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.laterLink}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.laterText, { color: C.textMuted, fontFamily: font('laterText') }]}>Más tarde</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(UpdateModal);

function createStyles(t) {
  const table = {
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
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
    },
    versionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    versionLabel: {
      fontSize: 13,
    },
    versionValue: {
      fontSize: 15,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    notes: {
      fontSize: 12,
      marginTop: 12,
      marginBottom: 4,
      lineHeight: 18,
    },
    errorText: {
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
    },
    buttons: {
      gap: 8,
      marginTop: 20,
    },
    button: {
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    downloadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    laterLink: {
      alignItems: 'center',
      marginTop: 12,
      paddingVertical: 4,
    },
    laterText: {
      fontSize: 12,
    },
  };

  const extra = typeof t.styles === 'function' ? t.styles() : (t.styles || {});
  Object.keys(extra).forEach((key) => {
    table[key] = { ...(table[key] || {}), ...extra[key] };
  });

  return StyleSheet.create(/** @type {any} */ (table));
}
