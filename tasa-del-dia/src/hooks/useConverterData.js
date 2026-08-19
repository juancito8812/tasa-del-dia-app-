import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Keyboard, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { fetchWithOfflineFallback, loadCacheRates, getStoredBCVLunes } from '../services/api';
import { extractRawDigits, formatRawDisplay, QUICK_USD, QUICK_BS } from '../utils/formatting';

export default function useConverterData() {
  const [rates, setRates] = useState({
    bcv: null, paralelo: null, euro: null, binance_p2p: null, bcv_lunes: null,
  });
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
  const [gasLitros, setGasLitros] = useState('');

  const gasLitrosNum = useMemo(() => parseFloat(gasLitros) || 0, [gasLitros]);
  const inputRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const pasteTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const loadRates = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Fase 1 — SWR: mostrar la caché guardada al instante (sin banner
      // offline) mientras la red revalida en background.
      const cache = await loadCacheRates();
      if (cache && (cache.tasaBCV !== null || cache.tasaParalelo !== null) && mountedRef.current) {
        setRates({
          bcv: cache.tasaBCV, paralelo: cache.tasaParalelo,
          euro: cache.tasaEuro, binance_p2p: cache.tasaBinanceP2P,
          bcv_lunes: null,
        });
        setLoading(false);
        setRefreshing(false);
      }

      const [result, bcvLunesData] = await Promise.all([
        fetchWithOfflineFallback(),
        getStoredBCVLunes(),
      ]);
      if (!mountedRef.current) return;

      const { data: apiData, fromCache, error: fetchError, cacheInfo } = result;

      if (fromCache && apiData) {
        setRates({
          bcv: apiData.tasaBCV, paralelo: apiData.tasaParalelo,
          euro: apiData.tasaEuro, binance_p2p: apiData.tasaBinanceP2P,
          bcv_lunes: bcvLunesData.value,
        });
        setOfflineMode(true);
        setOfflineCachedAt(cacheInfo?.cachedAt || null);
      } else if (apiData) {
        setRates({
          bcv: apiData.tasaBCV, paralelo: apiData.tasaParalelo,
          euro: apiData.tasaEuro, binance_p2p: apiData.tasaBinanceP2P,
          bcv_lunes: bcvLunesData.value,
        });
        setOfflineMode(false);
        setOfflineCachedAt(null);
      }

      if (fetchError && !fromCache) {
        Alert.alert('Error', 'No se pudieron cargar las tasas. Verifica tu conexión.');
      }
    } catch (err) {
      if (__DEV__) console.warn('[Converter] loadRates error:', err);
      Alert.alert('Error', 'No se pudieron cargar las tasas. Verifica tu conexión.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadRates();
    return () => { mountedRef.current = false; };
  }, [loadRates]);

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Handlers
  const getCurrentRate = () => rates[selectedRate];

  const parseAmount = (str) => parseFloat(str.replace(',', '.'));

  const handleConvert = () => {
    Keyboard.dismiss();
    const numericAmount = parseAmount(rawAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido');
      return;
    }
    const rate = getCurrentRate();
    if (!rate) {
      Alert.alert('Error', 'La tasa seleccionada no está disponible');
      return;
    }
    setResult({
      amount: numericAmount,
      rate,
      converted: mode === 'usd-to-bs' ? numericAmount * rate : numericAmount / rate,
    });
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
    } catch (err) {
      if (__DEV__) console.warn('[Converter] handlePaste error:', err);
    }
  };

  const handleQuickAmount = (val) => {
    setRawAmount(String(val));
    inputRef.current?.focus();
  };

  const handleCopy = async (text, type) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedType(type);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedType(null), 1500);
    } catch (err) {
      if (__DEV__) console.warn('[Converter] handleCopy error:', err);
    }
  };

  const handleSwapMode = () => {
    setMode((p) => (p === 'usd-to-bs' ? 'bs-to-usd' : 'usd-to-bs'));
    setResult(null);
    // Conservar el monto escrito por el usuario al cambiar de modo (fix: no borrarlo)
  };

  const handleChangeText = (text) => setRawAmount(extractRawDigits(text));
  const displayAmount = rawAmount ? formatRawDisplay(rawAmount) : '';
  const numericAmount = rawAmount ? parseFloat(rawAmount.replace(',', '.')) || 0 : 0;

  // Spread calculations
  const spreadBcv = (() => {
    const { bcv, paralelo } = rates;
    if (!bcv || !paralelo) return null;
    const diff = paralelo - bcv;
    const diffPercent = (diff / bcv) * 100;
    const isHigh = diffPercent > 15;
    const isMedium = diffPercent > 8;
    return {
      diff,
      diffPercent,
      barPercent: Math.min((diffPercent / 30) * 100, 100),
      barColor: isHigh ? 'highlight' : isMedium ? 'warning' : 'success',
    };
  })();

  const spreadLunes = (() => {
    const { bcv_lunes, paralelo } = rates;
    if (!bcv_lunes || !paralelo) return null;
    const diff = paralelo - bcv_lunes;
    const diffPercent = (diff / bcv_lunes) * 100;
    const isHigh = diffPercent > 15;
    const isMedium = diffPercent > 8;
    return {
      diff,
      diffPercent,
      barPercent: Math.min((diffPercent / 30) * 100, 100),
      barColor: isHigh ? 'highlight' : isMedium ? 'warning' : 'success',
    };
  })();

  const quickAmounts = useMemo(() => {
    const rate = rates[selectedRate] || 1;
    return mode === 'usd-to-bs'
      ? QUICK_USD
      : QUICK_BS.map((bs) => Math.round(bs / rate));
  }, [mode, selectedRate, rates]);

  return {
    rates, selectedRate, rawAmount, mode, result,
    loading, refreshing, isKeyboardVisible, copiedType, pasteFeedback,
    offlineMode, offlineCachedAt, gasLitros, gasLitrosNum,
    inputRef, copyTimeoutRef, quickAmounts,
    setSelectedRate, setRawAmount, setGasLitros,
    setResult, setCopiedType, setMode,
    loadRates, handleConvert, handlePaste, handleQuickAmount,
    handleCopy, handleSwapMode, handleChangeText,
    displayAmount, numericAmount,
    spreadBcv, spreadLunes,
  };
}
