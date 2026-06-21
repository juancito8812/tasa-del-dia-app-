import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadAndInstall, skipVersion } from '../services/autoUpdate';

export default function UpdateModal({
  visible, onClose, currentVersion, latestVersion, apkUrl, notes, C,
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    const ok = await downloadAndInstall(apkUrl);
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
            <Text style={[styles.title, { color: C.textPrimary }]}>Actualización disponible</Text>
          </View>

          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: C.textMuted }]}>Versión actual:</Text>
            <Text style={[styles.versionValue, { color: C.textSecondary }]}>v{currentVersion}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: C.textMuted }]}>Nueva versión:</Text>
            <Text style={[styles.versionValue, { color: C.info, fontWeight: '700' }]}>v{latestVersion}</Text>
          </View>

          {notes ? (
            <Text style={[styles.notes, { color: C.textSecondary }]} numberOfLines={4}>
              {notes}
            </Text>
          ) : null}

          {error ? (
            <Text style={[styles.errorText, { color: C.highlight }]}>{error}</Text>
          ) : null}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.inputBg, borderColor: C.cardBorder, borderWidth: 1 }]}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={downloading}
            >
              <Text style={[styles.buttonText, { color: C.textMuted }]}>Saltar esta versión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.info }]}
              onPress={handleDownload}
              activeOpacity={0.8}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#fff', fontWeight: '700' }]}>Descargar APK</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.laterLink}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.laterText, { color: C.textMuted }]}>Más tarde</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  laterLink: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  laterText: {
    fontSize: 12,
  },
});
