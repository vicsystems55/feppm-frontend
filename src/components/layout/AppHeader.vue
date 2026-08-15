<script setup>
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Menu,
  Search,
} from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import LanguageSwitcher from '../i18n/LanguageSwitcher.vue';
import { primaryRoleKey } from '../../config/roleNavigation.js';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notifications.js';

defineEmits(['toggle-menu']);

const auth = useAuthStore();
const notifications = useNotificationStore();
const router = useRouter();
const { locale, t, te } = useI18n();
const userMenuOpen = ref(false);
const userMenuRef = ref(null);
const notificationMenuOpen = ref(false);
const notificationMenuRef = ref(null);
const signingOut = ref(false);
let notificationTimer;
const fullName = computed(() => [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || t('common.user'));
const roleName = computed(() => {
  const roleKey = primaryRoleKey(auth.user?.roles);
  const key = `roles.${roleKey}`;
  return te(key) ? t(key) : (auth.user?.roles.find((role) => role.key === roleKey)?.name ?? t('common.user'));
});
const initials = computed(() => [auth.user?.firstName, auth.user?.lastName]
  .filter(Boolean)
  .map((name) => name[0])
  .join('')
  .toUpperCase() || 'U');

async function signOut() {
  if (signingOut.value) return;
  signingOut.value = true;
  userMenuOpen.value = false;

  try {
    await auth.logout();
  } finally {
    notifications.reset();
    signingOut.value = false;
    await router.replace({ name: 'login' });
  }
}

function closeMenus(event) {
  if (event.key === 'Escape') {
    userMenuOpen.value = false;
    notificationMenuOpen.value = false;
    return;
  }
  if (!userMenuRef.value?.contains(event.target)) userMenuOpen.value = false;
  if (!notificationMenuRef.value?.contains(event.target)) notificationMenuOpen.value = false;
}

function relativeTime(value) {
  if (!value) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const formatter = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' });
  if (seconds < 60) return formatter.format(-seconds, 'second');
  if (seconds < 3600) return formatter.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return formatter.format(-Math.floor(seconds / 3600), 'hour');
  if (seconds < 604800) return formatter.format(-Math.floor(seconds / 86400), 'day');
  return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(value));
}

async function openNotification(notification) {
  notificationMenuOpen.value = false;
  try {
    await notifications.markRead(notification.id);
  } finally {
    if (notification.alert?.ticketId) {
      await router.push(`/modules/issues/${notification.alert.ticketId}`);
    } else {
      await router.push({ name: 'notifications' });
    }
  }
}

onMounted(() => {
  notifications.fetchNotifications().catch(() => {});
  notificationTimer = window.setInterval(() => {
    notifications.fetchNotifications({ silent: true }).catch(() => {});
  }, 60_000);
  document.addEventListener('click', closeMenus);
  document.addEventListener('keydown', closeMenus);
});

onBeforeUnmount(() => {
  window.clearInterval(notificationTimer);
  document.removeEventListener('click', closeMenus);
  document.removeEventListener('keydown', closeMenus);
});
</script>

<template>
  <header class="app-header">
    <button class="menu-toggle" type="button" :aria-label="t('navigation.open')" @click="$emit('toggle-menu')">
      <Menu :size="22" />
    </button>

    <label class="global-search">
      <Search :size="19" />
      <input type="search" :placeholder="t('header.searchPlaceholder')" />
      <kbd>⌘ K</kbd>
    </label>

    <div class="header-actions">
      <LanguageSwitcher compact />
      <button class="help-button" type="button" :aria-label="t('header.help')"><CircleHelp :size="20" /></button>
      <div ref="notificationMenuRef" class="notification-menu-wrap">
        <button
          class="notification-button"
          :class="{ 'has-badge': notifications.unreadCount > 0 }"
          type="button"
          :aria-label="t('header.notifications')"
          aria-haspopup="menu"
          :aria-expanded="notificationMenuOpen"
          @click.stop="notificationMenuOpen = !notificationMenuOpen; userMenuOpen = false"
        >
          <Bell :size="20" />
          <span v-if="notifications.unreadCount">
            {{ notifications.unreadCount > 99 ? '99+' : notifications.unreadCount }}
          </span>
        </button>

        <div v-if="notificationMenuOpen" class="notification-dropdown" role="menu">
          <header>
            <div>
              <strong>{{ t('header.notifications') }}</strong>
              <span>{{ t('header.unread', { count: notifications.unreadCount }) }}</span>
            </div>
            <button
              type="button"
              :disabled="!notifications.unreadCount"
              @click="notifications.markAllRead()"
            >
              {{ t('header.markAllRead') }}
            </button>
          </header>

          <div v-if="notifications.loading && !notifications.loaded" class="notification-dropdown-state">
            {{ t('common.loading') }}
          </div>
          <div v-else-if="!notifications.latest.length" class="notification-dropdown-state">
            {{ t('header.noNotifications') }}
          </div>
          <div v-else class="notification-dropdown-list">
            <button
              v-for="notification in notifications.latest"
              :key="notification.id"
              type="button"
              :class="{ unread: !notification.readAt }"
              @click="openNotification(notification)"
            >
              <span class="notification-dropdown-icon"><Bell :size="17" /></span>
              <span>
                <strong>{{ notification.alert.title }}</strong>
                <small>{{ notification.alert.message }}</small>
                <time>{{ relativeTime(notification.alert.triggeredAt) }}</time>
              </span>
              <i v-if="!notification.readAt" />
            </button>
          </div>

          <RouterLink to="/modules/notifications" @click="notificationMenuOpen = false">
            {{ t('header.viewAllNotifications') }}
          </RouterLink>
        </div>
      </div>
    </div>

    <div ref="userMenuRef" class="user-menu-wrap">
      <button
        class="user-menu"
        type="button"
        aria-haspopup="menu"
        :aria-expanded="userMenuOpen"
        @click.stop="userMenuOpen = !userMenuOpen"
      >
        <span class="avatar">{{ initials }}</span>
        <span class="user-copy"><b>{{ fullName }}</b><small>{{ roleName }}</small></span>
        <ChevronDown :size="16" :class="{ 'is-rotated': userMenuOpen }" />
      </button>

      <div v-if="userMenuOpen" class="user-dropdown" role="menu">
        <div class="user-dropdown-profile">
          <strong>{{ fullName }}</strong>
          <span>{{ auth.user?.email }}</span>
        </div>
        <button role="menuitem" type="button" :disabled="signingOut" @click="signOut">
          <LogOut :size="18" />
          {{ signingOut ? t('header.signingOut') : t('header.signOut') }}
        </button>
      </div>
    </div>
  </header>
</template>
