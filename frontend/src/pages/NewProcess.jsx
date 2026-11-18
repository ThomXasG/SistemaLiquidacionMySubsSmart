import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck2, 
  ArrowLeft, 
  ShieldAlert, 
  Info, 
  UserCheck, 
  Calendar, 
  BookOpen,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getEmployees, createProcess } from '../api';

const TERMINATION_CAUSES = [
  {
    cause: "Desahucio solicitado por el trabajador",
    article: "Art. 169 numeral 8 y Art. 185",
    desc: "Aviso formal del trabajador con al menos 15 días de anticipación. Genera derecho a bonificación por desahucio (25% de la última remuneración mensual por cada año cumplido).",
    requiresDesahucio: true,
    requiresDismissal: false
  },
  {
    cause: "Acuerdo entre las partes",
    article: "Art. 169 numeral 1",
    desc: "Terminación consensuada por mutuo consentimiento de empleador y trabajador. Genera liquidación de haberes proporcionales.",
    requiresDesahucio: false,
    requiresDismissal: false
  },
  {
    cause: "Despido intempestivo",
    article: "Art. 188 y Art. 185",
    desc: "Terminación unilateral no justificada por el empleador. Genera indemnización por despido intempestivo (Art. 188) y bonificación por desahucio (Art. 185).",
    requiresDesahucio: true,
    requiresDismissal: true
  },
  {
    cause: "Conclusión de la obra, período de labor o servicios",
    article: "Art. 169 numeral 2",
    desc: "Cumplimiento del objeto o plazo convenido en contratos específicos (eventuales, por obra o temporada).",
    requiresDesahucio: false,
    requiresDismissal: false
  },
  {
    cause: "Muerte o incapacidad permanente del trabajador",
    article: "Art. 169 numeral 4",
    desc: "Causa sobrevenida que extingue el vínculo de trabajo sin responsabilidad indemnizatoria para la empresa.",
    requiresDesahucio: false,
    requiresDismissal: false
  },
  {
    cause: "Visto bueno concedido al empleador",
    article: "Art. 169 numeral 6 y Art. 172",
    desc: "Terminación previa resolución de la Inspectoría del Trabajo por falta grave o causales del Art. 172.",
    requiresDesahucio: false,
    requiresDismissal: false
  },
  {
    cause: "Visto bueno concedido al trabajador",
    article: "Art. 169 numeral 7 y Art. 173",
    desc: "Terminación por falta grave del empleador (Art. 173). Genera derecho a indemnizaciones equivalentes al despido intempestivo.",
    requiresDesahucio: true,
    requiresDismissal: true
  },
  {
    cause: "Caso fortuito o fuerza mayor",
    article: "Art. 169 numeral 5",
    desc: "Imposibilidad absoluta e imprevisible de continuar con las labores de la empresa.",
    requiresDesahucio: false,
    requiresDismissal: false
  }
];

export default function NewProcess() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedCauseIdx, setSelectedCauseIdx] = useState(0);

  const [formData, setFormData] = useState({
    request_date: new Date().toISOString().split('T')[0],
    effective_date: new Date().toISOString().split('T')[0],
    responsible: 'Ing. Sofía Morales (Talento Humano)',
    description: ''
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data);
      if (data.length > 0) {
        setSelectedEmployeeId(data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id.toString() === selectedEmployeeId);
  const selectedCauseObj = TERMINATION_CAUSES[selectedCauseIdx];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      alert("Seleccione un trabajador.");
      return;
    }

    try {
      const payload = {
        employee_id: parseInt(selectedEmployeeId),
        request_date: formData.request_date,
        effective_date: formData.effective_date,
        cause: selectedCauseObj.cause,
        legal_article: selectedCauseObj.article,
        description: formData.description || selectedCauseObj.desc,
        responsible: formData.responsible
      };

      const newProcess = await createProcess(payload);
      navigate(`/processes/${newProcess.id}`);
    } catch (err) {
      alert("Error al iniciar proceso: " + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/processes')}
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Iniciar Proceso de Terminación Laboral</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro formal conforme al Art. 169 del Código del Trabajo ecuatoriano.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Employee */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">1. Selección del Colaborador</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Colaborador Registrado
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} &bull; C.I.: {emp.national_id} &bull; {emp.position} ({emp.status})
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Cargo</span>
                <p className="font-bold text-slate-800">{selectedEmployee.position}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Departamento</span>
                <p className="font-bold text-slate-800">{selectedEmployee.department}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Fecha de Ingreso</span>
                <p className="font-bold text-slate-800">{selectedEmployee.hire_date}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Remuneración</span>
                <p className="font-bold text-blue-700 font-mono">${selectedEmployee.monthly_salary?.toFixed(2)}/mes</p>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Causa de terminación laboral */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">2. Causa Legal de Terminación (Art. 169 C.T.)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TERMINATION_CAUSES.map((item, idx) => (
              <label
                key={idx}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  selectedCauseIdx === idx
                    ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="causeRadio"
                    checked={selectedCauseIdx === idx}
                    onChange={() => setSelectedCauseIdx(idx)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.cause}</p>
                    <span className="text-[10px] text-blue-700 font-semibold">{item.article}</span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{item.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[10px] font-bold">
                  {item.requiresDesahucio ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      &check; Aplica Desahucio (Art. 185)
                    </span>
                  ) : (
                    <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      Sin Desahucio
                    </span>
                  )}
                  {item.requiresDismissal && (
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      &check; Indemnización Despido (Art. 188)
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Step 3: Fechas y Responsables */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">3. Cronología y Responsable del Trámite</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha de Notificación / Solicitud
              </label>
              <input
                type="date"
                required
                value={formData.request_date}
                onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha Efectiva de Terminación (Último Día Laborado)
              </label>
              <input
                type="date"
                required
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Responsable de Coordinación del Expediente
            </label>
            <input
              type="text"
              required
              value={formData.responsible}
              onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observaciones Iniciales del Proceso
            </label>
            <textarea
              rows="2"
              placeholder="Detalle o antecedentes de la salida del trabajador..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-blue-500" />
            <span>Al crear el expediente se generará automáticamente la lista de verificación departamental.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/processes')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aperturar Expediente</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

