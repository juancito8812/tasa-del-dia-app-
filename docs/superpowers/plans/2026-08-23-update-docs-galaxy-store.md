# Plan: Actualizar repo con info Galaxy Store

> **Objetivo:** Actualizar documentación del repo para que todo esté listo cuando se apruebe la publicación en Galaxy Store.

## Contexto

Se completó la preparación para Galaxy Store (5 commits en `feature/ui-editorial`):
- Privacy policy
- Detección de canal de distribución
- Auto-update deshabilitado para Galaxy Store
- Permisos condicionales
- Build profile EAS

Falta actualizar la documentación existente para reflejar estos cambios.

---

## Archivos a actualizar

### 1. `AI_HANDOFF.md` — Agregar sesión Galaxy Store

**Ubicación:** Después de la línea 606 (fin del archivo)

**Contenido a agregar:**

```markdown
---

### Sesión 23-Ago-2026 — Preparación Galaxy Store

**Objetivo:** Preparar la app para publicación en Samsung Galaxy Store sin romper la distribución existente por APK.

**Commits en `feature/ui-editorial`:**

| Commit | Cambio |
|--------|--------|
| `ca54972` | Privacy policy + checklist de Galaxy Store |
| `557d97f` | Detección de canal de distribución (DistributionContext) |
| `b7ea67a` | Auto-update deshabilitado para Galaxy Store |
| `302f6c2` | Permisos condicionales (sin REQUEST_INSTALL_PACKAGES para Galaxy Store) |
| `a865e5c` | Build profile EAS para Galaxy Store |

**Archivos nuevos:**
- `docs/privacy-policy.md` — Política de privacidad en español
- `docs/galaxy-store-checklist.md` — Checklist para Samsung Seller Office
- `src/context/DistributionContext.js` — Detección de canal de distribución

**Archivos modificados:**
- `App.js` — DistributionProvider + gate de auto-update
- `app.config.js` — Permisos condicionales (DISTRIBUTION env var)
- `eas.json` — Build profile `galaxy-store`

**Verificación:** 186/186 tests, lint 0, typecheck 0

**Pendiente para publicar:**
1. Publicar privacy policy en URL pública (GitHub Pages)
2. Registrar `com.tasadeldia.app` en Samsung Seller Office
3. Completar IARC + Data Safety
4. Subir screenshots 1080x2340

**Cómo construir para Galaxy Store:**
```bash
cd tasa-del-dia
eas build --platform android --profile galaxy-store --local
```

---

*Fin del documento de traspaso — Última actualización: 23-Ago-2026*
```

---

### 2. `README.md` — Agregar sección Galaxy Store

**Ubicación:** Después de la sección "🔄 Auto-Update" (línea 75) y antes de "🔐 Signing Policy"

**Contenido a insertar:**

```markdown
### 📲 Samsung Galaxy Store

La app también está preparada para publicarse en Samsung Galaxy Store. Cuando se distribuye desde Galaxy Store:

- ✅ El auto-update **se desactiva** (Galaxy Store gestiona las actualizaciones)
- ✅ El permiso `REQUEST_INSTALL_PACKAGES` **se omite** (Galaxy Store lo rechaza)
- ✅ La privacy policy **está incluida** en `docs/privacy-policy.md`

**Construir para Galaxy Store:**

```bash
cd tasa-del-dia
eas build --platform android --profile galaxy-store --local
```

**Construir para distribución directa (GitHub):**

```bash
cd tasa-del-dia
eas build --platform android --profile preview --local
```

> La diferencia: el build de Galaxy Store usa `DISTRIBUTION=galaxy-store` que activa los permisos condicionales.

```

---

### 3. `README.md` — Actualizar estructura del repo

**Línea 107:** Agregar `DistributionContext.js` a la estructura

```markdown
│   │   ├── context/               # ThemeContext (dark/light/system), DistributionContext
```

---

### 4. Verificar archivos existentes

- `docs/privacy-policy.md` — ✅ Ya creado, contenido correcto
- `docs/galaxy-store-checklist.md` — ✅ Ya creado, contenido correcto

---

## Resumen de cambios

| Archivo | Acción | Líneas approx |
|---------|--------|---------------|
| `AI_HANDOFF.md` | Agregar sesión Galaxy Store | +40 líneas |
| `README.md` | Agregar sección Galaxy Store | +25 líneas |
| `README.md` | Actualizar estructura repo | 1 línea |

## Riesgo

**Ninguno** — Solo cambios de documentación. No se modifica código.

## Verificación

1. Leer los archivos actualizados
2. Verificar que los links internos funcionen
3. Confirmar que la info es consistente con los commits existentes
