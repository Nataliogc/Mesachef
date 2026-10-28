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

- **Versión:** `v10.2.0`
- **Última Actualización:** 28/10/2026
- **Estado General:** Operativo en Producción (Matrix)

---

## 📝 Historial de Versiones

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
