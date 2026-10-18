# Política de Privacidad — Tasa del Día

**Última actualización:** 18 de octubre de 2026

## Datos que recopila esta app

Tasa del Día es una aplicación gratuita que consulta tasas de cambio en Venezuela. La app **no recopila ni transmite datos personales identificables**.

### Datos almacenados localmente en tu dispositivo

- **Tasas de cambio guardadas:** La almacena la tasa del BCV (Lunes) que el usuario ingresa manualmente.
- **Preferencias de tema:** Oscuro / Claro / Sistema.
- **Estado del recordatorio:** Activo / Inactivo (no los contenido de notificaciones).
- **Versión saltada:** Si el usuario elige "Saltar esta versión" en actualizaciones.
- **Caché de datos:** Tasas de cambio para funcionamiento offline.
- **Historial de tasas:** registros de tasas (BCV, paralelo, euro, Binance) guardados localmente por día, incluido el valor manual de "BCV Lunes" si el usuario lo introduce.
- **Datos bancarios:** La app almacena localmente cuentas bancarias que el usuario registra voluntariamente (cedula, teléfono, banco, número de cuenta, tipo de cuenta) y métodos de pago digital (Zelle, PayPal, Binance, Facebank, Zinli, Wally). **Estos datos NO se envían a ningún servidor externo** — permanecen exclusivamente en el dispositivo del usuario.

Todos estos datos se almacenan exclusivamente en el dispositivo del usuario. Las preferencias, caché de tasas e historial usan el almacenamiento interno de la app (AsyncStorage). **Los datos bancarios y de pago digital se guardan cifrados** con el almacén seguro del sistema (Android Keystore / iOS Keychain) mediante `expo-secure-store`. **Nada se envía a servidores externos.** Además, el respaldo del sistema (ADB/cloud) está desactivado para el sandbox de la app (`allowBackup=false`).

### Datos que la app accede (pero no recopila)

- **Tasas de cambio en vivo:** La app consulta las siguientes APIs públicas al momento de consultar las tasas:
  - [DolarApi.com](https://ve.dolarapi.com) — Tasas oficiales BCV y paralelo
  - [Binance P2P API](https://p2p.binance.com) — Tasa paralela crypto (USDT/VES)
- **Notificaciones push:** Si el usuario activa el recordatorio de los viernes, la app programa notificaciones locales del sistema operativo. No se envían datos a servicios de terceros.

## Permisos de la app

| Permiso | Uso |
|---------|-----|
| `POST_NOTIFICATIONS` | Mostrar recordatorio semanal de ingresar tasa del BCV (solo si el usuario lo activa) |
| `REQUEST_INSTALL_PACKAGES` | Solo en instalaciones directas (fuera de tienda): abrir el instalador del sistema para aplicar la actualización descargada desde GitHub Releases. No se usa en la versión de Galaxy Store. |

## Actualizaciones

La app puede verificar actualizaciones desde GitHub Releases cuando se instala directamente (fuera de tiendas de aplicaciones). Esta función se desactiva automáticamente cuando la app se instala desde Samsung Galaxy Store.

## Servicios de terceros

- **DolarApi.com:** La app consulta tasas de cambio públicas. No se envía información del usuario a este servicio.
- **Binance P2P API:** La app consulta tasas de cambio públicas. No se envía información del usuario a este servicio.

## Seguridad

- La app no utiliza `eval()` ni ejecuta código dinámico.
- Todas las conexiones de red se realizan exclusivamente por HTTPS (`usesCleartextTraffic=false`).
- No se almacenan credenciales, tokens de acceso ni datos bancarios en servidores externos.
- Los datos bancarios y de pago digital se almacenan **cifrados** en el almacén seguro del sistema (Keystore/Keychain) y no se transmiten a terceros.
- La actualización automática solo descarga e instala APKs por HTTPS desde el repositorio oficial de GitHub; el sistema operativo verifica la firma antes de instalar.
- El respaldo del sistema para la app está deshabilitado (`allowBackup=false`).

## Cambios en esta política

Si se realizan cambios significativos en esta política, se notificará a través de una actualización de la app.

## Contacto

Si tenés preguntas sobre esta política de privacidad, podés contactarnos a través de:
- GitHub: [github.com/juancito8812/tasa-del-dia-app-/issues](https://github.com/juancito8812/tasa-del-dia-app-/issues)
