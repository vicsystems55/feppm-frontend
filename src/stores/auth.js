import { defineStore } from 'pinia';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? 'Unable to complete this request.');
  return payload;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    user: null,
    rememberMe: true,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.accessToken && state.user),
    isSuperAdmin: (state) => state.user?.roles?.some((role) => role.key === 'SUPER_ADMIN') ?? false,
  },

  actions: {
    setSession(data, rememberMe = this.rememberMe) {
      this.accessToken = data.accessToken;
      this.user = data.user;
      this.rememberMe = rememberMe;
    },

    clearSession() {
      this.accessToken = null;
      this.user = null;
    },

    async login({ email, password, rememberMe }) {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const payload = await parseResponse(response);
      this.setSession(payload.data, rememberMe);
      return payload.data.user;
    },

    async loadCurrentUser() {
      if (!this.accessToken) return false;
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      if (!response.ok) return false;
      const payload = await response.json();
      this.user = payload.data.user;
      return true;
    },

    async refresh() {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        this.clearSession();
        return false;
      }
      const payload = await response.json();
      this.setSession(payload.data, this.rememberMe);
      return true;
    },

    async initialize() {
      if (this.initialized) return this.isAuthenticated;
      try {
        let authenticated = await this.loadCurrentUser();
        if (!authenticated) authenticated = await this.refresh();
        return authenticated;
      } catch {
        this.clearSession();
        return false;
      } finally {
        this.initialized = true;
      }
    },

    async authorizedFetch(path, options = {}) {
      const request = () => fetch(`${API_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        },
      });

      let response = await request();
      if (response.status === 401 && await this.refresh()) response = await request();
      return response;
    },

    async logout() {
      this.clearSession();
      this.initialized = true;

      try {
        const response = await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
        return response.ok;
      } catch {
        return false;
      }
    },
  },
});
