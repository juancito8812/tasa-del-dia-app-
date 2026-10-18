// Pantalla COMPARTIDA de Tasas para los 4 estilos de UI.
// La versión base (original: bento grid + hero glass) es la fuente de verdad de
// lógica, accesibilidad y comportamiento; los temas solo aportan diferencias
// VISUALES deliberadas (radios, gaps, tipografías, colores) vía THEME_STYLES.
// El estilo terminal además cambia la COMPOSICIÓN (hero + filas con barra,
// footer punteado, gasolina punteada), por eso conserva una rama de layout.
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useRates } from '../context/RatesContext';
import RateCard from '../components/RateCard';
import RatesHeader from '../components/RatesHeader';
import BCVModal from '../components/BCVModal';
import { formatCurrency, getSeverityKey } from '../utils/formatting';
import { useFintechFonts } from '../ui/fintech/fonts';

// Tokens por estilo de UI.
const THEME_STYLES = {
  original: {},
  editorial: {
    styles: {
      bentoCols: { gap: 16 },
      bentoRow: { gap: 16 },
      brechaChip: { borderRadius: 8 },
      reminderChip: { borderRadius: 8 },
      gasCard: { borderRadius: 12, padding: 20, marginTop: 16 },
    },
  },
  fintech: {
    fonts: true,
    styles: (C, F) => ({
      bentoCols: { gap: 16 },
      bentoRow: { gap: 16 },
      // Chips pastilla (999px) como los del sitio
      brechaChip: { borderRadius: 999 },
      reminderChip: { borderRadius: 999 },
      brechaText: { fontWeight: '600', fontFamily: F.monoSemiBold },
      updateText: { fontFamily: F.mono },
      reminderLabel: { fontFamily: F.monoMedium },
      gasCard: { borderRadius: 16, padding: 20, marginTop: 16 },
      gasTitle: { fontWeight: '600', fontFamily: F.sansSemiBold },
      gasSubtext: { fontFamily: F.mono },
      gasItemL: { fontWeight: '500', fontFamily: F.sans },
      gasItemR: { fontWeight: '600', fontFamily: F.monoMedium },
    }),
  },
  // Terminal: filas planas con barra proporcional, footer y gasolina punteados.
  terminal: {
    variant: 'terminal',
    refreshTint: (C) => C.textPrimary,
    gasTitle: 'Gasolina',
    gasSubtext: '$0,50 USD/L — TASA BCV',
    updatePrefix: 'ÚLTIMA ACTUALIZACIÓN: ',
    uppercase: true,
    styles: {
      footerBox: {
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: 10,
        marginTop: 10,
        gap: 8,
      },
      footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      brechaText: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'monospace',
        letterSpacing: 0.5,
      },
      reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      reminderLabel: {
        fontSize: 10,
        fontWeight: '600',
        fontFamily: 'monospace',
        letterSpacing: 0.5,
      },
      gasCard: {
        borderRadius: 0,
        borderStyle: 'dashed',
        padding: 12,
        marginTop: 10,
      },
      gasHeader: { marginBottom: 4 },
      gasTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        fontFamily: 'monospace',
        textTransform: 'uppercase',
      },
      gasSubtext: {
        fontSize: 10,
        marginBottom: 8,
        fontFamily: 'monospace',
      },
      gasItem: { borderBottomWidth: 1 },
      gasItemL: { fontSize: 12, fontWeight: '600', fontFamily: 'monospace' },
      gasItemR: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
      updateText: {
        fontSize: 9,
        textAlign: 'center',
        marginTop: 8,
        fontFamily: 'monospace',
        letterSpacing: 0.5,
      },
    },
  },
};

function createStyles(C, F, t) {
  const table = {
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 8 },

    // Bento Grid
    bentoCols: { gap: 8 },
    bentoRow: { flexDirection: 'row', gap: 8 },
    bentoHalf: { flex: 1 },

    // Brecha chips row
    chipsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 2,
      marginBottom: 4,
      paddingHorizontal: 2,
    },
    chipsLeft: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      flex: 1,
    },
    brechaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
    },
    brechaText: { fontSize: 11, fontWeight: '700' },
    updateText: { fontSize: 10 },

    // Reminder inline
    reminderChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderWidth: 1,
    },
    reminderLabel: { fontSize: 10, fontWeight: '600' },

    // Gasolina card
    gasCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 14,
      marginTop: 6,
      overflow: 'hidden',
    },
    gasHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    gasTitle: { fontSize: 14, fontWeight: '700' },
    gasSubtext: { fontSize: 11, marginBottom: 8 },
    gasItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    gasItemL: { fontSize: 13, fontWeight: '600' },
    gasItemR: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  };

  const extra = typeof t.styles === 'function' ? t.styles(C, F) : (t.styles || {});
  Object.keys(extra).forEach((key) => {
    table[key] = { ...(table[key] || {}), ...extra[key] };
  });

  return StyleSheet.create(/** @type {any} */ (table));
}

export default function RatesScreen() {
  const { colors: C, uiStyle } = useTheme();
  const F = useFintechFonts();
  const t = THEME_STYLES[uiStyle] ?? {};
  const styles = useMemo(() => createStyles(C, F, t), [C, F, t]);
  const hook = useRates();

  const [modalVisible, setModalVisible] = useState(false);
  const [editValue, setEditValue] = useState('');

  // Desestructurado: deps estables para los useCallback (evita re-crearlos por render)
  const { tasaBCVLunes, handleSaveBCVLunes: saveBcvLunes } = hook;

  const bcvLunesColor = C.bcvLunes;

  const severityColor = (pct) => pct === null
    ? C.textMuted
    : { highlight: C.highlight, warning: C.warning, success: C.success }[getSeverityKey(pct)];
  const brechaColor = severityColor(hook.brecha);
  const brechaLunesColor = severityColor(hook.brechaLunes);

  // Handlers estables: se pasan a RateCard/BCVModal (memoizados)
  const handleEditBCVLunes = useCallback(() => {
    // Prefill en formato local es-VE (780,50) en vez del raw float (780.5)
    setEditValue(tasaBCVLunes ? formatCurrency(tasaBCVLunes) : '');
    setModalVisible(true);
  }, [tasaBCVLunes]);

  const handleSaveBCVLunes = useCallback(() => {
    saveBcvLunes(editValue);
    setModalVisible(false);
  }, [saveBcvLunes, editValue]);

  // Barras proporcionales (estilo terminal): ratio de cada tasa vs la máxima visible
  const maxRate = useMemo(() => {
    const rates = [
      hook.data.tasaBCV,
      hook.data.tasaParalelo,
      hook.data.tasaEuro,
      hook.data.tasaBinanceP2P,
      hook.tasaBCVLunes,
    ].filter((r) => typeof r === 'number' && r > 0);
    return rates.length ? Math.max(...rates) : 1;
  }, [hook.data, hook.tasaBCVLunes]);

  const ratioOf = useCallback(
    (rate) => (typeof rate === 'number' && rate > 0 && maxRate > 0 ? rate / maxRate : 0),
    [maxRate]
  );

  const isTerminal = t.variant === 'terminal';

  const refreshControl = (
    <RefreshControl
      refreshing={hook.refreshing}
      onRefresh={hook.onRefresh}
      tintColor={t.refreshTint ? t.refreshTint(C) : C.highlight}
      colors={[t.refreshTint ? t.refreshTint(C) : C.highlight]}
      progressBackgroundColor={C.secondary}
    />
  );

  /** @type {any} */
  const bcvCardProps = {
    title: 'BCV (Oficial)',
    subtitle: 'Banco Central de Venezuela',
    rate: hook.data.tasaBCV,
    icon: 'bank',
    color: C.success,
    loading: hook.loading,
    updatedAt: hook.data.usdFetchedAt,
    size: 'large',
    type: 'bcv',
  };

  /** @type {any[]} */
  const otherCards = [
    {
      key: 'paralelo',
      title: 'Dólar Paralelo',
      subtitle: 'Mercado promedio',
      rate: hook.data.tasaParalelo,
      icon: 'trending-up',
      color: C.highlight,
      updatedAt: hook.data.usdFetchedAt,
      size: 'medium',
      type: 'paralelo',
    },
    {
      key: 'euro',
      title: 'Euro (BCV)',
      subtitle: 'Banco Central',
      rate: hook.data.tasaEuro,
      icon: 'globe',
      color: C.info,
      updatedAt: hook.data.eurCapturedAt,
      size: 'medium',
      type: 'euro',
    },
    {
      key: 'binance',
      title: 'Binance P2P',
      subtitle: 'Paralelo crypto',
      rate: hook.data.tasaBinanceP2P,
      icon: 'logo-bitcoin',
      color: C.warning,
      updatedAt: hook.data.usdFetchedAt,
      size: 'compact',
      type: 'gasolina',
    },
    {
      key: 'bcv-lunes',
      title: 'BCV (Lunes)',
      subtitle: 'Tasa del lunes',
      rate: hook.tasaBCVLunes,
      icon: 'calendar',
      color: bcvLunesColor,
      updatedAt: null,
      size: 'compact',
      type: 'bcv-lunes',
      onEdit: handleEditBCVLunes,
    },
  ];

  const gasolinaRows = [1, 5, 10, 20, 30].map((litros, idx, arr) => {
    const precioBs = litros * 0.50 * hook.data.tasaBCV;
    return (
      <View
        key={litros}
        style={[
          styles.gasItem,
          isTerminal && { borderBottomColor: C.cardBorder },
          isTerminal && idx === arr.length - 1 && { borderBottomWidth: 0 },
        ]}
      >
        <Text style={[styles.gasItemL, { color: C.textSecondary }]}>{litros}L</Text>
        <Text style={[styles.gasItemR, { color: C.textPrimary }]}>
          Bs. {precioBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    );
  });

  const gasolinaCard = hook.data.tasaBCV !== null && (
    <View
      style={[
        styles.gasCard,
        { borderColor: C.cardBorder },
        !isTerminal && { backgroundColor: C.cardBg },
      ]}
    >
      <View style={styles.gasHeader}>
        <Ionicons name="flame" size={isTerminal ? 14 : 16} color={isTerminal ? C.textPrimary : C.warning} />
        <Text style={[styles.gasTitle, { color: C.textPrimary }]}>
          {t.gasTitle || 'Gasolina (BCV)'}
        </Text>
      </View>
      <Text style={[styles.gasSubtext, { color: isTerminal ? C.dimmed : C.textMuted }]}>
        {t.gasSubtext || '$0,50 USD/L — Tasa BCV'}
      </Text>
      {gasolinaRows}
    </View>
  );

  const reminderSwitch = (
    <Switch
      value={hook.reminderEnabled}
      onValueChange={hook.handleToggleReminder}
      trackColor={{ false: isTerminal ? C.barTrack : C.inputBg, true: isTerminal ? C.dimmed : bcvLunesColor + '50' }}
      thumbColor={hook.reminderEnabled ? (isTerminal ? C.textPrimary : bcvLunesColor) : C.textMuted}
      style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
    />
  );

  return (
    <View style={styles.container}>
      <RatesHeader
        C={C}
        error={hook.error}
        offlineMode={hook.offlineMode}
        offlineCachedAt={hook.offlineCachedAt}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        refreshControl={refreshControl}
      >
        {isTerminal ? (
          <>
            {/* === HERO: BCV (bloque invertido) === */}
            <RateCard {...bcvCardProps} />

            {/* === FILAS TERMINALES === */}
            {otherCards.map((c) => (
              <RateCard
                key={c.key}
                title={c.title}
                subtitle={c.subtitle}
                rate={c.rate}
                icon={c.icon}
                color={c.color}
                loading={hook.loading}
                updatedAt={c.updatedAt}
                size={c.size}
                type={c.type}
                onEdit={c.onEdit}
                ratio={ratioOf(c.rate)}
              />
            ))}

            {/* === FOOTER: brechas + recordatorio (borde punteado) === */}
            <View style={[styles.footerBox, { borderColor: C.cardBorder }]}>
              <View style={styles.footerRow}>
                {hook.brecha !== null && (
                  <Text style={[styles.brechaText, { color: C.textPrimary }]}>
                    BRECHA BCV↔PAR: +{hook.brecha.toFixed(1)}%
                  </Text>
                )}
                {hook.brechaLunes !== null && (
                  <Text style={[styles.brechaText, { color: C.dimmed }]}>
                    LUN: +{hook.brechaLunes.toFixed(1)}%
                  </Text>
                )}
              </View>
              <View style={styles.footerRow}>
                <View style={styles.reminderRow}>
                  <Ionicons
                    name="alarm-outline"
                    size={12}
                    color={hook.reminderEnabled ? C.textPrimary : C.dimmed}
                  />
                  <Text style={[styles.reminderLabel, { color: hook.reminderEnabled ? C.textPrimary : C.dimmed }]}>
                    {hook.reminderEnabled ? 'REC: VIE 6PM ●' : 'REC: OFF ○'}
                  </Text>
                </View>
                {reminderSwitch}
              </View>
            </View>

            {/* ⛽ GASOLINA */}
            {gasolinaCard}

            {/* Update time footer */}
            <Text style={[styles.updateText, { color: C.dimmed }]}>
              ÚLTIMA ACTUALIZACIÓN: {hook.data.usdFetchedAt
                ? new Date(hook.data.usdFetchedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </Text>
          </>
        ) : (
          <>
            {/* === BENTO GRID === */}

            {/* 🥇 BCV — Hero card, full width (2 cols) */}
            <RateCard {...bcvCardProps} />

            {/* 🥈 Paralelo + Euro side by side */}
            <View style={styles.bentoRow}>
              <View style={styles.bentoHalf}>
                <RateCard
                  title={otherCards[0].title}
                  subtitle={otherCards[0].subtitle}
                  rate={otherCards[0].rate}
                  icon={otherCards[0].icon}
                  color={otherCards[0].color}
                  loading={hook.loading}
                  updatedAt={otherCards[0].updatedAt}
                  size={otherCards[0].size}
                  type={otherCards[0].type}
                />
              </View>
              <View style={styles.bentoHalf}>
                <RateCard
                  title={otherCards[1].title}
                  subtitle={otherCards[1].subtitle}
                  rate={otherCards[1].rate}
                  icon={otherCards[1].icon}
                  color={otherCards[1].color}
                  loading={hook.loading}
                  updatedAt={otherCards[1].updatedAt}
                  size={otherCards[1].size}
                  type={otherCards[1].type}
                />
              </View>
            </View>

            {/* 🥉 Binance P2P + BCV Lunes side by side */}
            <View style={styles.bentoRow}>
              <View style={styles.bentoHalf}>
                <RateCard
                  title={otherCards[2].title}
                  subtitle={otherCards[2].subtitle}
                  rate={otherCards[2].rate}
                  icon={otherCards[2].icon}
                  color={otherCards[2].color}
                  loading={hook.loading}
                  updatedAt={otherCards[2].updatedAt}
                  size={otherCards[2].size}
                  type={otherCards[2].type}
                />
              </View>
              <View style={styles.bentoHalf}>
                <RateCard
                  title={otherCards[3].title}
                  subtitle={otherCards[3].subtitle}
                  rate={otherCards[3].rate}
                  icon={otherCards[3].icon}
                  color={otherCards[3].color}
                  loading={false}
                  size={otherCards[3].size}
                  type={otherCards[3].type}
                  onEdit={otherCards[3].onEdit}
                />
              </View>
            </View>

            {/* === CHIPS ROW: Brechas + Recordatorio + Update time === */}
            <View style={styles.chipsRow}>
              <View style={styles.chipsLeft}>
                {hook.brecha !== null && (
                  <View style={[styles.brechaChip, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                    <Ionicons name="git-compare-outline" size={11} color={brechaColor} />
                    <Text style={[styles.brechaText, { color: brechaColor }]}>BCV: {hook.brecha.toFixed(1)}%</Text>
                  </View>
                )}
                {hook.brechaLunes !== null && (
                  <View style={[styles.brechaChip, { backgroundColor: C.cardBg, borderColor: bcvLunesColor + '30' }]}>
                    <Ionicons name="calendar" size={11} color={bcvLunesColor} />
                    <Text style={[styles.brechaText, { color: brechaLunesColor }]}>Lunes: {hook.brechaLunes.toFixed(1)}%</Text>
                  </View>
                )}
              </View>

              {/* Reminder toggle inline */}
              <View style={[styles.reminderChip, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
                <Ionicons name="alarm-outline" size={12} color={hook.reminderEnabled ? bcvLunesColor : C.textMuted} />
                <Text style={[styles.reminderLabel, { color: hook.reminderEnabled ? bcvLunesColor : C.textMuted }]}>
                  {hook.reminderEnabled ? 'Vie 6PM' : 'Off'}
                </Text>
                {reminderSwitch}
              </View>
            </View>

            {/* ⛽ Gasolina — Full width */}
            {gasolinaCard}

            {/* Update time footer */}
            <Text style={[styles.updateText, { color: C.textMuted, textAlign: 'center', marginTop: 8 }]}>
              Última actualización: {hook.data.usdFetchedAt
                ? new Date(hook.data.usdFetchedAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </Text>
          </>
        )}
      </ScrollView>

      <BCVModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        editValue={editValue}
        onChangeText={setEditValue}
        onSave={handleSaveBCVLunes}
        bcvLunesColor={bcvLunesColor}
        C={C}
      />
    </View>
  );
}
