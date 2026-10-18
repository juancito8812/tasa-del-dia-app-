import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useRates } from '../context/RatesContext';
import { calculateNet, calculateGross, calculateBsPurchase } from '../constants/paypalFees';
import { hapticLight } from '../utils/haptics';
import {
  parseNumericInput,
  buildResultText,
  buildBsPurchaseText,
} from '../utils/paypalCalculator';
import { createStyles } from '../components/PayPalCalculatorScreenStyles';
import PayPalCalculatorHeader from '../components/PayPalCalculatorHeader';
import PayPalModeToggle from '../components/PayPalModeToggle';
import PayPalAmountInput from '../components/PayPalAmountInput';
import PayPalResultCard from '../components/PayPalResultCard';
import PayPalBsPurchaseCard from '../components/PayPalBsPurchaseCard';
import PayPalInfoCard from '../components/PayPalInfoCard';

function PayPalCalculatorScreen() {
  const { colors: C } = useTheme();
  const { data } = useRates();

  const [mode, setMode] = useState('net'); // 'net' = ¿Cuánto recibo?, 'gross' = ¿Cuánto cobro?
  const [amount, setAmount] = useState('');
  const [bsAmount, setBsAmount] = useState(''); // Pagar compras en BS: monto
  const [bsRate, setBsRate] = useState(''); // Pagar compras en BS: tasa

  const styles = useMemo(() => createStyles(C), [C]);

  const parsedAmount = useMemo(() => parseNumericInput(amount), [amount]);

  const feeType = 'receive';

  const result = useMemo(() => {
    if (parsedAmount <= 0) return null;
    if (mode === 'net') {
      return calculateGross(parsedAmount, feeType);
    }
    return calculateNet(parsedAmount, feeType);
  }, [parsedAmount, feeType, mode]);

  const equivalents = useMemo(() => {
    if (!result) return null;
    const usdAmount = result.gross ?? result.net;
    if (usdAmount <= 0) return null;

    const bcv = data.tasaBCV ? usdAmount * Number(data.tasaBCV) : null;
    const paralelo = data.tasaParalelo ? usdAmount * Number(data.tasaParalelo) : null;
    const binance = data.tasaBinanceP2P ? usdAmount * Number(data.tasaBinanceP2P) : null;
    const euro = data.tasaEuro ? usdAmount * Number(data.tasaEuro) : null;

    return { bcv, paralelo, binance, euro };
  }, [result, data]);

  // --- Pagar compras en BS ---
  const parsedBsAmount = useMemo(() => parseNumericInput(bsAmount), [bsAmount]);
  const parsedBsRate = useMemo(() => parseNumericInput(bsRate), [bsRate]);

  const bsPurchase = useMemo(
    () => calculateBsPurchase(parsedBsAmount, parsedBsRate),
    [parsedBsAmount, parsedBsRate]
  );

  const rateChips = useMemo(() => {
    const chips = [];
    if (data.tasaBCV) chips.push({ label: 'Tasa BCV', rate: Number(data.tasaBCV), icon: 'business' });
    if (data.tasaParalelo) chips.push({ label: 'Tasa Paralelo', rate: Number(data.tasaParalelo), icon: 'cash' });
    if (data.tasaBinanceP2P) chips.push({ label: 'Tasa Binance', rate: Number(data.tasaBinanceP2P), icon: 'logo-bitcoin' });
    return chips;
  }, [data]);

  const handleSelectRate = useCallback((rate) => {
    setBsRate(String(Math.round(rate * 100) / 100));
  }, []);

  const handleCopyBsPurchase = useCallback(async () => {
    hapticLight();
    if (!bsPurchase) return;
    const text = buildBsPurchaseText({ bsPurchase, parsedBsAmount, parsedBsRate });
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', 'Resultado copiado al portapapeles');
  }, [bsPurchase, parsedBsAmount, parsedBsRate]);

  const handleCopy = useCallback(async () => {
    hapticLight();
    if (!result || !equivalents) return;
    await Clipboard.setStringAsync(
      buildResultText({ feeType, parsedAmount, result, equivalents, mode })
    );
    Alert.alert('Copiado', 'Resultado copiado al portapapeles');
  }, [result, equivalents, feeType, parsedAmount, mode]);

  const handleShare = useCallback(async () => {
    hapticLight();
    if (!result || !equivalents) return;
    await Share.share({
      message: buildResultText({ feeType, parsedAmount, result, equivalents, mode }),
    });
  }, [result, equivalents, feeType, parsedAmount, mode]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PayPalCalculatorHeader styles={styles} C={C} />

      <PayPalModeToggle styles={styles} C={C} mode={mode} onChange={setMode} />

      <PayPalAmountInput
        styles={styles}
        C={C}
        label={mode === 'net' ? 'Monto a recibir' : 'Monto a enviar'}
        prefix="$"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
      />

      <PayPalResultCard
        styles={styles}
        C={C}
        mode={mode}
        result={result}
        equivalents={equivalents}
        parsedAmount={parsedAmount}
        onCopy={handleCopy}
        onShare={handleShare}
      />

      <PayPalBsPurchaseCard
        styles={styles}
        C={C}
        bsAmount={bsAmount}
        bsRate={bsRate}
        onChangeBsAmount={setBsAmount}
        onChangeBsRate={setBsRate}
        rateChips={rateChips}
        onSelectRate={handleSelectRate}
        bsPurchase={bsPurchase}
        onCopy={handleCopyBsPurchase}
      />

      <PayPalInfoCard styles={styles} C={C} />
    </ScrollView>
  );
}

export default PayPalCalculatorScreen;
