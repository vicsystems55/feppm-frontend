async function request(auth, path, options = {}) {
  const response = await auth.authorizedFetch(`/maintenance-operations${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to complete the maintenance request.');
  return payload.data;
}

function query(parameters = {}) {
  const values = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) values.set(key, value);
  });
  return values.size ? `?${values}` : '';
}

export const maintenanceOperationsApi = {
  dashboard: (auth) => request(auth, '/dashboard'),
  requests: (auth, filters = {}) => request(auth, `/requests${query(filters)}`),
  request: (auth, id) => request(auth, `/requests/${id}`),
  triage: (auth, id, data) => request(auth, `/requests/${id}/triage`, { method: 'PUT', body: JSON.stringify(data) }),
  createWorkOrder: (auth, id, data) => request(auth, `/requests/${id}/work-orders`, { method: 'POST', body: JSON.stringify(data) }),
  workOrders: (auth, filters = {}) => request(auth, `/work-orders${query(filters)}`),
  workOrder: (auth, id) => request(auth, `/work-orders/${id}`),
  submitWorkOrder: (auth, id, data = {}) => request(auth, `/work-orders/${id}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  approveWorkOrder: (auth, id, data = {}) => request(auth, `/work-orders/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  assignWorkOrder: (auth, id, data) => request(auth, `/work-orders/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  verifyWorkOrder: (auth, id, data) => request(auth, `/work-orders/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),
  technicians: (auth) => request(auth, '/technicians'),
  saveTechnician: (auth, data) => request(auth, '/technicians', { method: 'POST', body: JSON.stringify(data) }),
  contracts: (auth) => request(auth, '/vendor-contracts'),
  createVendor: (auth, data) => request(auth, '/vendors', { method: 'POST', body: JSON.stringify(data) }),
  createContract: (auth, data) => request(auth, '/vendor-contracts', { method: 'POST', body: JSON.stringify(data) }),
  updateContract: (auth, id, data) => request(auth, `/vendor-contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  options: (auth) => request(auth, '/options'),
};
