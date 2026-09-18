async function request(auth, path, options = {}) {
  const response = await auth.authorizedFetch(`/workshop-resources${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to complete the workshop resource request.');
  return payload;
}

async function resourceRequest(auth, path, options = {}) {
  const response = await auth.authorizedFetch(`/resource-requests${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to complete the resource request.');
  return payload;
}

function query(parameters = {}) {
  const values = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) values.set(key, value);
  });
  return values.size ? `?${values}` : '';
}

export const workshopResourceApi = {
  overview: (auth) => request(auth, '/overview'),
  store: (auth, id) => request(auth, `/stores/${id}`),
  tools: (auth, filters = {}) => request(auth, `/tools${query(filters)}`),
  options: (auth, workshopId) => request(auth, `/options${query({ workshopId })}`),
  receiveTool: (auth, data) => request(auth, '/tools/receive', { method: 'POST', body: JSON.stringify(data) }),
  issueTool: (auth, id, data) => request(auth, `/tools/${id}/issue`, { method: 'POST', body: JSON.stringify(data) }),
  returnTool: (auth, id, data) => request(auth, `/tools/${id}/return`, { method: 'POST', body: JSON.stringify(data) }),
  auditTool: (auth, id, data) => request(auth, `/tools/${id}/audit`, { method: 'POST', body: JSON.stringify(data) }),
};

export const resourceRequestApi = {
  list: (auth, filters = {}) => resourceRequest(auth, `${query(filters)}`),
  get: (auth, id) => resourceRequest(auth, `/${id}`),
  options: (auth) => resourceRequest(auth, '/options'),
  create: (auth, data) => resourceRequest(auth, '', { method: 'POST', body: JSON.stringify(data) }),
  workshopReview: (auth, id, data) => resourceRequest(auth, `/${id}/workshop-review`, { method: 'POST', body: JSON.stringify(data) }),
  storeReview: (auth, id, data) => resourceRequest(auth, `/${id}/store-review`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (auth, id, data = {}) => resourceRequest(auth, `/${id}/cancel`, { method: 'POST', body: JSON.stringify(data) }),
};
