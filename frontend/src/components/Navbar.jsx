import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCheck, 
  PlusCircle, 
  UserPlus, 
  Shield, 
  Briefcase, 
  Laptop, 
  DollarSign, 
  KeyRound 
} from 'lucide-react';
import { useRole } from '../context/RoleContext';

export default function Navbar() {
  const { currentRole, userName, handleRoleChange, ROLES } = useRole();
  const navigate = useNavigate();

  const getRoleIcon = (roleId) => {
    switch(roleId) {
      case 'Admin': return Shield;
      case 'RRHH': return Briefcase;
      case 'TI': return Laptop;
      case 'Contabilidad': return DollarSign;
      case 'Administracion': return KeyRound;
      default: return UserCheck;
    }
  };

  const CurrentIcon = getRoleIcon(currentRole.id);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0">
      {/* Title / Department indicator */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          MySubs Smart &bull; Software Development &bull; Gestión Paz y Salvo
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 leading-none">Rol de Aprobación</span>
            <select
              value={currentRole.id}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => navigate('/processes/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm hover:shadow"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden md:inline">Iniciar Terminación</span>
        </button>

        <button
          onClick={() => navigate('/employees?openModal=true')}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden lg:inline">Nuevo Colaborador</span>
        </button>
      </div>
    </header>
  );
}

