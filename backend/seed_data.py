import os
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

from database import engine, SessionLocal, Base
from models import (
    Company, Employee, TerminationProcess, ClearanceRequirement,
    EvidenceFile, VacationControl, LiquidationSettlement, AuditLog
)
from calculators import calculate_full_liquidation
from pdf_generator import generate_paz_y_salvo_pdf, generate_liquidation_pdf, UPLOADS_DIR

def create_mock_evidence_pdf(filename: str, title: str, details: str):
    path = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(path):
        return path
    
    doc = SimpleDocTemplate(path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [
        Paragraph(f"<b>DOCUMENTO DE EVIDENCIA FICTICIO PARA DEMOSTRACIÓN</b>", styles['Heading2']),
        Spacer(1, 10),
        Paragraph(f"<b>{title}</b>", styles['Heading3']),
        Spacer(1, 10),
        Paragraph(details, styles['Normal']),
        Spacer(1, 20),
        Paragraph("<i>Este archivo es un comprobante ficticio generado automáticamente para propósitos demostrativos del Sistema de Paz y Salvo Laboral.</i>", styles['Italic']),
        Spacer(1, 40),
        Paragraph("Firma de Conformidad: ___________________________", styles['Normal'])
    ]
    doc.build(story)
    return path

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_company = db.query(Company).filter_by(ruc="1899999999001").first()
        if existing_company:
            print("Base de datos ya contiene el caso demostrativo.")
            return

        print("Iniciando precarga del caso demostrativo...")

        # 1. EMPRESA
        company = Company(
            business_name="MySubs Smart",
            ruc="1899999999001",
            legal_representative="Carlos Mendoza",
            address="Ambato, Ecuador (Parque Tecnológico / Av. Los Guaytambos)",
            phone="032821000 / 0998765432",
            email="talento.humano@mysubssmart.ec",
            region="Sierra"
        )
        db.add(company)
        db.commit()
        db.refresh(company)

        # 2. TRABAJADOR
        employee = Employee(
            company_id=company.id,
            first_name="Andrés Sebastián",
            last_name="Torres",
            national_id="1800000001",
            position="Analista de Sistemas",
            department="Tecnología",
            hire_date="2023-03-01",
            exit_date="2026-10-31",
            contract_type="Contrato Indefinido",
            monthly_salary=800.0,
            email="andres.torres@mysubssmart.ec",
            status="En proceso de salida"
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

        # 3. EXPEDIENTE DE TERMINACIÓN
        process = TerminationProcess(
            employee_id=employee.id,
            request_date="2026-10-15",
            effective_date="2026-10-31",
            cause="Desahucio solicitado por el trabajador",
            legal_article="Art. 169 numeral 8 y Art. 185 del Código del Trabajo",
            description="El trabajador presentó formalmente su solicitud de desahucio con más de 15 días de anticipación de conformidad con la ley ecuatoriana.",
            responsible="Ing. Sofía Morales (Talento Humano)",
            status="Paz y Salvo Aprobado",
            paz_y_salvo_certified=True,
            certified_at=datetime.utcnow()
        )
        db.add(process)
        db.commit()
        db.refresh(process)

        # 4. REQUISITOS DEPARTAMENTALES
        requirements_data = [
            # Recursos Humanos
            {
                "dept": "Recursos Humanos",
                "name": "Entrega de credenciales institucionales",
                "desc": "Devolución física del carnet de identificación institucional con fotografía.",
                "reviewer": "Ing. Sofía Morales",
                "date": "2026-10-28",
                "status": "Aprobado",
                "obs": "Credencial física recibida e invalidada.",
                "evidence_file": "evidencia_entrega_credencial_rrhh.pdf",
                "evidence_title": "Acta de Recepción de Credencial Institucional",
                "evidence_desc": "Constancia de entrega del carnet de identificación del Ing. Andrés Torres."
            },
            {
                "dept": "Recursos Humanos",
                "name": "Documentación laboral y firmas pendientes",
                "desc": "Revisión de contratos, adendas y entrega de constancia de fin de relación laboral.",
                "reviewer": "Ing. Sofía Morales",
                "date": "2026-10-28",
                "status": "Aprobado",
                "obs": "Expediente físico completo y sin firmas pendientes.",
                "evidence_file": "evidencia_expediente_firmado_rrhh.pdf",
                "evidence_title": "Verificación de Carpeta de Personal y Contratos",
                "evidence_desc": "Constancia de archivo íntegro y sin adendas pendientes."
            },
            {
                "dept": "Recursos Humanos",
                "name": "Registro y balance de vacaciones",
                "desc": "Verificación en el sistema de asistencia y balance de días pendientes de goce.",
                "reviewer": "Ing. Sofía Morales",
                "date": "2026-10-29",
                "status": "Aprobado",
                "obs": "Se constata un saldo de 10 días pendientes para liquidación económica.",
                "evidence_file": "evidencia_balance_vacaciones.pdf",
                "evidence_title": "Reporte de Balance de Vacaciones Sistema Biométrico",
                "evidence_desc": "Certificación de saldo de 10 días de vacaciones no gozadas."
            },
            {
                "dept": "Recursos Humanos",
                "name": "Entrega de uniformes institucionales",
                "desc": "Recepción de prendas y distintivos de uso corporativo.",
                "reviewer": "Ing. Sofía Morales",
                "date": "2026-10-28",
                "status": "No aplica",
                "obs": "El cargo de Analista de Sistemas no contempló dotación de uniforme obligatorio.",
                "evidence_file": None
            },

            # Sistemas / TI
            {
                "dept": "Sistemas / TI",
                "name": "Devolución de equipo informático principal",
                "desc": "Laptop corporativa Dell Inspiron 15, cargador original y mouse óptico.",
                "reviewer": "Ing. Fernando Paredes",
                "date": "2026-10-29",
                "status": "Aprobado",
                "obs": "Equipo inspeccionado técnicamente, en perfecto estado operativo y formateado.",
                "evidence_file": "evidencia_entrega_laptop_ti.pdf",
                "evidence_title": "Acta de Devolución de Equipos Informáticos TI",
                "evidence_desc": "Entrega técnica conforme de Laptop Dell S/N: TEC-AND-2023-089 y cargador."
            },
            {
                "dept": "Sistemas / TI",
                "name": "Devolución de accesorios y token de seguridad",
                "desc": "Token USB de firma y auriculares con micrófono para teletrabajo.",
                "reviewer": "Ing. Fernando Paredes",
                "date": "2026-10-29",
                "status": "Aprobado",
                "obs": "Accesorios devueltos en buen estado.",
                "evidence_file": None
            },
            {
                "dept": "Sistemas / TI",
                "name": "Desactivación de cuentas y accesos institucionales",
                "desc": "Bloqueo de correo Google Workspace, VPN Fortinet y repositorios GitLab.",
                "reviewer": "Ing. Fernando Paredes",
                "date": "2026-10-30",
                "status": "Aprobado",
                "obs": "Accesos revocados a las 18:00 del 31 de octubre de 2026.",
                "evidence_file": "evidencia_cierre_cuentas_ti.pdf",
                "evidence_title": "Comprobante de Revocatoria de Accesos y Cuentas TI",
                "evidence_desc": "Bitácora de desactivación de cuentas y credenciales en directorio activo."
            },
            {
                "dept": "Sistemas / TI",
                "name": "Entrega y respaldo de proyectos y credenciales",
                "desc": "Transferencia de código fuente, documentación técnica y claves maestras.",
                "reviewer": "Ing. Fernando Paredes",
                "date": "2026-10-30",
                "status": "Aprobado",
                "obs": "Repositorios transferidos y documentación técnica validada.",
                "evidence_file": None
            },

            # Contabilidad / Finanzas
            {
                "dept": "Contabilidad / Finanzas",
                "name": "Verificación de anticipos de sueldo",
                "desc": "Constatación de quincenas o anticipos otorgados en el período vigente.",
                "reviewer": "Lic. Marcela Castro",
                "date": "2026-10-30",
                "status": "Aprobado",
                "obs": "Existe un anticipo pendiente de $100.00 que se descontará de la liquidación.",
                "evidence_file": "evidencia_comprobante_anticipo_contabilidad.pdf",
                "evidence_title": "Reporte Contable de Anticipo de Sueldo Pendiente",
                "evidence_desc": "Comprobante de transferencia bancaria por anticipo de $100.00."
            },
            {
                "dept": "Contabilidad / Finanzas",
                "name": "Préstamos internos o convenios institucionales",
                "desc": "Verificación de préstamos quirografarios de empresa o anticipos de utilidades.",
                "reviewer": "Lic. Marcela Castro",
                "date": "2026-10-30",
                "status": "Aprobado",
                "obs": "El trabajador no registra préstamos internos ni deudas pendientes ($0.00).",
                "evidence_file": None
            },
            {
                "dept": "Contabilidad / Finanzas",
                "name": "Descargo de fondos a rendir y viáticos",
                "desc": "Comprobantes de gastos de movilización o viáticos pendientes de justificar.",
                "reviewer": "Lic. Marcela Castro",
                "date": "2026-10-30",
                "status": "Aprobado",
                "obs": "Sin liquidaciones de viáticos pendientes.",
                "evidence_file": None
            },

            # Administración
            {
                "dept": "Administración",
                "name": "Tarjetas y tags de acceso vehicular y peatonal",
                "desc": "Tarjeta RFID para torniquetes del edificio y tag para garaje.",
                "reviewer": "Dra. Patricia Alvear",
                "date": "2026-10-30",
                "status": "Aprobado",
                "obs": "Tarjetas recibidas físicamente y desvinculadas del sistema biométrico.",
                "evidence_file": "evidencia_entrega_tarjetas_admin.pdf",
                "evidence_title": "Acta de Entrega de Tarjetas RFID y Control de Accesos",
                "evidence_desc": "Recepción física de 1 tarjeta de acceso y 1 tag de garaje."
            },
            {
                "dept": "Administración",
                "name": "Llaves de oficinas y mobiliario",
                "desc": "Juego de llaves del departamento de Tecnología y gaveta personal.",
                "reviewer": "Dra. Patricia Alvear",
                "date": "2026-10-30",
                "status": "Aprobado",
                "obs": "Llaves entregadas a la administración.",
                "evidence_file": None
            }
        ]

        stored_req_objects = []
        for r_item in requirements_data:
            req = ClearanceRequirement(
                process_id=process.id,
                department=r_item["dept"],
                requirement_name=r_item["name"],
                description=r_item["desc"],
                is_mandatory=True,
                reviewer_name=r_item["reviewer"],
                review_date=r_item["date"],
                status=r_item["status"],
                observations=r_item["obs"]
            )
            db.add(req)
            db.commit()
            db.refresh(req)
            stored_req_objects.append(req)

            # Si tiene archivo de evidencia, generarlo y registrarlo
            if r_item.get("evidence_file"):
                pdf_p = create_mock_evidence_pdf(
                    r_item["evidence_file"],
                    r_item["evidence_title"],
                    r_item["evidence_desc"]
                )
                ev = EvidenceFile(
                    process_id=process.id,
                    requirement_id=req.id,
                    department=r_item["dept"],
                    original_filename=r_item["evidence_file"],
                    stored_filename=r_item["evidence_file"],
                    file_path=pdf_p,
                    file_type="pdf",
                    file_size_bytes=os.path.getsize(pdf_p),
                    uploaded_by=r_item["reviewer"],
                    notes=f"Evidencia adjunta para {r_item['name']}"
                )
                db.add(ev)
                db.commit()

        # 5. REGISTRO DE VACACIONES
        vacation = VacationControl(
            process_id=process.id,
            days_accrued=45.0, # 3 años cumplidos (15 días x 3)
            days_taken=35.0,
            days_pending=10.0,
            accrued_periods="Período 2023-2024: 15 gozados; Período 2024-2025: 15 gozados; Período 2025-2026: 5 gozados / 10 pendientes",
            economic_value=266.67,
            calculation_details="10 días pendientes × ($800.00 / 30) = $266.67 (Arts. 69 y 71 del Código del Trabajo)"
        )
        db.add(vacation)
        db.commit()

        # 6. CÁLCULO DE LIQUIDACIÓN
        liq_calc = calculate_full_liquidation(
            hire_date_str="2023-03-01",
            exit_date_str="2026-10-31",
            monthly_salary=800.0,
            cause="Desahucio solicitado por el trabajador",
            region="Sierra",
            sbu_value=460.0,
            pending_salary_days=0,
            vacation_days_pending=10.0,
            reserve_fund_pending=False, # Al día
            advance_deduction_value=100.0, # Anticipo
            loans_deduction_value=0.0
        )

        settlement = LiquidationSettlement(
            process_id=process.id,
            calculation_date="2026-10-31",
            region="Sierra",
            sbu_value=460.0,
            monthly_salary=800.0,
            years_worked=liq_calc["years_worked"],
            full_years=liq_calc["full_years"],
            pending_salary_days=liq_calc["pending_salary_days"],
            pending_salary_value=liq_calc["pending_salary_value"],
            vacation_days_pending=liq_calc["vacation_days_pending"],
            vacation_value=liq_calc["vacation_value"],
            thirteenth_salary_value=liq_calc["thirteenth_salary_value"],
            thirteenth_details=liq_calc["thirteenth_details"],
            fourteenth_salary_value=liq_calc["fourteenth_salary_value"],
            fourteenth_details=liq_calc["fourteenth_details"],
            reserve_fund_value=liq_calc["reserve_fund_value"],
            reserve_fund_details=liq_calc["reserve_fund_details"],
            desahucio_bonus_value=liq_calc["desahucio_bonus_value"],
            desahucio_details=liq_calc["desahucio_details"],
            untimely_dismissal_value=liq_calc["untimely_dismissal_value"],
            untimely_dismissal_details=liq_calc["untimely_dismissal_details"],
            other_earnings_name=None,
            other_earnings_value=0.0,
            advance_deduction_value=liq_calc["advance_deduction_value"],
            loans_deduction_value=liq_calc["loans_deduction_value"],
            other_deduction_name=None,
            other_deduction_value=0.0,
            total_earnings=liq_calc["total_earnings"],
            total_deductions=liq_calc["total_deductions"],
            net_payable=liq_calc["net_payable"],
            calculation_breakdown_json=json.dumps(liq_calc["breakdown"])
        )
        db.add(settlement)
        db.commit()
        db.refresh(settlement)

        # 7. GENERAR PDFs DEMOSTRATIVOS
        company_dict = {
            "business_name": company.business_name,
            "ruc": company.ruc,
            "legal_representative": company.legal_representative,
            "address": company.address,
            "phone": company.phone,
            "email": company.email,
            "region": company.region
        }
        emp_dict = {
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "national_id": employee.national_id,
            "position": employee.position,
            "department": employee.department,
            "hire_date": employee.hire_date,
            "monthly_salary": employee.monthly_salary
        }
        proc_dict = {
            "effective_date": process.effective_date,
            "cause": process.cause,
            "legal_article": process.legal_article,
            "responsible": process.responsible
        }
        req_list = [
            {
                "department": r.department,
                "requirement_name": r.requirement_name,
                "reviewer_name": r.reviewer_name,
                "review_date": r.review_date,
                "status": r.status,
                "observations": r.observations
            }
            for r in stored_req_objects
        ]

        stored_evidence = db.query(EvidenceFile).filter_by(process_id=process.id).all()
        paz_pdf_path = generate_paz_y_salvo_pdf(
            process_id=process.id,
            company_data=company_dict,
            employee_data=emp_dict,
            process_data=proc_dict,
            requirements_data=req_list,
            evidence_files=stored_evidence
        )

        liq_dict = {
            "full_years": settlement.full_years,
            "years_worked": settlement.years_worked,
            "sbu_value": settlement.sbu_value,
            "region": settlement.region,
            "pending_salary_days": settlement.pending_salary_days,
            "pending_salary_value": settlement.pending_salary_value,
            "vacation_days_pending": settlement.vacation_days_pending,
            "vacation_value": settlement.vacation_value,
            "thirteenth_salary_value": settlement.thirteenth_salary_value,
            "thirteenth_details": settlement.thirteenth_details,
            "fourteenth_salary_value": settlement.fourteenth_salary_value,
            "fourteenth_details": settlement.fourteenth_details,
            "reserve_fund_value": settlement.reserve_fund_value,
            "reserve_fund_details": settlement.reserve_fund_details,
            "desahucio_bonus_value": settlement.desahucio_bonus_value,
            "desahucio_details": settlement.desahucio_details,
            "untimely_dismissal_value": settlement.untimely_dismissal_value,
            "untimely_dismissal_details": settlement.untimely_dismissal_details,
            "other_earnings_name": settlement.other_earnings_name,
            "other_earnings_value": settlement.other_earnings_value,
            "advance_deduction_value": settlement.advance_deduction_value,
            "loans_deduction_value": settlement.loans_deduction_value,
            "other_deduction_name": settlement.other_deduction_name,
            "other_deduction_value": settlement.other_deduction_value,
            "total_earnings": settlement.total_earnings,
            "total_deductions": settlement.total_deductions,
            "net_payable": settlement.net_payable
        }

        liq_pdf_path = generate_liquidation_pdf(
            process_id=process.id,
            company_data=company_dict,
            employee_data=emp_dict,
            process_data=proc_dict,
            liquidation_data=liq_dict
        )

        settlement.paz_y_salvo_pdf_path = os.path.basename(paz_pdf_path)
        settlement.liquidation_pdf_path = os.path.basename(liq_pdf_path)
        db.commit()

        # 8. AUDIT LOGS
        logs = [
            AuditLog(
                process_id=process.id,
                action="Inicio de Expediente de Terminación",
                department="Recursos Humanos",
                user_name="Ing. Sofía Morales",
                details="Apertura del expediente por desahucio voluntario."
            ),
            AuditLog(
                process_id=process.id,
                action="Aprobación de Paz y Salvo Tecnológico",
                department="Sistemas / TI",
                user_name="Ing. Fernando Paredes",
                details="Devolución de laptop y revocado de credenciales."
            ),
            AuditLog(
                process_id=process.id,
                action="Aprobación de Paz y Salvo Financiero",
                department="Contabilidad / Finanzas",
                user_name="Lic. Marcela Castro",
                details="Verificación de anticipo pendiente de $100.00."
            ),
            AuditLog(
                process_id=process.id,
                action="Certificación de Paz y Salvo Integral",
                department="Gerencia General",
                user_name="Carlos Mendoza",
                details="Todos los departamentos completaron la verificación satisfactoriamente."
            ),
            AuditLog(
                process_id=process.id,
                action="Generación de Acta de Liquidación",
                department="Recursos Humanos",
                user_name="Ing. Sofía Morales",
                details="Cálculo matemático conforme a ley: Total $1,615.00 neto."
            )
        ]
        for l in logs:
            db.add(l)
        db.commit()

        print("Precarga del caso demostrativo completada con éxito.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

