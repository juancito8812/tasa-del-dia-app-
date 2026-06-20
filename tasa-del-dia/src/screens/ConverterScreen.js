import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Animated,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import ThemeToggleMini from '../components/ThemeToggleMini';
import { fetchWithOfflineFallback, getStoredBCVLunes } from '../services/api';
import AutoRefreshBar from '../components/AutoRefreshBar';
import useAutoRefresh from '../hooks/useAutoRefresh';

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000];
const TAB_BAR_HEIGHT = 60;

/**
 * Extrae solo los dígitos (y punto decimal) de un texto formateado.
 * Maneja formato español (ej: "28.028,33"), inglés ("28,028.33"),
 * y escritura en vivo donde la coma indica inicio de decimales.
 */
function extractRawDigits(text) {
  if (!text) return '';
  const dotCount = (text.match(/\./g) || []).length;
  const commaCount = (text.match(/,/g) || []).length;

  if (dotCount > 0 && commaCount > 0) {
    // Ambos separadores → el último es el decimal
    const lastDot = text.lastIndexOf('.');
    const lastComma = text.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Español: coma es decimal
      const parts = text.split(',');
      const intPart = parts[0].replace(/[^0-9]/g, '');
      const decPart = (parts[1] || '').replace(/[^0-9]/g, '').slice(0, 2);
      return decPart ? `${intPart}.${decPart}` : intPart + '.';
    } else {
      // Inglés: punto es decimal
      const parts = text.split('.');
      const intPart = parts[0].replace(/[^0-9]/g, '');
      const decPart = (parts[1] || '').replace(/[^0-9]/g, '').slice(0, 2);
      return decPart ? `${intPart}.${decPart}` : intPart + '.';
    }
  }

  if (commaCount > 0) {
    // Solo comas → la última coma es decimal (formato español)
    if (text.endsWith(',')) {
      const intPart = text.slice(0, -1).replace(/[^0-9]/g, '');
      return intPart + '.';
    }
    const parts = text.split(',');
    const intPart = parts.slice(0, -1).join('').replace(/[^0-9]/g, '');
    const decPart = parts[parts.length - 1].replace(/[^0-9]/g, '').slice(0, 2);
    return decPart ? `${intPart}.${decPart}` : intPart;
  }

  // Sin comas: si hay múltiples puntos, tratar como formato español
  // (ej: "28.02833" cuando Android elimina la coma "28.028,33")
  if (dotCount > 1) {
    const lastIndex = text.lastIndexOf('.');
    let cleaned = text.replace(/\./g, '');
    cleaned = cleaned.slice(0, lastIndex) + '.' + cleaned.slice(lastIndex);
    const dotPos = cleaned.indexOf('.');
    const intPart = cleaned.slice(0, dotPos);
    const decPart = cleaned.slice(dotPos + 1).slice(0, 2);
    return decPart ? `${intPart}.${decPart}` : intPart;
  }

  // Un solo punto: puede ser decimal (usuario escribiendolo) o miles (auto-formato)
  // Si hay 3+ dígitos después del punto, es miles del auto-formato (ej: "28.028" → 28028)
  // Si hay 0-2 dígitos, es decimal (ej: "25.36" → 25.36)
  if (dotCount === 1) {
    const parts = text.split('.');
    const afterDot = parts[1] || '';
    const digitsAfterDot = afterDot.replace(/[^0-9]/g, '');
    // Auto-formato de miles: el punto separa grupos de 3 dígitos
    if (digitsAfterDot.length >= 3) {
      return text.replace(/[^0-9]/g, '');
    }
    // Decimal: preservar el punto con hasta 2 decimales
    const intPart = parts[0].replace(/[^0-9]/g, '');
    const decPart = digitsAfterDot.slice(0, 2);
    if (text.endsWith('.')) return intPart + '.';
    return decPart ? `${intPart}.${decPart}` : intPart;
  }

  // Sin separadores: solo extraer dígitos
  return text.replace(/[^0-9]/g, '');
}

/**
 * Formatea un string de dígitos crudos a formato español con separadores de miles.
 * Ej: "28028" → "28.028", "28028.33" → "28.028,33", "28028." → "28.028,"
 */
function formatRawDisplay(raw) {
  if (!raw) return '';
  const dotIndex = raw.indexOf('.');
  if (dotIndex !== -1) {
    const intPart = raw.slice(0, dotIndex);
    const decPart = raw.slice(dotIndex + 1);
    const intNum = parseInt(intPart, 10);
    const formattedInt = isNaN(intNum) ? intPart : intNum.toLocaleString('es-VE');
    // Si no hay decimales (coma recién escrita), mostrar coma al final
    return decPart === '' ? `${formattedInt},` : `${formattedInt},${decPart}`;
  }
  const num = parseInt(raw, 10);
  if (isNaN(num)) return raw;
  return num.toLocaleString('es-VE');
}

function getRateTypes(C) {
  return [
    { key: 'bcv', label: 'BCV (Oficial)', color: C.success },
    { key: 'paralelo', label: 'Paralelo', color: C.highlight },
    { key: 'binance_p2p', label: 'Binance P2P', color: C.warning },
    { key: 'euro', label: 'Euro (BCV)', color: C.info },
    { key: 'bcv_lunes', label: 'BCV (Lunes)', color: C.bcvLunes || '#a855f7' },
  ];
}

function createStyles(C) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: C.primary,
    },
    container: {
      flex: 1,
      backgroundColor: C.primary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 12,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 8,
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
      color: C.textPrimary,
      letterSpacing: 0.5,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: C.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 10,
    },
    converterCard: {
      backgroundColor: C.cardBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
      overflow: 'hidden',
      marginBottom: 12,
    },
    cardGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      opacity: 0.5,
    },
    modeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 14,
      backgroundColor: C.inputBg,
      borderRadius: 12,
      padding: 4,
    },
    modeSide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    modeText: {
      fontSize: 13,
      fontWeight: '600',
      color: C.textMuted,
    },
    swapCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: C.cardBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    displayContainer: {
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 8,
    },
    displayLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: C.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    displayValue: {
      fontSize: 38,
      fontWeight: '800',
      letterSpacing: 1,
      fontVariant: ['tabular-nums'],
    },
    displaySubtext: {
      fontSize: 12,
      color: C.textMuted,
      marginTop: 2,
      letterSpacing: 0.5,
    },
    copiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    copiedBadgeText: {
      fontSize: 11,
      color: C.success,
      fontWeight: '600',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.inputBorder,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    inputContainerFocused: {
      borderColor: C.highlight + '50',
      backgroundColor: C.secondary,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 18,
      fontWeight: '600',
      color: C.textPrimary,
      textAlign: 'left',
      fontVariant: ['tabular-nums'],
    },
    quickRow: {
      marginBottom: 12,
    },
    quickContent: {
      gap: 6,
      paddingRight: 4,
    },
    quickChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.cardBorder,
    },
    quickChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: C.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    convertButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      paddingVertical: 14,
      gap: 8,
      shadowColor: C.highlight,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    convertButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    inlineResult: {
      marginTop: 0,
    },
    resultDivider: {
      height: 1,
      backgroundColor: C.cardBorder,
      marginVertical: 14,
    },
    resultLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: C.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: 10,
      textAlign: 'center',
    },
    resultContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 10,
    },
    resultItem: {
      alignItems: 'center',
      flex: 1,
    },
    resultItemLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: C.textMuted,
      marginBottom: 3,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    resultItemValue: {
      fontSize: 22,
      fontWeight: '800',
      color: C.textPrimary,
      fontVariant: ['tabular-nums'],
    },
    resultArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultMeta: {
      fontSize: 10,
      color: C.textMuted,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    rateSelector: {
      marginBottom: 12,
      gap: 6,
    },
    rateOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
      gap: 10,
      overflow: 'hidden',
    },
    rateActiveBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      borderTopLeftRadius: 14,
      borderBottomLeftRadius: 14,
    },
    rateDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    rateOptionText: {
      flex: 1,
    },
    rateOptionLabel: {
      fontSize: 13,
      color: C.textSecondary,
      letterSpacing: 0.2,
    },
    rateOptionValue: {
      fontSize: 11,
      color: C.textMuted,
      marginTop: 1,
    },
    spreadCard: {
      backgroundColor: C.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.cardBorder,
      padding: 12,
    },
    spreadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    spreadTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    spreadTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: C.textMuted,
      letterSpacing: 0.3,
    },
    spreadPercent: {
      fontSize: 16,
      fontWeight: '800',
    },
    spreadBarBg: {
      height: 4,
      backgroundColor: C.inputBg,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 10,
    },
    spreadBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    spreadStats: {
      gap: 4,
    },
    spreadStat: {
      fontSize: 11,
      color: C.textMuted,
      letterSpacing: 0.2,
    },
  });
}

export default function ConverterScreen() {
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => createStyles(C), [C]);
  const RATE_TYPES = useMemo(() => getRateTypes(C), [C]);

  const [rates, setRates] = useState({ bcv: null, paralelo: null, euro: null, binance_p2p: null, bcv_lunes: null });
  const [selectedRate, setSelectedRate] = useState('bcv');
  const [rawAmount, setRawAmount] = useState('');
  const [mode, setMode] = useState('usd-to-bs');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [copiedType, setCopiedType] = useState(null);
  const [pasteFeedback, setPasteFeedback] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineCachedAt, setOfflineCachedAt] = useState(null);
  const insets = useSafeAreaInsets();

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
  const inputRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const pasteTimeoutRef = useRef(null);

  const loadRates = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const [result, bcvLunesData] = await Promise.all([
        fetchWithOfflineFallback(),
        getStoredBCVLunes(),
      ]);

      const { data: apiData, fromCache, error: fetchError, cacheInfo } = result;

      if (fromCache && apiData) {
        // Using cached data (offline mode)
        setRates({
          bcv: apiData.tasaBCV,
          paralelo: apiData.tasaParalelo,
          euro: apiData.tasaEuro,
          binance_p2p: apiData.tasaBinanceP2P,
          bcv_lunes: bcvLunesData.value,
        });
        setOfflineMode(true);
        setOfflineCachedAt(cacheInfo?.cachedAt || null);
      } else if (apiData) {
        // Fresh data from API
        setRates({
          bcv: apiData.tasaBCV,
          paralelo: apiData.tasaParalelo,
          euro: apiData.tasaEuro,
          binance_p2p: apiData.tasaBinanceP2P,
          bcv_lunes: bcvLunesData.value,
        });
        setOfflineMode(false);
        setOfflineCachedAt(null);
      }

      if (fetchError && !fromCache) {
        Alert.alert('Error', 'No se pudieron cargar las tasas: ' + fetchError);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar las tasas: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const mounted = { current: true };
    loadRates();
    return () => { mounted.current = false; };
  }, [loadRates]);

  // Recargar BCV Lunes cada vez que se enfoca la pestaña (sincronización con RatesScreen)
  useFocusEffect(
    useCallback(() => {
      const mounted = { current: true };
      getStoredBCVLunes().then((data) => {
        if (mounted.current) {
          setRates((prev) => ({ ...prev, bcv_lunes: data.value }));
        }
      });
      return () => { mounted.current = false; };
    }, [])
  );

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const { countdown, resetCountdown } = useAutoRefresh(useCallback(() => loadRates(true), [loadRates]));
  const getCurrentRate = () => rates[selectedRate];

  const handleConvert = () => {
    Keyboard.dismiss();
    const numericAmount = parseFloat(rawAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) { Alert.alert('Error', 'Ingresa un monto válido'); return; }
    const rate = getCurrentRate();
    if (!rate) { Alert.alert('Error', 'La tasa seleccionada no está disponible'); return; }
    setResult({ amount: numericAmount, rate, converted: mode === 'usd-to-bs' ? numericAmount * rate : numericAmount / rate });
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setRawAmount(extractRawDigits(text));
        inputRef.current?.focus();
        setPasteFeedback(true);
        if (pasteTimeoutRef.current) clearTimeout(pasteTimeoutRef.current);
        pasteTimeoutRef.current = setTimeout(() => setPasteFeedback(false), 1200);
      }
    } catch {}
  };

  const handleQuickAmount = (val) => { setRawAmount(String(val)); inputRef.current?.focus(); };
  const formatCurrency = (v) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const getRateLabel = () => RATE_TYPES.find((r) => r.key === selectedRate)?.label || '';
  const getCurrentColor = () => RATE_TYPES.find((r) => r.key === selectedRate)?.color || C.accent;

  const handleCopy = async (text, type) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedType(type);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedType(null), 1500);
    } catch {}
  };

  const handleSwapMode = () => { setMode((p) => (p === 'usd-to-bs' ? 'bs-to-usd' : 'usd-to-bs')); setResult(null); setRawAmount(''); };

  const spreadBcv = (() => {
    const { bcv, paralelo } = rates;
    if (!bcv || !paralelo) return null;
    const diff = paralelo - bcv;
    const diffPercent = (diff / bcv) * 100;
    const isHigh = diffPercent > 15;
    const isMedium = diffPercent > 8;
    return { diff, diffPercent, barPercent: Math.min((diffPercent / 30) * 100, 100), barColor: isHigh ? C.highlight : isMedium ? C.warning : C.success };
  })();

  const spreadLunes = (() => {
    const { bcv_lunes, paralelo } = rates;
    if (!bcv_lunes || !paralelo) return null;
    const diff = paralelo - bcv_lunes;
    const diffPercent = (diff / bcv_lunes) * 100;
    const isHigh = diffPercent > 15;
    const isMedium = diffPercent > 8;
    return { diff, diffPercent, barPercent: Math.min((diffPercent / 30) * 100, 100), barColor: isHigh ? C.highlight : isMedium ? C.warning : C.success };
  })();

  const bcvLunesColor = C.bcvLunes || '#a855f7';

  const handleChangeText = (text) => { setRawAmount(extractRawDigits(text)); };
  const displayAmount = rawAmount ? formatRawDisplay(rawAmount) : '';

  const currentColor = getCurrentColor();
  const numericAmount = parseFloat(rawAmount) || 0;

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.primary} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT + insets.bottom : 0}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} keyboardDismissMode="interactive"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadRates(true); resetCountdown(); }} tintColor={C.highlight} colors={[C.highlight]} progressBackgroundColor={C.secondary} />}>
          <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0.85, 1], outputRange: [15, 0] }) }] }}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={[styles.logoContainer, { backgroundColor: C.highlight + '15' }]}>
                <Ionicons name="swap-horizontal" size={18} color={C.highlight} />
              </View>
              <Text style={styles.headerTitle}>Conversor</Text>
              <View style={{ flex: 1 }} />
              <ThemeToggleMini />
            </View>
            {offlineMode && (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.warning, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 6, marginTop: 6 }}>
                <Ionicons name="cloud-offline-outline" size={12} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 11, flex: 1 }}>
                  Sin conexión — Mostrando últimas tasas{offlineCachedAt ? ` (${new Date(offlineCachedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })})` : ''}
                </Text>
              </View>
            )}
          </View>

          <AutoRefreshBar countdown={countdown} compact />

          <View style={styles.converterCard}>
            <View style={[styles.cardGlow, { backgroundColor: currentColor }]} />
            <TouchableOpacity style={styles.modeToggle} onPress={handleSwapMode} activeOpacity={0.7}>
              <View style={[styles.modeSide, mode === 'usd-to-bs' && { backgroundColor: currentColor + '20', borderColor: currentColor + '40' }]}>
                <Ionicons name="logo-usd" size={16} color={mode === 'usd-to-bs' ? currentColor : C.textMuted} />
                <Text style={[styles.modeText, mode === 'usd-to-bs' && { color: currentColor, fontWeight: '700' }]}>USD</Text>
              </View>
              <View style={styles.swapCircle}><Ionicons name="swap-horizontal" size={16} color={C.textMuted} /></View>
              <View style={[styles.modeSide, mode === 'bs-to-usd' && { backgroundColor: currentColor + '20', borderColor: currentColor + '40' }]}>
                <Text style={[styles.modeText, mode === 'bs-to-usd' && { color: currentColor, fontWeight: '700' }]}>Bs.</Text>
                <Ionicons name="cash" size={16} color={mode === 'bs-to-usd' ? currentColor : C.textMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.displayContainer} activeOpacity={0.7} onPress={() => { if (rawAmount) handleCopy(`${mode === 'usd-to-bs' ? 'USD ' : 'Bs. '}${formatCurrency(numericAmount)}`, 'amount'); }}>
              <Text style={styles.displayLabel}>{copiedType === 'amount' ? '¡Copiado!' : mode === 'usd-to-bs' ? 'Dólares (USD)' : 'Bolívares (Bs.)'}</Text>
              <Text style={[styles.displayValue, { color: copiedType === 'amount' ? C.success : currentColor }]}>{rawAmount ? displayAmount : '0,00'}</Text>
              {rawAmount.length > 0 && copiedType !== 'amount' && <Text style={styles.displaySubtext}>{mode === 'usd-to-bs' ? `× ${getRateLabel().split(' ')[0]} =` : `÷ ${getRateLabel().split(' ')[0]} =`}</Text>}
              {copiedType === 'amount' && <View style={[styles.copiedBadge, { backgroundColor: C.success + '15' }]}><Ionicons name="checkmark" size={12} color={C.success} /><Text style={styles.copiedBadgeText}>Copiado al portapapeles</Text></View>}
            </TouchableOpacity>

            <View style={[styles.inputContainer, isKeyboardVisible && styles.inputContainerFocused]}>
              <Ionicons name={mode === 'usd-to-bs' ? 'logo-usd' : 'cash'} size={16} color={C.textMuted} style={styles.inputIcon} />
              <TextInput ref={inputRef} style={[styles.input, { borderColor: currentColor + '30' }]} placeholder="0.00" placeholderTextColor={C.textMuted} keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'} value={rawAmount} onChangeText={handleChangeText} returnKeyType="done" onSubmitEditing={handleConvert} />
              <TouchableOpacity onPress={handlePaste} activeOpacity={0.6} style={{ paddingLeft: 8, paddingVertical: 4 }}>
                <View style={{ backgroundColor: pasteFeedback ? (C.success + '20') : (currentColor + '20'), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name={pasteFeedback ? 'checkmark-circle' : 'clipboard'} size={13} color={pasteFeedback ? C.success : currentColor} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: pasteFeedback ? C.success : currentColor }}>{pasteFeedback ? '¡Pegado!' : 'Pegar'}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
              {QUICK_AMOUNTS.map((val) => (
                <TouchableOpacity key={val} style={[styles.quickChip, numericAmount === val && { backgroundColor: currentColor + '20', borderColor: currentColor }]} onPress={() => handleQuickAmount(val)} activeOpacity={0.7}>
                  <Text style={[styles.quickChipText, numericAmount === val && { color: currentColor, fontWeight: '700' }]}>{val.toLocaleString('es-VE')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.convertButton, { backgroundColor: currentColor }]} onPress={handleConvert} activeOpacity={0.8}>
              <Ionicons name="calculator" size={18} color="#fff" /><Text style={styles.convertButtonText}>Convertir</Text>
            </TouchableOpacity>

            {result && (
              <View style={styles.inlineResult}>
                <View style={styles.resultDivider} />
                <Text style={styles.resultLabel}>Resultado</Text>
                <View style={styles.resultContent}>
                  <TouchableOpacity style={styles.resultItem} activeOpacity={0.7} onPress={() => handleCopy(formatCurrency(result.amount), 'result-source')}>
                    <Text style={styles.resultItemLabel}>{copiedType === 'result-source' ? '¡Copiado!' : (mode === 'usd-to-bs' ? 'USD' : 'Bs.')}</Text>
                    <Text style={[styles.resultItemValue, copiedType === 'result-source' && { color: C.success }]}>{formatCurrency(result.amount)}</Text>
                  </TouchableOpacity>
                  <View style={styles.resultArrow}><Ionicons name="arrow-forward" size={16} color={C.textMuted} /></View>
                  <TouchableOpacity style={styles.resultItem} activeOpacity={0.7} onPress={() => handleCopy(formatCurrency(result.converted), 'result-target')}>
                    <Text style={styles.resultItemLabel}>{copiedType === 'result-target' ? '¡Copiado!' : (mode === 'usd-to-bs' ? 'Bs.' : 'USD')}</Text>
                    <Text style={[styles.resultItemValue, { color: copiedType === 'result-target' ? C.success : currentColor }]}>{formatCurrency(result.converted)}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handleCopy(`Bs. ${formatCurrency(result.rate)}`, 'rate')}>
                  <Text style={styles.resultMeta}>Tasa: {getRateLabel()} — <Text style={{ fontWeight: '700' }}>{copiedType === 'rate' ? '¡Copiado!' : `Bs. ${formatCurrency(result.rate)}`}</Text></Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>Tasa a usar</Text>
          <View style={styles.rateSelector}>
            {RATE_TYPES.map((rt) => {
              const isActive = selectedRate === rt.key;
              const rateVal = rates[rt.key];
              return (
                <TouchableOpacity key={rt.key} style={[styles.rateOption, isActive && { backgroundColor: rt.color + '12', borderColor: rt.color }]} activeOpacity={0.7} onPress={() => { setSelectedRate(rt.key); setResult(null); }}>
                  {isActive && <View style={[styles.rateActiveBar, { backgroundColor: rt.color }]} />}
                  <View style={[styles.rateDot, { backgroundColor: isActive ? rt.color : 'rgba(255,255,255,0.15)' }]} />
                  <View style={styles.rateOptionText}>
                    <Text style={[styles.rateOptionLabel, isActive && { color: C.textPrimary, fontWeight: '700' }]}>{rt.label}</Text>
                    <Text style={styles.rateOptionValue}>{rateVal ? `Bs. ${formatCurrency(rateVal)}` : 'Cargando...'}</Text>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={18} color={rt.color} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {!loading && spreadBcv && (
            <View style={styles.spreadCard}>
              <View style={styles.spreadHeader}>
                <View style={styles.spreadTitleRow}><Ionicons name="git-compare" size={13} color={C.textSecondary} /><Text style={styles.spreadTitle}>Brecha BCV vs Paralelo</Text></View>
                <Text style={[styles.spreadPercent, { color: spreadBcv.barColor }]}>{spreadBcv.diffPercent.toFixed(1)}%</Text>
              </View>
              <View style={styles.spreadBarBg}><View style={[styles.spreadBarFill, { width: `${spreadBcv.barPercent}%`, backgroundColor: spreadBcv.barColor }]} /></View>
              <View style={styles.spreadStats}>
                <Text style={styles.spreadStat}>BCV: <Text style={{ color: C.success, fontWeight: '700' }}>Bs. {formatCurrency(rates.bcv)}</Text></Text>
                <Text style={styles.spreadStat}>Paralelo: <Text style={{ color: C.highlight, fontWeight: '700' }}>Bs. {formatCurrency(rates.paralelo)}</Text></Text>
                <Text style={styles.spreadStat}>Diferencia: <Text style={{ color: spreadBcv.barColor, fontWeight: '700' }}>Bs. {formatCurrency(spreadBcv.diff)}</Text></Text>
              </View>
            </View>
          )}

          {!loading && spreadLunes && (
            <View style={[styles.spreadCard, { marginTop: 8 }]}>
              <View style={styles.spreadHeader}>
                <View style={styles.spreadTitleRow}><Ionicons name="calendar" size={13} color={bcvLunesColor} /><Text style={styles.spreadTitle}>Brecha BCV (Lunes) vs Paralelo</Text></View>
                <Text style={[styles.spreadPercent, { color: spreadLunes.barColor }]}>{spreadLunes.diffPercent.toFixed(1)}%</Text>
              </View>
              <View style={styles.spreadBarBg}><View style={[styles.spreadBarFill, { width: `${spreadLunes.barPercent}%`, backgroundColor: spreadLunes.barColor }]} /></View>
              <View style={styles.spreadStats}>
                <Text style={styles.spreadStat}>BCV (Lunes): <Text style={{ color: bcvLunesColor, fontWeight: '700' }}>Bs. {formatCurrency(rates.bcv_lunes)}</Text></Text>
                <Text style={styles.spreadStat}>Paralelo: <Text style={{ color: C.highlight, fontWeight: '700' }}>Bs. {formatCurrency(rates.paralelo)}</Text></Text>
                <Text style={styles.spreadStat}>Diferencia: <Text style={{ color: spreadLunes.barColor, fontWeight: '700' }}>Bs. {formatCurrency(spreadLunes.diff)}</Text></Text>
              </View>
            </View>
          )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
