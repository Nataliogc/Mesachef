# 📖 Manual Operativo para Recepción: Gestión de Pagos y Garantías PayGold (Sercotel Guadiana)

> **Versión Oficial del Manual:** `v10.3.8` • **Fecha de Actualización:** 28/10/2026 • **Estado:** Operativo en Producción

Este manual detalla paso a paso el procedimiento oficial que el equipo de Recepción y Administración debe seguir para registrar reservas, generar enlaces seguros de pago en Eurocaja Rural (PayGold), configurar la notificación automática online, enviar la confirmación por WhatsApp y gestionar modificaciones o conciliaciones.

---

## ✨ Novedades Recientes de esta Versión (v10.3.8)

* **🍽️ Menú Interactivo de Fin de Año y Envío por WhatsApp:** Integración del menú digital oficial (`menu-fin-de-ano-2026.html`) en la cabecera del evento, con modal para enviar el enlace y ficha del menú por WhatsApp a cualquier cliente o grupo, además de descarga en PDF.
* **✨ Ocultación Automática de PayGold en Servicio Incluido:** Al marcar la casilla *"✓ Servicio Incluido (sin cargo)"*, el bloque bancario de PayGold y tarjeta desaparece de la ficha del participante y se muestra un aviso explicativo, eliminando confusión operativa al no requerirse pasarela de pago.
* **⚡ Notificación Automática Online (Webhook):** Integración con Eurocaja Redsys para que la reserva pase automáticamente a `🟢 Garantizado / Pagado` en tiempo real al cobrar, sin que Recepción tenga que esperar el reenvío de email de Isabel.
* **📍 Captura Oficial del TPV (Paso 5):** Se añade la imagen exacta de la pantalla de Eurocaja donde se marca la casilla *"Notificar resultado a la siguiente URL"* y se introduce la URL de MesaChef.
* **🔄 Botón "Nuevo Cód." para Modificaciones:** Si el cliente amplía comensales o cambia importes, este botón genera un sufijo correlativo (`GE-XXXXXX-2`) para evitar el *Error 913 (Pedido repetido)* en Redsys.
* **💰 Copia Inteligente del Importe Pendiente:** El botón *"💰 Copiar Importe"* detecta si el cliente ya abonó parte de la reserva y copia automáticamente solo la diferencia restante que falta por cobrar.
* **📋 Copia Directa de URL en el Modal:** Se incorpora el botón *"📋 Copiar URL Webhook"* en la ficha del participante para copiar la dirección sin tener que buscarla.
* **👥 Cómputo por Personas y Cero Pagos en Lista de Puerta:** El *Listado de Participantes* para recepción/maitre no incluye datos económicos ni referencias de pago; computa en cabecera y pie el recuento real de **personas confirmadas y personas pendientes** (en lugar de reservas), y muestra el estado operativo (`✅ Confirmado` / `⏳ Pendiente`) considerando confirmados los servicios especiales. Los importes económicos y de saldo quedan reservados para el *Resumen Financiero*.
* **🔓 Guardado Flexible de Reserva:** Se permite guardar la reserva en cualquier momento sin obligar a tener el enlace PayGold de inmediato. El enlace solo se exige al pulsar *"📱 WhatsApp PayGold"*.

---

## 📌 Datos Clave de Acceso y Configuración

| Concepto | Detalle Oficial |
| :--- | :--- |
| **Establecimiento** | Sercotel Guadiana |
| **Entidad Bancaria** | Eurocaja Rural (Redsys) |
| **Usuario / Terminal TPV** | `168355840-001` |
| **Portal de Acceso TPV** | [https://canales.redsys.es/portal](https://canales.redsys.es/portal) |
| **URL Notificación Online (Webhook)** | `https://europe-west1-mesa-chef-prod.cloudfunctions.net/redsysWebhook` |
| **Sincronización Automática** | Instantánea: MesaChef pasa a 🟢 Garantizado y anota el pago al momento |
| **Email de Avisos de Pago** | `administracion@hotelguadiana.es` (Isabel) |
| **Circuito de Conciliación** | Isabel recibe el justificante oficial de Eurocaja para control contable y facturación. |

---

## 🔄 Resumen del Circuito de Cobro (Automático + Respaldo Contable)

```mermaid
sequenceDiagram
    autonumber
    actor Rec as Recepcionista
    participant MC as MesaChef
    participant TPV as Eurocaja (PayGold)
    actor Cli as Cliente
    participant WH as Webhook MesaChef
    actor Isa as Isabel (Admin)

    Rec->>MC: Abre ficha participante y anota datos
    Rec->>MC: Copia Cód. Pedido, Importe y Descripción
    Rec->>TPV: Accede con 168355840-001 y genera enlace PayGold
    TPV-->>Rec: Entrega enlace de pago seguro
    Rec->>MC: Pega enlace y pulsa "WhatsApp PayGold"
    Rec->>Cli: Envía mensaje con enlace y política de pago
    Cli->>TPV: Paga desde su móvil (Bizum / Tarjeta)
    par Actualización Automática en Tiempo Real
        TPV->>WH: Notificación HTTP online instantánea
        WH->>MC: Actualiza ficha a 🟢 Garantizado y anota el pago
    and Respaldo Contable Oficial
        TPV->>Isa: Justificante oficial por email (administracion@)
    end
```

---

## 🛡️ Seguridad Total: ¿Por qué es Vital Utilizar el Enlace PayGold?

La razón primordial por la que **NUNCA debemos pedir ni escribir tarjetas de crédito completas de 16 dígitos en notas ni en el campo de "Observaciones"** es proteger legalmente al hotel y a cada uno de los empleados de recepción:

1. **Prevención de Filtraciones y Responsabilidad Legal (RGPD & PCI-DSS):**  
   Almacenar datos completos de tarjetas en texto plano en ordenadores o libretas incumple la normativa bancaria internacional PCI-DSS y el RGPD. Ante cualquier filtración, inspección o brecha de seguridad, el hotel se enfrenta a **sanciones de hasta el 4% de la facturación y multas de Visa/Mastercard de hasta 100.000 €**, además de la cancelación inmediata del TPV. Con PayGold, **el hotel nunca almacena la tarjeta**, por lo que no existe ningún dato que pueda filtrarse.

2. **Blindaje contra Fraudes y Falsas Devoluciones (3D Secure / PSD2):**  
   Si el hotel cobrase una tarjeta manualmente tecleando los números en el datáfono, el cliente puede llamar a su banco al día siguiente diciendo *"yo no autoricé este cobro"*. Por ley, el banco siempre le devuelve el dinero al cliente y el hotel pierde el dinero de la cena. Con el enlace PayGold, **el cliente autoriza en su propia app bancaria (con huella, Face ID o SMS)**. Legalmente se produce el traspaso de responsabilidad (*Liability Shift*) y **el cliente NO puede repudiar el cobro**.

3. **Tranquilidad para el Personal de Recepción:**  
   Al no ver ni guardar tarjetas de clientes, ningún recepcionista puede ser jamás objeto de sospecha si a ese cliente le clonan la tarjeta en otro comercio. En MesaChef solo dejamos constancia de los últimos 4 dígitos (ej. `•••• 2525`) como simple referencia visual.

---

## 📝 Procedimiento Paso a Paso

### PASO 1: Apertura de la Ficha en MesaChef

1. En el módulo **Grandes Eventos** de MesaChef, localiza la reserva o pulsa **+ Añadir Participante**.
2. Rellena los datos de la reserva:
   * **Nombre Titular:** Nombre completo del cliente.
   * **Teléfono:** 9 dígitos (ej. `607 915 958`).
   * **Comensales:** Adultos y Niños.
   * **Fecha Cargo Previsto:** Selecciona la fecha límite de pago (ej. `28/12/2026`).

![Ficha Participante en MesaChef](Img/manual/step1_mesachef.png)

> [!CAUTION]
> **REGLA DE ORO DE SEGURIDAD (PCI-DSS):**
> **NUNCA apuntar números de tarjeta de 16 dígitos en el recuadro "Observaciones"**.  
> Si el cliente facilita su tarjeta por teléfono, anota **únicamente los últimos 4 dígitos** (ej. `2525`) en su casilla correspondiente. El cobro oficial se realiza exclusivamente a través del enlace de Eurocaja Rural.

---

### PASO 2: Acceso al TPV Virtual de Eurocaja Rural

1. En la ficha de MesaChef, pulsa en el enlace azul: **🌐 Abrir TPV Eurocaja Rural**.
2. Introduce las credenciales oficiales de acceso:
   * **Usuario:** `168355840-001` *(importante: debe incluir el terminal `-001`)*.
   * **Contraseña:** La contraseña asignada al TPV de recepción.
   * Pulsa **Aceptar**.

![Inicio de Sesión en Redsys Eurocaja](Img/manual/step2_redsys_login.png)

---

### PASO 3: Generación del Enlace PayGold en Eurocaja

1. En el menú lateral izquierdo de Eurocaja Rural, haz clic en **PayGold** (icono verde con tarjeta y flecha).
2. Rellena las 3 casillas utilizando los **botones de copia rápida** de MesaChef:
   * **Código de pedido:** Pulsa **`📋 Copiar`** en MesaChef y pégalo aquí (`Ctrl + V`). *(Ejemplo: `GE-232078`)*.
   * **Importe:** Pulsa **`💰 Copiar Importe`** en MesaChef y pégalo aquí (`Ctrl + V`). *(Ejemplo: `120.00`)*.
   * **Descripción:** Pulsa **`📝 Copiar Descripción`** en MesaChef y pégalo aquí (`Ctrl + V`).  
     *Formato oficial:* `Cena Fin de Año - [Nombre del Cliente]` *(Ej: `Cena Fin de Año 2026 - Natalio Fernandez`)*.
3. **Caducidad del enlace (OBLIGATORIO):** Marca la opción **"Hora exacta"** e introduce **exactamente la misma Fecha Límite de Pago** fijada en MesaChef para este evento (ej. `Fecha: 28-12-2026`, `Hora: 23:59`). **NUNCA dejar las 24 horas por defecto**, para que el enlace expire exactamente el día acordado.
4. Pulsa el botón **Aceptar / Enviar**: el banco generará el enlace oficial seguro (ej. `https://sis.redsys.es/sis/p2f?t=...`).
5. **Copia ese enlace.**

![Formulario PayGold en Eurocaja](Img/manual/step3_paygold_form.png)

---

### PASO 4: Envío del WhatsApp de Confirmación al Cliente

1. Vuelve a la ficha del participante en **MesaChef**.
2. Pega el enlace en la casilla:  
   👉 **Enlace PayGold generado en Eurocaja**.
3. Haz clic en el botón verde: **`📱 WhatsApp PayGold`**.
4. Se abrirá WhatsApp Web / App con el mensaje redactado automáticamente:
   * Nombre del cliente y del evento (*Cena Fin de año 2026 en Sercotel Guadiana*).
   * Número de asistentes e importes.
   * Enlace oficial seguro de Eurocaja Rural para pagar con Bizum o Tarjeta.
   * **Cláusula de cancelación obligatoria:**
     > *"A partir de esta fecha la cantidad será no reembolsable. Si el pago no se recibe en esta fecha, su reserva será cancelada por falta de pago."*
5. Envía el mensaje y pulsa **Guardar Ficha** en MesaChef. El estado cambiará a `📤 Enlace Enviado`.

![WhatsApp generado con enlace y políticas](Img/manual/step4_whatsapp_message.png)

---

### PASO 5: Dónde se Configura el Enlace Webhook en Eurocaja (Notificación Online)

Para que Eurocaja Rural avise de forma automática e inmediata a MesaChef cada vez que un cliente pague, se debe configurar una sola vez la **URL de Notificación Online**:

1. En el portal de Eurocaja Rural Redsys, entra en la administración del comercio `168355840` / Terminal `001`.
2. Localiza el apartado **"Notificación online"**:
   * Marca la casilla: ☑️ **"Notificar resultado a la siguiente URL"**.
   * En el recuadro **"URL destino notificación"**, introduce la URL oficial:
     ```text
     https://europe-west1-mesa-chef-prod.cloudfunctions.net/redsysWebhook
     ```
     *(Puedes copiarla con 1 clic en MesaChef pulsando el botón `📋 Copiar URL Webhook`).*
3. Pulsa **Aceptar / Guardar**.

![Dónde configurar la URL de Notificación Online en Eurocaja](Img/manual/step_webhook_config.png)

---

### PASO 6: Actualización Automática (Webhook) y Conciliación Contable

Gracias a la integración del **Webhook Online de Redsys**, el sistema funciona ahora de manera autónoma:

1. **Sincronización Automática en Tiempo Real (MesaChef):**
   * En el instante en que el cliente completa el pago desde su teléfono (mediante Bizum o tarjeta), Eurocaja Rural envía la notificación a esa URL destino.
   * **MesaChef actualiza automáticamente la ficha:**
     - Cambia el estado a **`✅ Garantizado / Pagado`**.
     - Anota el abono en el **Historial de Pagos** con la fecha y código de autorización del banco.
     - Guarda los últimos 4 dígitos y caducidad para referencia del hotel.
   * **El personal de Recepción NO necesita hacer nada a mano**: al consultar la lista de participantes verá el semáforo verde inmediatamente.

2. **Control y Conciliación con Administración (Isabel):**
   * Eurocaja Rural sigue enviando de forma paralela el correo con el justificante oficial a **`administracion@hotelguadiana.es`** (**Isabel**).
   * **Función de este email:** Sirve a Isabel para la cuadratura contable y la conciliación mensual con el extracto bancario de Eurocaja Rural.
   * **Recepción ya no tiene que esperar el correo:** Dado que MesaChef se actualiza al segundo, Recepción puede continuar atendiendo sin demoras.

![Email de confirmación que recibe Isabel](Img/manual/step5_email_isabel.png)

---

## 🔄 ¿Qué Hacer si el Cliente Modifica Comensales o Importes?

En Redsys **NUNCA se puede repetir un número de pedido** ya utilizado (`Error 913: Pedido repetido`). Si un cliente llama para añadir más personas (o si el enlace original caducó y necesita uno nuevo):

1. **Ajusta los comensales en MesaChef:**
   - Si eran 2 personas (180 €) y pasan a ser 3 (270 €), el sistema calcula automáticamente el nuevo **Pendiente: 90,00 €**.
   - Los pagos realizados anteriormente (180 €) se mantienen intactos en el *Historial de Pagos*.
2. **Genera una nueva versión de pedido con 1 clic:**
   - En la casilla *Cód. Pedido*, pulsa el botón **`🔄 Nuevo Cód.`**:  
     `GE-675270` pasará automáticamente a `GE-675270-2`.
3. **Copia la diferencia:**
   - Pulsa **`💰 Copiar Importe`**: copiará únicamente los **90,00 €** pendientes.
4. **Crea el nuevo enlace en Eurocaja:**
   - Genera el enlace PayGold con el nuevo código correlativo (`GE-675270-2`) y la diferencia (90 €).
5. **Pega el enlace y envía el WhatsApp:**
   - Pega el nuevo enlace y pulsa **`📱 WhatsApp PayGold`**.
   - Cuando el cliente pague, el Webhook **sumará los nuevos 90 € al historial**, completando los 270 € y dejando la reserva 100% garantizada.

---

## ❓ Preguntas Frecuentes y Resolución de Incidencias

> [!TIP]
> **¿Cómo sé si un cliente ya ha pagado sin entrar a su ficha?**  
> En la tabla principal de participantes de Grandes Eventos, la columna **Garantía PayGold** mostrará el distintivo verde **`✅ Garantizado`** y el importe pendiente quedará a **`0,00 €`**.

> [!TIP]
> **¿Qué pasa si el cliente no paga antes de la fecha límite?**  
> En la tabla de participantes de Grandes Eventos, la reserva mostrará la alerta roja:  
> `⚠️ Vencido: DD/MM/AAAA`.  
> Recepción debe llamar al cliente o, si no responde, proceder a la cancelación de la reserva por falta de pago según la política informada.

> [!NOTE]
> **¿Por qué el usuario de Eurocaja debe ser 168355840-001?**  
> El sufijo `-001` identifica el Terminal 1 asignado al Hotel Guadiana para cobros a distancia PayGold. Sin este sufijo, el sistema del banco no permitirá iniciar sesión.
