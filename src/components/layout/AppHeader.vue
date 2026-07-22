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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { primaryRoleKey } from '../../config/roleNavigation.js';
import { useAuthStore } from '../../stores/auth.js';

defineEmits(['toggle-menu']);

const auth = useAuthStore();
const router = useRouter();
const userMenuOpen = ref(false);
const userMenuRef = ref(null);
const signingOut = ref(false);
const fullName = computed(() => [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ') || 'User');
const roleName = computed(() => {
  const roleKey = primaryRoleKey(auth.user?.roles);
  return auth.user?.roles.find((role) => role.key === roleKey)?.name ?? 'User';
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
    signingOut.value = false;
    await router.replace({ name: 'login' });
  }
}

function closeUserMenu(event) {
  if (event.key === 'Escape' || !userMenuRef.value?.contains(event.target)) {
    userMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', closeUserMenu);
  document.addEventListener('keydown', closeUserMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeUserMenu);
  document.removeEventListener('keydown', closeUserMenu);
});
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
          {{ signingOut ? 'Signing out…' : 'Sign out' }}
        </button>
      </div>
    </div>
  </header>
</template>
