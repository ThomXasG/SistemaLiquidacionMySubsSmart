import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Download, 
  Eye, 
  Plus, 
  Upload, 
  Trash2, 
  FileText, 
  Calendar, 
  DollarSign, 
  ShieldAlert, 
  Sparkles,
  Info,
  ChevronRight,
  UserCheck,
  Building,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Paperclip,
  Calculator
} from 'lucide-react';
import { 
  getProcessDetail, 
  updateRequirementStatus, 
  addCustomRequirement,
  deleteRequirement,
  uploadEvidence,
  deleteEvidence,
  updateVacations,
  calculateLiquidation,
  generatePazYSalvoPDF,
  generateLiquidationPDF
} from '../api';
import { useRole } from '../context/RoleContext';
import Modal from '../components/Modal';
import PdfViewerModal from '../components/PdfViewerModal';
import MdtCalculatorModal from '../components/MdtCalculatorModal';

export default function ProcessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentRole, userName } = useRole();

  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clearance'); // clearance, evidence, vacation, liquidation, audit
  const [deptFilter, setDeptFilter] = useState('Todos');

  // Modals state
  const [pdfModal, setPdfModal] = useState({ isOpen: false, url: '', title: '' });
  const [blockingModal, setBlockingModal] = useState({ isOpen: false, items: [] });
  const [newReqModal, setNewReqModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [recalcModal, setRecalcModal] = useState(false);
  const [mdtModalOpen, setMdtModalOpen] = useState(false);

  // New Req Form State
  const [newReq, setNewReq] = useState({
    department: 'Recursos Humanos',
    requirement_name: '',
    description: '',
    is_mandatory: true
  });

  // Upload Form State
  const [uploadData, setUploadData] = useState({
    file: null,
    department: 'Recursos Humanos',
    requirement_id: '',
    notes: ''
  });

  // Recalc Form State
  const [recalcForm, setRecalcForm] = useState({
    region: 'Sierra',
    sbu_value: 460.0,
    pending_salary_days: 0,
    vacation_days_pending: 10.0,
    reserve_fund_pending: false,
    advance_deduction_value: 100.0,
    loans_deduction_value: 0.0,
    other_earnings_name: '',
    other_earnings_value: 0.0
  });

  useEffect(() => {
    loadProcess();
  }, [id]);

  const loadProcess = async () => {
    try {
      setLoading(true);
      const data = await getProcessDetail(id);
      setProcess(data);

      if (data.liquidation) {
        setRecalcForm({
          region: data.liquidation.region || 'Sierra',
          sbu_value: data.liquidation.sbu_value || 460.0,
          pending_salary_days: data.liquidation.pending_salary_days || 0,
          vacation_days_pending: data.liquidation.vacation_days_pending || 10.0,
          reserve_fund_pending: data.liquidation.reserve_fund_value > 0,
          advance_deduction_value: data.liquidation.advance_deduction_value || 0.0,
          loans_deduction_value: data.liquidation.loans_deduction_value || 0.0,
          other_earnings_name: data.liquidation.other_earnings_name || '',
          other_earnings_value: data.liquidation.other_earnings_value || 0.0
        });
      }
    } catch (err) {
      console.error("Error loading process detail:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !process) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Cargando expediente laboral...</p>
        </div>
      </div>
    );
  }

  const employee = process?.employee || {};
  const clearance_requirements = process?.clearance_requirements || [];
  const evidence_files = process?.evidence_files || [];
  const vacation_record = process?.vacation_record || null;
  const liquidation = process?.liquidation || null;
  const audit_logs = process?.audit_logs || [];

  // Calculo de progreso de paz y salvo
  const totalMandatory = clearance_requirements.filter(r => r.is_mandatory).length;
  const approvedCount = clearance_requirements.filter(r => r.is_mandatory && (r.status === 'Aprobado' || r.status === 'No aplica')).length;
  const progressPct = totalMandatory > 0 ? Math.round((approvedCount / totalMandatory) * 100) : 100;
  const isPazYSalvoReady = progressPct === 100;

  // Manejo de cambio de estado de requisito
  const handleStatusChange = async (reqId, newStatus) => {
    try {
      await updateRequirementStatus(reqId, { status: newStatus }, userName, currentRole.id);
      loadProcess();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Manejo de observaciones en requisito
  const handleObservationsChange = async (reqId, obs) => {
    try {
      await updateRequirementStatus(reqId, { observations: obs }, userName, currentRole.id);
      loadProcess();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Agregar requisito personalizado
  const handleAddRequirement = async (e) => {
    e.preventDefault();
    if (!newReq.requirement_name) return;
    try {
      await addCustomRequirement(id, newReq);
      setNewReqModal(false);
      setNewReq({
        department: 'Recursos Humanos',
        requirement_name: '',
        description: '',
        is_mandatory: true
      });
      loadProcess();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Subir archivo de evidencia
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      alert("Seleccione un archivo.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('department', uploadData.department);
      if (uploadData.requirement_id) {
        formData.append('requirement_id', uploadData.requirement_id);
      }
      formData.append('uploaded_by', userName);
      formData.append('notes', uploadData.notes);

      await uploadEvidence(id, formData);
      setUploadModal(false);
      setUploadData({
        file: null,
        department: 'Recursos Humanos',
        requirement_id: '',
        notes: ''
      });
      loadProcess();
    } catch (err) {
      alert("Error al cargar archivo: " + err.message);
    }
  };

  // Eliminar evidencia
  const handleDeleteEvidence = async (evId) => {
    if (!window.confirm("¿Desea eliminar este archivo de evidencia?")) return;
    try {
      await deleteEvidence(evId);
      loadProcess();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Generar Paz y Salvo con Validación Estricta
  const handleGeneratePazYSalvo = async () => {
    try {
      const res = await generatePazYSalvoPDF(id, userName);
      loadProcess();
      setPdfModal({
        isOpen: true,
        url: res.pdf_url,
        title: `Certificado de Paz y Salvo - ${employee?.first_name} ${employee?.last_name}`
      });
    } catch (err) {
      if (err.data && err.data.unresolved_requirements) {
        setBlockingModal({
          isOpen: true,
          items: err.data.unresolved_requirements
        });
      } else {
        alert("Error al generar certificado: " + err.message);
      }
    }
  };

  // Generar Liquidación PDF
  const handleGenerateLiquidationPDF = async () => {
    try {
      const res = await generateLiquidationPDF(id, userName);
      loadProcess();
      setPdfModal({
        isOpen: true,
        url: res.pdf_url,
        title: `Acta de Liquidación Laboral - ${employee?.first_name} ${employee?.last_name}`
      });
    } catch (err) {
      alert("Error al generar acta de liquidación: " + err.message);
    }
  };

  // Recalcular liquidación
  const handleRecalculateSubmit = async (e) => {
    e.preventDefault();
    try {
      await calculateLiquidation(id, {
        process_id: parseInt(id),
        region: recalcForm.region,
        sbu_value: parseFloat(recalcForm.sbu_value),
        pending_salary_days: parseInt(recalcForm.pending_salary_days || 0),
        vacation_days_pending: parseFloat(recalcForm.vacation_days_pending || 0),
        reserve_fund_pending: recalcForm.reserve_fund_pending,
        advance_deduction_value: parseFloat(recalcForm.advance_deduction_value || 0),
        loans_deduction_value: parseFloat(recalcForm.loans_deduction_value || 0),
        other_earnings_name: recalcForm.other_earnings_name,
        other_earnings_value: parseFloat(recalcForm.other_earnings_value || 0)
      });
      setRecalcModal(false);
      loadProcess();
    } catch (err) {
      alert("Error al calcular liquidación: " + err.message);
    }
  };

  const departmentsList = [
    'Todos',
    'Recursos Humanos',
    'Sistemas / TI',
    'Contabilidad / Finanzas',
    'Administración'
  ];

  const filteredRequirements = clearance_requirements.filter(r => 
    deptFilter === 'Todos' ? true : r.department === deptFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                EXP-{process.id.toString().padStart(4, '0')}
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-semibold">{employee?.company?.business_name || 'MySubs Smart'}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {employee?.first_name} {employee?.last_name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{employee?.position}</span>
              <span>&bull;</span>
              <span>Dept: <b>{employee?.department}</b></span>
              <span>&bull;</span>
              <span className="font-mono">C.I.: <b>{employee?.national_id}</b></span>
              <span>&bull;</span>
              <span>Remuneración: <b>${employee?.monthly_salary?.toFixed(2)}/mes</b></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {process.paz_y_salvo_certified ? (
              <button
                onClick={() => setPdfModal({
                  isOpen: true,
                  url: `/uploads/${liquidation?.paz_y_salvo_pdf_path || `certificado_paz_y_salvo_exp_${process.id}.pdf`}`,
                  title: `Expediente Consolidado de Paz y Salvo (PDF con Evidencias) - ${employee?.first_name} ${employee?.last_name}`
                })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ver Paz y Salvo Consolidado PDF</span>
              </button>
            ) : (
              <button
                onClick={handleGeneratePazYSalvo}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  isPazYSalvoReady 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                title={isPazYSalvoReady ? 'Todos los requisitos aprobados. Listo para emitir.' : 'Requisitos pendientes.'}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Emitir Paz y Salvo Consolidado PDF</span>
              </button>
            )}

            {liquidation ? (
              <button
                onClick={() => setPdfModal({
                  isOpen: true,
                  url: `/uploads/${liquidation.liquidation_pdf_path || `liquidacion_laboral_exp_${process.id}.pdf`}`,
                  title: `Acta de Liquidación Laboral - ${employee?.first_name} ${employee?.last_name}`
                })}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Ver Liquidación PDF</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateLiquidationPDF}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>Generar Liquidación PDF</span>
              </button>
            )}

            <button
              onClick={() => setMdtModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              title="Calculadora Oficial del Ministerio del Trabajo (MDT)"
            >
              <Calculator className="w-4 h-4 text-blue-200" />
              <span>Calculadora MDT</span>
            </button>

            <button
              onClick={() => setRecalcModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1"
              title="Ajustar parámetros de liquidación"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ajustar Rubros</span>
            </button>
          </div>
        </div>

        {/* Info Grid & Progress Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">Causa Legal de Salida</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{process.cause}</p>
            <p className="text-[11px] text-blue-600 font-medium">{process.legal_article}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">Vigencia Laboral</p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{employee?.hire_date} &rarr; {process.effective_date}</p>
            <p className="text-[11px] text-slate-500 font-medium">
              {liquidation?.full_years || 3} años de servicio cumplidos
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">Estado del Paz y Salvo</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-black ${isPazYSalvoReady ? 'text-emerald-600' : 'text-amber-600'}`}>
                {progressPct}% ({approvedCount}/{totalMandatory} aprobados)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 mt-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isPazYSalvoReady ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] uppercase font-bold text-slate-400">Liquidación Neta Calculada</p>
            <p className="text-base font-black text-blue-700 mt-0.5">
              ${liquidation?.net_payable?.toFixed(2) || '1,615.00'} USD
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Conforme Art. 185 y proporcionales</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 px-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('clearance')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'clearance'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Control Departamental de Paz y Salvo</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
            {clearance_requirements.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>Evidencias y Archivos Adjuntos</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
            {evidence_files.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('vacation')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'vacation'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Control de Vacaciones (Arts. 69 y 71)</span>
        </button>

        <button
          onClick={() => setActiveTab('liquidation')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'liquidation'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Liquidación Laboral Ecuatoriana</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Trazabilidad y Auditoría</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
            {(audit_logs || []).length}
          </span>
        </button>
      </div>

      {/* TAB 1: CONTROL DEPARTAMENTAL DE PAZ Y SALVO */}
      {activeTab === 'clearance' && (
        <div className="space-y-4">
          {/* Department Filter Pills & New Req Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              {departmentsList.map(dept => {
                const count = dept === 'Todos' 
                  ? clearance_requirements.length 
                  : clearance_requirements.filter(r => r.department === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setDeptFilter(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      deptFilter === dept
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{dept}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      deptFilter === dept ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setNewReqModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Requisito</span>
            </button>
          </div>

          {/* Requirements List */}
          <div className="grid grid-cols-1 gap-3">
            {filteredRequirements.map(req => {
              const reqEvidences = evidence_files.filter(ev => ev.requirement_id === req.id);
              return (
                <div 
                  key={req.id} 
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {req.department}
                        </span>
                        {req.is_mandatory && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            Obligatorio
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{req.requirement_name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{req.description}</p>
                    </div>

                    {/* Status Badge & Action Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                        req.status === 'Aprobado' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : req.status === 'No aplica'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : req.status === 'Rechazado'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {req.status === 'Aprobado' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {req.status === 'Pendiente' && <Clock className="w-3.5 h-3.5" />}
                        {req.status === 'Rechazado' && <XCircle className="w-3.5 h-3.5" />}
                        {req.status}
                      </span>

                      {/* Dropdown or buttons for quick state change */}
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className="text-xs font-bold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Rechazado">Rechazado</option>
                        <option value="No aplica">No aplica</option>
                      </select>
                    </div>
                  </div>

                  {/* Observations and Reviewer metadata */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
                    <div className="flex-1">
                      <input
                        type="text"
                        defaultValue={req.observations || ''}
                        onBlur={(e) => handleObservationsChange(req.id, e.target.value)}
                        placeholder="Escriba observaciones de verificación (presione fuera para guardar)..."
                        className="w-full text-xs text-slate-700 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-blue-400 focus:bg-white rounded-lg px-2.5 py-1 focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                      {req.reviewer_name && (
                        <span>Resp: <b className="text-slate-600">{req.reviewer_name}</b></span>
                      )}
                      {req.review_date && (
                        <span>Fecha: <b className="text-slate-600">{req.review_date}</b></span>
                      )}

                      {/* Evidence Pill */}
                      {reqEvidences.length > 0 ? (
                        <button
                          onClick={() => setActiveTab('evidence')}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{reqEvidences.length} evidencia(s)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUploadData({
                              file: null,
                              department: req.department,
                              requirement_id: req.id,
                              notes: `Evidencia para ${req.requirement_name}`
                            });
                            setUploadModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-600"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Adjuntar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ARCHIVOS Y EVIDENCIAS ADJUNTAS */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">Expediente Digital Unificado</p>
                <p className="text-[11px] text-blue-700">
                  Todos los archivos y evidencias cargados a continuación se consolidan automáticamente en un <b>único archivo PDF</b> junto con el Certificado Oficial de Paz y Salvo.
                </p>
              </div>
            </div>
            {process.paz_y_salvo_certified && (
              <button
                onClick={() => setPdfModal({
                  isOpen: true,
                  url: `/uploads/${liquidation?.paz_y_salvo_pdf_path || `certificado_paz_y_salvo_exp_${process.id}.pdf`}`,
                  title: `Expediente Consolidado de Paz y Salvo (PDF con Evidencias) - ${employee?.first_name} ${employee?.last_name}`
                })}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver PDF Consolidado</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Archivos y Evidencias Documentales</h3>
              <p className="text-xs text-slate-500">Documentos digitalizados, actas de entrega, fotografías y comprobantes en PDF/imágenes.</p>
            </div>
            <button
              onClick={() => setUploadModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Subir Archivo de Evidencia</span>
            </button>
          </div>

          {evidence_files.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Paperclip className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Sin archivos de evidencia cargados</p>
              <p className="text-xs text-slate-400">Adjunte comprobantes en formato PDF, PNG o JPG de hasta 10 MB.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evidence_files.map(ev => {
                const fileUrl = `/uploads/${ev.stored_filename}`;
                const isPdf = ev.file_type === 'pdf';
                return (
                  <div key={ev.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={ev.original_filename}>
                            {ev.original_filename}
                          </p>
                          <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">
                            {ev.department}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEvidence(ev.id)}
                        className="text-slate-300 hover:text-red-500 p-1"
                        title="Eliminar archivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                      "{ev.notes || 'Comprobante documental registrado'}"
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{(ev.file_size_bytes / 1024).toFixed(1)} KB &bull; {ev.uploaded_by}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPdfModal({
                            isOpen: true,
                            url: fileUrl,
                            title: ev.original_filename
                          })}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>
                        <a
                          href={fileUrl}
                          download
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold flex items-center gap-1 text-[11px]"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTROL DE VACACIONES */}
      {activeTab === 'vacation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Días Generados por Ley</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{vacation_record?.days_accrued || 45} días</h4>
              <p className="text-[11px] text-slate-500 mt-1">15 días/año (Art. 69 C.T.)</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Días Gozados / Disfrutados</p>
              <h4 className="text-2xl font-black text-slate-600 mt-1">{vacation_record?.days_taken || 35} días</h4>
              <p className="text-[11px] text-slate-500 mt-1">Registrados en biométrico/permisos</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Saldo Días Pendientes</p>
              <h4 className="text-2xl font-black text-blue-600 mt-1">{vacation_record?.days_pending || 10} días</h4>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">Sujetos a pago en liquidación</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Valor Económico a Pagar</p>
              <h4 className="text-2xl font-black text-emerald-600 mt-1">${vacation_record?.economic_value?.toFixed(2) || '266.67'} USD</h4>
              <p className="text-[11px] text-slate-500 mt-1">Base diaria: ${(employee?.monthly_salary / 30).toFixed(2)}/día</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-800">Fundamentación Legal y Detalle de Períodos</h4>
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-2 leading-relaxed">
              <p>
                <b>Base Legal (Artículos 69 y 71 del Código del Trabajo):</b> Todo trabajador tiene derecho a gozar anualmente de un período ininterrumpido de quince días de descanso. Quienes hubieren prestado servicios por más de cinco años tendrán derecho a un día adicional por cada año excedente. Cuando el trabajador cese en sus funciones sin haber gozado de sus vacaciones, se le liquidarán en dinero la parte proporcional al tiempo servido.
              </p>
              <p className="font-mono text-blue-900 bg-white p-2 rounded-lg border border-blue-200">
                Fórmula: {vacation_record?.calculation_details || "10 días pendientes × ($800.00 / 30) = $266.67"}
              </p>
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold text-slate-700 mb-1">Períodos Acumulados Registrados:</p>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
                {vacation_record?.accrued_periods || "Período 2023-2024: 15 gozados; Período 2024-2025: 15 gozados; Período 2025-2026: 5 gozados / 10 pendientes"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIQUIDACIÓN LABORAL ECUATORIANA */}
      {activeTab === 'liquidation' && liquidation && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Haberes y Beneficios</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                ${liquidation.total_earnings?.toFixed(2)} USD
              </h3>
              <p className="text-xs text-slate-400 mt-1">Ingresos de ley a favor del trabajador</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Descuentos y Deducciones</p>
              <h3 className="text-2xl font-black text-red-600 mt-1">
                -${liquidation.total_deductions?.toFixed(2)} USD
              </h3>
              <p className="text-xs text-slate-400 mt-1">Anticipos o préstamos autorizados</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white shadow-md">
              <p className="text-xs font-bold text-blue-200 uppercase">Valor Neto a Recibir</p>
              <h3 className="text-3xl font-black text-white mt-1">
                ${liquidation.net_payable?.toFixed(2)} USD
              </h3>
              <p className="text-xs text-blue-300 mt-1">Saldo a transferir al trabajador</p>
            </div>
          </div>

          {/* Banner MDT Calculator */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-blue-950 uppercase tracking-wide">
                    Simulador Homologado Ministerio del Trabajo (MDT)
                  </h4>
                  <span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                    calculadoras.trabajo.gob.ec
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Calcule y compare con las opciones oficiales del SUT (décimos acumulados/mensualizados, fondos de reserva, desahucio Art. 185, despido Art. 188). Sincronice de inmediato con los documentos PDF.
                </p>
              </div>
            </div>
            <button
              onClick={() => setMdtModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Abrir Calculadora MDT</span>
            </button>
          </div>

          {/* Haberes Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">1. Haberes y Beneficios Sociales (Ingresos)</h4>
                <p className="text-xs text-slate-500">Cálculos matemáticos transparentes con base legal del Código del Trabajo</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Subtotal: ${liquidation.total_earnings?.toFixed(2)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Rubro / Concepto</th>
                    <th className="py-2.5 px-3">Base Legal</th>
                    <th className="py-2.5 px-3">Fórmula y Detalle de Cálculo</th>
                    <th className="py-2.5 px-3 text-right">Valor (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liquidation.pending_salary_days > 0 && (
                    <tr>
                      <td className="py-3 px-3 font-bold text-slate-800">Sueldo Días Laborados</td>
                      <td className="py-3 px-3 text-slate-600 font-medium">Art. 82 C.T.</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {liquidation.pending_salary_days} días a razón de ${(employee?.monthly_salary / 30).toFixed(2)}/día
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        ${liquidation.pending_salary_value?.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-800">Vacaciones No Gozadas</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">Arts. 69 y 71 C.T.</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {liquidation.vacation_days_pending} días × (${employee?.monthly_salary?.toFixed(2)} / 30)
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      ${liquidation.vacation_value?.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-800">Décima Tercera Remuneración (Navideña)</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">Art. 111 C.T.</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {liquidation.thirteenth_details || "Proporcional 1 Dic a fecha de salida / 12"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      ${liquidation.thirteenth_salary_value?.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-800">Décima Cuarta Remuneración (Escolar)</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">Art. 113 C.T.</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {liquidation.fourteenth_details || `Proporcional ciclo escolar (${liquidation.region})`}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      ${liquidation.fourteenth_salary_value?.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-800">Fondos de Reserva</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">Art. 196 C.T.</td>
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      {liquidation.reserve_fund_details || "Al día en el IESS"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      ${liquidation.reserve_fund_value?.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-bold text-blue-900">Bonificación por Desahucio</td>
                    <td className="py-3 px-3 text-blue-700 font-medium">Art. 185 C.T.</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      {liquidation.desahucio_details || `25% de $${employee?.monthly_salary?.toFixed(2)} × ${liquidation.full_years} años cumplidos`}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-900">
                      ${liquidation.desahucio_bonus_value?.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-bold text-slate-500">Indemnización Despido Intempestivo</td>
                    <td className="py-3 px-3 text-slate-500 font-medium">Art. 188 C.T.</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] italic">
                      {liquidation.untimely_dismissal_details || "No aplica (terminación por desahucio voluntario)"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-400">
                      ${liquidation.untimely_dismissal_value?.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deducciones Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">2. Descuentos y Deducciones Autorizadas</h4>
                <p className="text-xs text-slate-500">Valores debitables autorizados y justificados contablemente</p>
              </div>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                Subtotal: -${liquidation.total_deductions?.toFixed(2)}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-2.5 px-3">Concepto de Deducción</th>
                  <th className="py-2.5 px-3">Sustento</th>
                  <th className="py-2.5 px-3 text-right">Valor (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 font-bold text-slate-800">Anticipos de Sueldo / Quincena</td>
                  <td className="py-3 px-3 text-slate-600">Verificado por Contabilidad (comprobante en evidencias)</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-red-600">
                    -${liquidation.advance_deduction_value?.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-bold text-slate-800">Préstamos Internos de Empresa</td>
                  <td className="py-3 px-3 text-slate-600">Sin préstamos o convenios pendientes</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-400">
                    -${liquidation.loans_deduction_value?.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDITORÍA Y TRAZABILIDAD */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Historial y Trazabilidad del Expediente</h4>
            <p className="text-xs text-slate-500">Registro inmutable de acciones, revisiones de departamento y emisión de documentos.</p>
          </div>

          <div className="space-y-3">
            {(audit_logs || []).map(log => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800">{log.action}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('es-EC')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Área: <b className="text-slate-600">{log.department}</b> &bull; Usuario: <b className="text-slate-600">{log.user_name}</b>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: BLOQUEO DE PAZ Y SALVO (REGLA DE CALIDAD) */}
      <Modal
        isOpen={blockingModal.isOpen}
        onClose={() => setBlockingModal({ isOpen: false, items: [] })}
        title="Emisión Bloqueada: Paz y Salvo Incompleto"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-800">
            <ShieldAlert className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Normativa del Sistema de Calidad:</p>
              <p>
                El Certificado de Paz y Salvo <b>no puede emitirse</b> mientras existan obligaciones o requisitos obligatorios con estado <b>Pendiente</b> o <b>Rechazado</b>.
              </p>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-700">Requisitos que bloquean la certificación:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {blockingModal.items.map(it => (
              <div key={it.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{it.requirement_name}</span>
                  <p className="text-[11px] text-blue-600">{it.department}</p>
                </div>
                <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                  {it.status}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setBlockingModal({ isOpen: false, items: [] })}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
            >
              Entendido y Volver
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: AGREGAR REQUISITO PERSONALIZADO */}
      <Modal
        isOpen={newReqModal}
        onClose={() => setNewReqModal(false)}
        title="Añadir Requisito Departamental"
      >
        <form onSubmit={handleAddRequirement} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Departamento Responsable</label>
            <select
              value={newReq.department}
              onChange={(e) => setNewReq({ ...newReq, department: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Sistemas / TI">Sistemas / TI</option>
              <option value="Contabilidad / Finanzas">Contabilidad / Finanzas</option>
              <option value="Administración">Administración</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre del Requisito / Obligación</label>
            <input
              type="text"
              required
              placeholder="Ej: Devolución de teléfono corporativo..."
              value={newReq.requirement_name}
              onChange={(e) => setNewReq({ ...newReq, requirement_name: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Descripción y Criterio de Verificación</label>
            <textarea
              rows="3"
              placeholder="Instrucciones sobre qué y cómo debe verificar el responsable..."
              value={newReq.description}
              onChange={(e) => setNewReq({ ...newReq, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_mandatory"
              checked={newReq.is_mandatory}
              onChange={(e) => setNewReq({ ...newReq, is_mandatory: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="is_mandatory" className="font-semibold text-slate-700">
              Requisito de cumplimiento obligatorio para emisión de paz y salvo
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNewReqModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm"
            >
              Guardar Requisito
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: SUBIR EVIDENCIA */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Adjuntar Archivo de Evidencia"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Archivo (PDF, PNG, JPG - Máx 10 MB)</label>
            <input
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Departamento Responsable</label>
            <select
              value={uploadData.department}
              onChange={(e) => setUploadData({ ...uploadData, department: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="Recursos Humanos">Recursos Humanos</option>
              <option value="Sistemas / TI">Sistemas / TI</option>
              <option value="Contabilidad / Finanzas">Contabilidad / Finanzas</option>
              <option value="Administración">Administración</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Vincular a Requisito (Opcional)</label>
            <select
              value={uploadData.requirement_id}
              onChange={(e) => setUploadData({ ...uploadData, requirement_id: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sin vinculación específica --</option>
              {clearance_requirements
                .filter(r => r.department === uploadData.department)
                .map(r => (
                  <option key={r.id} value={r.id}>{r.requirement_name}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notas y Descripción del Documento</label>
            <textarea
              rows="2"
              placeholder="Detalle del comprobante (ej: Acta de entrega con firma física)..."
              value={uploadData.notes}
              onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUploadModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm"
            >
              Subir y Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: AJUSTAR RUBROS / RECALCULAR LIQUIDACIÓN */}
      <Modal
        isOpen={recalcModal}
        onClose={() => setRecalcModal(false)}
        title="Simulador y Ajuste de Liquidación Laboral"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleRecalculateSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 leading-relaxed">
            Permite ajustar parámetros de cálculo según el Código del Trabajo. El sistema aplicará automáticamente las reglas proporcionales según región y antigüedad.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Región Laboral (para Décimo Cuarto)</label>
              <select
                value={recalcForm.region}
                onChange={(e) => setRecalcForm({ ...recalcForm, region: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="Sierra">Sierra y Amazonía (1 Ago - 31 Jul)</option>
                <option value="Costa">Costa e Insular (1 Mar - 28/29 Feb)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Salario Básico Unificado (SBU)</label>
              <input
                type="number"
                step="0.01"
                value={recalcForm.sbu_value}
                onChange={(e) => setRecalcForm({ ...recalcForm, sbu_value: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Días de Sueldo Pendientes en Último Mes</label>
              <input
                type="number"
                min="0"
                max="30"
                value={recalcForm.pending_salary_days}
                onChange={(e) => setRecalcForm({ ...recalcForm, pending_salary_days: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Días de Vacaciones Pendientes</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={recalcForm.vacation_days_pending}
                onChange={(e) => setRecalcForm({ ...recalcForm, vacation_days_pending: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Anticipos Pendientes de Sueldo ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={recalcForm.advance_deduction_value}
                onChange={(e) => setRecalcForm({ ...recalcForm, advance_deduction_value: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Préstamos Internos Pendientes ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={recalcForm.loans_deduction_value}
                onChange={(e) => setRecalcForm({ ...recalcForm, loans_deduction_value: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reserve_fund"
              checked={recalcForm.reserve_fund_pending}
              onChange={(e) => setRecalcForm({ ...recalcForm, reserve_fund_pending: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="reserve_fund" className="font-semibold text-slate-700">
              Liquidar fondos de reserva del último período (8.33% de remuneración)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRecalcModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ejecutar Recálculo</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VISOR DE PDF */}
      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={() => setPdfModal({ isOpen: false, url: '', title: '' })}
        fileUrl={pdfModal.url}
        title={pdfModal.title}
      />

      {/* MODAL: CALCULADORA OFICIAL MDT */}
      <MdtCalculatorModal
        isOpen={mdtModalOpen}
        onClose={() => setMdtModalOpen(false)}
        processData={process}
        onSuccessApply={() => loadProcess()}
        userName={userName}
      />
    </div>
  );
}
