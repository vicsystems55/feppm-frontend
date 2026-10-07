function query(filters = {}) {
  const values = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) values.set(key, value); });
  return values.size ? `?${values}` : '';
}

async function jsonResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to load the executive report.');
  return payload.data;
}

export const executiveReportApi = {
  async preview(auth, filters) {
    return jsonResponse(await auth.authorizedFetch(`/executive-reports${query(filters)}`));
  },
  async exportExcel(auth, filters) {
    const response = await auth.authorizedFetch(`/executive-reports/export${query(filters)}`);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Unable to export the executive report.');
    }
    const disposition = response.headers.get('content-disposition') || '';
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'FEPPM-State-Executive-Report.xlsx';
    return { blob: await response.blob(), filename };
  },
};
