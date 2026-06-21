import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ThemeToggleMini from '../components/ThemeToggleMini';
import { fetchWithOfflineFallback, getStoredBCVLunes, setStoredBCVLunes, getReminderEnabled, setReminderEnabled as persistReminderEnabled, saveHistoricalRate, getTodayKey } from '../services/api';
import { scheduleFridayReminder, cancelFridayReminder, ensureReminderScheduled } from '../services/notifications';
import RateCard from '../components/RateCard';
import ScreenContainer from '../components/ScreenContainer';


function createStyles(C) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
      flex: 1,
      backgroundColor: C.primary,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logoContainer: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: 0.5,
      flex: 1,
    },
    headerBadge: {
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
    },
    headerBadgeText: {
      fontSize: 14,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      gap: 6,
      marginTop: 6,
    },
    errorText: {
      color: '#fff',
      fontSize: 11,
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 8,
    },
    grid: {
      gap: 6,
    },
    gridRow: {
      flexDirection: 'row',
      gap: 6,
    },
    gridCell: {
      flex: 1,
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      paddingHorizontal: 4,
    },
    brechaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderWidth: 1,
    },
    brechaText: {
      fontSize: 11,
      fontWeight: '700',
    },
    updateText: {
      fontSize: 11,
    },
  });
}

export default function RatesScreen({ isActive }) {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);

  const [data, setData] = useState({
    tasaBCV: null,
    tasaParalelo: null,
    tasaEuro: null,
    tasaBinanceP2P: null,
    usdFetchedAt: null,
    eurCapturedAt: null,
  });
  const [tasaBCVLunes, setTasaBCVLunes] = useState(null);
  const [bcvLunesUpdatedAt, setBcvLunesUpdatedAt] = useState(null);
  const [reminderEnabled, setReminderEnabledLocal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineCachedAt, setOfflineCachedAt] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editValue, setEditValue] = useState('');


  // Animación fade-in al cambiar de pestaña
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;
    fadeAnim.setValue(0.85);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive, fadeAnim]);

  const loadRates = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const { data: result, fromCache, error: fetchError, cacheInfo } = await fetchWithOfflineFallback();
      
      if (fromCache && result) {
        // Using cached data (offline mode)
        setData(result);
        setOfflineMode(true);
        setOfflineCachedAt(cacheInfo?.cachedAt || null);
      } else if (result) {
        // Fresh data from API
        setData(result);
        setOfflineMode(false);
        setOfflineCachedAt(null);
      }
      
      if (fetchError && !fromCache) {
        setError(fetchError);
      }
    } catch (err) {
      setError(err.message || 'Error al obtener las tasas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const mounted = { current: true };
    loadRates();
    getStoredBCVLunes().then((data) => {
      if (mounted.current) {
        setTasaBCVLunes(data.value);
        setBcvLunesUpdatedAt(data.updatedAt);
      }
    }).catch(() => {});
    getReminderEnabled().then((enabled) => {
      if (mounted.current) {
        setReminderEnabledLocal(enabled);
        if (enabled) {
          ensureReminderScheduled();
        }
      }
    }).catch(() => {});
    return () => { mounted.current = false; };
  }, [loadRates]);

  // Auto-guardar tasas de hoy cada vez que se carguen exitosamente
  useEffect(() => {
    if (data.tasaBCV !== null || data.tasaParalelo !== null) {
      const todayKey = getTodayKey();
      saveHistoricalRate(todayKey, {
        bcv: data.tasaBCV,
        paralelo: data.tasaParalelo,
        binance_p2p: data.tasaBinanceP2P,
        euro: data.tasaEuro,
        fetchedAt: data.usdFetchedAt,
      });
    }
  }, [data.tasaBCV, data.tasaParalelo, data.tasaBinanceP2P, data.tasaEuro, data.usdFetchedAt]);

  // ─── Retry automático con backoff cuando estamos offline ──────
  const retryRef = useRef(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    if (offlineMode) {
      retryCountRef.current = 0;
      const tryReconnect = async () => {
        retryCountRef.current++;
        if (retryCountRef.current > 10) return;
        try {
          const { data: result, fromCache } = await fetchWithOfflineFallback();
          if (result && !fromCache) {
            if (cancelled) return;
            setData(result);
            setOfflineMode(false);
            setOfflineCachedAt(null);
            setError(null);
            retryCountRef.current = 0;
          }
        } catch {}
        if (cancelled) return;
        const delay = Math.min(30000 * Math.pow(1.5, retryCountRef.current - 1), 300000);
        retryRef.current = setTimeout(tryReconnect, delay);
      };
      retryRef.current = setTimeout(tryReconnect, 30000);
    }
    return () => {
      cancelled = true;
      if (retryRef.current) {
        clearTimeout(retryRef.current);
        retryRef.current = null;
      }
      retryCountRef.current = 0;
    };
  }, [offlineMode]);

  const onRefresh = () => {
    loadRates(true);
  };

  const handleEditBCVLunes = () => {
    setEditValue(tasaBCVLunes ? String(tasaBCVLunes) : '');
    setModalVisible(true);
  };

  const handleSaveBCVLunes = () => {
    // Normaliza formato español (ej: "28.028,33" → 28028.33)
    const normalized = editValue.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed) && parsed > 0) {
      setTasaBCVLunes(parsed);
      const now = new Date().toISOString();
      setBcvLunesUpdatedAt(now);
      setStoredBCVLunes(parsed);
      const todayKey = getTodayKey();
      saveHistoricalRate(todayKey, { bcv: parsed });
      // La notificación semanal se re-agenda sola en ensureReminderScheduled al abrir la app
    } else {
      setTasaBCVLunes(null);
      setBcvLunesUpdatedAt(null);
      setStoredBCVLunes(null);
    }
    setModalVisible(false);
  };

  const brecha =
    data.tasaBCV != null && data.tasaParalelo != null
      ? ((data.tasaParalelo - data.tasaBCV) / data.tasaBCV) * 100
      : null;

  const brechaLunes =
    tasaBCVLunes != null && data.tasaParalelo != null
      ? ((data.tasaParalelo - tasaBCVLunes) / tasaBCVLunes) * 100
      : null;

  const translateY = useMemo(() => fadeAnim.interpolate({ inputRange: [0.85, 1], outputRange: [15, 0] }), [fadeAnim]);
  const brechaColor =
    brecha !== null
      ? brecha > 15
        ? C.highlight
        : brecha > 8
        ? C.warning
        : C.success
      : C.textMuted;

  const brechaLunesColor =
    brechaLunes !== null
      ? brechaLunes > 15
        ? C.highlight
        : brechaLunes > 8
        ? C.warning
        : C.success
      : C.textMuted;

  const bcvLunesColor = C.bcvLunes;


  const handleToggleReminder = async (value) => {
    if (value) {
      const success = await scheduleFridayReminder(bcvLunesUpdatedAt);
      if (success) {
        setReminderEnabledLocal(true);
        persistReminderEnabled(true);
      } else {
        Alert.alert('Permiso requerido', 'Para activar el recordatorio, debes permitir las notificaciones en la configuración del dispositivo.');
      }
    } else {
      await cancelFridayReminder();
      setReminderEnabledLocal(false);
      persistReminderEnabled(false);
    }
  };

  const formatEditTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Ahora';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `Hace ${diffHour}h`;
      return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <ScreenContainer>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.primary} />
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={[styles.logoContainer, { backgroundColor: C.highlight + '15' }]}>
                <Ionicons name="trending-down" size={18} color={C.highlight} />
              </View>
              <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Tasa del Día</Text>
              <ThemeToggleMini />
              <View style={[styles.headerBadge, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <Text style={styles.headerBadgeText}>🇻🇪</Text>
              </View>
            </View>
            {error && !offlineMode && (
              <View style={[styles.errorBanner, { backgroundColor: C.highlight }]}>
                <Ionicons name="alert-circle" size={12} color="#fff" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            {offlineMode && (
              <View style={[styles.errorBanner, { backgroundColor: C.warning }]}>
                <Ionicons name="cloud-offline-outline" size={12} color="#fff" />
                <Text style={styles.errorText}>
                  Sin conexión — Mostrando últimas tasas disponibles{offlineCachedAt ? ` (${new Date(offlineCachedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })})` : ''}
                </Text>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={C.highlight}
                colors={[C.highlight]}
                progressBackgroundColor={C.secondary}
              />
            }
          >
            <View style={styles.grid}>
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <RateCard title="BCV (Oficial)" rate={data.tasaBCV} icon="bank" color={C.success} loading={loading} updatedAt={data.usdFetchedAt} compact />
                </View>
                <View style={styles.gridCell}>
                  <RateCard title="Paralelo" rate={data.tasaParalelo} icon="trending-up" color={C.highlight} loading={loading} updatedAt={data.usdFetchedAt} compact />
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <RateCard title="Euro (BCV)" rate={data.tasaEuro} icon="globe" color={C.info} loading={loading} updatedAt={data.eurCapturedAt} compact />
                </View>
                <View style={styles.gridCell}>
                  <RateCard title="Binance P2P" rate={data.tasaBinanceP2P} icon="logo-bitcoin" color={C.warning} loading={loading} updatedAt={data.usdFetchedAt} compact />
                </View>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <View style={{ flex: 1 }}>
                    <RateCard title="BCV (Lunes)" rate={tasaBCVLunes} icon="calendar" color={bcvLunesColor} loading={false} compact onEdit={handleEditBCVLunes} />
                    {bcvLunesUpdatedAt && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 1, gap: 4 }}>
                        <Ionicons name="time-outline" size={8} color={C.textMuted} />
                        <Text style={{ fontSize: 9, color: C.textMuted }}>{formatEditTime(bcvLunesUpdatedAt)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.gridCell}>
                  <View style={{
                    flex: 1,
                    backgroundColor: C.cardBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.cardBorder,
                    padding: 10,
                    justifyContent: 'center',
                    minHeight: 80,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.3 }}>Recordatorio</Text>
                        <Text style={{ fontSize: 9, color: C.textMuted, marginTop: 1 }}>Vie 6:00 PM</Text>
                      </View>
                      <Switch
                        value={reminderEnabled}
                        onValueChange={handleToggleReminder}
                        trackColor={{ false: C.inputBg, true: bcvLunesColor + '60' }}
                        thumbColor={reminderEnabled ? bcvLunesColor : C.textMuted}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>


            <View style={styles.bottomBar}>
              <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
                {brecha !== null && (
                  <View style={[styles.brechaChip, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                    <Ionicons name="git-compare-outline" size={12} color={brechaColor} />
                    <Text style={[styles.brechaText, { color: brechaColor }]}>BCV: {brecha.toFixed(1)}%</Text>
                  </View>
                )}
                {brechaLunes !== null && (
                  <View style={[styles.brechaChip, { backgroundColor: C.cardBg, borderColor: bcvLunesColor + '40' }]}>
                    <Ionicons name="calendar" size={12} color={bcvLunesColor} />
                    <Text style={[styles.brechaText, { color: brechaLunesColor }]}>Lunes: {brechaLunes.toFixed(1)}%</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.updateText, { color: C.textMuted }]}>
                {data.usdFetchedAt
                  ? new Date(data.usdFetchedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </Text>
            </View>
            {/* ⛽ Gasolina (BCV) */}
            {data.tasaBCV !== null && data.tasaBCV !== undefined && (
              <View style={{
                backgroundColor: C.cardBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: C.cardBorder,
                padding: 12,
                marginTop: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="flame" size={16} color={C.warning} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary }}>Gasolina (BCV)</Text>
                </View>
                <Text style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>$0,50 USD/L — Tasa BCV</Text>
                {[1, 5, 10, 20, 30].map(litros => {
                  const precioBs = litros * 0.50 * data.tasaBCV;
                  return (
                    <View key={litros} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: C.textSecondary }}>{litros}L</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary, fontVariant: ['tabular-nums'] }}>
                        Bs. {precioBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>


          <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
            <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={{ backgroundColor: C.secondary, borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: C.cardBorder }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 }}>BCV (Lunes)</Text>
                <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>Ingresa la tasa publicada por el BCV para el lunes</Text>
                <TextInput
                  style={{ backgroundColor: C.inputBg, borderRadius: 12, padding: 14, fontSize: 20, fontWeight: '600', color: C.textPrimary, textAlign: 'center', borderWidth: 1, borderColor: C.inputBorder, fontVariant: ['tabular-nums'] }}
                  placeholder="0,00"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  value={editValue}
                  onChangeText={setEditValue}
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.inputBg, alignItems: 'center' }} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: C.textMuted }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: bcvLunesColor, alignItems: 'center' }} onPress={handleSaveBCVLunes} activeOpacity={0.8}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Guardar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </Animated.View>
      </SafeAreaView>
    </ScreenContainer>
  );
}
