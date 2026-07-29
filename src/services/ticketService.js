async function ticketRequest(auth, path, options = {}) {
  const response = await auth.authorizedFetch(`/tickets${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to complete the ticket request.');
  return payload.data;
}

function queryString(parameters = {}) {
  const query = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) query.set(key, value);
  });
  const value = query.toString();
  return value ? `?${value}` : '';
}

export const ticketApi = {
  list(auth, filters) {
    return ticketRequest(auth, queryString(filters));
  },
  options(auth, organizationId = '') {
    return ticketRequest(auth, `/options${queryString({ organizationId })}`);
  },
  get(auth, id) {
    return ticketRequest(auth, `/${id}`);
  },
  create(auth, data) {
    return ticketRequest(auth, '', { method: 'POST', body: JSON.stringify(data) });
  },
  changeStatus(auth, id, data) {
    return ticketRequest(auth, `/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  assign(auth, id, data) {
    return ticketRequest(auth, `/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  escalate(auth, id, data) {
    return ticketRequest(auth, `/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  comment(auth, id, data) {
    return ticketRequest(auth, `/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
