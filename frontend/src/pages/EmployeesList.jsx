import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  FileCheck2, 
  Building, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getCompanies } from '../api';
import Modal from '../components/Modal';

export default function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_id: 1,
    first_name: '',
    last_name: '',
    national_id: '',
    position: '',
    department: 'Tecnología',
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'Contrato Indefinido',
    monthly_salary: 800.0,
    email: '',
    status: 'Activo'
  });

  useEffect(() => {
    loadData();
    if (searchParams.get('openModal') === 'true') {
      handleOpenCreate();
    }
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      const [empData, compData] = await Promise.all([
        getEmployees(params),
        getCompanies()
      ]);
      setEmployees(empData);
      setCompanies(compData);
      if (compData.length > 0) {
        setFormData(prev => ({ ...prev, company_id: compData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEmp(null);
    setFormData({
      company_id: companies[0]?.id || 1,
      first_name: '',
      last_name: '',
      national_id: '',
      position: '',
      department: 'Tecnología',
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: 'Contrato Indefinido',
      monthly_salary: 800.0,
      email: '',
      status: 'Activo'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setFormData({
      company_id: emp.company_id,
      first_name: emp.first_name,
      last_name: emp.last_name,
      national_id: emp.national_id,
      position: emp.position,
      department: emp.department,
      hire_date: emp.hire_date,
      contract_type: emp.contract_type,
      monthly_salary: emp.monthly_salary,
      email: emp.email,
      status: emp.status
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmp) {
        await updateEmployee(editingEmp.id, formData);
      } else {
        await createEmployee(formData);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Está seguro de eliminar el registro de ${name}?`)) return;
    try {
      await deleteEmployee(id);
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filtered = employees.filter(e => {
    const term = searchTerm.toLowerCase();
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const id = e.national_id;
    const pos = e.position.toLowerCase();
    const dept = e.department.toLowerCase();
    return name.includes(term) || id.includes(term) || pos.includes(term) || dept.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Colaboradores Registrados</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión del talento humano, remuneraciones mensuales y contratos de la empresa.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Colaborador</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombres, cédula o departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-600">Estado Laboral:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="Activo">Activos</option>
            <option value="En proceso de salida">En Proceso de Salida</option>
            <option value="Terminado">Terminados / Finiquitados</option>
          </select>
        </div>
      </div>

      {/* Grid of employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            No se encontraron colaboradores registrados.
          </div>
        ) : (
          filtered.map(emp => (
            <div 
              key={emp.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow transition-all space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{emp.first_name} {emp.last_name}</h3>
                    <p className="text-xs text-blue-600 font-semibold">{emp.position}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    emp.status === 'Activo' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : emp.status === 'En proceso de salida'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {emp.status}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cédula:</span>
                    <span className="font-mono font-bold text-slate-800">{emp.national_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Departamento:</span>
                    <span className="font-semibold text-slate-800">{emp.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha Ingreso:</span>
                    <span className="font-medium text-slate-800">{emp.hire_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contrato:</span>
                    <span className="text-slate-700">{emp.contract_type}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400 font-bold">Sueldo Base:</span>
                    <span className="font-mono font-black text-blue-700">${emp.monthly_salary?.toFixed(2)}/mes</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate(`/processes/new`)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    title="Iniciar proceso de desvinculación"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Salida
                  </button>

                  <button
                    onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                    className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEmp ? "Editar Datos del Colaborador" : "Registrar Nuevo Colaborador"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombres</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Apellidos</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cédula de Identidad (10 dígitos)</label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="Ej: 1800000001"
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="colaborador@empresa.ec"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cargo Laboral</label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Departamento</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="Tecnología">Tecnología / Desarrollo</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Contabilidad y Finanzas">Contabilidad y Finanzas</option>
                <option value="Producto y Calidad">Producto / QA Software</option>
                <option value="Administración">Administración</option>
                <option value="Ventas">Ventas y Comercial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de Ingreso</label>
              <input
                type="date"
                required
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Remuneración Mensual ($)</label>
              <input
                type="number"
                step="0.01"
                min="460"
                required
                value={formData.monthly_salary}
                onChange={(e) => setFormData({ ...formData, monthly_salary: parseFloat(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-blue-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Contrato</label>
              <select
                value={formData.contract_type}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Contrato Indefinido">Contrato Indefinido (Art. 14 C.T.)</option>
                <option value="Contrato Eventual">Contrato Eventual</option>
                <option value="Contrato por Obra Cierta">Contrato por Obra Cierta</option>
                <option value="Contrato de Temporada">Contrato de Temporada</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="Activo">Activo</option>
                <option value="En proceso de salida">En proceso de salida</option>
                <option value="Terminado">Terminado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm"
            >
              {editingEmp ? "Actualizar Colaborador" : "Guardar Registro"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

