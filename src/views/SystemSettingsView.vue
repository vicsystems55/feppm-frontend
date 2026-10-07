<script setup>
import { Eye, EyeOff, LoaderCircle, Settings, ShieldCheck } from '@lucide/vue';
import { onMounted, ref } from 'vue';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { systemSettingsApi } from '../services/systemSettingsService.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const saving = ref(false);
const demoLoginsEnabled = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

async function loadSettings() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await systemSettingsApi.settings(auth);
    demoLoginsEnabled.value = data.demoLoginsEnabled;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function toggleDemoLogins() {
  const previousValue = demoLoginsEnabled.value;
  demoLoginsEnabled.value = !previousValue;
  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const data = await systemSettingsApi.setDemoLoginsEnabled(auth, demoLoginsEnabled.value);
    demoLoginsEnabled.value = data.demoLoginsEnabled;
    successMessage.value = demoLoginsEnabled.value
      ? 'Demo account shortcuts are now visible on the login page.'
      : 'Demo account shortcuts are now hidden from the login page.';
  } catch (error) {
    demoLoginsEnabled.value = previousValue;
    errorMessage.value = error.message;
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />

      <main class="settings-page">
        <header class="settings-heading">
          <span class="settings-heading__icon"><Settings :size="25" /></span>
          <div>
            <p>PLATFORM ADMINISTRATION</p>
            <h1>System settings</h1>
            <span>Control public access options and platform-wide behaviour.</span>
          </div>
        </header>

        <p v-if="errorMessage" class="settings-message error" role="alert">{{ errorMessage }}</p>
        <p v-if="successMessage" class="settings-message success" role="status">{{ successMessage }}</p>

        <section class="settings-panel">
          <div class="settings-panel__title">
            <span><ShieldCheck :size="21" /></span>
            <div>
              <h2>Login page access</h2>
              <p>Manage which sign-in conveniences are exposed publicly.</p>
            </div>
          </div>

          <div class="setting-row">
            <span class="setting-row__icon" :class="{ enabled: demoLoginsEnabled }">
              <Eye v-if="demoLoginsEnabled" :size="23" />
              <EyeOff v-else :size="23" />
            </span>
            <div class="setting-row__copy">
              <div class="setting-row__heading">
                <h3>Show demo logins</h3>
                <span :class="demoLoginsEnabled ? 'status-on' : 'status-off'">
                  {{ demoLoginsEnabled ? 'Visible' : 'Hidden' }}
                </span>
              </div>
              <p>
                When enabled, visitors can select a demo role to prefill its email and demo password.
                Turn this off when public demonstrations are not required.
              </p>
            </div>

            <LoaderCircle v-if="loading" class="spin" :size="24" />
            <button
              v-else
              class="toggle"
              :class="{ active: demoLoginsEnabled }"
              type="button"
              role="switch"
              :aria-checked="demoLoginsEnabled"
              :aria-label="demoLoginsEnabled ? 'Hide demo logins' : 'Show demo logins'"
              :disabled="saving"
              @click="toggleDemoLogins"
            >
              <span />
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.settings-page { min-height: calc(100vh - 76px); padding: 38px; background: #f5f8fc; }
.settings-heading { display: flex; align-items: center; gap: 16px; }
.settings-heading__icon { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 15px; color: #fff; background: linear-gradient(145deg, #086cd9, #0ba575); box-shadow: 0 10px 24px rgba(8,108,217,.18); }
.settings-heading p { margin: 0 0 4px; color: #0870db; font-size: 12px; font-weight: 800; letter-spacing: .08em; }
.settings-heading h1 { margin: 0; color: #102a4c; font-size: clamp(26px, 3vw, 36px); line-height: 1.2; }
.settings-heading div > span { display: block; margin-top: 7px; color: #66788f; font-size: 15px; line-height: 1.6; }
.settings-message { max-width: 920px; margin: 22px 0 -4px; padding: 12px 15px; border-radius: 10px; font-size: 14px; }
.settings-message.error { color: #a8241b; border: 1px solid #f1b1aa; background: #fff1ef; }
.settings-message.success { color: #087044; border: 1px solid #a7dfc4; background: #edfff6; }
.settings-panel { max-width: 920px; margin-top: 30px; padding: 26px; border: 1px solid #dce5f0; border-radius: 18px; background: #fff; box-shadow: 0 12px 35px rgba(19,48,80,.06); }
.settings-panel__title { display: flex; align-items: center; gap: 12px; padding-bottom: 22px; border-bottom: 1px solid #e6edf5; }
.settings-panel__title > span { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 12px; color: #086bd7; background: #eaf3ff; }
.settings-panel h2, .settings-panel h3 { margin: 0; color: #122d50; }
.settings-panel h2 { font-size: 19px; }.settings-panel h3 { font-size: 16px; }
.settings-panel__title p, .setting-row__copy > p { margin: 5px 0 0; color: #687a91; font-size: 14px; line-height: 1.6; }
.setting-row { min-height: 118px; display: flex; align-items: center; gap: 16px; padding-top: 22px; }
.setting-row__icon { width: 46px; height: 46px; display: grid; flex: 0 0 46px; place-items: center; border-radius: 13px; color: #66788f; background: #eef2f6; }
.setting-row__icon.enabled { color: #078551; background: #e4f8ef; }
.setting-row__copy { min-width: 0; flex: 1; }.setting-row__heading { display: flex; align-items: center; gap: 10px; }
.setting-row__heading span { padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.status-on { color: #087a4b; background: #dff7ec; }.status-off { color: #667085; background: #eef1f5; }
.toggle { width: 52px; height: 29px; padding: 3px; flex: 0 0 52px; border: 0; border-radius: 999px; background: #aab4c1; cursor: pointer; transition: background .2s; }
.toggle span { width: 23px; height: 23px; display: block; border-radius: 50%; background: #fff; box-shadow: 0 2px 5px rgba(15,35,60,.25); transition: transform .2s; }
.toggle.active { background: #0a9c64; }.toggle.active span { transform: translateX(23px); }.toggle:disabled { cursor: wait; opacity: .65; }
.spin { animation: spin .8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 700px) { .settings-page { padding: 26px 18px; }.settings-panel { padding: 20px; }.setting-row { align-items: flex-start; flex-wrap: wrap; }.setting-row__copy { flex-basis: calc(100% - 62px); }.toggle { margin-left: 62px; } }
</style>
