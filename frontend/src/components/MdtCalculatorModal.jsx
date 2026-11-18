import React, { useState, useEffect } from 'react';
import { 
  Calculator, ExternalLink, CheckCircle2, AlertCircle, RefreshCw, 
  HelpCircle, Sparkles, FileText, ArrowRight, X, ShieldAlert 
} from 'lucide-react';
import { simulateMdtLiquidation, applyMdtCalculation } from '../api';

export default function MdtCalculatorModal({ 
  isOpen, 
  onClose, 
  processData, 
  onSuccessApply, 
  userName = 'Administrador' 
}) {
  if (!isOpen) return null;

  const employee = processData?.employee;
  const initialHireDate = employee?.hire_date || '2023-03-01';
  const initialExitDate = processData?.effective_date || '2026-10-31';
  const initialSalary = employee?.monthly_salary || 800.0;
  const initialCause = processData?.cause || 'Desahucio solicitado por el trabajador';
  const initialRegion = employee?.company?.region || 'Sierra';
  const initialVacationDays = processData?.vacation_record?.days_pending ?? 10.0;

  const [formData, setFormData] = useState({
    hire_date: initialHireDate,
    exit_date: initialExitDate,
    monthly_salary: initialSalary,
    cause: initialCause,
    region: initialRegion,
    sbu_value: 460.0,
    pending_salary_days: 0,
    vacation_days_pending: initialVacationDays,
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
  const [error, setError] = useState(null);

  // Ejecutar simulación automática al abrir o al cambiar parámetros
  useEffect(() => {
    runSimulation();
  }, [
    formData.hire_date,
    formData.exit_date,
    formData.monthly_salary,
    formData.cause,
    formData.region,
    formData.sbu_value,
    formData.pending_salary_days,
    formData.vacation_days_pending,
    formData.thirteenth_accumulated,
    formData.fourteenth_accumulated,
    formData.reserve_fund_pending,
    formData.advance_deduction_value,
    formData.loans_deduction_value,
    formData.other_earnings_value,
    formData.other_deduction_value
  ]);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
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
      setError(err.message || 'Error al ejecutar simulación.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToProcess = async () => {
    if (!processData?.id) return;
    if (!window.confirm("¿Está seguro de aplicar estos valores calculados al expediente y regenerar los reportes PDF oficiales?")) {
      return;
    }
    setApplying(true);
    try {
      const res = await applyMdtCalculation(processData.id, {
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
      if (onSuccessApply) {
        onSuccessApply(res);
      }
      onClose();
    } catch (err) {
      alert("Error al aplicar al expediente: " + err.message);
    } finally {
      setApplying(false);
    }
  };

  const calc = simulationResult?.calculation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Calculadora Oficial de Liquidaciones (MDT Ecuador)
                </h3>
                <span className="text-[10px] font-bold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  Homologada
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Modelo idéntico al motor del Ministerio del Trabajo (Artículos 69, 71, 111, 113, 185 y 188 C.T.)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href="https://calculadoras.trabajo.gob.ec/liquidaciones" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
              title="Abrir portal web oficial del Ministerio del Trabajo"
            >
              <span>Abrir portal oficial MDT</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Banner Informativo sobre API / Conexión Externa */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>Información Técnica:</b> El portal gubernamental <i>calculadoras.trabajo.gob.ec</i> no dispone de API pública para terceros. Por ello, el sistema integra la réplica oficial exacta para calcular localmente con 100% de disponibilidad y sincronización directa a los reportes PDF.
            </span>
          </div>
        </div>

        {/* Contenido en 2 columnas */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          
          {/* Columna Izquierda: Parámetros Oficiales MDT (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Parámetros de Entrada (MDT)
              </h4>
              <button 
                onClick={runSimulation}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Recalcular</span>
              </button>
            </div>

            {/* Causal de salida */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Causal de Terminación (Art. 169 C.T.)
              </label>
              <select
                value={formData.cause}
                onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="Desahucio solicitado por el trabajador">Desahucio solicitado por el trabajador (Art. 185)</option>
                <option value="Despido intempestivo unilateral">Despido intempestivo del empleador (Art. 188)</option>
                <option value="Acuerdo entre las partes">Acuerdo entre las partes (Renuncia voluntaria / Mutuo acuerdo)</option>
                <option value="Conclusión de la obra o período de labor">Conclusión de la obra o plazo pactado</option>
                <option value="Visto bueno otorgado al empleador">Visto bueno otorgado al empleador (Art. 172)</option>
                <option value="Visto bueno solicitado por el trabajador">Visto bueno solicitado por el trabajador (Art. 173)</option>
              </select>
            </div>

            {/* Región y Sueldo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Región Laboral</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Sierra">Sierra y Amazonía</option>
                  <option value="Costa">Costa e Insular</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Remuneración ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthly_salary}
                  onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                />
              </div>
            </div>

            {/* Fechas de inicio y fin */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de Ingreso</label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha de Salida</label>
                <input
                  type="date"
                  value={formData.exit_date}
                  onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>
            </div>

            {/* Opciones de Décimos (Acumulado vs Mensualizado como en MDT) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <p className="text-[11px] font-bold text-slate-700 uppercase">Modalidad de Beneficios Sociales (MDT):</p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Décimo Tercer Sueldo (Navideño):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thirteenth_accumulated: true })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${formData.thirteenth_accumulated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    Acumula
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, thirteenth_accumulated: false })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${!formData.thirteenth_accumulated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    Mensualiza
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Décimo Cuarto Sueldo (Escolar):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fourteenth_accumulated: true })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${formData.fourteenth_accumulated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    Acumula
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, fourteenth_accumulated: false })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${!formData.fourteenth_accumulated ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    Mensualiza
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Fondos de Reserva Pendientes:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, reserve_fund_pending: true })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${formData.reserve_fund_pending ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    Pendiente
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, reserve_fund_pending: false })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${!formData.reserve_fund_pending ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    Al día en IESS
                  </button>
                </div>
              </div>
            </div>

            {/* Vacaciones y Días pendientes de sueldo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Días Vacaciones Pendientes</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.vacation_days_pending}
                  onChange={(e) => setFormData({ ...formData, vacation_days_pending: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Días Sueldo Último Mes</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.pending_salary_days}
                  onChange={(e) => setFormData({ ...formData, pending_salary_days: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                />
              </div>
            </div>

            {/* Deducciones */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Anticipos de Sueldo ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.advance_deduction_value}
                  onChange={(e) => setFormData({ ...formData, advance_deduction_value: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-red-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Préstamos Pendientes ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.loans_deduction_value}
                  onChange={(e) => setFormData({ ...formData, loans_deduction_value: e.target.value })}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-red-600"
                />
              </div>
            </div>

          </div>

          {/* Columna Derecha: Resultados y Desglose Homologado (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Header de resultados */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Desglose Homologado Oficial
                </h4>
              </div>
              {simulationResult?.service_time && (
                <span className="text-[11px] font-bold text-slate-500">
                  Antigüedad: {simulationResult.service_time.full_years} años ({simulationResult.service_time.total_days} días)
                </span>
              )}
            </div>

            {/* Resumen Totales KPI */}
            {calc && (
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Total Haberes</p>
                  <p className="text-lg font-black text-emerald-800 mt-0.5">
                    ${calc.total_earnings?.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200">
                  <p className="text-[10px] font-bold uppercase text-red-700">Deducciones</p>
                  <p className="text-lg font-black text-red-800 mt-0.5">
                    -${calc.total_deductions?.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-900 text-white shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-blue-200">Neto a Liquidar</p>
                  <p className="text-xl font-black text-white mt-0.5">
                    ${calc.net_payable?.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Tabla detallada de rubros calculados */}
            {calc && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 px-3.5 py-2 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  Rubros que integran el Acta de Finiquito MDT:
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  
                  {/* Sueldo pendiente */}
                  {calc.pending_salary_days > 0 && (
                    <div className="p-2.5 px-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Sueldo por Días Trabajados</p>
                        <p className="text-[10px] text-slate-500">{calc.pending_salary_days} días en mes de salida (Art. 82 C.T.)</p>
                      </div>
                      <span className="font-mono font-bold text-slate-800">${calc.pending_salary_value?.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Vacaciones no gozadas */}
                  <div className="p-2.5 px-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Vacaciones No Gozadas (Arts. 69 y 71)</p>
                      <p className="text-[10px] text-slate-500">{calc.vacation_days_pending} días pendientes a base diaria de ${(parseFloat(formData.monthly_salary) / 30).toFixed(2)}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">${calc.vacation_value?.toFixed(2)}</span>
                  </div>

                  {/* Décimo Tercer Sueldo */}
                  <div className="p-2.5 px-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Décima Tercera Remuneración (Art. 111)</p>
                      <p className="text-[10px] text-slate-500">{calc.thirteenth_details || 'Proporcional navideño'}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">${calc.thirteenth_salary_value?.toFixed(2)}</span>
                  </div>

                  {/* Décimo Cuarto Sueldo */}
                  <div className="p-2.5 px-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Décima Cuarta Remuneración (Art. 113 - {formData.region})</p>
                      <p className="text-[10px] text-slate-500">{calc.fourteenth_details || 'Proporcional escolar'}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">${calc.fourteenth_salary_value?.toFixed(2)}</span>
                  </div>

                  {/* Fondos de reserva */}
                  <div className="p-2.5 px-3.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Fondos de Reserva (Art. 196)</p>
                      <p className="text-[10px] text-slate-500">{calc.reserve_fund_details || 'Al día'}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">${calc.reserve_fund_value?.toFixed(2)}</span>
                  </div>

                  {/* Bonificación por desahucio */}
                  <div className="p-2.5 px-3.5 flex items-center justify-between bg-blue-50/40">
                    <div>
                      <p className="font-bold text-blue-900">Bonificación por Desahucio (Art. 185)</p>
                      <p className="text-[10px] text-blue-700">{calc.desahucio_details}</p>
                    </div>
                    <span className="font-mono font-bold text-blue-900">${calc.desahucio_bonus_value?.toFixed(2)}</span>
                  </div>

                  {/* Despido intempestivo */}
                  {calc.untimely_dismissal_value > 0 ? (
                    <div className="p-2.5 px-3.5 flex items-center justify-between bg-purple-50/40">
                      <div>
                        <p className="font-bold text-purple-900">Indemnización por Despido Intempestivo (Art. 188)</p>
                        <p className="text-[10px] text-purple-700">{calc.untimely_dismissal_details}</p>
                      </div>
                      <span className="font-mono font-bold text-purple-900">${calc.untimely_dismissal_value?.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 px-3.5 flex items-center justify-between text-slate-400">
                      <div>
                        <p className="font-medium">Indemnización por Despido Intempestivo (Art. 188)</p>
                        <p className="text-[10px] italic">No aplica para la causal seleccionada</p>
                      </div>
                      <span className="font-mono">$0.00</span>
                    </div>
                  )}

                  {/* Deducciones aplicables */}
                  {calc.total_deductions > 0 && (
                    <div className="p-2.5 px-3.5 flex items-center justify-between bg-red-50/40">
                      <div>
                        <p className="font-bold text-red-900">Deducciones Autorizadas (Anticipos / Préstamos)</p>
                        <p className="text-[10px] text-red-700">Valores a retener del finiquito</p>
                      </div>
                      <span className="font-mono font-bold text-red-700">-${calc.total_deductions?.toFixed(2)}</span>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Botón de Sincronización y Actualización de Reportes */}
            <div className="pt-2">
              <button
                onClick={handleApplyToProcess}
                disabled={applying || loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {applying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sincronizando y regenerando documentos PDF...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aplicar al Expediente y Regenerar Reportes PDF Oficiales</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-1.5">
                Esta acción actualiza la liquidación en la base de datos y recrea automáticamente el PDF de liquidación y el Paz y Salvo consolidado.
              </p>
            </div>

          </div>

        </div>

        {/* Footer Modal */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Colaborador: <b>{employee?.first_name} {employee?.last_name}</b> (C.I. {employee?.national_id})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
}
