# 📋 Registro de Versiones del Sistema MesaChef

Este documento mantiene el registro y control de versiones **único y global** para todo el sistema MesaChef.

> **Regla del Sistema:** Existe **una única versión global** para todo el sistema.
> Cada vez que se realice cualquier modificación en cualquier módulo, pantalla, lógica o estilo:
> 1. Se incrementa el número de versión global del sistema.
> 2. Se actualiza la fecha a la fecha en curso.
> 3. Se registra en este documento la nueva versión, la fecha, los módulos afectados y el detalle de los cambios.
> 4. Se refleja la nueva versión en `package.json` y en las etiquetas de versión visibles de la interfaz (`Matrix vX.Y.Z`).

---

## 📌 Versión Actual del Sistema

- **Versión:** `v10.3.4`
- **Última Actualización:** 28/10/2026
- **Estado General:** Operativo en Producción (Matrix)

---

## 📝 Historial de Versiones

### [v10.3.4] - 28/10/2026
- **Módulos:** Grandes Eventos / Informes de Impresión
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Rediseño de los informes de impresión según su propósito operativo y confidencialidad:
    - **Lista de Participantes:** Eliminadas las columnas y cifras económicas (`Pagado` / `Pendiente` en €) para el personal de sala y puerta; sustituidas por columna de estado operativo (`✅ Confirmado` / `⏳ Pendiente`), total de comensales por reserva, mesa y observaciones/alérgenos, con bloque de resumen de asistencia al inicio y pie de tabla.
    - **Distribución de Mesas:** Incorporación de desglose de adultos/niños y observaciones de sala por comensal.
    - **Informe Económico y Financiero:** Reporte exclusivo con el desglose de facturación prevista, recaudación cobrada, saldo pendiente por reserva y sumatorios totales al pie de tabla.

### [v10.3.3] - 28/10/2026
- **Módulos:** Grandes Eventos / Manuales de Usuario
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Incorporación en todos los manuales (Word, HTML interactivo y Markdown) del Paso 5 específico con la captura oficial de Eurocaja Rural (Redsys Canales) donde se activa la casilla "Notificar resultado a la siguiente URL" y se introduce la URL destino del Webhook.
  - Documentación del procedimiento ante modificaciones de comensales e importes mediante el botón `🔄 Nuevo Cód.` para evitar el error de pedido repetido en Redsys.

### [v10.3.2] - 28/10/2026
- **Módulos:** Grandes Eventos / Backend Webhook
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Inclusión en el modal de reserva de la URL de Notificación Online oficial del Webhook Redsys con botón de copiado rápido (`btnCopyWebhookUrl`) para configurar el TPV de Eurocaja Rural.
  - Implementación del botón `🔄 Nuevo Cód.` (`btnRegenPaygoldRef`) para generar automáticamente nuevos códigos o versiones correlativas (`GE-XXXXXX-2`) ante ampliaciones de comensales o reenvíos de enlaces sin colisionar con pedidos anteriores en Redsys.
  - Mejora en la Cloud Function del Webhook para resolver pedidos con sufijo de versión de forma flexible sin perder la trazabilidad de la reserva.

### [v10.3.1] - 28/10/2026
- **Módulos:** Grandes Eventos
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Corrección en el modal de reserva: eliminación del atributo HTML `required` en el campo del enlace PayGold para permitir guardar y dar de alta la reserva antes de entrar al TPV de Eurocaja Rural. La validación obligatoria se mantiene activa exclusivamente al pulsar el botón de envío de WhatsApp PayGold.

### [v10.3.0] - 28/10/2026
- **Módulos:** Backend (Cloud Functions) / Grandes Eventos / PayGold Eurocaja
- **Tipo de cambio:** MINOR
- **Descripción:**
  - Implementación de Cloud Function 2nd Gen para Webhook de notificación online asíncrona de Redsys (`redsysWebhook` en `europe-west1`).
  - Decodificación y validación automática de parámetros `Ds_MerchantParameters` (Base64/JSON) y verificación de códigos de autorización (0000-0099).
  - Sincronización en tiempo real con Firestore (`participantes_eventos`): cambio de estado a `garantizado`, registro contable en `pagos`, extracción segura de últimos 4 dígitos y caducidad, y guardado en colección de auditoría `auditoria_paygold`.
  - Configuración del proyecto Firebase `mesa-chef-prod` en plan Blaze con activación de APIs Cloud Build, Cloud Functions y Artifact Registry.

### [v10.2.2] - 28/10/2026
- **Módulos:** Grandes Eventos
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Enlace directo al manual de recepción en cabecera de evento, política estricta de caducidad exacta y sección de seguridad anti-filtraciones RGPD/PCI-DSS

### [v10.2.1] - 28/10/2026
- **Módulos:** Grandes Eventos
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Ampliación del modal de participante a 1260px y corrección de visibilidad y estilos con colores dinámicos en el selector de Estado Garantía

### [v10.2.0] - 28/10/2026
- **Módulos:** Grandes Eventos
- **Tipo de cambio:** MINOR
- **Descripción:**
  - Rediseño panorámico adaptable de 2 columnas (1040px) en modal de participante y enlace PayGold obligatorio para confirmación WhatsApp

### [v10.1.3] - 28/10/2026
- **Módulos:** Grandes Eventos
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Incorporación de política de límite de pago y cancelación no reembolsable en plantilla WhatsApp e invalidación de caché de scripts

### [v10.1.2] - 28/10/2026
- **Módulos:** Grandes Eventos
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Detección dinámica del nombre del evento en plantilla WhatsApp y botones de copiado rápido de importe y descripción para Eurocaja Rural PayGold

### [v10.1.1] - 28/10/2026
- **Módulos:** Grandes Eventos
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Corrección de enlace al Portal de Administración TPV Virtual Redsys Canales (Eurocaja Rural)

### [v10.1.0] - 28/10/2026
- **Módulos:** Grandes Eventos
- **Tipo de cambio:** MINOR
- **Descripción:**
  - Integración de Garantía y Pago PayGold (Eurocaja Rural) con fecha de cargo, avisos en tiempo real, protección PCI-DSS y confirmación por WhatsApp para Sercotel Guadiana

### [v10.0.1] - 27/10/2026
- **Módulos:** Varios módulos
- **Tipo de cambio:** PATCH
- **Descripción:**
  - Prueba de bump automático

### [v10.0.0] - 27/10/2026
- **Módulos:** Sistema Completo
- **Tipo de cambio:** Unificación de versión
- **Descripción:** 
  - Establecimiento de versión única global para todos los módulos de MesaChef (`v10.0.0`).
  - Creación del registro centralizado de versiones y control de cambios.
  - Definición de política de incremento de versión global ante cualquier cambio en cualquier módulo.
