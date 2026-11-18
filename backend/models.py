from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    business_name = Column(String(200), nullable=False)
    ruc = Column(String(13), unique=True, index=True, nullable=False)
    legal_representative = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    region = Column(String(50), default="Sierra", nullable=False) # Sierra o Costa
    created_at = Column(DateTime, default=datetime.utcnow)

    employees = relationship("Employee", back_populates="company", cascade="all, delete-orphan")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    national_id = Column(String(10), unique=True, index=True, nullable=False) # Cédula
    position = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    hire_date = Column(String(10), nullable=False) # YYYY-MM-DD
    exit_date = Column(String(10), nullable=True) # YYYY-MM-DD
    contract_type = Column(String(100), default="Contrato Indefinido", nullable=False)
    monthly_salary = Column(Float, nullable=False)
    email = Column(String(100), nullable=False)
    status = Column(String(50), default="Activo", nullable=False) # Activo, En proceso de salida, Terminado
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="employees")
    termination_processes = relationship("TerminationProcess", back_populates="employee", cascade="all, delete-orphan")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class TerminationProcess(Base):
    __tablename__ = "termination_processes"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    request_date = Column(String(10), nullable=False) # YYYY-MM-DD
    effective_date = Column(String(10), nullable=False) # YYYY-MM-DD
    cause = Column(String(150), nullable=False)
    legal_article = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    responsible = Column(String(100), nullable=False)
    status = Column(String(50), default="Iniciado", nullable=False) # Iniciado, En Revisión, Paz y Salvo Aprobado, Liquidación Generada, Finalizado
    paz_y_salvo_certified = Column(Boolean, default=False)
    certified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="termination_processes")
    clearance_requirements = relationship("ClearanceRequirement", back_populates="process", cascade="all, delete-orphan")
    evidence_files = relationship("EvidenceFile", back_populates="process", cascade="all, delete-orphan")
    vacation_record = relationship("VacationControl", back_populates="process", uselist=False, cascade="all, delete-orphan")
    liquidation = relationship("LiquidationSettlement", back_populates="process", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="process", cascade="all, delete-orphan")


class ClearanceRequirement(Base):
    __tablename__ = "clearance_requirements"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("termination_processes.id"), nullable=False)
    department = Column(String(100), nullable=False) # Recursos Humanos, Sistemas / TI, Contabilidad / Finanzas, Bodega / Inventario, Administración
    requirement_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_mandatory = Column(Boolean, default=True)
    reviewer_name = Column(String(100), nullable=True)
    review_date = Column(String(10), nullable=True) # YYYY-MM-DD
    status = Column(String(50), default="Pendiente", nullable=False) # Pendiente, Aprobado, Rechazado, No aplica
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    process = relationship("TerminationProcess", back_populates="clearance_requirements")
    evidence_files = relationship("EvidenceFile", back_populates="requirement")


class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("termination_processes.id"), nullable=False)
    requirement_id = Column(Integer, ForeignKey("clearance_requirements.id"), nullable=True)
    department = Column(String(100), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, jpg, jpeg, png
    file_size_bytes = Column(Integer, nullable=False)
    uploaded_by = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    process = relationship("TerminationProcess", back_populates="evidence_files")
    requirement = relationship("ClearanceRequirement", back_populates="evidence_files")


class VacationControl(Base):
    __tablename__ = "vacation_controls"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("termination_processes.id"), nullable=False)
    days_accrued = Column(Float, default=0.0)
    days_taken = Column(Float, default=0.0)
    days_pending = Column(Float, default=0.0)
    accrued_periods = Column(String(255), nullable=True)
    economic_value = Column(Float, default=0.0)
    calculation_details = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    process = relationship("TerminationProcess", back_populates="vacation_record")


class LiquidationSettlement(Base):
    __tablename__ = "liquidation_settlements"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("termination_processes.id"), nullable=False)
    calculation_date = Column(String(10), nullable=False)
    region = Column(String(50), default="Sierra", nullable=False)
    sbu_value = Column(Float, default=460.0)
    monthly_salary = Column(Float, nullable=False)
    years_worked = Column(Float, default=0.0)
    full_years = Column(Integer, default=0)

    # Haberes
    pending_salary_days = Column(Integer, default=0)
    pending_salary_value = Column(Float, default=0.0)
    vacation_days_pending = Column(Float, default=0.0)
    vacation_value = Column(Float, default=0.0)
    thirteenth_salary_value = Column(Float, default=0.0)
    thirteenth_details = Column(String(255), nullable=True)
    fourteenth_salary_value = Column(Float, default=0.0)
    fourteenth_details = Column(String(255), nullable=True)
    reserve_fund_value = Column(Float, default=0.0)
    reserve_fund_details = Column(String(255), nullable=True)
    desahucio_bonus_value = Column(Float, default=0.0)
    desahucio_details = Column(String(255), nullable=True)
    untimely_dismissal_value = Column(Float, default=0.0)
    untimely_dismissal_details = Column(String(255), nullable=True)
    other_earnings_name = Column(String(100), nullable=True)
    other_earnings_value = Column(Float, default=0.0)

    # Deducciones
    advance_deduction_value = Column(Float, default=0.0)
    loans_deduction_value = Column(Float, default=0.0)
    other_deduction_name = Column(String(100), nullable=True)
    other_deduction_value = Column(Float, default=0.0)

    # Totales
    total_earnings = Column(Float, nullable=False)
    total_deductions = Column(Float, nullable=False)
    net_payable = Column(Float, nullable=False)

    calculation_breakdown_json = Column(Text, nullable=True)
    paz_y_salvo_pdf_path = Column(String(500), nullable=True)
    liquidation_pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    process = relationship("TerminationProcess", back_populates="liquidation")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    process_id = Column(Integer, ForeignKey("termination_processes.id"), nullable=False)
    action = Column(String(100), nullable=False)
    department = Column(String(100), nullable=True)
    user_name = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    process = relationship("TerminationProcess", back_populates="audit_logs")

