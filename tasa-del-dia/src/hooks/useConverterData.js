import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Keyboard, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { fetchWithOfflineFallback, getStoredBCVLunes } from '../services/api';

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000];

export { QUICK_AMOUNTS };

// ponytail: 50 líneas de parsing → 6. Si hay coma, los puntos son miles.
// Casos: "28028,33" → "28028.33".  "28.028,33" → "28028.33".  "28028" → "28028".
export function extractRawDigits(text) {
  if (!text) return '';
  const norm = text.includes(',') ? text.replace(/\./g, '') : text;
  const clean = norm.replace(',', '.').replace(/[^0-9.]/g, '');
  const dotIdx = clean.indexOf('.');
  const intPart = dotIdx === -1 ? clean : clean.slice(0, dotIdx);
  const decPart = dotIdx === -1 ? '' : clean.slice(dotIdx + 1).replace(/\./g, '').slice(0, 2);
  return decPart ? `${intPart}.${decPart}` : intPart || clean;
}

export function formatRawDisplay(raw) {
  if (!raw) return '';
  const dotIndex = raw.indexOf('.');
  if (dotIndex !== -1) {
    const intPart = raw.slice(0, dotIndex);
    const decPart = raw.slice(dotIndex + 1);
    const intNum = parseInt(intPart, 10);
    const formattedInt = isNaN(intNum) ? intPart : intNum.toLocaleString('es-VE');
    return decPart === '' ? `${formattedInt},` : `${formattedInt},${decPart}`;
  }
  const num = parseInt(raw, 10);
  if (isNaN(num)) return raw;
  return num.toLocaleString('es-VE');
}

export function getRateTypes(C) {
  return [
    { key: 'bcv', label: 'BCV (Oficial)', color: C.success },
    { key: 'paralelo', label: 'Paralelo', color: C.highlight },
    { key: 'binance_p2p', label: 'Binance P2P', color: C.warning },
    { key: 'euro', label: 'Euro (BCV)', color: C.info },
    { key: 'bcv_lunes', label: 'BCV (Lunes)', color: C.bcvLunes },
  ];
}

export function formatCurrency(v) {
  return v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
    mountedRef.current = true;
    loadRates();
    return () => { mountedRef.current = false; };
  }, [loadRates]);

  // Cargar BCV Lunes al montar
  useEffect(() => {
    let mounted = true;
    getStoredBCVLunes().then((d) => {
      if (mounted) setRates((prev) => ({ ...prev, bcv_lunes: d.value }));
    });
    return () => { mounted = false; };
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Handlers
  const getCurrentRate = () => rates[selectedRate];

  const handleConvert = () => {
    Keyboard.dismiss();
    const numericAmount = parseFloat(rawAmount);
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
    } catch {}
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
    } catch {}
  };

  const handleSwapMode = () => {
    setMode((p) => (p === 'usd-to-bs' ? 'bs-to-usd' : 'usd-to-bs'));
    setResult(null);
    setRawAmount('');
  };

  const handleChangeText = (text) => setRawAmount(extractRawDigits(text));
  const displayAmount = rawAmount ? formatRawDisplay(rawAmount) : '';
  const numericAmount = parseFloat(rawAmount) || 0;

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

  return {
    rates, selectedRate, rawAmount, mode, result,
    loading, refreshing, isKeyboardVisible, copiedType, pasteFeedback,
    offlineMode, offlineCachedAt, gasLitros, gasLitrosNum,
    inputRef, copyTimeoutRef,
    setSelectedRate, setRawAmount, setGasLitros,
    setResult, setCopiedType, setMode,
    loadRates, handleConvert, handlePaste, handleQuickAmount,
    handleCopy, handleSwapMode, handleChangeText,
    displayAmount, numericAmount,
    spreadBcv, spreadLunes,
  };
}
