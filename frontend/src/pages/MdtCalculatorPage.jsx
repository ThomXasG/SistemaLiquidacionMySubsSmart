import React, { useState, useEffect } from 'react';
import { 
  Calculator, ExternalLink, Sparkles, CheckCircle2, RefreshCw, 
  HelpCircle, FileText, ArrowRight, ShieldCheck, Users, Info
} from 'lucide-react';
import { getEmployees, getProcesses, simulateMdtLiquidation, applyMdtCalculation } from '../api';
import { useRole } from '../context/RoleContext';

export default function MdtCalculatorPage() {
  const { userName } = useRole();
  const [processes, setProcesses] = useState([]);
  const [selectedProcessId, setSelectedProcessId] = useState('1'); // default case 1

  const [formData, setFormData] = useState({
    hire_date: '2023-03-01',
    exit_date: '2026-10-31',
    monthly_salary: 800.0,
    contract_type: 'Contrato Indefinido',
    cause: 'Desahucio solicitado por el trabajador',
    region: 'Sierra',
    sbu_value: 460.0,
    pending_salary_days: 0,
    vacation_days_pending: 10.0,
    thirteenth_accumulated: true,
    fourteenth_accumulated: true,
    reserve_fund_pending: false,
    advance_deduction_value: 100.0,
    loans_deduction_value: 0.0,
    other_earnings_name: '',
    other_earnings_value: 0.0,
    other_deduction_name: '',
    other_deduction_value: 0.0
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    try {
      const data = await getProcesses();
      setProcesses(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Cargar datos de un proceso cuando se selecciona
  const handleSelectProcess = (procId) => {
    setSelectedProcessId(procId);
    if (!procId) return;
    const proc = processes.find(p => p.id === parseInt(procId));
    if (proc && proc.employee) {
      setFormData({
        hire_date: proc.employee.hire_date || '2023-03-01',
        exit_date: proc.effective_date || '2026-10-31',
        monthly_salary: proc.employee.monthly_salary || 800.0,
        contract_type: proc.employee.contract_type || 'Contrato Indefinido',
        cause: proc.cause || 'Desahucio solicitado por el trabajador',
        region: proc.employee.company?.region || 'Sierra',
        sbu_value: 460.0,
        pending_salary_days: 0,
        vacation_days_pending: 10.0,
        thirteenth_accumulated: true,
        fourteenth_accumulated: true,
        reserve_fund_pending: false,
        advance_deduction_value: 100.0,
        loans_deduction_value: 0.0,
        other_earnings_name: '',
        other_earnings_value: 0.0,
        other_deduction_name: '',
        other_deduction_value: 0.0
      });
    }
  };

  useEffect(() => {
    runSimulation();
  }, [
    formData.hire_date,
    formData.exit_date,
    formData.monthly_salary,
    formData.contract_type,
    formData.cause,
    formData.region,
    formData.sbu_value,
    formData.pending_salary_days,
    formData.vacation_days_pending,
    formData.thirteenth_accumulated,
    formData.fourteenth_accumulated,
    formData.reserve_fund_pending,
    formData.advance_deduction_value,
    formData.loans_deduction_value
  ]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await simulateMdtLiquidation({
        ...formData,
        monthly_salary: parseFloat(formData.monthly_salary) || 0,
        sbu_value: parseFloat(formData.sbu_value) || 460.0,
        pending_salary_days: parseInt(formData.pending_salary_days) || 0,
        vacation_days_pending: parseFloat(formData.vacation_days_pending) || 0,
        advance_deduction_value: parseFloat(formData.advance_deduction_value) || 0,
        loans_deduction_value: parseFloat(formData.loans_deduction_value) || 0,
        other_earnings_value: parseFloat(formData.other_earnings_value) || 0,
        other_deduction_value: parseFloat(formData.other_deduction_value) || 0
      });
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedProcessId) {
      alert("Por favor seleccione un expediente activo para aplicar la liquidación.");
      return;
    }
    if (!window.confirm("¿Desea aplicar los valores de esta simulación al expediente seleccionado y regenerar sus PDFs?")) {
      return;
    }
    setApplying(true);
    try {
      const res = await applyMdtCalculation(selectedProcessId, {
        ...formData,
        monthly_salary: parseFloat(formData.monthly_salary) || 0,
        sbu_value: parseFloat(formData.sbu_value) || 460.0,
        pending_salary_days: parseInt(formData.pending_salary_days) || 0,
        vacation_days_pending: parseFloat(formData.vacation_days_pending) || 0,
        advance_deduction_value: parseFloat(formData.advance_deduction_value) || 0,
        loans_deduction_value: parseFloat(formData.loans_deduction_value) || 0,
        other_earnings_value: parseFloat(formData.other_earnings_value) || 0,
        other_deduction_value: parseFloat(formData.other_deduction_value) || 0
      }, userName);

      alert("✅ " + res.message);
    } catch (err) {
      alert("Error al aplicar al expediente: " + err.message);
    } finally {
      setApplying(false);
    }
  };

  const calc = simulationResult?.calculation;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Homologación Oficial
              </span>
              <span className="text-xs text-blue-200">
                Código del Trabajo del Ecuador
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Calculadora de Liquidaciones (Ministerio del Trabajo)
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
              Módulo interactivo basado en las reglas del simulador oficial <b>calculadoras.trabajo.gob.ec/liquidaciones</b>. Permite calcular haberes, indemnizaciones y deducciones, y sincronizar los resultados directamente con los expedientes y reportes PDF de la empresa.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <a
              href="https://calculadoras.trabajo.gob.ec/liquidaciones"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-blue-50 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Abrir portal oficial MDT</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            </a>
            <p className="text-[10px] text-blue-300 text-center">
              Apertura en nueva pestaña para contrastar
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Expediente */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">Vincular Simulación con un Expediente</p>
            <p className="text-[11px] text-slate-500">Seleccione un colaborador para precargar sus fechas y salario:</p>
          </div>
        </div>

        <select
          value={selectedProcessId}
          onChange={(e) => handleSelectProcess(e.target.value)}
          className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer min-w-[280px]"
        >
          <option value="">-- Simulación Libre (Sin vincular) --</option>
          {processes.map(p => (
            <option key={p.id} value={p.id}>
              EXP-{p.id.toString().padStart(4, '0')}: {p.employee?.first_name} {p.employee?.last_name} (${p.employee?.monthly_salary?.toFixed(2)}/mes)
            </option>
          ))}
        </select>
      </div>

      {/* Main Grid: Formulario vs Resultados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Formulario de Parámetros (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Parámetros del Cálculo (MDT)</span>
            </h3>
            <button
              onClick={runSimulation}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Recalcular</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipo de Contrato Laboral (Código del Trabajo)
            </label>
            <select
              value={formData.contract_type}
              onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Contrato Indefinido">Contrato Indefinido (Art. 14 C.T.)</option>
              <option value="Contrato a Prueba">Contrato a Prueba (hasta 90 días - Art. 15 C.T.)</option>
              <option value="Contrato por Obra Cierta">Contrato por Obra Cierta / Servicio Determinado</option>
              <option value="Contrato Eventual">Contrato Eventual o de Temporada</option>
              <option value="Contrato de Aprendizaje">Contrato de Aprendizaje (Art. 157 C.T.)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Causal de Salida (Art. 169 C.T.)
            </label>
            <select
              value={formData.cause}
              onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="Desahucio solicitado por el trabajador">Desahucio solicitado por el trabajador (Art. 185 - Bonificación 25%)</option>
              <option value="Despido intempestivo unilateral">Despido intempestivo unilateral (Art. 188 - Indemnización + Desahucio)</option>
              <option value="Acuerdo entre las partes">Acuerdo entre las partes (Renuncia voluntaria / Mutuo acuerdo)</option>
              <option value="Conclusión de la obra o período de labor">Conclusión de la obra o contrato por tarea</option>
              <option value="Visto bueno otorgado al empleador">Visto bueno otorgado al empleador (Art. 172)</option>
              <option value="Visto bueno solicitado por el trabajador">Visto bueno solicitado por el trabajador (Art. 173)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Región Laboral</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Sierra">Sierra y Amazonía</option>
                <option value="Costa">Costa e Insular</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remuneración Mensual ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monthly_salary}
                onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Ingreso</label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Salida</label>
              <input
                type="date"
                value={formData.exit_date}
                onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
              />
            </div>
          </div>

          {/* Modalidad de Décimos SUT */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-700 uppercase">Modalidad de Beneficios Sociales (SUT / MDT):</p>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Décimo Tercero (Navideño):</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, thirteenth_accumulated: true })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${formData.thirteenth_accumulated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  Acumulado
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, thirteenth_accumulated: false })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${!formData.thirteenth_accumulated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  Mensualizado
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Décimo Cuarto (Escolar):</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, fourteenth_accumulated: true })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${formData.fourteenth_accumulated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  Acumulado
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, fourteenth_accumulated: false })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${!formData.fourteenth_accumulated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  Mensualizado
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-600 font-medium">Fondos de Reserva:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, reserve_fund_pending: true })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${formData.reserve_fund_pending ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  Pendiente
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, reserve_fund_pending: false })}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${!formData.reserve_fund_pending ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                >
                  Al día en IESS
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Días Vacaciones Pendientes</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.vacation_days_pending}
                onChange={(e) => setFormData({ ...formData, vacation_days_pending: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Días Sueldo Último Mes</label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.pending_salary_days}
                onChange={(e) => setFormData({ ...formData, pending_salary_days: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Anticipos de Sueldo ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.advance_deduction_value}
                onChange={(e) => setFormData({ ...formData, advance_deduction_value: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Préstamos Pendientes ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.loans_deduction_value}
                onChange={(e) => setFormData({ ...formData, loans_deduction_value: e.target.value })}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-red-600"
              />
            </div>
          </div>
        </div>

        {/* Resultados del Cálculo (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* KPI Cards */}
          {calc && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-emerald-600">Total Haberes</p>
                <h3 className="text-xl font-black text-emerald-700 mt-1">
                  ${calc.total_earnings?.toFixed(2)} USD
                </h3>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-red-600">Deducciones</p>
                <h3 className="text-xl font-black text-red-700 mt-1">
                  -${calc.total_deductions?.toFixed(2)} USD
                </h3>
              </div>

              <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white shadow-md">
                <p className="text-[10px] font-bold uppercase text-blue-200">Neto a Liquidar</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  ${calc.net_payable?.toFixed(2)} USD
                </h3>
              </div>
            </div>
          )}

          {/* Tabla Desglose */}
          {calc && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
              <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Desglose Individual de Rubros y Base Legal
                  </h4>
                  <p className="text-xs text-slate-500">
                    Valores calculados conforme a la normativa vigente
                  </p>
                </div>
                {simulationResult?.service_time && (
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {simulationResult.service_time.full_years} años cumplidos
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {calc.pending_salary_days > 0 && (
                  <div className="p-3 px-5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Sueldo Días Laborados (Art. 82)</p>
                      <p className="text-[11px] text-slate-500">{calc.pending_salary_days} días del mes en curso</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">${calc.pending_salary_value?.toFixed(2)}</span>
                  </div>
                )}

                <div className="p-3 px-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Vacaciones No Gozadas (Arts. 69 y 71)</p>
                    <p className="text-[11px] text-slate-500">{calc.vacation_days_pending} días a razón de ${(parseFloat(formData.monthly_salary) / 30).toFixed(2)}/día</p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">${calc.vacation_value?.toFixed(2)}</span>
                </div>

                <div className="p-3 px-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Décima Tercera Remuneración (Art. 111)</p>
                    <p className="text-[11px] text-slate-500">{calc.thirteenth_details}</p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">${calc.thirteenth_salary_value?.toFixed(2)}</span>
                </div>

                <div className="p-3 px-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Décima Cuarta Remuneración (Art. 113 - {formData.region})</p>
                    <p className="text-[11px] text-slate-500">{calc.fourteenth_details}</p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">${calc.fourteenth_salary_value?.toFixed(2)}</span>
                </div>

                <div className="p-3 px-5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Fondos de Reserva (Art. 196)</p>
                    <p className="text-[11px] text-slate-500">{calc.reserve_fund_details}</p>
                  </div>
                  <span className="font-mono font-bold text-slate-800">${calc.reserve_fund_value?.toFixed(2)}</span>
                </div>

                <div className="p-3 px-5 flex items-center justify-between bg-blue-50/50">
                  <div>
                    <p className="font-bold text-blue-900">Bonificación por Desahucio (Art. 185)</p>
                    <p className="text-[11px] text-blue-700">{calc.desahucio_details}</p>
                  </div>
                  <span className="font-mono font-bold text-blue-900">${calc.desahucio_bonus_value?.toFixed(2)}</span>
                </div>

                {calc.untimely_dismissal_value > 0 ? (
                  <div className="p-3 px-5 flex items-center justify-between bg-purple-50/50">
                    <div>
                      <p className="font-bold text-purple-900">Indemnización Despido Intempestivo (Art. 188)</p>
                      <p className="text-[11px] text-purple-700">{calc.untimely_dismissal_details}</p>
                    </div>
                    <span className="font-mono font-bold text-purple-900">${calc.untimely_dismissal_value?.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="p-3 px-5 flex items-center justify-between text-slate-400">
                    <div>
                      <p className="font-medium">Indemnización Despido Intempestivo (Art. 188)</p>
                      <p className="text-[11px] italic">No aplica</p>
                    </div>
                    <span className="font-mono">$0.00</span>
                  </div>
                )}

                {calc.total_deductions > 0 && (
                  <div className="p-3 px-5 flex items-center justify-between bg-red-50/50">
                    <div>
                      <p className="font-bold text-red-900">Deducciones Autorizadas (Anticipos)</p>
                      <p className="text-[11px] text-red-700">Retención de haberes pendientes</p>
                    </div>
                    <span className="font-mono font-bold text-red-700">-${calc.total_deductions?.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botón de Sincronización */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-xs font-bold text-slate-800">Sincronización con Expediente y Reportes</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Al aplicar estos valores, se actualizará la base de datos del expediente seleccionado (EXP-{selectedProcessId || '0001'}) y se regenerará de inmediato el <b>Acta de Liquidación en PDF</b> y el <b>Expediente Consolidado de Paz y Salvo</b>.
            </p>
            <button
              onClick={handleApply}
              disabled={applying || !selectedProcessId}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {applying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sincronizando y emitiendo documentos PDF...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Aplicar al Expediente y Regenerar Reportes PDF Oficiales</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
