# 📘 Manual de Operaciones Integral - MesaChef Matrix v10.3.2

**Versión del Documento:** 10.2.2 Updated  
**Confidencialidad:** Uso Interno Grupo Guadiana & Cumbria  
**Filosofía:** "Dato que no está en la Matrix, evento que no existe."
Bienvenida
PROYECTO MESACHEF
Bienvenido a MesaChef la suite integral diseñada para la gestión eficiente de hostelería en el Grupo. Esta guía está pensada para facilitar el uso de la versión 10.0, cubriendo sus operaciones principales y las novedades incorporadas.

VERSIÓN MATRIX
MesaChef nace de una necesidad real: unificar, ordenar y dar coherencia a la gestión operativa de eventos, restauración y espacios en un entorno hotelero cada vez más complejo y dinámico.
No es solo un software. MesaChef es una herramienta de control, visión y toma de decisiones, diseñada desde la operativa diaria, pensada para quienes están en primera línea y necesitan información clara, accesible y accionable.
La versión Matrix representa el punto de partida del proyecto. Su objetivo es conectar los distintos elementos clave del negocio —eventos, salones, reservas, menús, participantes, importes y estados— en una única estructura lógica y visual. Una matriz donde cada dato tiene sentido por sí mismo, pero cobra verdadero valor cuando se relaciona con el resto.
Matrix no busca aún la perfección, sino la solidez de los cimientos:
•	Centraliza la información dispersa.
•	Elimina duplicidades y dependencias externas.
•	Aporta trazabilidad completa desde la creación del evento hasta su cierre económico.
•	Facilita una lectura rápida del estado real de cada servicio.
Esta versión inicial está pensada para ordenar el presente, pero sobre todo para preparar el futuro. Cada decisión técnica y funcional se ha tomado con una evolución clara en mente: más automatización, más análisis, más integración y una experiencia cada vez más fluida, también en movilidad.
MesaChef Matrix es el primer nodo de un sistema vivo, escalable y adaptable, que crecerá al ritmo de la operativa real del hotel. Un proyecto construido desde dentro, para dar soporte al día a día, mejorar el control y anticiparse a lo que viene.

---

## 📑 Índice de Contenidos

1.  **Fundamentos y Acceso**
2.  **Módulo: Restaurante (El Diario)**
3.  **Módulo: Planning de Salones (La Torre de Control)**
4.  **Módulo: Presupuestos (Comercial)**
5.  **Módulo: Grandes Eventos (Tickets y Cotillones)**
6.  **Administración y Configuración**
7.  **Informes de Cocina y Sala**
8.  **FAQ y Solución de Problemas**

---

## 1. 🚀 Fundamentos y Acceso

### Selección de Entorno
Al iniciar la aplicación, localice el selector de hotel en la esquina superior izquierda. **Es vital** confirmar que está en el hotel correcto antes de trabajar:
-   **Sercotel Guadiana:**
-   **Cumbria Spa&Hotel:**

### Modos de Conexión
-   🟢 **Online:** Todo sincronizado.
-   🟡 **Offline / Reonectando:** Puede seguir trabajando, pero los datos no se enviarán a cocina hasta recuperar la red. **No cierre la pestaña.**

---

## 2. 🍽️ Módulo: Restaurante (El Diario)

Gestión de reservas a la carta, menús del día y pequeños grupos.

### El Grid de Reservas
La pantalla principal es una parrilla dividida en días (columnas) y turnos (filas).

#### Estados del Servicio (Código de Colores)
Cada reserva tiene una barra lateral de color:
-   ⬜ **Blanco (Pendiente):** Reserva tomada, cliente por llegar.
-   � **Verde (Confirmada):** Reserva reconfirmada telefónicamente.
-   🟦 **Azul / Sentado:** (Implícito) Clientes ya en mesa.
-   🔴 **Rojo (Anulada):** Cancelación. Se mantiene visible para estadística.
-   🚦 **Badge "NUEVO":** Parpadea durante 15 minutos tras la creación. Ideal para que el Maître vea lo último que ha entrado.

#### Operativa de Turnos
El sistema detecta automáticamente si es Almuerzo o Cena por la hora:
-   ☀️ **Almuerzo:** 13:00 - 16:00 (Aprox).
-   🌙 **Cena:** 20:30 - 23:00 (Aprox).
-   🚫 **Bloqueo de Turno:** Si la cocina está saturada, pulse el icono del candado para cerrar la venta online/recepción de ese turno específico.

### Notas de Cocina y Alergias
En el campo "Notas" o "Alergias", sea telegráfico pero preciso.
-   *Ejemplo:* "Celiaco estricto silla bebe".
-   Esta nota **sale impresa** en el listado de cocina.

---

## 3. 📅 Módulo: Planning de Salones (La Torre de Control)

Autoridad suprema de disponibilidad.

### Semáforo de Disponibilidad
-   🟠 **TENTATIVO (Opción):** Cliente interesado. Se puede "desafiar" si entra una venta firme.
-   🟢 **CONFIRMADO (Vendido):** Contrato firmado + Señal. Intocable.
-   🔴 **BLOQUEO TÉCNICO:** Obras, pintura o uso interno.
-   ⚪ **LIBRE:** Disponible para venta.

### Crear Reserva de Salón
1.  Click en celda vacía.
2.  **Datos Obligatorios:** Nombre Evento, Pax, Teléfono.
3.  **Montaje Supervisado:** El sistema validará si los pax caben en el salón según el montaje:
    -   🍽️ **Banquete:** Mesas redondas.
    -   🎭 **Teatro:** Sillas en fila.
    -   🎓 **Escuela:** Mesas pupitre.
    -   🍸 **Cóctel:** De pie.

### Gestión de Overbooking
Si ve una alerta de **CONFLICTO**:
-   Pare inmediatamente.
-   Verifique quién tiene la reserva VERDE. Esa es la válida.
-   Contacte con el compañero de la reserva NARANJA para negociar cambio de fecha/sala.

---

## 4. 📄 Módulo: Presupuestos (Manual de Dirección Comercial)

Este es el corazón financiero del hotel. Aquí nacen los eventos antes de existir en el calendario.

### 4.1. El Arte de Crear una Propuesta
1.  **Datos de Cabecera:**
    *   **Cliente y Referencia:** Vitales para el CRM.
    *   **Fechas y Turnos:** Definen *cuándo* necesitamos el espacio.
    *   **Sincronización Inteligente de Pax:** Si cambia el número de adultos en la cabecera (ej: de 100 a 120), el sistema **actualizará automáticamente** las unidades de los menús en las líneas de detalle. *Ahorra horas de recalculo.*

### 4.2. Selección de Espacio y "Matrix Check"
Al seleccionar un **Salón** y una **Fecha**, el sistema consulta en tiempo real el Módulo de Salones.
*   ✅ **Si está libre:** Permite seguir.
*   ❌ **Si está ocupado (Verde):** Bloquea la operación y sugiere cambio de fecha.
*   ⚠️ **Aviso de Montaje:** Al elegir "Banquete" o "Escuela", le indicará la **Capacidad Máxima** real de ese salón. *Nunca venda por encima de esa cifra.*

### 4.3. Confección del Menú (Líneas)
*   **Kits de Venta:** Use los packs precargados (Menú Boda A, Boda B) para ir rápido." en desarrollo"
*   **Personalización "Sin Cargo" (S/C):** Marque esta casilla si desea regalar una partida (ej. "Prueba de menú gratuita"). El precio saldrá a 0€ pero quedará registrado el coste interno.

### 4.4. Ciclo de Vida y **Sincronización Inter-Modular**
El estado del presupuesto dispara acciones en todo el ecosistema MesaChef:

| Estado | Acción en el Sistema | Impacto en Módulos |
| :--- | :--- | :--- |
| **Borrador** | Solo visible en listado. | Ninguno. (Invisible para Operaciones). |
| **Enviado** | PDF generado para cliente. | Aparece como **🟠 TENTATIVO** en Salones (Opción). |
| **CONFIRMADO** | **El "Gatillo" del Sistema.** | 1. **Salones:** Pasa a **🟢 VERDE (Bloqueado)**.<br>2. **Restaurante:** Si el lugar es "Restaurante", crea la reserva en el Libro de Reservas.<br>3. **Cocina:** Entra en la previsión de compras. |
| **Rechazado** | Cliente desiste. | Libera la fecha en Salones (vuelve a Blanco). |

> **IMPORTANTE:** El botón "Confirmar" es la herramienta más potente del comercial. Úselo solo con contrato firmado y señal recibida.

---

## 5. 🎉 Módulo: Grandes Eventos (Tickets)

Para Nochevieja, Reyes, Congresos con venta de entrada individual.

### Motor de Venta
-   **Alta Rápida:** Solo requiere Nombre y Nº Entradas.
-   **Pagos Parciales:** (Ej. Señal 50€). El sistema muestra el "Pendiente de Cobro" en rojo.

### Anulaciones Financieras
Al anular un ticket, el sistema ofrece dos vías:
1.  **Devolver (Borrar saldo):** Si se devuelve el dinero al cliente.
2.  **Retener (Gastos):** Si el hotel se queda la señal por cancelación tardía.

---

## 6. ⚙️ Administración (Solo Gerencia)

El panel de control ("La Sala de Máquinas") es de acceso restringido. Aquí se definen las reglas del juego para todo el hotel.

### 🔐 Acceso y Seguridad
-   **URL:** `/admin.html`
-   **Seguridad:** Protegido por contraseña maestra.
-   **Modo Mantenimiento:** En la pestaña "General" existe un interruptor de emergencia ("CERRAR SISTEMA"). Si se activa, ningún usuario podrá crear reservas hasta que se desactive. Úselo solo en actualizaciones críticas.

### 🌍 Pestaña General
Defina los horarios operativos que rigen el Restaurante y los avisos:
-   **Horarios de Cocina:** Defina la hora de apertura y cierre para Almuerzos y Cenas. El sistema avisará si alguien intenta reservar fuera de hora.
-   **IA & Tono:** Configure si la IA (usada en redacción de menús) debe hablar en tono "Formal", "Cercano" o "Lujo".

### 🏨 Gestión de Salones (Guadiana / Cumbria)
Aquí se crea la arquitectura física del hotel. Puede añadir salones, desactivarlos o editarlos:
-   **Capacidades Dinámicas:** Pulse el icono ⚙️ en cada salón para definir cuántas personas caben *exactamente* en cada formato (Banquete vs Escuela vs Teatro).
    -   *Impacto:* Si define "Banquete: 100", el sistema de reservas impedirá vender una boda de 120 pax en ese salón.
-   **Tarifas de Alquiler:** Defina el coste de alquiler (Media Jornada / Jornada Completa) para que aparezca por defecto en los Presupuestos.

### 📽️ Extras y Servicios
Catálogo de precios fijos para servicios complementarios (Proyector, Azafatas, Barra Libre).
-   Lo que añada aquí aparecerá disponible en el desplegable "Añadir Servicio" del módulo de Presupuestos.

### 📅 Festivos y Bloqueos
-   **Festivos:** Días marcados en rojo en todos los calendarios. Cierre total.
-   **Bloqueos Tácticos:** Puede cerrar **un salón específico** durante un rango de fechas (ej: "Pintura Salón Mercurio del 1 al 5 de Agosto"). Esto impide la venta solo en ese espacio, dejando el resto del hotel operativo.

---

## 7. 🖨️ Informes de Cocina y Sala

Desde el módulo Restaurante, botón "Imprimir".

### Informe de Previsión (Semanal/Diario)
Documento vital para el Jefe de Cocina.
-   **Incluye:** Totales de pax por turno, desglose de platos (si están predefinidos), alergias y observaciones especiales.
-   **Hora de Corte:** Se recomienda imprimir el definitivo a las 11:30 (Almuerzo) y 19:30 (Cena).

---

## 8. ❓ FAQ - Solución de Problemas y Casos Reales

### 🚨 Emergencias Técnicas
**Q: "Se ha ido la luz/internet en medio de una reserva."**
A: **No cierre la pestaña ni el navegador.** MesaChef guarda los datos en la memoria local. Siga trabajando. En cuanto vuelva la conexión, verá el badge pasar de amarillo a verde. Si cierra la pestaña antes, perderá el trabajo no guardado.

**Q: "He borrado un presupuesto confirmado por error. ¿Pánico?"**
A: Respire. El sistema no borra físicamente de inmediato. Contacte con IT en los primeros 30 minutos para intentar recuperar el documento de la papelera de reciclaje de la base de datos.
*(Nota: Esto no aplica a bloqueo de salones, que se liberan al instante).*

**Q: "¿Puedo usar la Tablet en el pase de cocina?"**
A: **Sí.** MesaChef es 100% *responsive*. El Maître puede usar un iPad para ver las reservas en tiempo real y marcar mesas como "Sentadas".

---

### 📅 Operativa de Salones y Bloqueos
**Q: "¿Puedo confirmar un evento para el año 2026 o 2027?"**
A: Sí, el calendario es infinito. Navegue con las flechas de año. Es recomendable para bloquear bodas con mucha antelación.

**Q: "¿Qué pasa si dos comerciales intentan reservar el mismo salón a la vez?"**
A: El sistema funciona por **"Gatillo Rápido"**. El primero que pulsa "Guardar" se queda la fecha y el salón se pinta de su color. Al segundo le saltará un error: *"Conflicto: El salón acaba de ser ocupado"*.

**Q: "¿Puedo alquilar el salón por 'Media Jornada'?"**
A: **Sí.** El sistema permite tres tipos de venta:
*   **Media Jornada (Mañana):** Deja libre la tarde.
*   **Media Jornada (Tarde):** Deja libre la mañana.
*   **Jornada Completa:** Bloquea todo el día (Mañana y Tarde).
*   *Nota:* Si un salón tiene ocupada la "Mañana", usted podrá vender la "Tarde" sin que salte conflicto.

---

### 💰 Presupuestos y Finanzas
**Q: "¿Cómo facturo un evento?"**
A: **MesaChef NO factura.** Es estrictamente una herramienta de control de la operativa diaria. Para emitir una factura legal, debe introducir los datos manualmente en el **PMS de Gruphotel**.

**Q: "El cliente quiere un plato que no está en la base de datos."**
A: Puede escribirlo manualmente. Recuerde que el sistema actúa como **gestor de la operativa**: la prioridad es que la orden de servicio (Cocina/Sala) refleje exactamente lo que se va a servir, aunque el plato no esté codificado oficialmente.

**Q: "¿El 'Sin Cargo' (S/C) afecta a mis objetivos de venta?"**
A: Sí. Todo lo que marque como S/C reduce el precio medio por cubierto. Úselo con responsabilidad para atenciones comerciales autorizadas.

---

### 🍽️ Restaurante
**Q: "¿Puedo reservar en horario de tarde (17:00) si no es Almuerzo ni Cena?"**
A: **Sí.** El sistema lo permitirá, pero lo considerará **"Horario Especial"**.
*   *Nota:* Asegúrese de informar a Cocina, ya que las partidas calientes suelen estar cerradas a esa hora.

**Q: "¿Sale la alergia al gluten en el ticket de cocina?"**
A: Sí, en negrita y mayúsculas, siempre que lo haya escrito en el campo "Observaciones/Alergias". **Validarlo verbalmente con cocina siempre.**
