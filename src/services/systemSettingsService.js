const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || fallbackMessage);
  return payload.data;
}

export const systemSettingsApi = {
  async publicSettings() {
    const response = await fetch(`${API_URL}/system-settings/public`);
    return parseResponse(response, 'Unable to load public settings.');
  },

  async settings(auth) {
    const response = await auth.authorizedFetch('/system-settings');
    return parseResponse(response, 'Unable to load system settings.');
  },

  async setDemoLoginsEnabled(auth, enabled) {
    const response = await auth.authorizedFetch('/system-settings/demo-logins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    return parseResponse(response, 'Unable to update the demo login setting.');
  },
};
