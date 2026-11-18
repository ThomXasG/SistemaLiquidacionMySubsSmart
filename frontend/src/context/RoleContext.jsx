import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext();

export const ROLES = [
  { id: 'Admin', name: 'Administrador General', dept: 'Todas las áreas', desc: 'Acceso total y aprobación global' },
  { id: 'RRHH', name: 'Recursos Humanos', dept: 'Recursos Humanos', desc: 'Aprobación de credenciales, vacaciones y contratos' },
  { id: 'TI', name: 'Sistemas / TI', dept: 'Sistemas / TI', desc: 'Devolución de laptops, cuentas, repositorios y accesos VPN' },
  { id: 'Contabilidad', name: 'Contabilidad / Finanzas', dept: 'Contabilidad / Finanzas', desc: 'Validación de anticipos, préstamos y liquidación' },
  { id: 'Administracion', name: 'Administración', dept: 'Administración', desc: 'Recepción de llaves, tarjetas RFID y activos' },
];

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(ROLES[0]);
  const [userName, setUserName] = useState('Ing. Carlos Mendoza (Admin)');

  const handleRoleChange = (roleId) => {
    const selected = ROLES.find(r => r.id === roleId) || ROLES[0];
    setCurrentRole(selected);
    if (selected.id === 'Admin') setUserName('Ing. Carlos Mendoza (Admin)');
    else if (selected.id === 'RRHH') setUserName('Ing. Sofía Morales (RRHH)');
    else if (selected.id === 'TI') setUserName('Ing. Fernando Paredes (TI)');
    else if (selected.id === 'Contabilidad') setUserName('Lic. Marcela Castro (Contabilidad)');
    else if (selected.id === 'Administracion') setUserName('Dra. Patricia Alvear (Administración)');
  };

  return (
    <RoleContext.Provider value={{ currentRole, userName, setUserName, handleRoleChange, ROLES }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);

