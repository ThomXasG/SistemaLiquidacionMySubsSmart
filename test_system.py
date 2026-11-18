import os
import sys
import json

# Agregar backend al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from fastapi.testclient import TestClient
from backend.main import app
from backend.calculators import (
    calculate_full_liquidation,
    calculate_service_time,
    calculate_thirteenth_salary,
    calculate_fourteenth_salary,
    calculate_vacation_settlement,
    calculate_desahucio_bonus
)
from backend.schemas import validate_ecuadorian_id, validate_ecuadorian_ruc

def run_tests():
    print("=" * 70)
    print("SUITE DE PRUEBAS DEL SISTEMA DE PAZ Y SALVO Y LIQUIDACIÓN LABORAL")
    print("=" * 70)
    client = TestClient(app)

    # 1. PRUEBA DE VALIDACIONES DE CÉDULA Y RUC
    print("\n[TEST 1] Validación de Cédula y RUC Ecuatorianos:")
    assert validate_ecuadorian_id("1800000001") == True, "Fallo en cédula demo"
    assert validate_ecuadorian_id("1710034065") == True, "Fallo en cédula válida"
    assert validate_ecuadorian_id("1234567890") == False, "Fallo en rechazo de cédula inválida"
    assert validate_ecuadorian_ruc("1899999999001") == True, "Fallo en RUC demo"
    assert validate_ecuadorian_ruc("9999999999999") == False, "Fallo en rechazo de RUC inválido"
    print("  -> Algoritmo módulo 10 y validación de identificadores: APROBADO")

    # 2. PRUEBA MATEMÁTICA Y LEGAL DE LIQUIDACIÓN (CASO DEMOSTRATIVO)
    print("\n[TEST 2] Verificación Matemática de la Liquidación (Andrés Sebastián Torres):")
    calc = calculate_full_liquidation(
        hire_date_str="2023-03-01",
        exit_date_str="2026-10-31",
        monthly_salary=800.0,
        cause="Desahucio solicitado por el trabajador",
        region="Sierra",
        sbu_value=460.0,
        pending_salary_days=0,
        vacation_days_pending=10.0,
        reserve_fund_pending=False,
        advance_deduction_value=100.0,
        loans_deduction_value=0.0
    )

    print(f"  - Años completos de servicio: {calc['full_years']} años (Esperado: 3)")
    assert calc["full_years"] == 3, f"Años erróneos: {calc['full_years']}"

    print(f"  - Vacaciones no gozadas (10 días): ${calc['vacation_value']} (Esperado: $266.67)")
    assert abs(calc["vacation_value"] - 266.67) < 0.05, f"Vacaciones erróneas: {calc['vacation_value']}"

    print(f"  - Décimo tercer sueldo (11 meses): ${calc['thirteenth_salary_value']} (Esperado: $733.33)")
    assert abs(calc["thirteenth_salary_value"] - 733.33) < 0.05, f"Décimo tercero erróneo: {calc['thirteenth_salary_value']}"

    print(f"  - Décimo cuarto sueldo (Sierra, 3 meses): ${calc['fourteenth_salary_value']} (Esperado: $115.00)")
    assert abs(calc["fourteenth_salary_value"] - 115.00) < 0.05, f"Décimo cuarto erróneo: {calc['fourteenth_salary_value']}"

    print(f"  - Bonificación por desahucio (Art. 185, 3 años * $200): ${calc['desahucio_bonus_value']} (Esperado: $600.00)")
    assert abs(calc["desahucio_bonus_value"] - 600.00) < 0.05, f"Desahucio erróneo: {calc['desahucio_bonus_value']}"

    print(f"  - Total Haberes: ${calc['total_earnings']} (Esperado: $1,715.00)")
    assert abs(calc["total_earnings"] - 1715.00) < 0.05, f"Total haberes erróneo: {calc['total_earnings']}"

    print(f"  - Total Deducciones (Anticipo): ${calc['total_deductions']} (Esperado: $100.00)")
    assert abs(calc["total_deductions"] - 100.00) < 0.05, f"Total deducciones erróneo: {calc['total_deductions']}"

    print(f"  - Valor Neto a Recibir: ${calc['net_payable']} (Esperado: $1,615.00)")
    assert abs(calc["net_payable"] - 1615.00) < 0.05, f"Neto a recibir erróneo: {calc['net_payable']}"
    print("  -> Cálculos matemáticos y fórmulas del Código del Trabajo: APROBADO")

    # 3. PRUEBA DE ENDPOINTS REST API
    print("\n[TEST 3] Pruebas de Endpoints FastAPI:")
    
    # Dashboard
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200, f"Error en dashboard: {res.text}"
    stats = res.json()
    assert stats["employees"]["total"] >= 1
    assert stats["processes"]["total"] >= 1
    print("  - GET /api/dashboard/stats: OK")

    # Expediente 1
    res = client.get("/api/processes/1")
    assert res.status_code == 200, f"Error en proceso 1: {res.text}"
    proc = res.json()
    assert proc["employee"]["national_id"] == "1800000001"
    assert len(proc["clearance_requirements"]) >= 10
    print(f"  - GET /api/processes/1 (Expediente {proc['employee']['full_name']}): OK")

    # 4. PRUEBA DE REGLA DE CALIDAD DE BLOQUEO DE PAZ Y SALVO
    print("\n[TEST 4] Regla de Calidad: Bloqueo de Certificado si hay requisitos pendientes:")
    # Cambiamos un requisito a 'Pendiente' temporalmente
    first_req = proc["clearance_requirements"][0]
    res_update = client.put(f"/api/requirements/{first_req['id']}?user_name=Tester&user_role=Admin", json={"status": "Pendiente"})
    assert res_update.status_code == 200

    # Intentamos emitir paz y salvo -> Debe fallar con HTTP 400
    res_block = client.post("/api/processes/1/generate-paz-y-salvo?user_name=Tester")
    assert res_block.status_code == 400, f"Debería bloquearse con 400, devolvió {res_block.status_code}"
    assert "BLOQUEO DE EMISIÓN" in res_block.text
    print("  -> Bloqueo estricto por requisito pendiente verificado: FUNCIONA (HTTP 400 devuelto)")

    # Restauramos el requisito a 'Aprobado'
    client.put(f"/api/requirements/{first_req['id']}?user_name=Tester&user_role=Admin", json={"status": "Aprobado"})

    # Volvemos a emitir el certificado -> Ahora debe ser exitoso (HTTP 200)
    res_ok = client.post("/api/processes/1/generate-paz-y-salvo?user_name=Tester")
    assert res_ok.status_code == 200
    print("  -> Desbloqueo y generación exitosa con requisitos completos: OK")

    # 5. PRUEBA DE EXISTENCIA Y GENERACIÓN DE PDFs
    print("\n[TEST 5] Verificación de Documentos PDF Generados con ReportLab:")
    paz_pdf = os.path.join(os.path.dirname(__file__), "backend", "uploads", "certificado_paz_y_salvo_exp_1.pdf")
    liq_pdf = os.path.join(os.path.dirname(__file__), "backend", "uploads", "liquidacion_laboral_exp_1.pdf")
    
    assert os.path.exists(paz_pdf), f"No existe el PDF de paz y salvo en {paz_pdf}"
    assert os.path.getsize(paz_pdf) > 2000, f"Tamaño sospechoso: {os.path.getsize(paz_pdf)}"
    print(f"  - Certificado Paz y Salvo PDF: {os.path.basename(paz_pdf)} ({os.path.getsize(paz_pdf)} bytes) -> EXISTE Y VÁLIDO")

    assert os.path.exists(liq_pdf), f"No existe el PDF de liquidación en {liq_pdf}"
    assert os.path.getsize(liq_pdf) > 2000, f"Tamaño sospechoso: {os.path.getsize(liq_pdf)}"
    print(f"  - Acta de Liquidación PDF: {os.path.basename(liq_pdf)} ({os.path.getsize(liq_pdf)} bytes) -> EXISTE Y VÁLIDO")

    print("\n" + "=" * 70)
    print("TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE (100% OK)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()

