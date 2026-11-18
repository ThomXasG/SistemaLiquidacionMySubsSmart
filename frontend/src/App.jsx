import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ProcessesList from './pages/ProcessesList';
import ProcessDetail from './pages/ProcessDetail';
import NewProcess from './pages/NewProcess';
import EmployeesList from './pages/EmployeesList';
import CompanySettings from './pages/CompanySettings';
import LegalGuide from './pages/LegalGuide';
import MdtCalculatorPage from './pages/MdtCalculatorPage';

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/processes" element={<ProcessesList />} />
                <Route path="/processes/new" element={<NewProcess />} />
                <Route path="/processes/:id" element={<ProcessDetail />} />
                <Route path="/employees" element={<EmployeesList />} />
                <Route path="/company" element={<CompanySettings />} />
                <Route path="/calculator" element={<MdtCalculatorPage />} />
                <Route path="/legal-guide" element={<LegalGuide />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </RoleProvider>
  );
}

