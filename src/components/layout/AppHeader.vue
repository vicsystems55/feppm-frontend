<script setup>
import {
  Bell,
  ChevronDown,
  CircleHelp,
  LogOut,
  Mail,
  Menu,
  Search,
} from '@lucide/vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '../../stores/auth.js';

defineEmits(['toggle-menu']);

const auth = useAuthStore();
const router = useRouter();
const fullName = computed(() => [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || 'Super Admin');
const initials = computed(() => [auth.user?.firstName, auth.user?.lastName]
  .filter(Boolean)
  .map((name) => name[0])
  .join('')
  .toUpperCase() || 'SA');

async function signOut() {
  await auth.logout();
  await router.replace({ name: 'login' });
}
</script>

<template>
  <header class="app-header">
    <button class="menu-toggle" type="button" aria-label="Open navigation" @click="$emit('toggle-menu')">
      <Menu :size="22" />
    </button>

    <label class="global-search">
      <Search :size="19" />
      <input type="search" placeholder="Search equipment, work orders, facilities..." />
      <kbd>⌘ K</kbd>
    </label>

    <div class="header-actions">
      <button type="button" aria-label="Help"><CircleHelp :size="20" /></button>
      <button class="has-badge" type="button" aria-label="Messages">
        <Mail :size="20" />
        <span>3</span>
      </button>
      <button class="has-badge" type="button" aria-label="Notifications">
        <Bell :size="20" />
        <span>12</span>
      </button>
      <button type="button" aria-label="Sign out" title="Sign out" @click="signOut">
        <LogOut :size="20" />
      </button>
    </div>

    <button class="user-menu" type="button">
      <span class="avatar">{{ initials }}</span>
      <span class="user-copy"><b>{{ fullName }}</b><small>Super Admin</small></span>
      <ChevronDown :size="16" />
    </button>
  </header>
</template>
