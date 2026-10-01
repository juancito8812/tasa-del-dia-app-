// Estilo FINTECH — modal de actualización: radio 18px (radio de modales del
// sitio), textos Space Grotesk y versiones en JetBrains Mono.
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { downloadAndInstall, skipVersion } from '../../services/autoUpdate';
import { useFintechFonts } from './fonts';

function UpdateModal({
  visible, onClose, currentVersion, latestVersion, apkUrl, notes, C,
}) {
  const F = useFintechFonts();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

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
            <Text style={[styles.title, { color: C.textPrimary, fontFamily: F.sansSemiBold }]}>Actualización disponible</Text>
          </View>

          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: C.textMuted, fontFamily: F.sans }]}>Versión actual:</Text>
            <Text style={[styles.versionValue, { color: C.textSecondary, fontFamily: F.monoSemiBold }]}>v{currentVersion}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: C.textMuted, fontFamily: F.sans }]}>Nueva versión:</Text>
            <Text style={[styles.versionValue, { color: C.highlight, fontWeight: '600', fontFamily: F.monoSemiBold }]}>v{latestVersion}</Text>
          </View>

          {notes ? (
            <Text style={[styles.notes, { color: C.textSecondary, fontFamily: F.sans }]} numberOfLines={4}>
              {notes}
            </Text>
          ) : null}

          {error ? (
            <Text style={[styles.errorText, { color: C.warning, fontFamily: F.sans }]}>{error}</Text>
          ) : null}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.inputBg, borderColor: C.cardBorder, borderWidth: 1 }]}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={downloading}
            >
              <Text style={[styles.buttonText, { color: C.textMuted, fontFamily: F.sansMedium }]}>Saltar esta versión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.highlight }]}
              onPress={handleDownload}
              activeOpacity={0.8}
              disabled={downloading}
            >
              {downloading ? (
                <View style={styles.downloadingRow}>
                  <ActivityIndicator color={C.onAccent} size="small" />
                  {progress > 0 ? (
                    <Text style={[styles.buttonText, { color: C.onAccent, fontWeight: '600', fontFamily: F.monoSemiBold }]}>
                      {` ${Math.round(progress / 1024 / 1024)} MB`}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={[styles.buttonText, { color: C.onAccent, fontWeight: '600', fontFamily: F.sansSemiBold }]}>Descargar APK</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.laterLink}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.laterText, { color: C.textMuted, fontFamily: F.sans }]}>Más tarde</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default React.memo(UpdateModal);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    borderRadius: 18,
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
    fontWeight: '600',
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
    borderRadius: 13,
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
});
