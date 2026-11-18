import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileCheck2, 
  CheckCircle2, 
  DollarSign, 
  ArrowUpRight, 
  Clock, 
  AlertCircle, 
  FileText, 
  Eye, 
  Award,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { getDashboardStats, getProcesses } from '../api';
import PdfViewerModal from '../components/PdfViewerModal';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfModal, setPdfModal] = useState({ isOpen: false, url: '', title: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, procData] = await Promise.all([
        getDashboardStats(),
        getProcesses()
      ]);
      setStats(statsData);
      setProcesses(procData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Cargando métricas del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control General</h2>
          <p className="text-sm text-slate-500 mt-1">
            Supervisión integral de desvinculaciones laborales, paz y salvo departamental y liquidaciones legales en Ecuador.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/processes/new')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <span>+ Iniciar Nuevo Proceso</span>
          </button>
        </div>
      </div>

      {/* CASO HIPOTÉTICO DE DEMOSTRACIÓN - BANNER DESTACADO */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-blue-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-repeat pointer-events-none flex items-center justify-center">
          <ShieldCheck className="w-80 h-80 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>CASO DE DEMOSTRACIÓN PRECARGADO Y VERIFICADO</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">
              Expediente Laboral: Andrés Sebastián Torres (C.I. 1800000001)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              <b>Empresa:</b> MySubs Smart (RUC: 1899999999001, Desarrollo de Software) &bull; 
              <b> Cargo:</b> Analista de Sistemas &bull; <b>Causa:</b> Desahucio (Art. 185 C.T.) &bull; 
              <b> Salario:</b> $800.00 &bull; <b>Liquidación Neta Calculada:</b> $1,615.00 USD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/processes/1')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Ver Expediente Completo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPdfModal({
                isOpen: true,
                url: '/uploads/certificado_paz_y_salvo_exp_1.pdf',
                title: 'Certificado de Paz y Salvo - Andrés Sebastián Torres'
              })}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Ver Paz y Salvo PDF</span>
            </button>
            <button
              onClick={() => setPdfModal({
                isOpen: true,
                url: '/uploads/liquidacion_laboral_exp_1.pdf',
                title: 'Acta de Liquidación Laboral - Andrés Sebastián Torres'
              })}
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Ver Liquidación PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Colaboradores */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Colaboradores Totales</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{stats?.employees?.total || 0}</h4>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="font-semibold text-emerald-600">{stats?.employees?.active || 0} activos</span>
              <span className="text-slate-300">&bull;</span>
              <span className="font-semibold text-amber-600">{stats?.employees?.terminating || 0} en salida</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Procesos Activos */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expedientes de Salida</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{stats?.processes?.total || 0}</h4>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="font-semibold text-emerald-600">{stats?.processes?.certified || 0} aprobados</span>
              <span className="text-slate-300">&bull;</span>
              <span className="font-semibold text-slate-500">{stats?.processes?.pending || 0} en curso</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Paz y Salvo Emitidos */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paz y Salvos Emitidos</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-1">{stats?.processes?.certified || 0}</h4>
            <p className="text-xs text-slate-500 mt-2">Certificados con firma digital listos</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Liquidaciones Procesadas */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Liquidaciones</p>
            <h4 className="text-2xl font-black text-blue-700 mt-1">
              ${stats?.settlements?.total_net_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
            </h4>
            <p className="text-xs text-slate-500 mt-2">{stats?.settlements?.count || 0} calculadas conforme C.T.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Middle Section: Department Clearance Progress & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Progress Card */}
        <div className="lg:col-span-1 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Cumplimiento Departamental</h3>
            <span className="text-[11px] font-semibold text-blue-600">Requisitos Globales</span>
          </div>

          <div className="space-y-3.5">
            {stats?.department_progress?.map((d) => (
              <div key={d.department} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{d.department}</span>
                  <span className="font-bold text-slate-900">{d.percentage}% ({d.approved}/{d.total})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      d.percentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${d.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>El certificado se desbloquea únicamente al 100% de aprobación.</span>
          </div>
        </div>

        {/* Recent Audit Activity Log */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Registro de Actividad y Auditoría</h3>
            <span className="text-[11px] text-slate-400">Últimas acciones registradas</span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {stats?.recent_logs?.length > 0 ? (
              stats.recent_logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-800 truncate">{log.action}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="font-semibold text-blue-600">{log.department}</span>
                      <span>&bull;</span>
                      <span>Resp: {log.user_name}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No hay registros de auditoría aún.</p>
            )}
          </div>
        </div>
      </div>

      {/* Expedientes Activos Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Expedientes de Terminación en Proceso</h3>
            <p className="text-xs text-slate-500">Gestión de salida y control de paz y salvo por trabajador</p>
          </div>
          <button
            onClick={() => navigate('/processes')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Ver todos los expedientes
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                <th className="py-2.5 px-3">Expediente</th>
                <th className="py-2.5 px-3">Trabajador</th>
                <th className="py-2.5 px-3">Cargo / Dept</th>
                <th className="py-2.5 px-3">Causa de Terminación</th>
                <th className="py-2.5 px-3">Fecha Salida</th>
                <th className="py-2.5 px-3">Paz y Salvo</th>
                <th className="py-2.5 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processes.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    EXP-{p.id.toString().padStart(4, '0')}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-800">{p.employee?.first_name} {p.employee?.last_name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">C.I. {p.employee?.national_id}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-medium text-slate-700">{p.employee?.position}</p>
                    <p className="text-[11px] text-slate-400">{p.employee?.department}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {p.cause}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-600">
                    {p.effective_date}
                  </td>
                  <td className="py-3 px-3">
                    {p.paz_y_salvo_certified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Certificado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" /> En Revisión
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => navigate(`/processes/${p.id}`)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Revisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Modal */}
      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={() => setPdfModal({ isOpen: false, url: '', title: '' })}
        fileUrl={pdfModal.url}
        title={pdfModal.title}
      />
    </div>
  );
}

