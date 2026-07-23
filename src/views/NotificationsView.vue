<script setup>
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  RefreshCw,
} from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { useNotificationStore } from '../stores/notifications.js';

const notifications = useNotificationStore();
const sidebarOpen = ref(false);
const filter = ref('all');
const actionError = ref('');

const visibleNotifications = computed(() => (
  filter.value === 'unread'
    ? notifications.items.filter((item) => !item.readAt)
    : notifications.items
));

function alertDetails(notification) {
  return notification.alert ?? {};
}

function formatTimestamp(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

async function refresh() {
  actionError.value = '';
  try {
    await notifications.fetchNotifications();
  } catch (error) {
    actionError.value = error.message;
  }
}

async function markRead(notification) {
  actionError.value = '';
  try {
    await notifications.markRead(notification.id);
  } catch (error) {
    actionError.value = error.message;
  }
}

async function markAllRead() {
  actionError.value = '';
  try {
    await notifications.markAllRead();
  } catch (error) {
    actionError.value = error.message;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />

      <main class="notifications-page">
        <header class="notifications-heading">
          <div>
            <span>Updates and alerts</span>
            <h1>Notifications</h1>
            <p>Task activity and operational updates assigned to your account.</p>
          </div>
          <div class="notifications-heading__actions">
            <button type="button" :disabled="notifications.loading" @click="refresh">
              <RefreshCw :size="17" :class="{ spin: notifications.loading }" />
              Refresh
            </button>
            <button
              class="primary"
              type="button"
              :disabled="!notifications.unreadCount"
              @click="markAllRead"
            >
              <CheckCheck :size="17" />
              Mark all read
            </button>
          </div>
        </header>

        <section class="notifications-panel">
          <div class="notifications-toolbar">
            <div class="notification-filters">
              <button
                type="button"
                :class="{ active: filter === 'all' }"
                @click="filter = 'all'"
              >
                All <span>{{ notifications.items.length }}</span>
              </button>
              <button
                type="button"
                :class="{ active: filter === 'unread' }"
                @click="filter = 'unread'"
              >
                Unread <span>{{ notifications.unreadCount }}</span>
              </button>
            </div>
          </div>

          <p v-if="actionError || notifications.error" class="notification-error">
            {{ actionError || notifications.error }}
          </p>

          <div v-if="notifications.loading && !notifications.loaded" class="notification-loading">
            <RefreshCw :size="22" class="spin" />
            Loading notifications…
          </div>

          <div v-else-if="!visibleNotifications.length" class="notification-empty">
            <span><Bell :size="30" /></span>
            <h2>{{ filter === 'unread' ? 'You are all caught up' : 'No notifications yet' }}</h2>
            <p>Task completions and other account updates will appear here.</p>
          </div>

          <div v-else class="notification-list">
            <button
              v-for="notification in visibleNotifications"
              :key="notification.id"
              type="button"
              class="notification-row"
              :class="{ unread: !notification.readAt }"
              @click="markRead(notification)"
            >
              <span class="notification-row__icon">
                <ClipboardCheck :size="21" />
              </span>
              <span class="notification-row__content">
                <span class="notification-row__title">
                  <strong>{{ alertDetails(notification).title }}</strong>
                  <i v-if="!notification.readAt" aria-label="Unread" />
                </span>
                <span class="notification-row__message">
                  {{ alertDetails(notification).message }}
                </span>
                <span class="notification-row__meta">
                  {{ alertDetails(notification).facility?.name || 'FEPPM' }}
                  <b>·</b>
                  {{ formatTimestamp(alertDetails(notification).triggeredAt) }}
                </span>
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
