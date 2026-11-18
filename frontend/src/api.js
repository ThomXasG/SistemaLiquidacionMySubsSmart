const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.headers || {};
  
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = 'Error en la solicitud al servidor';
    try {
      const data = await res.json();
      errorDetail = data.detail || data.message || errorDetail;
    } catch (e) {
      // ignore
    }
    const err = new Error(typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail);
    err.data = errorDetail;
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// Companies
export const getCompanies = () => request('/companies');
export const getCompany = (id) => request(`/companies/${id}`);
export const updateCompany = (id, data) => request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Employees
export const getEmployees = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/employees${query ? `?${query}` : ''}`);
};
export const getEmployee = (id) => request(`/employees/${id}`);
export const createEmployee = (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) });
export const updateEmployee = (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEmployee = (id) => request(`/employees/${id}`, { method: 'DELETE' });

// Termination Processes
export const getProcesses = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return request(`/processes${query ? `?${query}` : ''}`);
};
export const getProcessDetail = (id) => request(`/processes/${id}`);
export const createProcess = (data) => request('/processes', { method: 'POST', body: JSON.stringify(data) });
export const updateProcess = (id, data) => request(`/processes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProcess = (id) => request(`/processes/${id}`, { method: 'DELETE' });

// Clearance Requirements
export const updateRequirementStatus = (id, data, userName, userRole) => {
  const query = new URLSearchParams({ user_name: userName, user_role: userRole }).toString();
  return request(`/requirements/${id}?${query}`, { method: 'PUT', body: JSON.stringify(data) });
};
export const addCustomRequirement = (processId, data) => request(`/processes/${processId}/requirements`, { method: 'POST', body: JSON.stringify(data) });
export const deleteRequirement = (id) => request(`/requirements/${id}`, { method: 'DELETE' });

// Evidence Files
export const uploadEvidence = (processId, formData) => {
  return request(`/processes/${processId}/upload-evidence`, {
    method: 'POST',
    body: formData,
  });
};
export const deleteEvidence = (id) => request(`/evidence/${id}`, { method: 'DELETE' });

// Vacations
export const updateVacations = (processId, data) => request(`/processes/${processId}/vacations`, { method: 'PUT', body: JSON.stringify(data) });

// Liquidation
export const calculateLiquidation = (processId, data) => request(`/processes/${processId}/calculate-liquidation`, { method: 'POST', body: JSON.stringify(data) });
export const getLiquidation = (processId) => request(`/processes/${processId}/liquidation`);

// PDFs
export const generatePazYSalvoPDF = (processId, userName = 'Administrador') => request(`/processes/${processId}/generate-paz-y-salvo?user_name=${encodeURIComponent(userName)}`, { method: 'POST' });
export const generateLiquidationPDF = (processId, userName = 'Contabilidad') => request(`/processes/${processId}/generate-liquidation-pdf?user_name=${encodeURIComponent(userName)}`, { method: 'POST' });

// MDT Calculator integration
export const simulateMdtLiquidation = (data) => request('/liquidation/simulate-mdt', { method: 'POST', body: JSON.stringify(data) });
export const applyMdtCalculation = (processId, data, userName = 'Administrador') => 
  request(`/processes/${processId}/apply-mdt-calculation?user_name=${encodeURIComponent(userName)}`, { method: 'POST', body: JSON.stringify(data) });

// Dashboard
export const getDashboardStats = () => request('/dashboard/stats');

