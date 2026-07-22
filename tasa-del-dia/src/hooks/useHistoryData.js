import { useState, useEffect, useRef, useMemo } from 'react';
import { Alert, Keyboard } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { API_CONFIG } from '../constants';
import { getHistoricalRates, formatDateKey, parseDateDDMMYYYY } from '../services/api';
import { formatCurrency, getWeekDay, getMonthAbbr, getDay } from '../utils/formatting';

export { formatDateKey };

export default function useHistoryData() {
  const [ratesData, setRatesData] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [customDateText, setCustomDateText] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const copyTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const loadHistory = async () => {
    try {
      const data = await getHistoricalRates();
      if (!mountedRef.current) return;
      const arr = Object.keys(data)
        .map((key) => ({ dateKey: key, ...data[key] }))
        .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      setRatesData(arr);
    } catch (err) {
      if (__DEV__) console.warn('[History] loadHistory error:', err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const last10 = ratesData.slice(0, 10);

  const chartInfo = useMemo(() => {
    if (ratesData.length === 0) return null;
    const reversed = [...ratesData].reverse().slice(-API_CONFIG.HISTORICAL_CHART_ENTRIES);
    if (reversed.length < 2) return null;
    const labels = reversed.map((item) => item.dateKey.slice(5).replace('-', '/'));
    const bcvData = reversed.map((item) => item.bcv || 0);
    const paraleloData = reversed.map((item) => item.paralelo || 0);
    if (bcvData.every((v) => v === 0) && paraleloData.every((v) => v === 0)) return null;
    return { labels, data: [bcvData, paraleloData] };
  }, [ratesData]);

  const selectedData = selectedDateKey
    ? ratesData.find((r) => r.dateKey === selectedDateKey)
    : null;

  const handleSelectDate = (dateKey) => {
    setSelectedDateKey(dateKey === selectedDateKey ? null : dateKey);
    setShowCustomInput(false);
    setCustomDateText('');
  };

  const handleCustomDate = () => {
    Keyboard.dismiss();
    const parsed = parseDateDDMMYYYY(customDateText);
    if (!parsed) {
      Alert.alert('Fecha inválida', 'Ingresa la fecha en formato DD/MM/AAAA (ej: 13/06/2026)');
      return;
    }
    const exists = ratesData.find((r) => r.dateKey === parsed);
    if (!exists) {
      Alert.alert('Sin datos', `No hay tasas guardadas para el ${formatDateKey(parsed)}`);
      return;
    }
    setSelectedDateKey(parsed);
    setShowCustomInput(false);
    setCustomDateText('');
  };

  const handleCopy = async (text, field) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(field);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      if (__DEV__) console.warn('[History] handleCopy error:', err);
    }
  };

  const handleCopyAll = async (data) => {
    const lines = [
      `Fecha: ${formatDateKey(data.dateKey)}`,
      `BCV: Bs. ${formatCurrency(data.bcv)}`,
      `Paralelo: Bs. ${formatCurrency(data.paralelo)}`,
      `Binance P2P: Bs. ${formatCurrency(data.binance_p2p)}`,
      `Euro: Bs. ${formatCurrency(data.euro)}`,
    ];
    if (data.manual) lines.push('Ingreso manual');
    handleCopy(lines.join('\n'), 'all');
  };

  return {
    ratesData, selectedDateKey, customDateText, copiedField, showCustomInput,
    copyTimeoutRef, last10, chartInfo, selectedData,
    setCustomDateText, setShowCustomInput,
    handleSelectDate, handleCustomDate, handleCopy, handleCopyAll,
  };
}
