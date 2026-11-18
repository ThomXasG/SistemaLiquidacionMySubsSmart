from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Validation helpers ---
def validate_ecuadorian_id(cedula: str) -> bool:
    # Allow demo id explicitly or standard validation
    if cedula in ["1800000001", "1799999999", "1800000002", "1800000003"]:
        return True
    if len(cedula) != 10 or not cedula.isdigit():
        return False
    prov = int(cedula[:2])
    if not (1 <= prov <= 24 or prov == 30):
        return False
    third = int(cedula[2])
    if third >= 6:
        return False
    coef = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    total = 0
    for i in range(9):
        val = int(cedula[i]) * coef[i]
        total += val if val < 10 else (val - 9)
    check_digit = (10 - (total % 10)) % 10
    return check_digit == int(cedula[9])


def validate_ecuadorian_ruc(ruc: str) -> bool:
    if ruc in ["1899999999001", "1790000000001", "1890000000001"]:
        return True
    if len(ruc) != 13 or not ruc.isdigit():
        return False
    if not ruc.endswith("001"):
        return False
    return validate_ecuadorian_id(ruc[:10])


# --- Company Schemas ---
class CompanyBase(BaseModel):
    business_name: str
    ruc: str
    legal_representative: str
    address: str
    phone: str
    email: str
    region: str = "Sierra"

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    business_name: Optional[str] = None
    legal_representative: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    region: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: int
    class Config:
        from_attributes = True


# --- Employee Schemas ---
class EmployeeBase(BaseModel):
    company_id: int
    first_name: str
    last_name: str
    national_id: str
    position: str
    department: str
    hire_date: str
    exit_date: Optional[str] = None
    contract_type: str = "Contrato Indefinido"
    monthly_salary: float
    email: str
    status: str = "Activo"

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    hire_date: Optional[str] = None
    exit_date: Optional[str] = None
    contract_type: Optional[str] = None
    monthly_salary: Optional[float] = None
    email: Optional[str] = None
    status: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    full_name: str
    company: Optional[CompanyResponse] = None
    class Config:
        from_attributes = True


# --- Clearance Requirements Schemas ---
class ClearanceRequirementBase(BaseModel):
    department: str
    requirement_name: str
    description: Optional[str] = None
    is_mandatory: bool = True
    reviewer_name: Optional[str] = None
    review_date: Optional[str] = None
    status: str = "Pendiente" # Pendiente, Aprobado, Rechazado, No aplica
    observations: Optional[str] = None

class ClearanceRequirementCreate(ClearanceRequirementBase):
    process_id: int

class ClearanceRequirementUpdate(BaseModel):
    status: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_date: Optional[str] = None
    observations: Optional[str] = None
    is_mandatory: Optional[bool] = None

class ClearanceRequirementResponse(ClearanceRequirementBase):
    id: int
    process_id: int
    class Config:
        from_attributes = True


# --- Evidence File Schemas ---
class EvidenceFileResponse(BaseModel):
    id: int
    process_id: int
    requirement_id: Optional[int] = None
    department: str
    original_filename: str
    stored_filename: str
    file_type: str
    file_size_bytes: int
    uploaded_by: str
    notes: Optional[str] = None
    uploaded_at: Any
    class Config:
        from_attributes = True


# --- Vacation Record Schemas ---
class VacationControlBase(BaseModel):
    days_accrued: float = 0.0
    days_taken: float = 0.0
    days_pending: float = 0.0
    accrued_periods: Optional[str] = None
    economic_value: float = 0.0
    calculation_details: Optional[str] = None

class VacationControlUpdate(BaseModel):
    days_taken: Optional[float] = None
    days_pending: Optional[float] = None
    accrued_periods: Optional[str] = None

class VacationControlResponse(VacationControlBase):
    id: int
    process_id: int
    class Config:
        from_attributes = True


# --- Liquidation Schemas ---
class LiquidationCalculationInput(BaseModel):
    process_id: int
    calculation_date: Optional[str] = None
    region: Optional[str] = None # Sierra o Costa
    sbu_value: Optional[float] = 460.0
    pending_salary_days: Optional[int] = 0
    vacation_days_pending: Optional[float] = None
    thirteenth_accumulated: Optional[bool] = True
    fourteenth_accumulated: Optional[bool] = True
    reserve_fund_pending: Optional[bool] = False
    apply_desahucio: Optional[bool] = None # Si es None se determina por causa
    apply_untimely_dismissal: Optional[bool] = None
    other_earnings_name: Optional[str] = None
    other_earnings_value: Optional[float] = 0.0
    advance_deduction_value: Optional[float] = 0.0
    loans_deduction_value: Optional[float] = 0.0
    other_deduction_name: Optional[str] = None
    other_deduction_value: Optional[float] = 0.0

class MdtSimulationInput(BaseModel):
    hire_date: str
    exit_date: str
    monthly_salary: float
    cause: str
    region: str = "Sierra"
    sbu_value: float = 460.0
    pending_salary_days: int = 0
    vacation_days_pending: Optional[float] = None
    thirteenth_accumulated: bool = True
    fourteenth_accumulated: bool = True
    reserve_fund_pending: bool = False
    advance_deduction_value: float = 0.0
    loans_deduction_value: float = 0.0
    other_earnings_name: Optional[str] = None
    other_earnings_value: float = 0.0
    other_deduction_name: Optional[str] = None
    other_deduction_value: float = 0.0

class LiquidationResponse(BaseModel):
    id: int
    process_id: int
    calculation_date: str
    region: str
    sbu_value: float
    monthly_salary: float
    years_worked: float
    full_years: int
    pending_salary_days: int
    pending_salary_value: float
    vacation_days_pending: float
    vacation_value: float
    thirteenth_salary_value: float
    thirteenth_details: Optional[str]
    fourteenth_salary_value: float
    fourteenth_details: Optional[str]
    reserve_fund_value: float
    reserve_fund_details: Optional[str]
    desahucio_bonus_value: float
    desahucio_details: Optional[str]
    untimely_dismissal_value: float
    untimely_dismissal_details: Optional[str]
    other_earnings_name: Optional[str]
    other_earnings_value: float
    advance_deduction_value: float
    loans_deduction_value: float
    other_deduction_name: Optional[str]
    other_deduction_value: float
    total_earnings: float
    total_deductions: float
    net_payable: float
    calculation_breakdown_json: Optional[str]
    paz_y_salvo_pdf_path: Optional[str]
    liquidation_pdf_path: Optional[str]
    class Config:
        from_attributes = True


# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    process_id: int
    action: str
    department: Optional[str]
    user_name: str
    details: Optional[str]
    timestamp: Any
    class Config:
        from_attributes = True


# --- Termination Process Schemas ---
class TerminationProcessCreate(BaseModel):
    employee_id: int
    request_date: str
    effective_date: str
    cause: str
    legal_article: str
    description: Optional[str] = None
    responsible: str

class TerminationProcessUpdate(BaseModel):
    effective_date: Optional[str] = None
    cause: Optional[str] = None
    legal_article: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class TerminationProcessResponse(BaseModel):
    id: int
    employee_id: int
    request_date: str
    effective_date: str
    cause: str
    legal_article: str
    description: Optional[str]
    responsible: str
    status: str
    paz_y_salvo_certified: bool
    certified_at: Optional[Any]
    created_at: Any
    updated_at: Any
    employee: Optional[EmployeeResponse] = None
    clearance_requirements: List[ClearanceRequirementResponse] = []
    evidence_files: List[EvidenceFileResponse] = []
    vacation_record: Optional[VacationControlResponse] = None
    liquidation: Optional[LiquidationResponse] = None
    audit_logs: List[AuditLogResponse] = []

    class Config:
        from_attributes = True
