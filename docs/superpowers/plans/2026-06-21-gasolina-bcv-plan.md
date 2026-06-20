# Gasolina (BCV) Implementation Plan

> **For agentic workers:** No sub-agents needed — single task, single file.

**Goal:** Mostrar precios de gasolina (1L, 5L, 10L, 20L, 30L) en Bs al final del scroll en RatesScreen, calculados contra tasa BCV.

**Architecture:** Card inline en `RatesScreen.js` con constante `GASOLINE_USD = 0.50`, renderizado condicional cuando `data.tasaBCV != null`.

**Tech Stack:** React Native, mismo estilo que los RateCard existentes.

---

### Task 1: Agregar card de gasolina al final del scroll

**Files:**
- Modify: `tasa-del-dia/src/screens/RatesScreen.js` (insertar ~25 líneas antes del `</ScrollView>`)

**Interfaces:**
- Consumes: `data.tasaBCV` del state, `C` (colores del theme), `styles` existentes
- Produces: Card con precios de gasolina en Bs

- [ ] **Step 1: Agregar constante y card al final del scroll**

Insertar antes del `</ScrollView>` (después del `bottomBar`):

```jsx
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
```

- [ ] **Step 2: Verificar que compile y pasar tests**

```bash
npx jest
```

- [ ] **Step 3: Commit**

```bash
git add tasa-del-dia/src/screens/RatesScreen.js docs/superpowers/specs/2026-06-21-gasolina-bcv-design.md docs/superpowers/plans/2026-06-21-gasolina-bcv-plan.md
git commit -m "feat: agregar card de gasolina (BCV) en RatesScreen
Muestra precios en Bs para 1L, 5L, 10L, 20L y 30L calculados contra tasa BCV ($0.50 USD/L fijo)."
```
