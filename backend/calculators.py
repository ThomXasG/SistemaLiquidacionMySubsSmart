import math
from datetime import datetime, date

def parse_date(date_str: str) -> date:
    return datetime.strptime(date_str, "%Y-%m-%d").date()

def calculate_service_time(hire_date_str: str, exit_date_str: str):
    d1 = parse_date(hire_date_str)
    d2 = parse_date(exit_date_str)
    
    total_days = (d2 - d1).days + 1 # Incluye el último día
    
    # Cálculo de años completos según aniversario
    full_years = d2.year - d1.year
    if (d2.month, d2.day) < (d1.month, d1.day):
        full_years -= 1
        
    full_years = max(0, full_years)
    years_float = round(total_days / 365.25, 2)
    
    return {
        "total_days": total_days,
        "full_years": full_years,
        "years_float": years_float,
        "hire_date": d1.strftime("%d/%m/%Y"),
        "exit_date": d2.strftime("%d/%m/%Y")
    }

def calculate_thirteenth_salary(hire_date_str: str, exit_date_str: str, monthly_salary: float, accumulated: bool = True):
    """
    Art. 111 Código del Trabajo:
    Período de cálculo: 1 de diciembre del año anterior al 30 de noviembre del año en curso.
    Doceava parte de lo percibido en el año calendario respectivo.
    Si el trabajador recibía este rubro mensualizado (accumulated=False), no se incluye en la liquidación.
    """
    d_exit = parse_date(exit_date_str)
    d_hire = parse_date(hire_date_str)
    
    # Inicio del período fiscal del décimo tercero
    if d_exit.month == 12:
        period_start = date(d_exit.year, 12, 1)
    else:
        period_start = date(d_exit.year - 1, 12, 1)
        
    actual_start = max(d_hire, period_start)
    
    months = (d_exit.year - actual_start.year) * 12 + (d_exit.month - actual_start.month)
    days_in_exit_month = min(30, d_exit.day)
    if actual_start.day > 1:
        initial_days = max(0, 30 - actual_start.day + 1)
        total_commercial_days = (months - 1) * 30 + initial_days + days_in_exit_month
    else:
        total_commercial_days = months * 30 + (days_in_exit_month if d_exit.day < 30 else 30)

    if not accumulated:
        return {
            "value": 0.0,
            "period_start": actual_start.strftime("%d/%m/%Y"),
            "period_end": d_exit.strftime("%d/%m/%Y"),
            "commercial_days": total_commercial_days,
            "formula": "Modalidad Mensualizada: Rubro cancelado mensualmente junto a la remuneración ordinaria.",
            "legal_basis": "Artículo 111 del Código del Trabajo (Mensualizado - No genera valor pendiente)"
        }

    # Valor proporcional
    value = round((monthly_salary * total_commercial_days) / 360, 2)
    
    return {
        "value": value,
        "period_start": actual_start.strftime("%d/%m/%Y"),
        "period_end": d_exit.strftime("%d/%m/%Y"),
        "commercial_days": total_commercial_days,
        "formula": f"(${monthly_salary:.2f} × {total_commercial_days} días) / 360 días = ${value:.2f}",
        "legal_basis": "Artículo 111 del Código del Trabajo (Décima Tercera Remuneración - Acumulada)"
    }

def calculate_fourteenth_salary(hire_date_str: str, exit_date_str: str, sbu_value: float, region: str = "Sierra", accumulated: bool = True):
    """
    Art. 113 Código del Trabajo:
    Sierra y Amazonía: 1 de agosto al 31 de julio del año siguiente.
    Costa e Insular: 1 de marzo al último día de febrero del año siguiente.
    Equivale a un Salario Básico Unificado (SBU).
    Si el trabajador recibía este rubro mensualizado (accumulated=False), no se incluye en la liquidación.
    """
    d_exit = parse_date(exit_date_str)
    d_hire = parse_date(hire_date_str)
    
    if region.lower() == "sierra" or "sierra" in region.lower() or "amazon" in region.lower():
        if d_exit.month >= 8:
            period_start = date(d_exit.year, 8, 1)
        else:
            period_start = date(d_exit.year - 1, 8, 1)
    else:
        if d_exit.month >= 3:
            period_start = date(d_exit.year, 3, 1)
        else:
            period_start = date(d_exit.year - 1, 3, 1)
            
    actual_start = max(d_hire, period_start)
    
    months = (d_exit.year - actual_start.year) * 12 + (d_exit.month - actual_start.month)
    days_in_exit_month = min(30, d_exit.day)
    if actual_start.day > 1:
        initial_days = max(0, 30 - actual_start.day + 1)
        total_commercial_days = (months - 1) * 30 + initial_days + days_in_exit_month
    else:
        total_commercial_days = months * 30 + (days_in_exit_month if d_exit.day < 30 else 30)

    if not accumulated:
        return {
            "value": 0.0,
            "region": region,
            "sbu_value": sbu_value,
            "period_start": actual_start.strftime("%d/%m/%Y"),
            "period_end": d_exit.strftime("%d/%m/%Y"),
            "commercial_days": total_commercial_days,
            "formula": "Modalidad Mensualizada: Rubro cancelado mensualmente junto a la remuneración ordinaria.",
            "legal_basis": f"Artículo 113 del Código del Trabajo (Mensualizado - No genera valor pendiente)"
        }

    value = round((sbu_value * total_commercial_days) / 360, 2)
    
    return {
        "value": value,
        "region": region,
        "sbu_value": sbu_value,
        "period_start": actual_start.strftime("%d/%m/%Y"),
        "period_end": d_exit.strftime("%d/%m/%Y"),
        "commercial_days": total_commercial_days,
        "formula": f"(${sbu_value:.2f} SBU × {total_commercial_days} días) / 360 días = ${value:.2f}",
        "legal_basis": f"Artículo 113 del Código del Trabajo (Décima Cuarta Remuneración - Acumulada - Región {region})"
    }

def calculate_vacation_settlement(hire_date_str: str, exit_date_str: str, monthly_salary: float, pending_days: float = None):
    """
    Art. 69 y 71 Código del Trabajo:
    15 días por cada año trabajado.
    A partir del 5to año: 1 día adicional por cada año excedente.
    Valor día = Salario mensual / 30.
    """
    st = calculate_service_time(hire_date_str, exit_date_str)
    full_years = st["full_years"]
    
    # Días anuales base
    annual_days = 15.0
    if full_years > 5:
        annual_days += (full_years - 5)
        
    daily_rate = round(monthly_salary / 30.0, 4)
    
    if pending_days is None:
        # Calcular proporcional del último período no gozado
        # Si no se indica, tomamos la fracción del último año
        days_fraction = st["total_days"] - (full_years * 365)
        pending_days = round((annual_days * max(0, days_fraction)) / 365.0, 2)
        
    value = round(pending_days * (monthly_salary / 30.0), 2)
    
    return {
        "pending_days": pending_days,
        "daily_rate": round(daily_rate, 2),
        "value": value,
        "formula": f"{pending_days:.2f} días × (${monthly_salary:.2f} / 30) = ${value:.2f}",
        "legal_basis": "Artículos 69 y 71 del Código del Trabajo (Vacaciones Anuales y Liquidación)"
    }

def calculate_desahucio_bonus(monthly_salary: float, full_years: int):
    """
    Art. 185 Código del Trabajo:
    25% de la última remuneración mensual por cada uno de los años de servicio cumplidos.
    """
    rate = 0.25 * monthly_salary
    value = round(rate * full_years, 2)
    return {
        "rate_per_year": round(rate, 2),
        "full_years": full_years,
        "value": value,
        "formula": f"25% de ${monthly_salary:.2f} (${rate:.2f}) × {full_years} años cumplidos = ${value:.2f}",
        "legal_basis": "Artículo 185 del Código del Trabajo (Bonificación por Desahucio)"
    }

def calculate_untimely_dismissal(monthly_salary: float, total_years_float: float):
    """
    Art. 188 Código del Trabajo:
    Despido intempestivo:
    - Hasta 3 años: 3 meses de remuneración.
    - Más de 3 años: 1 mes de remuneración por cada año de servicio o fracción de año.
    """
    if total_years_float <= 0:
        return {"value": 0.0, "months": 0, "formula": "No aplica", "legal_basis": "Art. 188"}
    
    if total_years_float <= 3.0:
        months = 3
    else:
        months = math.ceil(total_years_float) # Fracción de año cuenta como año completo para Art. 188
        
    value = round(months * monthly_salary, 2)
    return {
        "months": months,
        "value": value,
        "formula": f"{months} meses × ${monthly_salary:.2f} = ${value:.2f}",
        "legal_basis": "Artículo 188 del Código del Trabajo (Indemnización por Despido Intempestivo)"
    }

def calculate_full_liquidation(
    hire_date_str: str,
    exit_date_str: str,
    monthly_salary: float,
    cause: str,
    contract_type: str = "Contrato Indefinido",
    region: str = "Sierra",
    sbu_value: float = 460.0,
    pending_salary_days: int = 0,
    vacation_days_pending: float = 10.0,
    thirteenth_accumulated: bool = True,
    fourteenth_accumulated: bool = True,
    reserve_fund_pending: bool = False,
    apply_desahucio_override: bool = None,
    apply_dismissal_override: bool = None,
    other_earnings_name: str = None,
    other_earnings_value: float = 0.0,
    advance_deduction_value: float = 0.0,
    loans_deduction_value: float = 0.0,
    other_deduction_name: str = None,
    other_deduction_value: float = 0.0
):
    st = calculate_service_time(hire_date_str, exit_date_str)
    
    # 1. Sueldo pendiente
    pending_salary_val = round((monthly_salary / 30.0) * pending_salary_days, 2)
    
    # 2. Vacaciones
    vacation_calc = calculate_vacation_settlement(
        hire_date_str, exit_date_str, monthly_salary, vacation_days_pending
    )
    
    # 3. Décimo Tercero
    thirteenth_calc = calculate_thirteenth_salary(hire_date_str, exit_date_str, monthly_salary, accumulated=thirteenth_accumulated)
    
    # 4. Décimo Cuarto
    fourteenth_calc = calculate_fourteenth_salary(hire_date_str, exit_date_str, sbu_value, region, accumulated=fourteenth_accumulated)
    
    # 5. Fondos de Reserva (Art. 196)
    # Si tiene más de 1 año y se marcaron pendientes en la empresa
    reserve_fund_val = 0.0
    reserve_fund_details = "Al día / Pagados mensualmente o depositados en el IESS"
    if reserve_fund_pending and st["full_years"] >= 1:
        # Se liquida el valor del último mes o proporción (8.33% de la remuneración)
        reserve_fund_val = round(monthly_salary * 0.0833, 2)
        reserve_fund_details = f"8.33% de ${monthly_salary:.2f} correspondiente al último período pendiente = ${reserve_fund_val:.2f}"
    
    # 6. Desahucio (Art. 185) y 7. Despido intempestivo (Art. 188)
    # Reglas diferenciadas según el Código del Trabajo y modalidad contractual
    cause_lower = cause.lower()
    contract_lower = (contract_type or "indefinido").lower()
    
    applies_desahucio = False
    if "desahucio" in cause_lower or "despido" in cause_lower or "acuerdo" in cause_lower:
        if "desahucio" in cause_lower or "despido" in cause_lower:
            applies_desahucio = True
            
    if apply_desahucio_override is not None:
        applies_desahucio = apply_desahucio_override
        
    applies_dismissal = "despido" in cause_lower or "intempestivo" in cause_lower
    if apply_dismissal_override is not None:
        applies_dismissal = apply_dismissal_override

    # --- REGLAS SEGÚN TIPO DE CONTRATO ---
    # A) Período de Prueba (Art. 15 C.T.): Libre terminación sin despido ni desahucio
    if "prueba" in contract_lower:
        desahucio_calc = {
            "value": 0.0,
            "formula": "No aplica: Colaborador en período de prueba (Art. 15 del Código del Trabajo)",
            "legal_basis": "Artículo 15 del Código del Trabajo",
            "full_years": 0
        }
        dismissal_calc = {
            "value": 0.0,
            "formula": "No aplica: Terminación dentro del período de prueba de 90 días sin responsabilidad indemnizatoria",
            "legal_basis": "Artículo 15 del Código del Trabajo"
        }
    # B) Contrato por Obra Cierta / Servicio Determinado (Art. 16.1 y 169 num 2 C.T.)
    elif ("obra" in contract_lower or "servicio" in contract_lower) and ("conclusión" in cause_lower or "conclusion" in cause_lower or "cumplimiento" in cause_lower):
        if applies_desahucio and st["full_years"] >= 1:
            desahucio_calc = calculate_desahucio_bonus(monthly_salary, st["full_years"])
        else:
            desahucio_calc = {
                "value": 0.0,
                "formula": "No aplica por tiempo menor a 1 año",
                "legal_basis": "Artículo 16.1 del Código del Trabajo",
                "full_years": st["full_years"]
            }
        dismissal_calc = {
            "value": 0.0,
            "formula": "No aplica: Conclusión natural de la obra o servicio contratado (Art. 169 num 2 C.T.)",
            "legal_basis": "Artículo 169 numeral 2 del Código del Trabajo"
        }
    # C) Contrato de Aprendizaje (Art. 157 C.T.)
    elif "aprendizaje" in contract_lower:
        desahucio_calc = {
            "value": 0.0,
            "formula": "No aplica a contratos de aprendizaje",
            "legal_basis": "Artículo 157 del Código del Trabajo",
            "full_years": 0
        }
        dismissal_calc = {
            "value": 0.0,
            "formula": "No aplica: Régimen especial de formación técnica (Art. 157 C.T.)",
            "legal_basis": "Artículo 157 del Código del Trabajo"
        }
    # D) Contrato Indefinido u Ordinario
    else:
        if applies_desahucio and st["full_years"] >= 1:
            desahucio_calc = calculate_desahucio_bonus(monthly_salary, st["full_years"])
        else:
            desahucio_calc = {
                "value": 0.0,
                "formula": "No aplica para esta causa o tiempo de servicio menor a 1 año",
                "legal_basis": "Artículo 185 del Código del Trabajo",
                "full_years": st["full_years"]
            }
            
        if applies_dismissal:
            dismissal_calc = calculate_untimely_dismissal(monthly_salary, st["years_float"])
        else:
            dismissal_calc = {
                "value": 0.0,
                "formula": "No aplica (la terminación no fue por despido intempestivo unilateral)",
                "legal_basis": "Artículo 188 del Código del Trabajo"
            }
        
    # Totales
    total_earnings = round(
        pending_salary_val +
        vacation_calc["value"] +
        thirteenth_calc["value"] +
        fourteenth_calc["value"] +
        reserve_fund_val +
        desahucio_calc["value"] +
        dismissal_calc["value"] +
        (other_earnings_value or 0.0),
        2
    )
    
    total_deductions = round(
        (advance_deduction_value or 0.0) +
        (loans_deduction_value or 0.0) +
        (other_deduction_value or 0.0),
        2
    )
    
    net_payable = round(total_earnings - total_deductions, 2)
    
    breakdown = {
        "service_time": st,
        "haberes": {
            "sueldo_pendiente": {
                "dias": pending_salary_days,
                "valor": pending_salary_val,
                "formula": f"{pending_salary_days} días × (${monthly_salary:.2f} / 30) = ${pending_salary_val:.2f}",
                "base_legal": "Art. 82 Código del Trabajo"
            },
            "vacaciones": vacation_calc,
            "decimo_tercero": thirteenth_calc,
            "decimo_cuarto": fourteenth_calc,
            "fondos_reserva": {
                "valor": reserve_fund_val,
                "formula": reserve_fund_details,
                "base_legal": "Art. 196 Código del Trabajo"
            },
            "desahucio": desahucio_calc,
            "despido_intempestivo": dismissal_calc,
            "otros_ingresos": {
                "nombre": other_earnings_name or "N/A",
                "valor": other_earnings_value or 0.0
            }
        },
        "deducciones": {
            "anticipos": advance_deduction_value or 0.0,
            "prestamos": loans_deduction_value or 0.0,
            "otras_deducciones": {
                "nombre": other_deduction_name or "N/A",
                "valor": other_deduction_value or 0.0
            }
        },
        "totales": {
            "total_haberes": total_earnings,
            "total_deducciones": total_deductions,
            "neto_a_recibir": net_payable
        }
    }
    
    return {
        "years_worked": st["years_float"],
        "full_years": st["full_years"],
        "pending_salary_days": pending_salary_days,
        "pending_salary_value": pending_salary_val,
        "vacation_days_pending": vacation_calc["pending_days"],
        "vacation_value": vacation_calc["value"],
        "thirteenth_salary_value": thirteenth_calc["value"],
        "thirteenth_details": thirteenth_calc["formula"],
        "fourteenth_salary_value": fourteenth_calc["value"],
        "fourteenth_details": fourteenth_calc["formula"],
        "reserve_fund_value": reserve_fund_val,
        "reserve_fund_details": reserve_fund_details,
        "desahucio_bonus_value": desahucio_calc["value"],
        "desahucio_details": desahucio_calc["formula"],
        "untimely_dismissal_value": dismissal_calc["value"],
        "untimely_dismissal_details": dismissal_calc["formula"],
        "other_earnings_name": other_earnings_name,
        "other_earnings_value": other_earnings_value or 0.0,
        "advance_deduction_value": advance_deduction_value or 0.0,
        "loans_deduction_value": loans_deduction_value or 0.0,
        "other_deduction_name": other_deduction_name,
        "other_deduction_value": other_deduction_value or 0.0,
        "total_earnings": total_earnings,
        "total_deductions": total_deductions,
        "net_payable": net_payable,
        "breakdown": breakdown
    }
