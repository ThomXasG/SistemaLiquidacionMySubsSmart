import os
import sys
import shutil
import json
from datetime import datetime
from typing import List, Optional

# Asegurar ruta local del backend para imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import (
    Company, Employee, TerminationProcess, ClearanceRequirement,
    EvidenceFile, VacationControl, LiquidationSettlement, AuditLog
)
from schemas import (
    CompanyCreate, CompanyUpdate, CompanyResponse,
    EmployeeCreate, EmployeeUpdate, EmployeeResponse,
    TerminationProcessCreate, TerminationProcessUpdate, TerminationProcessResponse,
    ClearanceRequirementBase, ClearanceRequirementCreate, ClearanceRequirementUpdate, ClearanceRequirementResponse,
    EvidenceFileResponse, VacationControlUpdate, VacationControlResponse,
    LiquidationCalculationInput, LiquidationResponse, AuditLogResponse, MdtSimulationInput,
    validate_ecuadorian_id, validate_ecuadorian_ruc
)
from calculators import calculate_full_liquidation, calculate_service_time, calculate_vacation_settlement
from pdf_generator import generate_paz_y_salvo_pdf, generate_liquidation_pdf, UPLOADS_DIR
from seed_data import seed_database

# Asegurar tablas y datos semilla
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="Sistema de Gestión de Terminación Laboral y Paz y Salvo - Ecuador",
    description="API empresarial para administración de desvinculaciones laborales, paz y salvo departamental y liquidaciones conforme al Código del Trabajo ecuatoriano.",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Archivos estáticos de uploads
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Ruta al frontend compilado
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    # Montar assets
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


# ----------------------------------------------------
# 1. GESTIÓN DE EMPRESAS
# ----------------------------------------------------
@app.get("/api/companies", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()

@app.post("/api/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(company_in: CompanyCreate, db: Session = Depends(get_db)):
    if not validate_ecuadorian_ruc(company_in.ruc):
        raise HTTPException(status_code=400, detail="El RUC ingresado no cumple con el formato o algoritmo válido ecuatoriano.")
    
    existing = db.query(Company).filter_by(ruc=company_in.ruc).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una empresa registrada con ese RUC.")
    
    company = Company(**company_in.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@app.get("/api/companies/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")
    return company

@app.put("/api/companies/{company_id}", response_model=CompanyResponse)
def update_company(company_id: int, company_in: CompanyUpdate, db: Session = Depends(get_db)):
    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")
    
    for field, value in company_in.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    return company

@app.delete("/api/companies/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter_by(id=company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")
    db.delete(company)
    db.commit()
    return {"message": "Empresa eliminada exitosamente."}


# ----------------------------------------------------
# 2. GESTIÓN DE TRABAJADORES
# ----------------------------------------------------
@app.get("/api/employees", response_model=List[EmployeeResponse])
def get_employees(
    company_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Employee)
    if company_id:
        query = query.filter(Employee.company_id == company_id)
    if status_filter:
        query = query.filter(Employee.status == status_filter)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Employee.first_name.ilike(search_fmt)) |
            (Employee.last_name.ilike(search_fmt)) |
            (Employee.national_id.ilike(search_fmt)) |
            (Employee.position.ilike(search_fmt)) |
            (Employee.department.ilike(search_fmt))
        )
    return query.order_by(Employee.id.desc()).all()

@app.post("/api/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(emp_in: EmployeeCreate, db: Session = Depends(get_db)):
    if not validate_ecuadorian_id(emp_in.national_id):
        raise HTTPException(status_code=400, detail="La cédula ecuatoriana ingresada no es válida.")
    
    existing = db.query(Employee).filter_by(national_id=emp_in.national_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un trabajador registrado con esa cédula.")
    
    if emp_in.monthly_salary < 460.0:
        raise HTTPException(status_code=400, detail="La remuneración mensual no puede ser inferior al Salario Básico Unificado vigente ($460.00).")

    emp = Employee(**emp_in.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@app.get("/api/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter_by(id=employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado.")
    return emp

@app.put("/api/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, emp_in: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter_by(id=employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado.")
    
    for field, value in emp_in.model_dump(exclude_unset=True).items():
        setattr(emp, field, value)
    db.commit()
    db.refresh(emp)
    return emp

@app.delete("/api/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter_by(id=employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado.")
    db.delete(emp)
    db.commit()
    return {"message": "Trabajador eliminado exitosamente."}


# ----------------------------------------------------
# 3. GESTIÓN DE TERMINACIÓN LABORAL
# ----------------------------------------------------
DEFAULT_DEPARTMENT_REQUIREMENTS = [
    # Recursos Humanos
    ("Recursos Humanos", "Entrega de credenciales institucionales", "Devolución física del carnet de identificación institucional."),
    ("Recursos Humanos", "Documentación laboral y firmas de adendas", "Constancia de expedientes firmados y revisión de contratos."),
    ("Recursos Humanos", "Registro y balance de vacaciones", "Verificación del saldo de días de vacaciones pendientes en el sistema."),
    ("Recursos Humanos", "Entrega de uniformes institucionales", "Devolución de uniformes de la empresa si fueron asignados."),
    # Sistemas / TI
    ("Sistemas / TI", "Devolución de equipo informático principal", "Laptop corporativa, cargador y periféricos asignados."),
    ("Sistemas / TI", "Devolución de accesorios y tokens", "Tokens de seguridad, credenciales de acceso y periféricos adicionales."),
    ("Sistemas / TI", "Desactivación de cuentas institucionales", "Cierre y revocatoria de correo corporativo, VPN y accesos a servidores."),
    ("Sistemas / TI", "Entrega de repositorios y documentación de proyectos", "Traspaso formal de información técnica y código a su relevo."),
    # Contabilidad / Finanzas
    ("Contabilidad / Finanzas", "Verificación de anticipos de sueldo", "Revisión en el sistema contable de quincenas o anticipos pendientes."),
    ("Contabilidad / Finanzas", "Préstamos internos o convenios de empresa", "Verificación de obligaciones crediticias pendientes de pago."),
    ("Contabilidad / Finanzas", "Valores pendientes de justificar o viáticos", "Descargo y liquidación de viáticos o fondos a rendir pendientes."),
    ("Contabilidad / Finanzas", "Verificación de obligaciones económicas", "Revisión general de saldos contables del trabajador."),
    # Administración
    ("Administración", "Tarjetas de acceso físico y garaje", "Entrega de tarjetas magnéticas RFID o tags vehiculares."),
    ("Administración", "Llaves de oficinas y archivadores", "Devolución de llaves maestras o de oficinas asignadas."),
    ("Administración", "Documentos institucionales bajo custodia", "Devolución de sellos, membretes u otros bienes de la empresa.")
]

@app.get("/api/processes", response_model=List[TerminationProcessResponse])
def get_processes(
    status_filter: Optional[str] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TerminationProcess)
    if status_filter:
        query = query.filter(TerminationProcess.status == status_filter)
    if employee_id:
        query = query.filter(TerminationProcess.employee_id == employee_id)
    return query.order_by(TerminationProcess.id.desc()).all()

@app.post("/api/processes", response_model=TerminationProcessResponse, status_code=status.HTTP_201_CREATED)
def create_process(proc_in: TerminationProcessCreate, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter_by(id=proc_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado.")
    
    # Validar fechas
    if proc_in.effective_date < proc_in.request_date:
        raise HTTPException(status_code=400, detail="La fecha efectiva de terminación no puede ser anterior a la fecha de solicitud.")

    # Crear expediente
    process = TerminationProcess(
        employee_id=proc_in.employee_id,
        request_date=proc_in.request_date,
        effective_date=proc_in.effective_date,
        cause=proc_in.cause,
        legal_article=proc_in.legal_article,
        description=proc_in.description,
        responsible=proc_in.responsible,
        status="En Revisión"
    )
    db.add(process)
    
    # Actualizar estado del trabajador
    employee.status = "En proceso de salida"
    employee.exit_date = proc_in.effective_date
    db.commit()
    db.refresh(process)

    # Generar automáticamente los requisitos departamentales de paz y salvo
    for dept, name, desc in DEFAULT_DEPARTMENT_REQUIREMENTS:
        req = ClearanceRequirement(
            process_id=process.id,
            department=dept,
            requirement_name=name,
            description=desc,
            is_mandatory=True,
            status="Pendiente"
        )
        db.add(req)
        
    # Inicializar registro de vacaciones
    st = calculate_service_time(employee.hire_date, proc_in.effective_date)
    vac_calc = calculate_vacation_settlement(employee.hire_date, proc_in.effective_date, employee.monthly_salary)
    vacation = VacationControl(
        process_id=process.id,
        days_accrued=round(st["full_years"] * 15.0, 1),
        days_taken=0.0,
        days_pending=vac_calc["pending_days"],
        accrued_periods=f"Cálculo proporcional sobre {st['years_float']} años de servicio",
        economic_value=vac_calc["value"],
        calculation_details=vac_calc["formula"]
    )
    db.add(vacation)

    # Registrar en auditoría
    audit = AuditLog(
        process_id=process.id,
        action="Creación de Expediente de Terminación",
        department="Recursos Humanos",
        user_name=proc_in.responsible,
        details=f"Apertura del proceso por causa: {proc_in.cause} ({proc_in.legal_article})"
    )
    db.add(audit)

    db.commit()
    db.refresh(process)
    return process

@app.get("/api/processes/{process_id}", response_model=TerminationProcessResponse)
def get_process_detail(process_id: int, db: Session = Depends(get_db)):
    process = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Expediente de terminación no encontrado.")
    return process

@app.put("/api/processes/{process_id}", response_model=TerminationProcessResponse)
def update_process(process_id: int, proc_in: TerminationProcessUpdate, db: Session = Depends(get_db)):
    process = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
    
    for field, value in proc_in.model_dump(exclude_unset=True).items():
        setattr(process, field, value)
    
    db.commit()
    db.refresh(process)
    return process

@app.delete("/api/processes/{process_id}")
def delete_process(process_id: int, db: Session = Depends(get_db)):
    process = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not process:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
    
    # Revertir estado del empleado a activo
    if process.employee:
        process.employee.status = "Activo"
        process.employee.exit_date = None
        
    db.delete(process)
    db.commit()
    return {"message": "Expediente eliminado exitosamente."}


# ----------------------------------------------------
# 4. CONTROL DE REQUISITOS DE PAZ Y SALVO
# ----------------------------------------------------
@app.get("/api/processes/{process_id}/requirements", response_model=List[ClearanceRequirementResponse])
def get_process_requirements(process_id: int, db: Session = Depends(get_db)):
    return db.query(ClearanceRequirement).filter_by(process_id=process_id).all()

@app.post("/api/processes/{process_id}/requirements", response_model=ClearanceRequirementResponse)
def add_custom_requirement(process_id: int, req_in: ClearanceRequirementBase, db: Session = Depends(get_db)):
    proc = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
    
    req = ClearanceRequirement(
        process_id=process_id,
        **req_in.model_dump()
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@app.put("/api/requirements/{requirement_id}", response_model=ClearanceRequirementResponse)
def update_requirement_status(
    requirement_id: int,
    req_update: ClearanceRequirementUpdate,
    user_name: Optional[str] = "Responsable",
    user_role: Optional[str] = "Admin",
    db: Session = Depends(get_db)
):
    req = db.query(ClearanceRequirement).filter_by(id=requirement_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisito no encontrado.")
    
    # Control de roles por departamento
    # Si el usuario tiene un rol departamental específico, solo puede modificar requisitos de su área
    if user_role not in ["Admin", "SuperAdmin"]:
        role_map = {
            "RRHH": "Recursos Humanos",
            "TI": "Sistemas / TI",
            "Contabilidad": "Contabilidad / Finanzas",
            "Administracion": "Administración"
        }
        allowed_dept = role_map.get(user_role)
        if allowed_dept and allowed_dept != req.department:
            raise HTTPException(
                status_code=403,
                detail=f"Permiso denegado: El rol '{user_role}' solo puede aprobar requisitos del departamento '{allowed_dept}'."
            )

    old_status = req.status
    for field, value in req_update.model_dump(exclude_unset=True).items():
        setattr(req, field, value)
    
    if req_update.status and not req_update.review_date:
        req.review_date = datetime.now().strftime("%Y-%m-%d")
    if req_update.status and not req_update.reviewer_name:
        req.reviewer_name = user_name

    # Registrar en auditoría
    audit = AuditLog(
        process_id=req.process_id,
        action=f"Cambio de estado: {req.requirement_name}",
        department=req.department,
        user_name=req.reviewer_name or user_name,
        details=f"Estado anterior: '{old_status}' -> Nuevo estado: '{req.status}'. Observaciones: {req.observations or 'N/A'}"
    )
    db.add(audit)

    db.commit()
    db.refresh(req)
    return req

@app.delete("/api/requirements/{requirement_id}")
def delete_requirement(requirement_id: int, db: Session = Depends(get_db)):
    req = db.query(ClearanceRequirement).filter_by(id=requirement_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisito no encontrado.")
    db.delete(req)
    db.commit()
    return {"message": "Requisito eliminado exitosamente."}


# ----------------------------------------------------
# 5. GESTIÓN DE ARCHIVOS Y EVIDENCIAS
# ----------------------------------------------------
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 # 10 MB

@app.post("/api/processes/{process_id}/upload-evidence", response_model=EvidenceFileResponse)
def upload_evidence(
    process_id: int,
    file: UploadFile = File(...),
    department: str = Form(...),
    requirement_id: Optional[int] = Form(None),
    uploaded_by: str = Form("Responsable"),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    proc = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
    
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no permitido. Solo se aceptan archivos con extensiones: {', '.join(ALLOWED_EXTENSIONS).upper()}"
        )
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    stored_name = f"evidencia_exp_{process_id}_{timestamp}_{filename}"
    file_path = os.path.join(UPLOADS_DIR, stored_name)

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="El archivo excede el tamaño máximo permitido de 10 MB.")
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    ev_file = EvidenceFile(
        process_id=process_id,
        requirement_id=requirement_id,
        department=department,
        original_filename=filename,
        stored_filename=stored_name,
        file_path=file_path,
        file_type=ext,
        file_size_bytes=len(content),
        uploaded_by=uploaded_by,
        notes=notes
    )
    db.add(ev_file)

    # Registrar en auditoría
    audit = AuditLog(
        process_id=process_id,
        action="Carga de Archivo de Evidencia",
        department=department,
        user_name=uploaded_by,
        details=f"Archivo cargado: '{filename}' ({ext.upper()}, {len(content)//1024} KB). Notas: {notes or 'N/A'}"
    )
    db.add(audit)

    db.commit()
    db.refresh(ev_file)
    return ev_file

@app.delete("/api/evidence/{evidence_id}")
def delete_evidence(evidence_id: int, db: Session = Depends(get_db)):
    ev = db.query(EvidenceFile).filter_by(id=evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Archivo de evidencia no encontrado.")
    
    if os.path.exists(ev.file_path):
        try:
            os.remove(ev.file_path)
        except Exception:
            pass
            
    db.delete(ev)
    db.commit()
    return {"message": "Evidencia eliminada exitosamente."}


# ----------------------------------------------------
# 6. CONTROL DE VACACIONES
# ----------------------------------------------------
@app.get("/api/processes/{process_id}/vacations", response_model=VacationControlResponse)
def get_vacations(process_id: int, db: Session = Depends(get_db)):
    vac = db.query(VacationControl).filter_by(process_id=process_id).first()
    if not vac:
        raise HTTPException(status_code=404, detail="Control de vacaciones no encontrado.")
    return vac

@app.put("/api/processes/{process_id}/vacations", response_model=VacationControlResponse)
def update_vacations(process_id: int, vac_in: VacationControlUpdate, db: Session = Depends(get_db)):
    proc = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
    
    vac = db.query(VacationControl).filter_by(process_id=process_id).first()
    if not vac:
        vac = VacationControl(process_id=process_id)
        db.add(vac)
        
    if vac_in.days_pending is not None:
        vac.days_pending = vac_in.days_pending
    if vac_in.days_taken is not None:
        vac.days_taken = vac_in.days_taken
    if vac_in.accrued_periods is not None:
        vac.accrued_periods = vac_in.accrued_periods
        
    emp = proc.employee
    val = round(vac.days_pending * (emp.monthly_salary / 30.0), 2)
    vac.economic_value = val
    vac.calculation_details = f"{vac.days_pending:.2f} días pendientes × (${emp.monthly_salary:.2f} / 30) = ${val:.2f} (Arts. 69 y 71 Código del Trabajo)"

    db.commit()
    db.refresh(vac)
    return vac


# ----------------------------------------------------
# 7. CÁLCULO DE LIQUIDACIÓN LABORAL
# ----------------------------------------------------
@app.post("/api/processes/{process_id}/calculate-liquidation", response_model=LiquidationResponse)
def calculate_liquidation(
    process_id: int,
    calc_input: LiquidationCalculationInput,
    db: Session = Depends(get_db)
):
    proc = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
    
    emp = proc.employee
    comp = emp.company

    # Usar valores del control de vacaciones si no se envían
    vac_record = db.query(VacationControl).filter_by(process_id=process_id).first()
    vac_days = calc_input.vacation_days_pending if calc_input.vacation_days_pending is not None else (vac_record.days_pending if vac_record else 0.0)

    region = calc_input.region or comp.region or "Sierra"
    sbu = calc_input.sbu_value or 460.0

    calc_res = calculate_full_liquidation(
        hire_date_str=emp.hire_date,
        exit_date_str=proc.effective_date,
        monthly_salary=emp.monthly_salary,
        cause=proc.cause,
        region=region,
        sbu_value=sbu,
        pending_salary_days=calc_input.pending_salary_days or 0,
        vacation_days_pending=vac_days,
        reserve_fund_pending=calc_input.reserve_fund_pending or False,
        apply_desahucio_override=calc_input.apply_desahucio,
        apply_dismissal_override=calc_input.apply_untimely_dismissal,
        other_earnings_name=calc_input.other_earnings_name,
        other_earnings_value=calc_input.other_earnings_value or 0.0,
        advance_deduction_value=calc_input.advance_deduction_value or 0.0,
        loans_deduction_value=calc_input.loans_deduction_value or 0.0,
        other_deduction_name=calc_input.other_deduction_name,
        other_deduction_value=calc_input.other_deduction_value or 0.0
    )

    # Buscar o crear registro de liquidación
    liq = db.query(LiquidationSettlement).filter_by(process_id=process_id).first()
    if not liq:
        liq = LiquidationSettlement(process_id=process_id)
        db.add(liq)
        
    liq.calculation_date = calc_input.calculation_date or datetime.now().strftime("%Y-%m-%d")
    liq.region = region
    liq.sbu_value = sbu
    liq.monthly_salary = emp.monthly_salary
    liq.years_worked = calc_res["years_worked"]
    liq.full_years = calc_res["full_years"]
    liq.pending_salary_days = calc_res["pending_salary_days"]
    liq.pending_salary_value = calc_res["pending_salary_value"]
    liq.vacation_days_pending = calc_res["vacation_days_pending"]
    liq.vacation_value = calc_res["vacation_value"]
    liq.thirteenth_salary_value = calc_res["thirteenth_salary_value"]
    liq.thirteenth_details = calc_res["thirteenth_details"]
    liq.fourteenth_salary_value = calc_res["fourteenth_salary_value"]
    liq.fourteenth_details = calc_res["fourteenth_details"]
    liq.reserve_fund_value = calc_res["reserve_fund_value"]
    liq.reserve_fund_details = calc_res["reserve_fund_details"]
    liq.desahucio_bonus_value = calc_res["desahucio_bonus_value"]
    liq.desahucio_details = calc_res["desahucio_details"]
    liq.untimely_dismissal_value = calc_res["untimely_dismissal_value"]
    liq.untimely_dismissal_details = calc_res["untimely_dismissal_details"]
    liq.other_earnings_name = calc_res["other_earnings_name"]
    liq.other_earnings_value = calc_res["other_earnings_value"]
    liq.advance_deduction_value = calc_res["advance_deduction_value"]
    liq.loans_deduction_value = calc_res["loans_deduction_value"]
    liq.other_deduction_name = calc_res["other_deduction_name"]
    liq.other_deduction_value = calc_res["other_deduction_value"]
    liq.total_earnings = calc_res["total_earnings"]
    liq.total_deductions = calc_res["total_deductions"]
    liq.net_payable = calc_res["net_payable"]
    liq.calculation_breakdown_json = json.dumps(calc_res["breakdown"])

    proc.status = "Liquidación Calculada" if proc.paz_y_salvo_certified else "En Revisión"

    # Registrar en auditoría
    audit = AuditLog(
        process_id=process_id,
        action="Cálculo de Liquidación Laboral",
        department="Contabilidad / RRHH",
        user_name="Sistema Automatizado",
        details=f"Liquidación generada: Haberes ${liq.total_earnings:.2f}, Deducciones ${liq.total_deductions:.2f}, Neto ${liq.net_payable:.2f}"
    )
    db.add(audit)

    db.commit()
    db.refresh(liq)
    return liq

@app.get("/api/processes/{process_id}/liquidation", response_model=LiquidationResponse)
def get_liquidation(process_id: int, db: Session = Depends(get_db)):
    liq = db.query(LiquidationSettlement).filter_by(process_id=process_id).first()
    if not liq:
        raise HTTPException(status_code=404, detail="Liquidación aún no ha sido calculada para este expediente.")
    return liq

@app.post("/api/liquidation/simulate-mdt")
def simulate_mdt_liquidation(sim_input: MdtSimulationInput):
    """
    Simulador Oficial de Liquidaciones del Ministerio del Trabajo (MDT):
    Permite calcular de forma idéntica a la plataforma oficial (calculadoras.trabajo.gob.ec/liquidaciones),
    considerando modalidad de décimos (acumulados vs mensualizados), fondos de reserva, causales Art. 169,
    vacaciones pendientes y deducciones.
    """
    st = calculate_service_time(sim_input.hire_date, sim_input.exit_date)
    vac_days = sim_input.vacation_days_pending
    if vac_days is None:
        vac_days = round((15.0 * max(0, st["total_days"] - (st["full_years"] * 365))) / 365.0, 2)
        
    calc_res = calculate_full_liquidation(
        hire_date_str=sim_input.hire_date,
        exit_date_str=sim_input.exit_date,
        monthly_salary=sim_input.monthly_salary,
        cause=sim_input.cause,
        region=sim_input.region,
        sbu_value=sim_input.sbu_value,
        pending_salary_days=sim_input.pending_salary_days,
        vacation_days_pending=vac_days,
        thirteenth_accumulated=sim_input.thirteenth_accumulated,
        fourteenth_accumulated=sim_input.fourteenth_accumulated,
        reserve_fund_pending=sim_input.reserve_fund_pending,
        advance_deduction_value=sim_input.advance_deduction_value,
        loans_deduction_value=sim_input.loans_deduction_value,
        other_earnings_name=sim_input.other_earnings_name,
        other_earnings_value=sim_input.other_earnings_value,
        other_deduction_name=sim_input.other_deduction_name,
        other_deduction_value=sim_input.other_deduction_value
    )
    return {
        "source": "Simulador Homologado Ministerio del Trabajo (MDT Ecuador)",
        "service_time": st,
        "calculation": calc_res,
        "official_url": "https://calculadoras.trabajo.gob.ec/liquidaciones"
    }

@app.post("/api/processes/{process_id}/apply-mdt-calculation")
def apply_mdt_calculation_to_process(
    process_id: int,
    sim_input: MdtSimulationInput,
    user_name: str = "Administrador",
    db: Session = Depends(get_db)
):
    """
    Aplica los resultados de la Calculadora Oficial MDT directamente al expediente:
    1. Actualiza los valores de la liquidación en la base de datos.
    2. Actualiza el control de vacaciones si se modificaron los días.
    3. Regenera inmediatamente el PDF de Liquidación Laboral.
    4. Si el Paz y Salvo está certificado, actualiza también el PDF consolidado.
    5. Registra el evento en la bitácora de auditoría.
    """
    proc = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
        
    emp = proc.employee
    comp = emp.company
    
    emp.monthly_salary = sim_input.monthly_salary
    proc.effective_date = sim_input.exit_date
    proc.cause = sim_input.cause
    
    vac_record = db.query(VacationControl).filter_by(process_id=process_id).first()
    vac_days = sim_input.vacation_days_pending if sim_input.vacation_days_pending is not None else (vac_record.days_pending if vac_record else 0.0)
    if vac_record:
        vac_record.days_pending = vac_days
        vac_record.economic_value = round(vac_days * (emp.monthly_salary / 30.0), 2)
        
    calc_res = calculate_full_liquidation(
        hire_date_str=emp.hire_date,
        exit_date_str=proc.effective_date,
        monthly_salary=emp.monthly_salary,
        cause=proc.cause,
        region=sim_input.region,
        sbu_value=sim_input.sbu_value,
        pending_salary_days=sim_input.pending_salary_days,
        vacation_days_pending=vac_days,
        thirteenth_accumulated=sim_input.thirteenth_accumulated,
        fourteenth_accumulated=sim_input.fourteenth_accumulated,
        reserve_fund_pending=sim_input.reserve_fund_pending,
        advance_deduction_value=sim_input.advance_deduction_value,
        loans_deduction_value=sim_input.loans_deduction_value,
        other_earnings_name=sim_input.other_earnings_name,
        other_earnings_value=sim_input.other_earnings_value,
        other_deduction_name=sim_input.other_deduction_name,
        other_deduction_value=sim_input.other_deduction_value
    )
    
    liq = db.query(LiquidationSettlement).filter_by(process_id=process_id).first()
    if not liq:
        liq = LiquidationSettlement(process_id=process_id)
        db.add(liq)
        
    liq.calculation_date = datetime.now().strftime("%Y-%m-%d")
    liq.region = sim_input.region
    liq.sbu_value = sim_input.sbu_value
    liq.monthly_salary = emp.monthly_salary
    liq.years_worked = calc_res["years_worked"]
    liq.full_years = calc_res["full_years"]
    liq.pending_salary_days = calc_res["pending_salary_days"]
    liq.pending_salary_value = calc_res["pending_salary_value"]
    liq.vacation_days_pending = calc_res["vacation_days_pending"]
    liq.vacation_value = calc_res["vacation_value"]
    liq.thirteenth_salary_value = calc_res["thirteenth_salary_value"]
    liq.thirteenth_details = calc_res["thirteenth_details"]
    liq.fourteenth_salary_value = calc_res["fourteenth_salary_value"]
    liq.fourteenth_details = calc_res["fourteenth_details"]
    liq.reserve_fund_value = calc_res["reserve_fund_value"]
    liq.reserve_fund_details = calc_res["reserve_fund_details"]
    liq.desahucio_bonus_value = calc_res["desahucio_bonus_value"]
    liq.desahucio_details = calc_res["desahucio_details"]
    liq.untimely_dismissal_value = calc_res["untimely_dismissal_value"]
    liq.untimely_dismissal_details = calc_res["untimely_dismissal_details"]
    liq.other_earnings_name = calc_res["other_earnings_name"]
    liq.other_earnings_value = calc_res["other_earnings_value"]
    liq.advance_deduction_value = calc_res["advance_deduction_value"]
    liq.loans_deduction_value = calc_res["loans_deduction_value"]
    liq.other_deduction_name = calc_res["other_deduction_name"]
    liq.other_deduction_value = calc_res["other_deduction_value"]
    liq.total_earnings = calc_res["total_earnings"]
    liq.total_deductions = calc_res["total_deductions"]
    liq.net_payable = calc_res["net_payable"]
    liq.calculation_breakdown_json = json.dumps(calc_res["breakdown"])
    
    # Regenerar PDF de Liquidación automáticamente
    company_dict = {
        "business_name": comp.business_name,
        "ruc": comp.ruc,
        "legal_representative": comp.legal_representative,
        "address": comp.address,
        "phone": comp.phone,
        "email": comp.email,
        "region": comp.region
    }
    emp_dict = {
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "national_id": emp.national_id,
        "position": emp.position,
        "department": emp.department,
        "hire_date": emp.hire_date,
        "monthly_salary": emp.monthly_salary
    }
    proc_dict = {
        "effective_date": proc.effective_date,
        "cause": proc.cause,
        "legal_article": proc.legal_article,
        "responsible": proc.responsible
    }
    liq_dict = {
        "full_years": liq.full_years,
        "years_worked": liq.years_worked,
        "sbu_value": liq.sbu_value,
        "region": liq.region,
        "pending_salary_days": liq.pending_salary_days,
        "pending_salary_value": liq.pending_salary_value,
        "vacation_days_pending": liq.vacation_days_pending,
        "vacation_value": liq.vacation_value,
        "thirteenth_salary_value": liq.thirteenth_salary_value,
        "thirteenth_details": liq.thirteenth_details,
        "fourteenth_salary_value": liq.fourteenth_salary_value,
        "fourteenth_details": liq.fourteenth_details,
        "reserve_fund_value": liq.reserve_fund_value,
        "reserve_fund_details": liq.reserve_fund_details,
        "desahucio_bonus_value": liq.desahucio_bonus_value,
        "desahucio_details": liq.desahucio_details,
        "untimely_dismissal_value": liq.untimely_dismissal_value,
        "untimely_dismissal_details": liq.untimely_dismissal_details,
        "other_earnings_name": liq.other_earnings_name,
        "other_earnings_value": liq.other_earnings_value,
        "advance_deduction_value": liq.advance_deduction_value,
        "loans_deduction_value": liq.loans_deduction_value,
        "other_deduction_name": liq.other_deduction_name,
        "other_deduction_value": liq.other_deduction_value,
        "total_earnings": liq.total_earnings,
        "total_deductions": liq.total_deductions,
        "net_payable": liq.net_payable
    }
    
    liq_pdf_path = generate_liquidation_pdf(
        process_id=proc.id,
        company_data=company_dict,
        employee_data=emp_dict,
        process_data=proc_dict,
        liquidation_data=liq_dict
    )
    liq.liquidation_pdf_path = os.path.basename(liq_pdf_path)
    
    audit = AuditLog(
        process_id=proc.id,
        action="Sincronización con Calculadora MDT",
        department="Contabilidad / RRHH",
        user_name=user_name,
        details=f"Valores recalculados y sincronizados según criterios oficiales MDT. Neto a pagar: ${liq.net_payable:.2f} USD."
    )
    db.add(audit)
    db.commit()
    db.refresh(liq)
    
    return {
        "message": "Liquidación calculada y reportes PDF actualizados con éxito conforme a la Calculadora del Ministerio del Trabajo.",
        "settlement": liq,
        "liquidation_pdf_url": f"/uploads/{liq.liquidation_pdf_path}",
        "net_payable": liq.net_payable
    }


# ----------------------------------------------------
# 8. GENERACIÓN AUTOMÁTICA DE DOCUMENTOS PDF
# ----------------------------------------------------
@app.post("/api/processes/{process_id}/generate-paz-y-salvo")
def generate_paz_y_salvo(process_id: int, user_name: str = "Administrador", db: Session = Depends(get_db)):
    """
    REGLA DE CALIDAD OBLIGATORIA:
    El certificado de paz y salvo SOLAMENTE podrá generarse cuando TODOS los requisitos obligatorios
    estén Aprobados o marcados justificadamente como No aplica.
    Si hay requisitos Pendientes o Rechazados, el sistema RECHAZA la emisión con error HTTP 400.
    """
    proc = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
    
    requirements = db.query(ClearanceRequirement).filter_by(process_id=process_id).all()
    if not requirements:
        raise HTTPException(status_code=400, detail="No existen requisitos departamentales configurados para este expediente.")

    blocking_requirements = []
    for r in requirements:
        if r.is_mandatory and r.status not in ["Aprobado", "No aplica"]:
            blocking_requirements.append({
                "id": r.id,
                "department": r.department,
                "requirement_name": r.requirement_name,
                "status": r.status
            })

    if blocking_requirements:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "BLOQUEO DE EMISIÓN: No se puede generar el Certificado de Paz y Salvo. Existen obligaciones departamentales obligatorias pendientes o rechazadas.",
                "pending_count": len(blocking_requirements),
                "unresolved_requirements": blocking_requirements
            }
        )

    # Si todo está aprobado o no aplica, generar el PDF
    emp = proc.employee
    comp = emp.company

    company_dict = {
        "business_name": comp.business_name,
        "ruc": comp.ruc,
        "legal_representative": comp.legal_representative,
        "address": comp.address,
        "phone": comp.phone,
        "email": comp.email,
        "region": comp.region
    }
    emp_dict = {
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "national_id": emp.national_id,
        "position": emp.position,
        "department": emp.department,
        "hire_date": emp.hire_date,
        "monthly_salary": emp.monthly_salary
    }
    proc_dict = {
        "effective_date": proc.effective_date,
        "cause": proc.cause,
        "legal_article": proc.legal_article,
        "responsible": proc.responsible
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
        for r in requirements
    ]

    pdf_path = generate_paz_y_salvo_pdf(
        process_id=proc.id,
        company_data=company_dict,
        employee_data=emp_dict,
        process_data=proc_dict,
        requirements_data=req_list,
        evidence_files=proc.evidence_files
    )

    pdf_filename = os.path.basename(pdf_path)
    proc.paz_y_salvo_certified = True
    proc.certified_at = datetime.utcnow()
    proc.status = "Paz y Salvo Aprobado"

    liq = db.query(LiquidationSettlement).filter_by(process_id=process_id).first()
    if liq:
        liq.paz_y_salvo_pdf_path = pdf_filename

    audit = AuditLog(
        process_id=proc.id,
        action="Emisión Oficial de Paz y Salvo",
        department="Gerencia General",
        user_name=user_name,
        details="Certificado de Paz y Salvo aprobado y generado formalmente en PDF."
    )
    db.add(audit)

    db.commit()

    return {
        "message": "Certificado de Paz y Salvo generado exitosamente.",
        "pdf_url": f"/uploads/{pdf_filename}",
        "filename": pdf_filename
    }


@app.post("/api/processes/{process_id}/generate-liquidation-pdf")
def generate_liquidation_document(process_id: int, user_name: str = "Contabilidad", db: Session = Depends(get_db)):
    proc = db.query(TerminationProcess).filter_by(id=process_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Expediente no encontrado.")
    
    liq = db.query(LiquidationSettlement).filter_by(process_id=process_id).first()
    if not liq:
        raise HTTPException(status_code=400, detail="Debe calcular la liquidación antes de generar el documento PDF.")

    emp = proc.employee
    comp = emp.company

    company_dict = {
        "business_name": comp.business_name,
        "ruc": comp.ruc,
        "legal_representative": comp.legal_representative,
        "address": comp.address,
        "phone": comp.phone,
        "email": comp.email,
        "region": comp.region
    }
    emp_dict = {
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "national_id": emp.national_id,
        "position": emp.position,
        "department": emp.department,
        "hire_date": emp.hire_date,
        "monthly_salary": emp.monthly_salary
    }
    proc_dict = {
        "effective_date": proc.effective_date,
        "cause": proc.cause,
        "legal_article": proc.legal_article,
        "responsible": proc.responsible
    }
    liq_dict = {
        "full_years": liq.full_years,
        "years_worked": liq.years_worked,
        "sbu_value": liq.sbu_value,
        "region": liq.region,
        "pending_salary_days": liq.pending_salary_days,
        "pending_salary_value": liq.pending_salary_value,
        "vacation_days_pending": liq.vacation_days_pending,
        "vacation_value": liq.vacation_value,
        "thirteenth_salary_value": liq.thirteenth_salary_value,
        "thirteenth_details": liq.thirteenth_details,
        "fourteenth_salary_value": liq.fourteenth_salary_value,
        "fourteenth_details": liq.fourteenth_details,
        "reserve_fund_value": liq.reserve_fund_value,
        "reserve_fund_details": liq.reserve_fund_details,
        "desahucio_bonus_value": liq.desahucio_bonus_value,
        "desahucio_details": liq.desahucio_details,
        "untimely_dismissal_value": liq.untimely_dismissal_value,
        "untimely_dismissal_details": liq.untimely_dismissal_details,
        "other_earnings_name": liq.other_earnings_name,
        "other_earnings_value": liq.other_earnings_value,
        "advance_deduction_value": liq.advance_deduction_value,
        "loans_deduction_value": liq.loans_deduction_value,
        "other_deduction_name": liq.other_deduction_name,
        "other_deduction_value": liq.other_deduction_value,
        "total_earnings": liq.total_earnings,
        "total_deductions": liq.total_deductions,
        "net_payable": liq.net_payable
    }

    pdf_path = generate_liquidation_pdf(
        process_id=proc.id,
        company_data=company_dict,
        employee_data=emp_dict,
        process_data=proc_dict,
        liquidation_data=liq_dict
    )

    pdf_filename = os.path.basename(pdf_path)
    liq.liquidation_pdf_path = pdf_filename
    proc.status = "Finalizado" if proc.paz_y_salvo_certified else "Liquidación Calculada"

    audit = AuditLog(
        process_id=proc.id,
        action="Emisión de Acta de Liquidación PDF",
        department="Contabilidad / RRHH",
        user_name=user_name,
        details=f"Documento oficial de liquidación laboral generado en PDF por valor neto de ${liq.net_payable:.2f}."
    )
    db.add(audit)

    db.commit()

    return {
        "message": "Acta de Liquidación generada exitosamente.",
        "pdf_url": f"/uploads/{pdf_filename}",
        "filename": pdf_filename
    }


# ----------------------------------------------------
# 9. DASHBOARD Y ESTADÍSTICAS
# ----------------------------------------------------
@app.get("/api/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter_by(status="Activo").count()
    terminating_employees = db.query(Employee).filter_by(status="En proceso de salida").count()
    terminated_employees = db.query(Employee).filter_by(status="Terminado").count()

    total_processes = db.query(TerminationProcess).count()
    certified_processes = db.query(TerminationProcess).filter_by(paz_y_salvo_certified=True).count()
    pending_processes = total_processes - certified_processes

    # Requisitos por departamento
    depts = ["Recursos Humanos", "Sistemas / TI", "Contabilidad / Finanzas", "Administración"]
    dept_stats = []
    for d in depts:
        total_reqs = db.query(ClearanceRequirement).filter_by(department=d).count()
        approved_reqs = db.query(ClearanceRequirement).filter(
            ClearanceRequirement.department == d,
            ClearanceRequirement.status.in_(["Aprobado", "No aplica"])
        ).count()
        pct = round((approved_reqs / total_reqs * 100), 1) if total_reqs > 0 else 100.0
        dept_stats.append({
            "department": d,
            "total": total_reqs,
            "approved": approved_reqs,
            "percentage": pct
        })

    # Liquidaciones
    settlements = db.query(LiquidationSettlement).all()
    total_paid = sum(s.net_payable for s in settlements)

    recent_logs = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(8).all()

    return {
        "employees": {
            "total": total_employees,
            "active": active_employees,
            "terminating": terminating_employees,
            "terminated": terminated_employees
        },
        "processes": {
            "total": total_processes,
            "certified": certified_processes,
            "pending": pending_processes
        },
        "department_progress": dept_stats,
        "settlements": {
            "count": len(settlements),
            "total_net_amount": round(total_paid, 2)
        },
        "recent_logs": [
            {
                "id": l.id,
                "process_id": l.process_id,
                "action": l.action,
                "department": l.department,
                "user_name": l.user_name,
                "details": l.details,
                "timestamp": l.timestamp.strftime("%d/%m/%Y %H:%M")
            }
            for l in recent_logs
        ]
    }


# ----------------------------------------------------
# 10. SPA CATCH-ALL ROUTE (Servir Frontend React)
# ----------------------------------------------------
@app.get("/")
def serve_root():
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "API de Paz y Salvo Laboral operativa. Frontend no compilado."}

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("uploads/"):
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
        
    # Si solicita un archivo existente en dist (ej. favicon, etc)
    static_file = os.path.join(FRONTEND_DIST, full_path)
    if os.path.isfile(static_file):
        return FileResponse(static_file)

    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "API de Paz y Salvo Laboral operativa. Frontend no compilado."}

