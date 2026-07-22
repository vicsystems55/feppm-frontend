<script setup>
import { computed, ref } from 'vue';
import { Construction } from '@lucide/vue';
import { useRoute } from 'vue-router';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { navigationForRoles } from '../config/roleNavigation.js';
import { useAuthStore } from '../stores/auth.js';

const route = useRoute();
const auth = useAuthStore();
const sidebarOpen = ref(false);

const activeItem = computed(() => navigationForRoles(auth.user?.roles)
  .flatMap((group) => group.items)
  .find((item) => item.to === route.path));

const title = computed(() => activeItem.value?.label ?? route.params.slug
  .split('-')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' '));
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="module-page">
        <div class="module-placeholder">
          <span class="module-placeholder-icon"><Construction :size="28" /></span>
          <p>FEPPM module</p>
          <h1>{{ title }}</h1>
          <span>This module is included in your role access and is ready for feature development.</span>
          <RouterLink to="/">Return to dashboard</RouterLink>
        </div>
      </main>
    </div>
  </div>
</template>
