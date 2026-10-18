// DateDetailCard ÚNICO para todos los estilos de UI (Q1).
//
// La BASE (`original`) es la fuente de verdad de lógica, accesibilidad y
// comportamiento. Las copias por tema (`ui/editorial/DateDetailCard.js`,
// `ui/fintech/DateDetailCard.js`, `ui/terminal/DateDetailCard.js`) se han
// eliminado y de ellas solo se conservan sus diferencias VISUALES deliberadas,
// codificadas como tokens en THEME_STYLES.
//
// OJO (paridad): las copias editorial y fintech habían PERDIDO las props de
// accesibilidad del botón de cerrar (`accessibilityRole`/`accessibilityLabel`);
// aquí se conservan las del base — gana el base.
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatCurrency, getWeekDay } from '../utils/formatting';
import { formatDateKey } from '../hooks/useHistoryData';
import { useTheme } from '../context/ThemeContext';
import { useFintechFonts } from '../ui/fintech/fonts';

/**
 * Deltas visuales por estilo (Q1). Solo lo que difiere del estilo `original`.
 *
 * Convenciones:
 *  - `fonts`: nombre de familia en FONT (fintech) → fontFamily. Fuera de fintech
 *    `useFintechFonts()` devuelve `{}` → fontFamily `undefined` → sistema.
 *  - `styles(C)`: parche por clave sobre el stylesheet base (`mergeStyles`).
 *  - los `*Token` son claves de la paleta del tema; `null` = valor literal.
 * @type {Record<string, any>}
 */
export const THEME_STYLES = {
  // original = base, sin deltas.
  original: {},

  // editorial: monocromo premium → el CTA usa el color de acento del tema
  // (base: blanco literal) en vez de un fijo.
  editorial: {
    copyAllAccentIdle: 'onAccent',
    copyAllAccentCopied: 'onAccent',
  },

  // fintech: radios de pastilla, pesos medios, tintes más suaves, glow verde y
  // tipografías geométricas (Space Grotesk / JetBrains Mono).
  fintech: {
    copyAllAccentIdle: 'onAccent',
    copyAllAccentCopied: 'onAccent',
    glowToken: 'success',
    glowOpacity: 0.6,
    rateRowTint: '0D',
    copyAllBgToken: 'highlight',
    fonts: {
      date: 'sansSemiBold',
      badgeText: 'monoMedium',
      rateLabel: 'sans',
      rateValue: 'monoSemiBold',
      copyText: 'monoMedium',
      copyAllText: 'sansSemiBold',
    },
    styles: () => ({
      card: { borderRadius: 16 },
      glow: { borderTopLeftRadius: 16, borderTopRightRadius: 16, opacity: 0.6 },
      date: { fontWeight: '600', letterSpacing: -0.2 },
      badge: { borderRadius: 999 },
      badgeText: { fontWeight: '600' },
      rateRow: { borderRadius: 13 },
      rateLabel: { fontWeight: '500' },
      rateValue: { fontWeight: '600' },
      copyBtn: { borderRadius: 999 },
      copyText: { fontWeight: '600' },
      copyAll: { borderRadius: 13 },
      copyAllText: { fontWeight: '600' },
    }),
  },

  // terminal: consola monocroma → sin glow ni dots, filas con borde inferior,
  // etiquetas en mayúsculas y todo en `monospace`.
  terminal: {
    noGlow: true,
    showDot: false,
    badgeAsText: true,
    rateValueColorMode: 'primary',
    rateValueMutedToken: 'dimmed',
    rateRowTint: null,
    mutedToken: 'dimmed',
    copyBtnOutline: true,
    copyBtnColorMode: 'primary',
    copyIconSize: 11,
    copyAllOutline: true,
    copyAllAccentIdle: 'textPrimary',
    copyAllAccentCopied: 'onAccent',
    copyAllIconSize: 15,
    styles: (C) => ({
      card: { borderRadius: 0, padding: 14 },
      header: { marginBottom: 10 },
      headerLeft: { gap: 6 },
      date: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
        fontFamily: 'monospace',
        fontVariant: ['tabular-nums'],
      },
      badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: 'monospace' },
      rateRow: {
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderRadius: 0,
        marginBottom: 0,
        borderBottomWidth: 1,
      },
      rateLeft: { gap: 8 },
      rateLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: 'monospace' },
      rateValue: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0,
        fontVariant: ['tabular-nums'],
        fontFamily: 'monospace',
      },
      copyBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 0, gap: 3, borderWidth: 1, borderColor: C.cardBorder },
      copyText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'monospace' },
      copyAll: { borderRadius: 0, paddingVertical: 11, marginTop: 12, gap: 6, borderWidth: 1, borderColor: C.textPrimary },
      copyAllText: { fontSize: 12, fontWeight: '800', letterSpacing: 1, fontFamily: 'monospace' },
    }),
  },
};

/** Stylesheet base (= estilo `original`). @returns {Record<string, any>} */
function baseStyles() {
  return {
    card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, overflow: 'hidden' },
    glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 20, borderTopRightRadius: 20, opacity: 0.5 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    date: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '700' },
    rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6 },
    rateLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    rateLabel: { fontSize: 12, fontWeight: '600' },
    rateRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rateValue: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 0.3 },
    copyBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    copyText: { fontSize: 10, fontWeight: '700' },
    copyAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 12, marginTop: 12 },
    copyAllText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  };
}

/** Stylesheet base + parches visuales del estilo activo. */
function createStyles(C, t) {
  const base = StyleSheet.create(baseStyles());
  const patch = t.styles ? t.styles(C) : null;
  if (!patch) return base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    out[key] = [base[key], patch[key]];
  }
  return out;
}

function DateDetailCard({ selectedData, C, copiedField, handleCopy, handleCopyAll, onClose }) {
  const { uiStyle } = useTheme();
  const t = useMemo(() => THEME_STYLES[uiStyle] ?? {}, [uiStyle]);
  const F = useFintechFonts();
  const styles = useMemo(() => createStyles(C, t), [C, t]);

  if (!selectedData) return null;

  /** Familia tipográfica del tema (`undefined` → fuente del sistema). */
  const font = (key) => (t.fonts?.[key] && F ? F[t.fonts[key]] : undefined);
  /** Clave de paleta o literal para el acento del CTA. */
  const accent = (token, fallback) => (token && C[token] != null ? C[token] : fallback);
  const muted = C[t.mutedToken || 'textMuted'];
  const glowColor = C[t.glowToken || 'info'];
  const copyAllBg = t.copyAllBgToken ? C[t.copyAllBgToken] : C.info;
  const copyAllAccentIdle = accent(t.copyAllAccentIdle, '#fff');
  const copyAllAccentCopied = accent(t.copyAllAccentCopied, '#fff');

  const rates = [
    { key: 'bcv', label: 'BCV (Oficial)', color: C.success, value: selectedData.bcv },
    { key: 'paralelo', label: 'Paralelo', color: C.highlight, value: selectedData.paralelo },
    { key: 'binance_p2p', label: 'Binance P2P', color: C.warning, value: selectedData.binance_p2p },
    { key: 'euro', label: 'Euro (BCV)', color: C.info, value: selectedData.euro },
  ];

  const day = getWeekDay(selectedData.dateKey);
  const isWeekend = day === 'Sáb' || day === 'Dom';
  const primaryValueColors = t.rateValueColorMode === 'primary';

  return (
    <View style={[styles.card, { backgroundColor: C.cardBg, borderColor: C.cardBorder }]}>
      {!t.noGlow && <View style={[styles.glow, { backgroundColor: glowColor }]} />}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={t.badgeAsText ? 14 : 16} color={t.badgeAsText ? muted : C.info} />
          <Text style={[styles.date, { color: C.textPrimary, fontFamily: font('date') }]}>{formatDateKey(selectedData.dateKey)}</Text>
          {t.badgeAsText ? (
            <>
              <Text style={[styles.badgeText, { color: muted, fontFamily: font('badgeText') }]}>·</Text>
              <Text style={[styles.badgeText, { color: muted, fontFamily: font('badgeText') }]}>{day}</Text>
              {selectedData.manual && (
                <Text style={[styles.badgeText, { color: muted, fontFamily: font('badgeText') }]}>·</Text>
              )}
              {selectedData.manual && (
                <Text style={[styles.badgeText, { color: muted, fontFamily: font('badgeText') }]}>Manual</Text>
              )}
            </>
          ) : (
            <>
              <View style={[styles.badge, { backgroundColor: isWeekend ? C.warning + '20' : C.info + '15' }]}>
                <Text style={[styles.badgeText, { color: isWeekend ? C.warning : C.info, fontFamily: font('badgeText') }]}>
                  {day}
                </Text>
              </View>
              {selectedData.manual && (
                <View style={[styles.badge, { backgroundColor: C.textMuted + '15' }]}>
                  <Ionicons name="create-outline" size={10} color={C.textMuted} />
                  <Text style={[styles.badgeText, { color: C.textMuted, fontFamily: font('badgeText') }]}>Manual</Text>
                </View>
              )}
            </>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }} accessibilityRole="button" accessibilityLabel="Cerrar detalle">
          <Ionicons name={t.badgeAsText ? 'close' : 'close-circle'} size={t.badgeAsText ? 20 : 22} color={muted} />
        </TouchableOpacity>
      </View>

      {rates.map((r) => (
        <View
          key={r.key}
          style={[
            styles.rateRow,
            t.rateRowTint === null
              ? { borderBottomColor: C.cardBorder }
              : { backgroundColor: (r.color || C.textMuted) + (t.rateRowTint || '08') },
          ]}
        >
          <View style={styles.rateLeft}>
            {t.showDot !== false && <View style={[styles.dot, { backgroundColor: r.color }]} />}
            <Text style={[styles.rateLabel, { color: C.textSecondary, fontFamily: font('rateLabel') }]}>
              {t.badgeAsText ? r.label.toUpperCase() : r.label}
            </Text>
          </View>
          <View style={styles.rateRight}>
            <Text
              style={[
                styles.rateValue,
                {
                  color: primaryValueColors
                    ? (r.value ? C.textPrimary : muted)
                    : (r.value ? r.color : C.textMuted),
                  fontFamily: font('rateValue'),
                },
              ]}
            >
              {r.value ? `Bs. ${formatCurrency(r.value)}` : '—'}
            </Text>
            {r.value != null && (
              <TouchableOpacity
                style={[
                  styles.copyBtn,
                  t.copyBtnOutline
                    ? { backgroundColor: copiedField === r.key ? C.textPrimary : 'transparent' }
                    : { backgroundColor: copiedField === r.key ? C.success + '20' : (C.inputBg || C.secondary) },
                ]}
                onPress={() => handleCopy(formatCurrency(r.value), r.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={copiedField === r.key ? 'checkmark' : 'copy-outline'}
                  size={t.copyIconSize || 12}
                  color={
                    t.copyBtnColorMode === 'primary'
                      ? (copiedField === r.key ? C.onAccent : muted)
                      : (copiedField === r.key ? C.success : C.textMuted)
                  }
                />
                <Text
                  style={[
                    styles.copyText,
                    {
                      color:
                        t.copyBtnColorMode === 'primary'
                          ? (copiedField === r.key ? C.onAccent : muted)
                          : (copiedField === r.key ? C.success : C.textMuted),
                      fontFamily: font('copyText'),
                    },
                  ]}
                >
                  {copiedField === r.key ? 'Copiado' : 'Copiar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[
          styles.copyAll,
          t.copyAllOutline
            ? { backgroundColor: copiedField === 'all' ? C.textPrimary : C.secondary }
            : { backgroundColor: copiedField === 'all' ? C.success : copyAllBg },
        ]}
        onPress={() => handleCopyAll(selectedData)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={copiedField === 'all' ? 'checkmark-circle' : 'copy'}
          size={t.copyAllIconSize || 16}
          color={copiedField === 'all' ? copyAllAccentCopied : copyAllAccentIdle}
        />
        <Text
          style={[
            styles.copyAllText,
            { color: copiedField === 'all' ? copyAllAccentCopied : copyAllAccentIdle, fontFamily: font('copyAllText') },
          ]}
        >
          {copiedField === 'all' ? '¡Copiado al portapapeles!' : 'Copiar todo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(DateDetailCard);
