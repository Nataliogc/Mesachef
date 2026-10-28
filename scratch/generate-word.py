import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_word_manual():
    doc = Document()
    
    # Page setup - Margins 1 inch
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)
        
    # Styles
    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_t = p_title.add_run("MANUAL OPERATIVO PARA RECEPCIÓN")
    run_t.font.size = Pt(20)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor(15, 23, 42) # Slate-900
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("Gestión de Cobros, Garantías PayGold (Eurocaja Rural) y Confirmación por WhatsApp\nSercotel Hotel Guadiana • MesaChef Matrix v10.2.1")
    run_sub.font.size = Pt(11)
    run_sub.font.color.rgb = RGBColor(100, 116, 139) # Slate-500
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    
    # Summary Table: Datos Clave
    h2 = doc.add_paragraph()
    run_h2 = h2.add_run("1. DATOS CLAVE DE CONFIGURACIÓN Y ACCESO")
    run_h2.font.size = Pt(13)
    run_h2.font.bold = True
    run_h2.font.color.rgb = RGBColor(21, 128, 61) # Green-700
    
    table_data = [
        ("Establecimiento", "Sercotel Guadiana"),
        ("Entidad Bancaria", "Eurocaja Rural (Plataforma Redsys)"),
        ("Usuario / Terminal TPV", "168355840-001 (Obligatorio incluir -001)"),
        ("Portal de Acceso TPV", "https://canales.redsys.es/portal"),
        ("Email de Avisos de Pago", "administracion@hotelguadiana.es (Isabel)"),
        ("Circuito de Confirmación", "Isabel recibe el email del banco y lo reenvía a Recepción para su control y apunte en MesaChef.")
    ]
    
    table = doc.add_table(rows=len(table_data) + 1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    headers = ["Concepto", "Detalle Operativo"]
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "166534") # Dark green
        set_cell_margins(hdr_cells[i], top=140, bottom=140, left=160, right=160)
        p = hdr_cells[i].paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(255, 255, 255)
        p.runs[0].font.size = Pt(10)
        
    for r_idx, (col1, col2) in enumerate(table_data, start=1):
        row_cells = table.rows[r_idx].cells
        row_cells[0].text = col1
        row_cells[1].text = col2
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for i in range(2):
            set_cell_background(row_cells[i], bg)
            set_cell_margins(row_cells[i], top=100, bottom=100, left=140, right=140)
            p = row_cells[i].paragraphs[0]
            p.runs[0].font.size = Pt(9.5)
            if i == 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(30, 41, 59)
                
    table.columns[0].width = Inches(2.2)
    table.columns[1].width = Inches(4.5)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # Steps
    steps = [
        {
            "num": "PASO 1",
            "title": "Apertura y Registro de la Ficha en MesaChef",
            "desc": [
                "1. En MesaChef, entra en Grandes Eventos y localiza la reserva del cliente o pulsa en '+ Añadir Participante'.",
                "2. Rellena los datos habituales: Nombre completo del titular, Teléfono móvil, Adultos y Niños.",
                "3. En 'Fecha Cargo Previsto', selecciona la fecha límite pactada para el cobro (ej. 28/12/2026).",
                "4. Observa el 'Cód. Pedido PayGold' generado automáticamente (ej. GE-232078).",
                "IMPORTANTE: NUNCA escribir tarjetas de crédito completas de 16 dígitos en las Observaciones. Si el cliente la facilita por teléfono, apunta solo los últimos 4 dígitos en el recuadro seguro."
            ],
            "img": "Img/manual/step1_mesachef.png",
            "img_width": 5.8
        },
        {
            "num": "PASO 2",
            "title": "Acceso al Portal TPV Virtual de Eurocaja Rural",
            "desc": [
                "1. En la misma ficha de MesaChef, haz clic en el enlace azul: '🌐 Abrir TPV Eurocaja Rural'.",
                "2. En la pantalla de bienvenida de Redsys Eurocaja introduce:",
                "   • Usuario: 168355840-001 (imprescindible escribir el guion y el 001).",
                "   • Contraseña: La clave de acceso del TPV del hotel.",
                "3. Pulsa el botón naranja 'Aceptar'."
            ],
            "img": "Img/manual/step2_redsys_login.png",
            "img_width": 3.6
        },
        {
            "num": "PASO 3",
            "title": "Generación del Enlace de Cobro PayGold en Eurocaja",
            "desc": [
                "1. En el menú de la izquierda de Eurocaja, pulsa en el botón verde 'PayGold' (icono de tarjeta con flecha).",
                "2. Rellena las casillas usando los botones de copia rápida de MesaChef:",
                "   • Código de pedido: Pulsa '📋 Copiar' en MesaChef y pégalo aquí (Ctrl + V).",
                "   • Importe: Pulsa '💰 Copiar Importe' en MesaChef y pégalo aquí (Ctrl + V).",
                "   • Descripción: Pulsa '📝 Copiar Descripción' en MesaChef y pégalo aquí (Ctrl + V). Debe decir: Cena Fin de año - [Nombre Cliente].",
                "3. En Caducidad del enlace, marca la fecha límite acordada.",
                "4. Pulsa 'Aceptar / Enviar': el banco te facilitará el enlace seguro (https://sis.redsys.es/sis/p2f?t=...).",
                "5. Copia ese enlace oficial."
            ],
            "img": "Img/manual/step3_paygold_form.png",
            "img_width": 5.4
        },
        {
            "num": "PASO 4",
            "title": "Envío del WhatsApp con Enlace y Cláusula de Cancelación",
            "desc": [
                "1. Vuelve a la ficha de MesaChef y pega el enlace en 'Enlace PayGold generado en Eurocaja (Obligatorio)'.",
                "2. Haz clic en el botón verde: '📱 WhatsApp PayGold'.",
                "3. Se abrirá WhatsApp con el mensaje oficial pre-redactado que incluye:",
                "   • Nombre del cliente y evento oficial (Cena Fin de año 2026 en Sercotel Guadiana).",
                "   • Desglose de comensales e importe total y pendiente.",
                "   • Enlace directo a la pasarela bancaria oficial de Eurocaja Rural.",
                "   • Cláusula legal estricta de cancelación: 'A partir de esta fecha la cantidad será no reembolsable. Si el pago no se recibe en esta fecha, su reserva será cancelada por falta de pago.'",
                "4. Pulsa Enviar en WhatsApp y luego pulsa 'Guardar Ficha' en MesaChef."
            ],
            "img": "Img/manual/step4_whatsapp_message.png",
            "img_width": 5.2
        },
        {
            "num": "PASO 5",
            "title": "Confirmación del Cobro y Circuito con Isabel (Administración)",
            "desc": [
                "1. Cuando el cliente pulsa el enlace y paga (con Bizum o Tarjeta), Eurocaja envía un email de confirmación automática.",
                "2. Este correo llega a administracion@hotelguadiana.es (Isabel).",
                "3. Isabel comprueba la entrada del dinero y REENVÍA el correo a Recepción para su control.",
                "4. En cuanto Recepción recibe el email de Isabel:",
                "   • Abre la ficha del participante en MesaChef.",
                "   • En 'Historial de Pagos', anota el importe y pulsa '+ Añadir'.",
                "   • Cambia el 'Estado Garantía' a: '✅ Garantizado / Pagado'.",
                "   • Pulsa 'Guardar Ficha'. ¡Reserva 100% blindada!"
            ],
            "img": "Img/manual/step5_email_isabel.png",
            "img_width": 5.4
        }
    ]
    
    for s in steps:
        p_step = doc.add_paragraph()
        p_step.paragraph_format.space_before = Pt(14)
        run_st = p_step.add_run(f"[{s['num']}] {s['title']}")
        run_st.font.size = Pt(12.5)
        run_st.font.bold = True
        run_st.font.color.rgb = RGBColor(30, 41, 59)
        
        for line in s['desc']:
            p_line = doc.add_paragraph()
            p_line.paragraph_format.space_after = Pt(2)
            p_line.paragraph_format.space_before = Pt(1)
            p_line.paragraph_format.left_indent = Inches(0.2)
            run_l = p_line.add_run(line)
            run_l.font.size = Pt(9.5)
            if "IMPORTANTE:" in line or "REGLA DE ORO" in line:
                run_l.font.bold = True
                run_l.font.color.rgb = RGBColor(185, 28, 28) # Red
                
        if os.path.exists(s['img']):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(6)
            p_img.paragraph_format.space_after = Pt(10)
            doc.add_picture(s['img'], width=Inches(s['img_width']))
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run_cap = p_cap.add_run(f"Ilustración {s['num']}: {s['title']}")
            run_cap.font.size = Pt(8.5)
            run_cap.font.italic = True
            run_cap.font.color.rgb = RGBColor(100, 116, 139)
            
    # Save Word document
    out_word_path = 'c:/Users/comun/Documents/GitHub/Mesachef/MANUAL_RECEPCION_PAYGOLD_GUADIANA.docx'
    doc.save(out_word_path)
    print(f"Word document saved to {out_word_path}")

create_word_manual()
