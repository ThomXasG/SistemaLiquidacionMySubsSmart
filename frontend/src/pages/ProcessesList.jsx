import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck2, 
  Search, 
  PlusCircle, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2,
  Filter,
  FileText
} from 'lucide-react';
import { getProcesses, deleteProcess } from '../api';

export default function ProcessesList() {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProcesses();
  }, [statusFilter]);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      const data = await getProcesses(params);
      setProcesses(data);
    } catch (err) {
      console.error("Error loading processes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Está seguro de eliminar el expediente de ${name}? Esta acción restablecerá el estado del colaborador a 'Activo'.`)) {
      return;
    }
    try {
      await deleteProcess(id);
      loadProcesses();
    } catch (err) {
      alert("Error al eliminar expediente: " + err.message);
    }
  };

  const filtered = processes.filter(p => {
    const term = searchTerm.toLowerCase();
    const fullName = `${p.employee?.first_name || ''} ${p.employee?.last_name || ''}`.toLowerCase();
    const id = p.employee?.national_id || '';
    const pos = (p.employee?.position || '').toLowerCase();
    const dept = (p.employee?.department || '').toLowerCase();
    const cause = (p.cause || '').toLowerCase();
    return fullName.includes(term) || id.includes(term) || pos.includes(term) || dept.includes(term) || cause.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Expedientes de Terminación Laboral</h2>
          <p className="text-sm text-slate-500 mt-1">
            Control de desvinculaciones, verificación de paz y salvo departamental y liquidación de haberes.
          </p>
        </div>
        <button
          onClick={() => navigate('/processes/new')}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Iniciar Nuevo Expediente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por colaborador, cédula, cargo o causa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="En Revisión">En Revisión Departamental</option>
            <option value="Paz y Salvo Aprobado">Paz y Salvo Aprobado</option>
            <option value="Liquidación Calculada">Liquidación Calculada</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No se encontraron expedientes</p>
            <p className="text-xs text-slate-400">Intente con otro término de búsqueda o inicie un nuevo proceso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                  <th className="py-3 px-3">N° Expediente</th>
                  <th className="py-3 px-3">Colaborador</th>
                  <th className="py-3 px-3">Cargo y Área</th>
                  <th className="py-3 px-3">Causa de Salida</th>
                  <th className="py-3 px-3">Fecha Solicitud / Salida</th>
                  <th className="py-3 px-3">Paz y Salvo</th>
                  <th className="py-3 px-3">Liquidación</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const empName = `${p.employee?.first_name || ''} ${p.employee?.last_name || ''}`;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        EXP-{p.id.toString().padStart(4, '0')}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-800">{empName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">C.I. {p.employee?.national_id}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-slate-700">{p.employee?.position}</p>
                        <p className="text-[11px] text-slate-400">{p.employee?.department}</p>
                      </td>
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">{p.cause}</p>
                        <p className="text-[10px] text-blue-600 font-medium">{p.legal_article}</p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <p className="font-medium text-slate-700">{p.effective_date}</p>
                        <p className="text-[10px] text-slate-400">Sol: {p.request_date}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        {p.paz_y_salvo_certified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Certificado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> En Revisión
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {p.liquidation ? (
                          <span className="font-mono font-bold text-emerald-600">
                            ${p.liquidation.net_payable?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Pendiente</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/processes/${p.id}`)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Expediente
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, empName)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Eliminar Expediente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

