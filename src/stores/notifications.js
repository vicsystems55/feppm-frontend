import { defineStore } from 'pinia';

import { useAuthStore } from './auth.js';

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? 'Unable to load notifications.');
  }
  return payload;
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: [],
    unreadCount: 0,
    loaded: false,
    loading: false,
    error: null,
  }),

  getters: {
    latest: (state) => state.items.slice(0, 5),
  },

  actions: {
    async fetchNotifications({ silent = false } = {}) {
      const auth = useAuthStore();
      if (!auth.isAuthenticated || this.loading) return this.items;
      if (!silent) this.loading = true;

      try {
        const response = await auth.authorizedFetch('/notifications?limit=100');
        const payload = await parseResponse(response);
        this.items = payload.data?.notifications ?? [];
        this.unreadCount = payload.data?.unreadCount ?? 0;
        this.loaded = true;
        this.error = null;
        return this.items;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        if (!silent) this.loading = false;
      }
    },

    async markRead(id) {
      const notification = this.items.find((item) => item.id === id);
      if (!notification || notification.readAt) return;

      const auth = useAuthStore();
      const response = await auth.authorizedFetch(`/notifications/${id}/read`, {
        method: 'POST',
      });
      await parseResponse(response);

      notification.readAt = new Date().toISOString();
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    },

    async markAllRead() {
      if (!this.unreadCount) return;
      const auth = useAuthStore();
      const response = await auth.authorizedFetch('/notifications/read-all', {
        method: 'POST',
      });
      await parseResponse(response);

      const readAt = new Date().toISOString();
      this.items.forEach((item) => {
        if (!item.readAt) item.readAt = readAt;
      });
      this.unreadCount = 0;
    },

    reset() {
      this.items = [];
      this.unreadCount = 0;
      this.loaded = false;
      this.loading = false;
      this.error = null;
    },
  },
});
