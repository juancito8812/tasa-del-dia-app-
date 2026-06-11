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
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import ThemeToggleMini from '../components/ThemeToggleMini';
import { fetchWithOfflineFallback, getStoredBCVLunes, setStoredBCVLunes, getReminderEnabled, setReminderEnabled, getHistoricalRates, saveHistoricalRate, setManualHistoricalRate, getTodayKey, formatDateKey } from '../services/api';
import { scheduleFridayReminder, cancelFridayReminder, rescheduleIfEnteredToday, ensureReminderScheduled } from '../services/notifications';
import RateCard from '../components/RateCard';
import AutoRefreshBar from '../components/AutoRefreshBar';
import useAutoRefresh from '../hooks/useAutoRefresh';

function createStyles(C) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: C.primary,
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

export default function RatesScreen() {
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
  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineCachedAt, setOfflineCachedAt] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Historial de tasas
  const [historicalRates, setHistoricalRates] = useState({});
  const [histModalVisible, setHistModalVisible] = useState(false);
  const [histDate, setHistDate] = useState(new Date());
  const [histDateKey, setHistDateKey] = useState(null);
  const [histShowPicker, setHistShowPicker] = useState(false);
  const [histManualModal, setHistManualModal] = useState(false);
  const [histManualValues, setHistManualValues] = useState({ bcv: '', paralelo: '', euro: '' });

  // Animación fade-in al cambiar de pestaña
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0.85);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

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
    loadRates();
    getStoredBCVLunes().then((data) => {
      setTasaBCVLunes(data.value);
      setBcvLunesUpdatedAt(data.updatedAt);
    });
    getReminderEnabled().then((enabled) => {
      setReminderEnabledState(enabled);
      if (enabled) {
        ensureReminderScheduled();
      }
    });
    // Cargar historial de tasas
    getHistoricalRates().then(setHistoricalRates);
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
      }).then(() => {
        // Actualizar state local con datos frescos (incluso si ya existían)
        setHistoricalRates((prev) => ({ ...prev, [todayKey]: { bcv: data.tasaBCV, paralelo: data.tasaParalelo, binance_p2p: data.tasaBinanceP2P, euro: data.tasaEuro, fetchedAt: data.usdFetchedAt } }));
      });
    }
  }, [data.tasaBCV, data.tasaParalelo, data.tasaBinanceP2P, data.tasaEuro, data.usdFetchedAt]);

  const onRefresh = () => {
    loadRates(true);
    resetCountdown();
  };

  const { countdown, resetCountdown } = useAutoRefresh(
    useCallback(() => loadRates(true), [loadRates])
  );

  const handleEditBCVLunes = () => {
    setEditValue(tasaBCVLunes ? String(tasaBCVLunes) : '');
    setModalVisible(true);
  };

  const handleSaveBCVLunes = () => {
    const parsed = parseFloat(editValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      setTasaBCVLunes(parsed);
      const now = new Date().toISOString();
      setBcvLunesUpdatedAt(now);
      setStoredBCVLunes(parsed);
      // Si el recordatorio está activo y hoy es viernes, reagendar para próximo viernes
      if (reminderEnabled) {
        rescheduleIfEnteredToday(now);
      }
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

  const bcvLunesColor = C.bcvLunes || '#a855f7';

  // Helper para renderizar una tasa en el modal histórico
  const renderHistRate = (label, value, color) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 10, padding: 10, gap: 10 }}>
      <View style={{ width: 3, height: 24, borderRadius: 1.5, backgroundColor: color }} />
      <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: C.textSecondary }}>{label}</Text>
      {value != null ? (
        <Text style={{ fontSize: 14, fontWeight: '800', color, fontVariant: ['tabular-nums'] }}>
          Bs. {Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      ) : (
        <Text style={{ fontSize: 12, color: C.textMuted }}>—</Text>
      )}
    </View>
  );

  // Componente inline para campo de entrada manual de tasas
  const HistManualField = ({ label, value, onChange, color }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: C.textMuted, marginBottom: 4, letterSpacing: 0.3 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 10, borderWidth: 1, borderColor: C.cardBorder, paddingHorizontal: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color, marginRight: 6 }}>Bs.</Text>
        <TextInput
          style={{ flex: 1, paddingVertical: 10, fontSize: 16, fontWeight: '600', color: C.textPrimary, fontVariant: ['tabular-nums'] }}
          placeholder="0,00"
          placeholderTextColor={C.textMuted}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChange}
        />
      </View>
    </View>
  );

  const handleToggleReminder = async (value) => {
    if (value) {
      const success = await scheduleFridayReminder(bcvLunesUpdatedAt);
      if (success) {
        setReminderEnabledState(true);
        setReminderEnabled(true);
      } else {
        Alert.alert('Permiso requerido', 'Para activar el recordatorio, debes permitir las notificaciones en la configuración del dispositivo.');
      }
    } else {
      await cancelFridayReminder();
      setReminderEnabledState(false);
      setReminderEnabled(false);
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.primary} />
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0.85, 1], outputRange: [15, 0] }) }] }]}>
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

        <AutoRefreshBar countdown={countdown} compact />

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

          {/* ─── Tasas Históricas ─── */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setHistDate(new Date());
              setHistDateKey(null);
              setHistModalVisible(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.cardBg,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.cardBorder,
              padding: 14,
              marginTop: 8,
              gap: 12,
            }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: C.info + '18',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Ionicons name="calendar-outline" size={18} color={C.info} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.3 }}>
                Tasas Históricas
              </Text>
              <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
                {Object.keys(historicalRates).length > 0
                  ? `${Object.keys(historicalRates).length} fechas guardadas · Toca para consultar`
                  : 'Toca para consultar o guardar tasas de una fecha anterior'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
          </TouchableOpacity>

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
        </ScrollView>

        {/* ─── Modal Historial ─── */}
        <Modal visible={histModalVisible} transparent animationType="fade" onRequestClose={() => setHistModalVisible(false)}>
          <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ backgroundColor: C.secondary, borderRadius: 20, padding: 24, width: '90%', borderWidth: 1, borderColor: C.cardBorder, maxHeight: '90%' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 }}>Tasas Históricas</Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>Ingresa una fecha para ver las tasas de ese día</Text>

              {/* Selector de fecha nativo */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: C.inputBg, borderRadius: 12, padding: 14,
                  borderWidth: 1, borderColor: C.inputBorder,
                  marginBottom: 10,
                }}
                onPress={() => setHistShowPicker(true)}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: C.info + '18',
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  <Ionicons name="calendar-outline" size={18} color={C.info} />
                </View>
                <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: histDateKey ? C.textPrimary : C.textMuted }}>
                  {histDateKey ? formatDateKey(histDateKey) : 'Seleccionar fecha'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={C.textMuted} />
              </TouchableOpacity>

              {histShowPicker && (
                <DateTimePicker
                  value={histDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setHistShowPicker(false);
                    if (event.type === 'set' && selectedDate) {
                      setHistDate(selectedDate);
                      setHistDateKey(selectedDate.toISOString().slice(0, 10));
                    }
                  }}
                />
              )}

              {histDateKey && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Ionicons name="calendar" size={14} color={C.info} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.textPrimary }}>{formatDateKey(histDateKey)}</Text>
                    {histDateKey === getTodayKey() && (
                      <View style={{ backgroundColor: C.success + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: C.success }}>HOY</Text>
                      </View>
                    )}
                  </View>

                  {historicalRates[histDateKey] ? (
                    <>
                      {/* Mostrar tasas guardadas */}
                      <View style={{ gap: 6 }}>
                        {renderHistRate('BCV (Oficial)', historicalRates[histDateKey].bcv, C.success)}
                        {renderHistRate('Paralelo', historicalRates[histDateKey].paralelo, C.highlight)}
                        {renderHistRate('Binance P2P', historicalRates[histDateKey].binance_p2p, C.warning)}
                        {renderHistRate('Euro (BCV)', historicalRates[histDateKey].euro, C.info)}
                      </View>
                      {historicalRates[histDateKey].manual && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                          <Ionicons name="create-outline" size={11} color={C.textMuted} />
                          <Text style={{ fontSize: 10, color: C.textMuted }}>Ingresado manualmente</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={{ marginTop: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: C.inputBg, alignItems: 'center' }}
                        onPress={() => {
                          setHistModalVisible(false);
                          const h = historicalRates[histDateKey];
                          setHistManualValues({
                            bcv: h.bcv ? String(h.bcv) : '',
                            paralelo: h.paralelo ? String(h.paralelo) : '',
                            euro: h.euro ? String(h.euro) : '',
                          });
                          setHistManualModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: C.textSecondary }}>Editar tasas</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <View style={{ backgroundColor: C.warning + '12', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="information-circle-outline" size={14} color={C.warning} />
                          <Text style={{ fontSize: 12, color: C.textPrimary, fontWeight: '600', flex: 1 }}>
                            No hay tasas guardadas para esta fecha
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                          Puedes ingresarlas manualmente si conoces las tasas de ese día.
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={{ backgroundColor: C.info, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
                        onPress={() => {
                          setHistModalVisible(false);
                          setHistManualValues({ bcv: '', paralelo: '', euro: '' });
                          setHistManualModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Ingresar tasas manualmente</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}

              <TouchableOpacity
                style={{ marginTop: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: C.inputBg, alignItems: 'center' }}
                onPress={() => setHistModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: C.textMuted }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ─── Modal Ingreso Manual Historial ─── */}
        <Modal visible={histManualModal} transparent animationType="fade" onRequestClose={() => setHistManualModal(false)}>
          <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ backgroundColor: C.secondary, borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: C.cardBorder }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 4 }}>Ingresar tasas</Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>
                {histDateKey ? formatDateKey(histDateKey) : 'Selecciona una fecha primero'}
              </Text>

              <HistManualField label="BCV (Oficial)" value={histManualValues.bcv} onChange={(v) => setHistManualValues((p) => ({ ...p, bcv: v }))} color={C.success} />
              <HistManualField label="Paralelo" value={histManualValues.paralelo} onChange={(v) => setHistManualValues((p) => ({ ...p, paralelo: v }))} color={C.highlight} />
              <HistManualField label="Euro (BCV)" value={histManualValues.euro} onChange={(v) => setHistManualValues((p) => ({ ...p, euro: v }))} color={C.info} />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.inputBg, alignItems: 'center' }} onPress={() => setHistManualModal(false)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.textMuted }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.info, alignItems: 'center' }} onPress={() => {
                  if (!histDateKey) return;
                  const parseVal = (v) => { const n = parseFloat(v.replace(',', '.')); return isNaN(n) ? null : n; };
                  const bcv = parseVal(histManualValues.bcv);
                  const paralelo = parseVal(histManualValues.paralelo);
                  const euro = parseVal(histManualValues.euro);
                  if (bcv === null && paralelo === null && euro === null) {
                    Alert.alert('Error', 'Ingresa al menos una tasa');
                    return;
                  }
                  setManualHistoricalRate(histDateKey, { bcv, paralelo, binance_p2p: null, euro }).then(() => {
                    getHistoricalRates().then(setHistoricalRates);
                    setHistManualModal(false);
                    setHistModalVisible(true);
                    setHistDateKey(histDateKey);
                  });
                }} activeOpacity={0.8}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
  );
}
