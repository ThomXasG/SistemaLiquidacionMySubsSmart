import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileCheck2, 
  Users, 
  Building2, 
  Calculator, 
  BookOpen, 
  ShieldCheck,
  Award
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Panel Principal', icon: LayoutDashboard },
    { to: '/processes', label: 'Expedientes de Salida', icon: FileCheck2 },
    { to: '/calculator', label: 'Calculadora MDT', icon: Calculator },
    { to: '/employees', label: 'Colaboradores', icon: Users },
    { to: '/company', label: 'Empresa Empleadora', icon: Building2 },
    { to: '/legal-guide', label: 'Código del Trabajo', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-tight">MySubs Smart</h1>
          <p className="text-[11px] text-blue-400 font-medium">Software &amp; Paz y Salvo</p>
        </div>
      </div>

      {/* Case Demo Quick Badge */}
      <div className="px-4 pt-4">
        <NavLink
          to="/processes/1"
          className="block p-3 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/40 border border-blue-700/50 hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Caso Demo Precargado</span>
          </div>
          <p className="text-sm font-bold text-white group-hover:text-blue-200 transition-colors">
            Andrés Sebastián Torres
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            MySubs Smart &bull; Software House
          </p>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Módulos del Sistema
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Legal Footer Note */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <span>Normativa Ecuatoriana</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
        </div>
        <p className="leading-relaxed">
          Artículos 169, 185, 188, 111, 113, 69, 71 Código del Trabajo. SBU ref: $460.00.
        </p>
      </div>
    </aside>
  );
}

