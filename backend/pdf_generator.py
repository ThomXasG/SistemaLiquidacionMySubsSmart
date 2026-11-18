import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether, PageBreak, Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from PIL import Image as PILImage
import pypdf

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


def create_annex_divider_pdf(
    temp_path: str,
    company_name: str,
    process_id: int,
    annex_number: int,
    file_info: dict
):
    """
    Genera una página carátula formal para el anexo documental dentro del PDF consolidado.
    """
    doc = SimpleDocTemplate(
        temp_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    styles = getSampleStyleSheet()
    primary_color = colors.HexColor("#0f3d69")
    accent_color = colors.HexColor("#0284c7")
    light_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")

    story = []
    # Encabezado
    story.append(Paragraph(f"<b>{company_name.upper()} &bull; EXPEDIENTE DE PAZ Y SALVO LABORAL</b>", ParagraphStyle(
        'AnnHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=primary_color, alignment=1
    )))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=15))

    # Título de anexo
    story.append(Paragraph(
        f"<b>ANEXO DOCUMENTAL N° {annex_number}</b>",
        ParagraphStyle('AnnTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=14, leading=16, textColor=accent_color, alignment=1)
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"EVIDENCIA DE CUMPLIMIENTO DE OBLIGACIÓN DEPARTAMENTAL &bull; EXP-{process_id:04d}",
        ParagraphStyle('AnnSub', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor("#64748b"), alignment=1)
    ))
    story.append(Spacer(1, 15))

    # Ficha técnica del anexo
    bold_lbl = ParagraphStyle('BLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=primary_color)
    val_txt = ParagraphStyle('VText', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor("#1e293b"))

    info_data = [
        [
            Paragraph("<b>Departamento:</b>", bold_lbl),
            Paragraph(file_info.get('department', 'General'), val_txt),
            Paragraph("<b>Fecha Carga:</b>", bold_lbl),
            Paragraph(str(file_info.get('uploaded_at', datetime.now().strftime('%d/%m/%Y'))), val_txt)
        ],
        [
            Paragraph("<b>Archivo Original:</b>", bold_lbl),
            Paragraph(file_info.get('original_filename', 'N/A'), val_txt),
            Paragraph("<b>Responsable:</b>", bold_lbl),
            Paragraph(file_info.get('uploaded_by', 'Responsable'), val_txt)
        ],
        [
            Paragraph("<b>Observaciones / Detalle:</b>", bold_lbl),
            Paragraph(file_info.get('notes') or 'Comprobante documental registrado en el sistema.', val_txt),
            Paragraph("<b>Formato:</b>", bold_lbl),
            Paragraph(str(file_info.get('file_type', 'PDF')).upper(), val_txt)
        ]
    ]

    t_info = Table(info_data, colWidths=[110, 190, 90, 140])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.75, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 20))

    story.append(Paragraph(
        "<i>A continuación se adjunta copia digital íntegra del documento de respaldo consignado formalmente para este requisito.</i>",
        ParagraphStyle('AnnNotice', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, leading=11, textColor=colors.HexColor("#64748b"), alignment=1)
    ))

    doc.build(story)
    return temp_path


def create_image_annex_pdf(
    temp_path: str,
    company_name: str,
    process_id: int,
    annex_number: int,
    file_info: dict,
    image_path: str
):
    """
    Genera una página que incluye la ficha del anexo y la imagen embebida proporcionalmente.
    """
    doc = SimpleDocTemplate(
        temp_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=35,
        bottomMargin=35
    )
    styles = getSampleStyleSheet()
    primary_color = colors.HexColor("#0f3d69")
    accent_color = colors.HexColor("#0284c7")
    light_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")

    story = []
    # Encabezado
    story.append(Paragraph(f"<b>{company_name.upper()} &bull; ANEXO DOCUMENTAL N° {annex_number}</b>", ParagraphStyle(
        'AnnHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=primary_color, alignment=1
    )))
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceAfter=8))

    # Ficha corta
    bold_lbl = ParagraphStyle('BLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=primary_color)
    val_txt = ParagraphStyle('VText', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor("#1e293b"))

    info_data = [
        [
            Paragraph("<b>Departamento:</b>", bold_lbl),
            Paragraph(file_info.get('department', 'General'), val_txt),
            Paragraph("<b>Archivo:</b>", bold_lbl),
            Paragraph(file_info.get('original_filename', 'N/A'), val_txt)
        ],
        [
            Paragraph("<b>Responsable:</b>", bold_lbl),
            Paragraph(file_info.get('uploaded_by', 'Responsable'), val_txt),
            Paragraph("<b>Notas:</b>", bold_lbl),
            Paragraph(file_info.get('notes') or 'Comprobante digital adjunto.', val_txt)
        ]
    ]
    t_info = Table(info_data, colWidths=[90, 180, 80, 180])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 10))

    # Embeber imagen escalada
    try:
        with PILImage.open(image_path) as img:
            img_w, img_h = img.size
            max_w, max_h = 500, 520
            ratio = min(max_w / img_w, max_h / img_h, 1.0)
            final_w = img_w * ratio
            final_h = img_h * ratio
        story.append(RLImage(image_path, width=final_w, height=final_h))
    except Exception as e:
        story.append(Paragraph(f"No fue posible cargar la imagen: {str(e)}", styles['Normal']))

    doc.build(story)
    return temp_path


def generate_paz_y_salvo_pdf(
    process_id: int,
    company_data: dict,
    employee_data: dict,
    process_data: dict,
    requirements_data: list,
    output_filename: str = None,
    evidence_files: list = None
) -> str:
    """
    Genera el Expediente Único Consolidado de Paz y Salvo en un solo archivo PDF:
    1. Certificado Oficial de Paz y Salvo Departamental con firmas de ley.
    2. Índice general de anexos digitalizados.
    3. Todos los documentos de evidencia (PDFs e imágenes) consolidados secuencialmente en el mismo archivo.
    """
    if not output_filename:
        output_filename = f"certificado_paz_y_salvo_exp_{process_id}.pdf"
    
    final_output_path = os.path.join(UPLOADS_DIR, output_filename)
    temp_cert_path = os.path.join(UPLOADS_DIR, f"temp_cert_{process_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf")

    doc = SimpleDocTemplate(
        temp_cert_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=35,
        bottomMargin=35
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor("#0f3d69")
    accent_color = colors.HexColor("#0284c7")
    dark_gray = colors.HexColor("#1e293b")
    light_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=primary_color,
        alignment=1 # Center
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
        alignment=1
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=dark_gray,
        alignment=4 # Justify
    )
    
    bold_label = ParagraphStyle(
        'BoldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=primary_color
    )
    
    normal_val = ParagraphStyle(
        'NormalVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=11,
        textColor=dark_gray
    )
    
    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=10,
        textColor=colors.white,
        alignment=1
    )
    
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=dark_gray
    )
    
    table_cell_center = ParagraphStyle(
        'TableCellCenter',
        parent=table_cell,
        alignment=1
    )

    story = []

    # Encabezado Empresa
    story.append(Paragraph(f"<b>{company_data.get('business_name', 'EMPRESA').upper()}</b>", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        f"RUC: {company_data.get('ruc', '')} &nbsp;|&nbsp; Dirección: {company_data.get('address', '')} &nbsp;|&nbsp; Correo: {company_data.get('email', '')}",
        subtitle_style
    ))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=10))

    # Título del documento
    cert_title = Paragraph(
        "<b>CERTIFICADO DE PAZ Y SALVO INTERNO DE OBLIGACIONES LABORALES</b>",
        ParagraphStyle('CertTitle', parent=title_style, fontSize=12, leading=14, textColor=accent_color)
    )
    story.append(cert_title)
    story.append(Spacer(1, 4))
    
    exp_code = f"EXPEDIENTE N°: EXP-{process_id:04d} &nbsp;&nbsp;|&nbsp;&nbsp; FECHA DE EMISIÓN: {datetime.now().strftime('%d/%m/%Y')}"
    story.append(Paragraph(exp_code, subtitle_style))
    story.append(Spacer(1, 10))

    # Cuadro informativo del trabajador
    worker_info = [
        [
            Paragraph("<b>Colaborador:</b>", bold_label),
            Paragraph(f"{employee_data.get('first_name', '')} {employee_data.get('last_name', '')}", normal_val),
            Paragraph("<b>Cédula de Identidad:</b>", bold_label),
            Paragraph(employee_data.get('national_id', ''), normal_val),
        ],
        [
            Paragraph("<b>Cargo:</b>", bold_label),
            Paragraph(employee_data.get('position', ''), normal_val),
            Paragraph("<b>Departamento:</b>", bold_label),
            Paragraph(employee_data.get('department', ''), normal_val),
        ],
        [
            Paragraph("<b>Fecha de Ingreso:</b>", bold_label),
            Paragraph(employee_data.get('hire_date', ''), normal_val),
            Paragraph("<b>Fecha de Salida:</b>", bold_label),
            Paragraph(process_data.get('effective_date', ''), normal_val),
        ],
        [
            Paragraph("<b>Causa de Salida:</b>", bold_label),
            Paragraph(process_data.get('cause', ''), normal_val),
            Paragraph("<b>Base Legal:</b>", bold_label),
            Paragraph(process_data.get('legal_article', ''), normal_val),
        ],
    ]
    
    t_worker = Table(worker_info, colWidths=[105, 170, 115, 140])
    t_worker.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.75, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_worker)
    story.append(Spacer(1, 10))

    # Declaración formal
    decl_text = (
        "Por medio del presente documento, la empresa <b>" + company_data.get('business_name', '') + "</b> "
        "certifica que el/la colaborador(a) mencionado(a) ha realizado la entrega formal y satisfactoria "
        "de los bienes, activos, accesos, herramientas de trabajo, reportes de actividades e información institucional "
        "bajo su custodia, y ha regularizado sus obligaciones económicas y administrativas con cada uno de los "
        "departamentos de la organización, no registrando saldos deudores pendientes a la presente fecha."
    )
    story.append(Paragraph(decl_text, body_style))
    story.append(Spacer(1, 10))

    # Tabla de Departamentos y Verificaciones
    req_header = [
        Paragraph("DEPARTAMENTO", table_header),
        Paragraph("REQUISITO / OBLIGACIÓN VERIFICADA", table_header),
        Paragraph("RESPONSABLE", table_header),
        Paragraph("FECHA", table_header),
        Paragraph("ESTADO", table_header)
    ]
    req_rows = [req_header]
    
    for r in requirements_data:
        status_color = "#16a34a" if r.get('status') == "Aprobado" else ("#64748b" if r.get('status') == "No aplica" else "#dc2626")
        status_text = f"<font color='{status_color}'><b>{r.get('status', 'Pendiente').upper()}</b></font>"
        
        req_rows.append([
            Paragraph(f"<b>{r.get('department', '')}</b>", table_cell),
            Paragraph(f"{r.get('requirement_name', '')}<br/><font color='#64748b' size='6.5'>{r.get('observations') or 'Sin observaciones adicionales'}</font>", table_cell),
            Paragraph(r.get('reviewer_name') or 'N/A', table_cell),
            Paragraph(r.get('review_date') or '-', table_cell_center),
            Paragraph(status_text, table_cell_center)
        ])
        
    t_req = Table(req_rows, colWidths=[105, 205, 100, 60, 60])
    t_req.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOX', (0,0), (-1,-1), 0.75, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_req)
    story.append(Spacer(1, 12))

    # Nota de descargo y validez
    nota_style = ParagraphStyle(
        'Nota', parent=styles['Normal'], fontSize=7.5, leading=10, textColor=colors.HexColor("#64748b")
    )
    story.append(Paragraph(
        "<b>CLÁUSULA DE CONSTANCIA:</b> El presente paz y salvo es de carácter estrictamente interno para control "
        "operativo, departamental y administrativo de la empresa. No exime a las partes del cumplimiento de las "
        "obligaciones contempladas en el Código del Trabajo y la formalización correspondiente ante el Ministerio del Trabajo.",
        nota_style
    ))
    story.append(Spacer(1, 16))

    # Firmas
    signatures_data = [
        [
            Paragraph("________________________________________<br/><b>TRABAJADOR(A) SALIENTE</b><br/>"
                      f"{employee_data.get('first_name', '')} {employee_data.get('last_name', '')}<br/>"
                      f"C.I.: {employee_data.get('national_id', '')}",
                      ParagraphStyle('Sig', parent=styles['Normal'], fontSize=8, leading=10, alignment=1)),
            Paragraph("________________________________________<br/><b>RECURSOS HUMANOS / AUDITORÍA</b><br/>"
                      f"{process_data.get('responsible', 'Responsable de RRHH')}<br/>"
                      "Responsable de Verificación",
                      ParagraphStyle('Sig2', parent=styles['Normal'], fontSize=8, leading=10, alignment=1)),
            Paragraph("________________________________________<br/><b>REPRESENTANTE LEGAL</b><br/>"
                      f"{company_data.get('legal_representative', 'Gerencia General')}<br/>"
                      f"{company_data.get('business_name', '')}",
                      ParagraphStyle('Sig3', parent=styles['Normal'], fontSize=8, leading=10, alignment=1))
        ]
    ]
    t_sig = Table(signatures_data, colWidths=[175, 180, 175])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(KeepTogether(t_sig))

    # Si hay evidencias cargadas, agregar el índice de anexos al certificado
    if evidence_files:
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceAfter=8))
        story.append(Paragraph(
            "<b>ÍNDICE DE EVIDENCIAS Y DOCUMENTACIÓN DIGITALIZADA CONSOLIDADA:</b>",
            bold_label
        ))
        story.append(Spacer(1, 4))
        annex_index_rows = [[
            Paragraph("ANEXO", table_header),
            Paragraph("DEPARTAMENTO", table_header),
            Paragraph("DOCUMENTO DE RESPALDO", table_header),
            Paragraph("RESPONSABLE", table_header),
            Paragraph("ESTADO", table_header)
        ]]
        for idx, ev in enumerate(evidence_files, 1):
            ev_dict = ev if isinstance(ev, dict) else {
                "department": getattr(ev, "department", "General"),
                "original_filename": getattr(ev, "original_filename", ""),
                "uploaded_by": getattr(ev, "uploaded_by", ""),
                "notes": getattr(ev, "notes", ""),
                "file_path": getattr(ev, "file_path", ""),
                "file_type": getattr(ev, "file_type", "")
            }
            annex_index_rows.append([
                Paragraph(f"<b>Anexo {idx}</b>", table_cell_center),
                Paragraph(ev_dict.get("department", "General"), table_cell),
                Paragraph(f"{ev_dict.get('original_filename', '')}<br/><font color='#64748b' size='6.5'>{ev_dict.get('notes', '')}</font>", table_cell),
                Paragraph(ev_dict.get("uploaded_by", "Responsable"), table_cell),
                Paragraph("<font color='#16a34a'><b>CONSOLIDADO</b></font>", table_cell_center)
            ])
        t_annex_idx = Table(annex_index_rows, colWidths=[55, 110, 205, 95, 75])
        t_annex_idx.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
            ('BOX', (0,0), (-1,-1), 0.75, border_color),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('LEFTPADDING', (0,0), (-1,-1), 4),
            ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_annex_idx)

    doc.build(story)

    # Consolidación de todos los documentos en un solo PDF final usando pypdf
    if evidence_files:
        writer = pypdf.PdfWriter()
        # 1. Agregar páginas del certificado oficial
        cert_reader = pypdf.PdfReader(temp_cert_path)
        for page in cert_reader.pages:
            writer.add_page(page)

        # 2. Agregar cada archivo de evidencia con su carátula
        temp_files_to_clean = [temp_cert_path]
        for idx, ev in enumerate(evidence_files, 1):
            ev_dict = ev if isinstance(ev, dict) else {
                "department": getattr(ev, "department", "General"),
                "original_filename": getattr(ev, "original_filename", ""),
                "uploaded_by": getattr(ev, "uploaded_by", ""),
                "notes": getattr(ev, "notes", ""),
                "file_path": getattr(ev, "file_path", ""),
                "file_type": getattr(ev, "file_type", "")
            }
            ev_path = ev_dict.get("file_path")
            if not ev_path or not os.path.exists(ev_path):
                continue

            file_type = ev_dict.get("file_type", "").lower()
            if not file_type and "." in ev_path:
                file_type = ev_path.split(".")[-1].lower()

            if file_type == "pdf":
                div_temp = os.path.join(UPLOADS_DIR, f"temp_div_{process_id}_{idx}.pdf")
                create_annex_divider_pdf(div_temp, company_data.get('business_name', 'MySubs Smart'), process_id, idx, ev_dict)
                temp_files_to_clean.append(div_temp)
                
                div_reader = pypdf.PdfReader(div_temp)
                for page in div_reader.pages:
                    writer.add_page(page)

                try:
                    ev_reader = pypdf.PdfReader(ev_path)
                    for page in ev_reader.pages:
                        writer.add_page(page)
                except Exception as e:
                    print(f"Advertencia al fusionar PDF {ev_path}: {e}")

            elif file_type in ["jpg", "jpeg", "png"]:
                img_temp = os.path.join(UPLOADS_DIR, f"temp_img_{process_id}_{idx}.pdf")
                create_image_annex_pdf(img_temp, company_data.get('business_name', 'MySubs Smart'), process_id, idx, ev_dict, ev_path)
                temp_files_to_clean.append(img_temp)

                img_reader = pypdf.PdfReader(img_temp)
                for page in img_reader.pages:
                    writer.add_page(page)

        with open(final_output_path, "wb") as f_out:
            writer.write(f_out)

        for tf in temp_files_to_clean:
            try:
                if os.path.exists(tf):
                    os.remove(tf)
            except Exception:
                pass
    else:
        if os.path.exists(final_output_path):
            try:
                os.remove(final_output_path)
            except Exception:
                pass
        os.rename(temp_cert_path, final_output_path)

    return final_output_path


def generate_liquidation_pdf(
    process_id: int,
    company_data: dict,
    employee_data: dict,
    process_data: dict,
    liquidation_data: dict,
    output_filename: str = None
) -> str:
    """
    Genera el Acta de Liquidación Laboral Ecuatoriana con desglose matemático exhaustivo y base legal.
    """
    if not output_filename:
        output_filename = f"liquidacion_laboral_exp_{process_id}.pdf"
        
    file_path = os.path.join(UPLOADS_DIR, output_filename)
    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=32,
        bottomMargin=32
    )
    
    styles = getSampleStyleSheet()
    
    primary_color = colors.HexColor("#0f3d69")
    accent_color = colors.HexColor("#0284c7")
    dark_gray = colors.HexColor("#1e293b")
    light_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")
    
    title_style = ParagraphStyle(
        'LiqTitle', parent=styles['Heading1'],
        fontName='Helvetica-Bold', fontSize=14, leading=16, textColor=primary_color, alignment=1
    )
    subtitle_style = ParagraphStyle(
        'LiqSubtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor("#64748b"), alignment=1
    )
    bold_label = ParagraphStyle(
        'BLabel', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=10, textColor=primary_color
    )
    normal_val = ParagraphStyle(
        'NVal', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=10, textColor=dark_gray
    )
    th_style = ParagraphStyle(
        'THStyle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.white, alignment=1
    )
    cell_text = ParagraphStyle(
        'CellText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8, leading=10, textColor=dark_gray
    )
    cell_bold = ParagraphStyle(
        'CellBold', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=dark_gray
    )
    cell_amount = ParagraphStyle(
        'CellAmount', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=10, textColor=dark_gray, alignment=2 # Right
    )

    story = []

    # Cabecera
    story.append(Paragraph(f"<b>{company_data.get('business_name', 'EMPRESA').upper()}</b>", title_style))
    story.append(Paragraph(
        f"RUC: {company_data.get('ruc', '')} &nbsp;|&nbsp; Dirección: {company_data.get('address', '')} &nbsp;|&nbsp; Región Laboral: {company_data.get('region', 'Sierra')}",
        subtitle_style
    ))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))

    story.append(Paragraph(
        "<b>ACTA INTERNA DE LIQUIDACIÓN DE HABERES Y BENEFICIOS SOCIALES</b>",
        ParagraphStyle('T2', parent=title_style, fontSize=11, leading=13, textColor=accent_color)
    ))
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        f"CONFORME AL CÓDIGO DEL TRABAJO DE LA REPÚBLICA DEL ECUADOR &nbsp;|&nbsp; EXPEDIENTE: EXP-{process_id:04d}",
        subtitle_style
    ))
    story.append(Spacer(1, 8))

    # Ficha técnica
    info_table_data = [
        [
            Paragraph("<b>Trabajador:</b>", bold_label),
            Paragraph(f"{employee_data.get('first_name', '')} {employee_data.get('last_name', '')}", normal_val),
            Paragraph("<b>Cédula:</b>", bold_label),
            Paragraph(employee_data.get('national_id', ''), normal_val),
            Paragraph("<b>Cargo:</b>", bold_label),
            Paragraph(employee_data.get('position', ''), normal_val),
        ],
        [
            Paragraph("<b>Fecha Ingreso:</b>", bold_label),
            Paragraph(employee_data.get('hire_date', ''), normal_val),
            Paragraph("<b>Fecha Salida:</b>", bold_label),
            Paragraph(process_data.get('effective_date', ''), normal_val),
            Paragraph("<b>Tiempo Servicio:</b>", bold_label),
            Paragraph(f"{liquidation_data.get('full_years', 0)} años completos ({liquidation_data.get('years_worked', 0)} años)", normal_val),
        ],
        [
            Paragraph("<b>Sueldo Mensual:</b>", bold_label),
            Paragraph(f"${employee_data.get('monthly_salary', 0):.2f}", normal_val),
            Paragraph("<b>SBU Referencia:</b>", bold_label),
            Paragraph(f"${liquidation_data.get('sbu_value', 460):.2f}", normal_val),
            Paragraph("<b>Causa Salida:</b>", bold_label),
            Paragraph(f"{process_data.get('cause', '')} ({process_data.get('legal_article', '')})", normal_val),
        ]
    ]
    t_info = Table(info_table_data, colWidths=[75, 120, 55, 90, 80, 120])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.75, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_info)
    story.append(Spacer(1, 10))

    # 1. TABLA DE HABERES
    story.append(Paragraph("<b>1. DETALLE DE HABERES Y BENEFICIOS DE LEY (INGRESOS)</b>", bold_label))
    story.append(Spacer(1, 3))

    haberes_rows = [
        [
            Paragraph("RUBRO / CONCEPTO", th_style),
            Paragraph("BASE LEGAL", th_style),
            Paragraph("DETALLE Y FÓRMULA DE CÁLCULO", th_style),
            Paragraph("VALOR (USD)", th_style)
        ]
    ]

    # Sueldo pendiente
    if liquidation_data.get('pending_salary_days', 0) > 0:
        haberes_rows.append([
            Paragraph("<b>Sueldo días laborados</b>", cell_text),
            Paragraph("Art. 82 Código del Trabajo", cell_text),
            Paragraph(f"{liquidation_data.get('pending_salary_days')} días a razón de ${employee_data.get('monthly_salary', 0)/30:.2f}/día", cell_text),
            Paragraph(f"${liquidation_data.get('pending_salary_value', 0):.2f}", cell_amount)
        ])

    # Vacaciones
    haberes_rows.append([
        Paragraph("<b>Vacaciones no gozadas</b>", cell_text),
        Paragraph("Arts. 69 y 71 C.T.", cell_text),
        Paragraph(f"{liquidation_data.get('vacation_days_pending', 0):.1f} días pendientes × (${employee_data.get('monthly_salary', 0):.2f} / 30)", cell_text),
        Paragraph(f"${liquidation_data.get('vacation_value', 0):.2f}", cell_amount)
    ])

    # Décimo Tercero
    haberes_rows.append([
        Paragraph("<b>Décimo Tercer Sueldo</b>", cell_text),
        Paragraph("Art. 111 C.T.", cell_text),
        Paragraph(liquidation_data.get('thirteenth_details') or "Proporcional 1 Dic a fecha de salida / 12", cell_text),
        Paragraph(f"${liquidation_data.get('thirteenth_salary_value', 0):.2f}", cell_amount)
    ])

    # Décimo Cuarto
    haberes_rows.append([
        Paragraph("<b>Décimo Cuarto Sueldo</b>", cell_text),
        Paragraph("Art. 113 C.T.", cell_text),
        Paragraph(liquidation_data.get('fourteenth_details') or f"Proporcional ciclo escolar ({liquidation_data.get('region', 'Sierra')})", cell_text),
        Paragraph(f"${liquidation_data.get('fourteenth_salary_value', 0):.2f}", cell_amount)
    ])

    # Fondos de reserva
    if liquidation_data.get('reserve_fund_value', 0) > 0:
        haberes_rows.append([
            Paragraph("<b>Fondos de Reserva pendientes</b>", cell_text),
            Paragraph("Art. 196 C.T.", cell_text),
            Paragraph(liquidation_data.get('reserve_fund_details') or "8.33% remuneración mensual", cell_text),
            Paragraph(f"${liquidation_data.get('reserve_fund_value', 0):.2f}", cell_amount)
        ])
    else:
        haberes_rows.append([
            Paragraph("<b>Fondos de Reserva</b>", cell_text),
            Paragraph("Art. 196 C.T.", cell_text),
            Paragraph("Al día (reportados y pagados mensualmente a través del IESS)", cell_text),
            Paragraph("$0.00", cell_amount)
        ])

    # Bonificación por Desahucio
    haberes_rows.append([
        Paragraph("<b>Bonificación por Desahucio</b>", cell_text),
        Paragraph("Art. 185 C.T.", cell_text),
        Paragraph(liquidation_data.get('desahucio_details') or f"25% última remuneración × {liquidation_data.get('full_years', 0)} años cumplidos", cell_text),
        Paragraph(f"${liquidation_data.get('desahucio_bonus_value', 0):.2f}", cell_amount)
    ])

    # Despido intempestivo si aplica
    if liquidation_data.get('untimely_dismissal_value', 0) > 0:
        haberes_rows.append([
            Paragraph("<b>Indemnización Despido Intempestivo</b>", cell_text),
            Paragraph("Art. 188 C.T.", cell_text),
            Paragraph(liquidation_data.get('untimely_dismissal_details') or "Aplica por terminación unilateral", cell_text),
            Paragraph(f"${liquidation_data.get('untimely_dismissal_value', 0):.2f}", cell_amount)
        ])
    else:
        haberes_rows.append([
            Paragraph("<b>Indemnización Despido Intempestivo</b>", cell_text),
            Paragraph("Art. 188 C.T.", cell_text),
            Paragraph("No aplica para la causa de terminación registrada", cell_text),
            Paragraph("$0.00", cell_amount)
        ])

    # Otros haberes
    if liquidation_data.get('other_earnings_value', 0) > 0:
        haberes_rows.append([
            Paragraph(f"<b>{liquidation_data.get('other_earnings_name') or 'Otros Haberes'}</b>", cell_text),
            Paragraph("Acuerdo de partes / Contractual", cell_text),
            Paragraph("Valores adicionales reconocidos", cell_text),
            Paragraph(f"${liquidation_data.get('other_earnings_value', 0):.2f}", cell_amount)
        ])

    # Subtotal Haberes
    haberes_rows.append([
        Paragraph("<b>TOTAL HABERES Y BENEFICIOS SOCIALES:</b>", cell_bold),
        Paragraph("", cell_text),
        Paragraph("", cell_text),
        Paragraph(f"<b>${liquidation_data.get('total_earnings', 0):.2f}</b>", ParagraphStyle('THB', parent=cell_amount, textColor=colors.HexColor("#0f766e"), fontSize=9))
    ])

    t_haberes = Table(haberes_rows, colWidths=[140, 95, 215, 90])
    t_haberes.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#ccfbf1")),
        ('BOX', (0,0), (-1,-1), 0.75, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_haberes)
    story.append(Spacer(1, 8))

    # 2. TABLA DE DEDUCCIONES
    story.append(Paragraph("<b>2. DETALLE DE DESCUENTOS Y DEDUCCIONES AUTORIZADAS</b>", bold_label))
    story.append(Spacer(1, 3))

    deducciones_rows = [
        [
            Paragraph("CONCEPTO DE DESCUENTO", th_style),
            Paragraph("SUSTENTO / MOTIVO", th_style),
            Paragraph("ESTADO DE DEUDA", th_style),
            Paragraph("VALOR (USD)", th_style)
        ],
        [
            Paragraph("<b>Anticipos de sueldo / quincena</b>", cell_text),
            Paragraph("Valores anticipados a descontar en finiquito", cell_text),
            Paragraph("Verificado por Contabilidad", cell_text),
            Paragraph(f"${liquidation_data.get('advance_deduction_value', 0):.2f}", cell_amount)
        ],
        [
            Paragraph("<b>Préstamos internos / corporativos</b>", cell_text),
            Paragraph("Obligaciones de crédito pendientes con el empleador", cell_text),
            Paragraph("Verificado por Contabilidad", cell_text),
            Paragraph(f"${liquidation_data.get('loans_deduction_value', 0):.2f}", cell_amount)
        ]
    ]

    if liquidation_data.get('other_deduction_value', 0) > 0:
        deducciones_rows.append([
            Paragraph(f"<b>{liquidation_data.get('other_deduction_name') or 'Otras Deducciones'}</b>", cell_text),
            Paragraph("Deducción autorizada por el trabajador", cell_text),
            Paragraph("Comprobante adjunto", cell_text),
            Paragraph(f"${liquidation_data.get('other_deduction_value', 0):.2f}", cell_amount)
        ])

    deducciones_rows.append([
        Paragraph("<b>TOTAL DESCUENTOS Y DEDUCCIONES:</b>", cell_bold),
        Paragraph("", cell_text),
        Paragraph("", cell_text),
        Paragraph(f"<b>${liquidation_data.get('total_deductions', 0):.2f}</b>", ParagraphStyle('TDB', parent=cell_amount, textColor=colors.HexColor("#b91c1c"), fontSize=9))
    ])

    t_deduc = Table(deducciones_rows, colWidths=[160, 170, 120, 90])
    t_deduc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#fee2e2")),
        ('BOX', (0,0), (-1,-1), 0.75, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_deduc)
    story.append(Spacer(1, 8))

    # 3. RESUMEN NETO
    net_table_data = [
        [
            Paragraph("<b>TOTAL HABERES:</b>", bold_label),
            Paragraph(f"<b>${liquidation_data.get('total_earnings', 0):.2f}</b>", cell_bold),
            Paragraph("<b>TOTAL DEDUCCIONES:</b>", bold_label),
            Paragraph(f"<b>-${liquidation_data.get('total_deductions', 0):.2f}</b>", cell_bold),
            Paragraph("<b>VALOR NETO A RECIBIR:</b>", ParagraphStyle('NLabel', parent=bold_label, fontSize=9.5, textColor=primary_color)),
            Paragraph(f"<b>${liquidation_data.get('net_payable', 0):.2f}</b>", ParagraphStyle('NValTotal', parent=cell_amount, fontSize=11, textColor=primary_color)),
        ]
    ]
    t_net = Table(net_table_data, colWidths=[90, 80, 100, 80, 110, 80])
    t_net.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1.25, primary_color),
        ('INNERGRID', (0,0), (-1,-1), 0.5, border_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_net)
    story.append(Spacer(1, 10))

    # Declaración Legal y Aclaración
    legal_disclaimer = (
        "<b>ACLARACIÓN JURÍDICA Y CONSTANCIA:</b><br/>"
        "El presente documento es un instrumento de cálculo, verificación y registro interno empresarial. "
        "Su validez legal definitiva ante las autoridades de la República del Ecuador depende del cumplimiento "
        "de las formalidades previstas en la legislación vigente, incluyendo la suscripción del Acta de Finiquito "
        "a través del Sistema Único del Trabajo (SUT) del Ministerio del Trabajo, y la acreditación bancaria del saldo neto."
    )
    story.append(Paragraph(legal_disclaimer, ParagraphStyle('LegalDis', parent=styles['Normal'], fontSize=7, leading=9.5, textColor=colors.HexColor("#64748b"))))
    story.append(Spacer(1, 16))

    # Firmas
    signatures_data = [
        [
            Paragraph("________________________________________<br/><b>EL / LA TRABAJADOR(A)</b><br/>"
                      f"{employee_data.get('first_name', '')} {employee_data.get('last_name', '')}<br/>"
                      f"C.I.: {employee_data.get('national_id', '')}<br/>"
                      "Recibí Conforme",
                      ParagraphStyle('SigL1', parent=styles['Normal'], fontSize=8, leading=10, alignment=1)),
            Paragraph("________________________________________<br/><b>CONTABILIDAD / FINANZAS</b><br/>"
                      "Lic. Marcela Castro<br/>"
                      "Contadora General",
                      ParagraphStyle('SigL2', parent=styles['Normal'], fontSize=8, leading=10, alignment=1)),
            Paragraph("________________________________________<br/><b>EMPLEADOR / REPRESENTANTE LEGAL</b><br/>"
                      f"{company_data.get('legal_representative', 'Gerencia General')}<br/>"
                      f"{company_data.get('business_name', '')}",
                      ParagraphStyle('SigL3', parent=styles['Normal'], fontSize=8, leading=10, alignment=1))
        ]
    ]
    t_sig = Table(signatures_data, colWidths=[180, 180, 180])
    t_sig.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(KeepTogether(t_sig))

    doc.build(story)
    return file_path

