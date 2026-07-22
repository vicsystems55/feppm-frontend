<script setup>
import { AlertCircle, RefreshCw } from '@lucide/vue';
import { computed, onMounted, ref } from 'vue';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { primaryRoleKey } from '../config/roleNavigation.js';
import { useAuthStore } from '../stores/auth.js';
import FacilityManagerDashboard from './dashboards/FacilityManagerDashboard.vue';
import LgaAdminDashboard from './dashboards/LgaAdminDashboard.vue';
import NationalAdminDashboard from './dashboards/NationalAdminDashboard.vue';
import StateAdminDashboard from './dashboards/StateAdminDashboard.vue';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard.vue';
import ZonalAdminDashboard from './dashboards/ZonalAdminDashboard.vue';

const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const error = ref('');
const dashboard = ref(null);

const dashboards = {
  SUPER_ADMIN: SuperAdminDashboard,
  NATIONAL_ADMIN: NationalAdminDashboard,
  ZONAL_ADMIN: ZonalAdminDashboard,
  STATE_ADMIN: StateAdminDashboard,
  LGA_ADMIN: LgaAdminDashboard,
  FACILITY_MANAGER: FacilityManagerDashboard,
};

const roleKey = computed(() => dashboard.value?.roleKey ?? primaryRoleKey(auth.user?.roles));
const activeDashboard = computed(() => dashboards[roleKey.value] ?? StateAdminDashboard);

async function loadDashboard() {
  loading.value = true;
  error.value = '';
  try {
    const response = await auth.authorizedFetch('/dashboard');
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || 'Unable to load your dashboard.');
    dashboard.value = payload.data;
  } catch (loadError) {
    error.value = loadError.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="mission-content">
        <div v-if="loading" class="dashboard-state"><span class="dashboard-loader" /><strong>Preparing your mission control…</strong><p>Loading the latest information for your role and scope.</p></div>
        <div v-else-if="error" class="dashboard-state dashboard-state--error"><AlertCircle :size="34" /><strong>Dashboard unavailable</strong><p>{{ error }}</p><button type="button" @click="loadDashboard"><RefreshCw :size="17" />Try again</button></div>
        <component :is="activeDashboard" v-else-if="dashboard" :data="dashboard" :user="auth.user" />
      </main>
    </div>
  </div>
</template>
