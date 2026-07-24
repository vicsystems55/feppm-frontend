<script setup>
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { useAuthStore } from '../stores/auth.js';

const route = useRoute();
const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const accounts = ref([]);
const roles = ref([]);
const permissions = ref([]);
const organizations = ref([]);
const pagination = ref({ page: 1, pageSize: 20, total: 0, pages: 1 });
const search = ref('');
const roleFilter = ref('');
const organizationFilter = ref('');
const statusFilter = ref('');
const drawerOpen = ref(false);
const editingId = ref(null);
const formError = ref('');
const selectedRoleId = ref('');
const permissionDraft = ref([]);
let searchTimer;

const form = reactive({
  firstName: '', lastName: '', email: '', phone: '', password: '',
  organizationId: '', roleId: '', scopeUnitId: '', facilityId: '', status: 'ACTIVE',
});

const permissionsTab = computed(() => route.name === 'roles-permissions');
const selectedOrganization = computed(() => organizations.value.find((item) => item.id === form.organizationId));
const selectedRole = computed(() => roles.value.find((item) => item.id === form.roleId));
const scopeType = computed(() => ({
  NATIONAL_ADMIN: 'NATIONAL', ZONAL_ADMIN: 'ZONE', STATE_ADMIN: 'STATE', LGA_ADMIN: 'LGA', FACILITY_MANAGER: 'LGA',
}[selectedRole.value?.key] ?? null));
const scopeOptions = computed(() => selectedOrganization.value?.administrativeUnits.filter((unit) => unit.type === scopeType.value) ?? []);
const facilityOptions = computed(() => {
  const facilities = selectedOrganization.value?.facilities ?? [];
  if (selectedRole.value?.key !== 'FACILITY_MANAGER') return facilities;
  if (!form.scopeUnitId) return [];
  return facilities.filter((facility) => facility.administrativeUnitId === form.scopeUnitId);
});
const permissionGroups = computed(() => Object.entries(permissions.value.reduce((groups, permission) => {
  const group = permission.key.split('.')[0].replaceAll('_', ' ');
  (groups[group] ??= []).push(permission);
  return groups;
}, {})));
const permissionRole = computed(() => roles.value.find((role) => role.id === selectedRoleId.value));

function apiPayload(response) {
  return response.json().catch(() => ({}));
}

async function loadOptions() {
  const response = await auth.authorizedFetch('/admin/access-options');
  const payload = await apiPayload(response);
  if (!response.ok) throw new Error(payload.message ?? 'Unable to load access options.');
  roles.value = payload.data.roles;
  permissions.value = payload.data.permissions;
  organizations.value = payload.data.organizations;
  if (!selectedRoleId.value) selectedRoleId.value = roles.value.find((role) => role.key !== 'SUPER_ADMIN')?.id ?? roles.value[0]?.id;
}

function accountQuery(page = pagination.value.page) {
  const params = new URLSearchParams({ page, pageSize: pagination.value.pageSize });
  if (search.value.trim()) params.set('search', search.value.trim());
  if (roleFilter.value) params.set('roleKey', roleFilter.value);
  if (organizationFilter.value) params.set('organizationId', organizationFilter.value);
  if (statusFilter.value) params.set('status', statusFilter.value);
  return params;
}

async function loadAccounts(page = 1) {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await auth.authorizedFetch(`/admin/accounts?${accountQuery(page)}`);
    const payload = await apiPayload(response);
    if (!response.ok) throw new Error(payload.message ?? 'Unable to load accounts.');
    accounts.value = payload.data.accounts;
    pagination.value = payload.data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

function clearForm() {
  Object.assign(form, {
    firstName: '', lastName: '', email: '', phone: '', password: '',
    organizationId: organizations.value[0]?.id ?? '',
    roleId: roles.value.find((role) => role.key === 'STATE_ADMIN')?.id ?? roles.value[0]?.id ?? '',
    scopeUnitId: '', facilityId: '', status: 'ACTIVE',
  });
  editingId.value = null;
  formError.value = '';
}

function openCreate() {
  clearForm();
  drawerOpen.value = true;
}

function openEdit(account) {
  editingId.value = account.id;
  Object.assign(form, {
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    phone: account.phone ?? '',
    password: '',
    organizationId: account.organization.id,
    roleId: account.roles[0]?.id ?? '',
    scopeUnitId: account.scopes[0]?.id ?? account.facility?.administrativeUnitId ?? '',
    facilityId: account.facility?.id ?? '',
    status: account.status,
  });
  formError.value = '';
  drawerOpen.value = true;
}

function organizationChanged() {
  form.scopeUnitId = '';
  form.facilityId = '';
}

function roleChanged() {
  form.scopeUnitId = '';
  form.facilityId = '';
}

function scopeChanged() {
  form.facilityId = '';
}

async function saveAccount() {
  saving.value = true;
  formError.value = '';
  try {
    const response = await auth.authorizedFetch(editingId.value ? `/admin/accounts/${editingId.value}` : '/admin/accounts', {
      method: editingId.value ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const payload = await apiPayload(response);
    if (!response.ok) throw new Error(payload.message ?? 'Unable to save this account.');
    successMessage.value = payload.message;
    drawerOpen.value = false;
    await loadAccounts(editingId.value ? pagination.value.page : 1);
  } catch (error) {
    formError.value = error.message;
  } finally {
    saving.value = false;
  }
}

async function savePermissions() {
  if (!permissionRole.value || permissionRole.value.key === 'SUPER_ADMIN') return;
  saving.value = true;
  errorMessage.value = '';
  try {
    const response = await auth.authorizedFetch(`/admin/roles/${selectedRoleId.value}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionKeys: permissionDraft.value }),
    });
    const payload = await apiPayload(response);
    if (!response.ok) throw new Error(payload.message ?? 'Unable to update permissions.');
    successMessage.value = payload.message;
    await loadOptions();
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    saving.value = false;
  }
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value)) : 'Never';
}

watch(selectedRoleId, () => { permissionDraft.value = [...(permissionRole.value?.permissions ?? [])]; });
watch([roleFilter, organizationFilter, statusFilter], () => loadAccounts(1));
watch(search, () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadAccounts(1), 350); });
watch(() => route.name, () => { successMessage.value = ''; errorMessage.value = ''; });

onMounted(async () => {
  try {
    await loadOptions();
    await loadAccounts();
  } catch (error) {
    errorMessage.value = error.message;
    loading.value = false;
  }
});
onBeforeUnmount(() => clearTimeout(searchTimer));
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="accounts-page">
        <header class="accounts-heading">
          <div><p>Administration</p><h1>Accounts & access</h1><span>Manage login accounts, roles, permissions and organizational scope.</span></div>
          <button v-if="!permissionsTab" type="button" @click="openCreate"><Plus :size="18" /> Create account</button>
        </header>

        <nav class="access-tabs">
          <RouterLink to="/modules/users"><Users :size="17" /> Login accounts</RouterLink>
          <RouterLink to="/modules/roles-permissions"><ShieldCheck :size="17" /> Roles & permissions</RouterLink>
        </nav>

        <p v-if="successMessage" class="access-message success">{{ successMessage }}</p>
        <p v-if="errorMessage" class="access-message error">{{ errorMessage }}</p>

        <section v-if="!permissionsTab" class="accounts-panel">
          <div class="account-filters">
            <label><Search :size="18" /><input v-model="search" type="search" placeholder="Search name or email" /></label>
            <select v-model="roleFilter"><option value="">All roles</option><option v-for="role in roles" :key="role.id" :value="role.key">{{ role.name }}</option></select>
            <select v-model="organizationFilter"><option value="">All organizations</option><option v-for="organization in organizations" :key="organization.id" :value="organization.id">{{ organization.name }}</option></select>
            <select v-model="statusFilter"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></select>
          </div>
          <div v-if="loading" class="access-loading"><LoaderCircle class="spin" :size="25" /> Loading accounts…</div>
          <div v-else class="accounts-table-wrap">
            <table class="accounts-table">
              <thead><tr><th>Account</th><th>Role</th><th>Organization</th><th>Scope</th><th>Status</th><th>Last login</th><th></th></tr></thead>
              <tbody>
                <tr v-for="account in accounts" :key="account.id">
                  <td><div class="account-person"><span>{{ account.firstName[0] }}{{ account.lastName[0] }}</span><div><strong>{{ account.firstName }} {{ account.lastName }}</strong><small>{{ account.email }}</small></div></div></td>
                  <td><span class="role-pill">{{ account.roles[0]?.name ?? 'No role' }}</span></td>
                  <td>{{ account.organization.name }}</td>
                  <td><strong>{{ account.facility?.name ?? account.scopes[0]?.name ?? 'Platform-wide' }}</strong><small>{{ account.facility ? 'Facility' : account.scopes[0]?.type ?? 'All organizations' }}</small></td>
                  <td><span class="account-status" :class="account.status.toLowerCase()">{{ account.status }}</span></td>
                  <td>{{ formatDate(account.lastLoginAt) }}</td>
                  <td><button class="edit-account" type="button" @click="openEdit(account)"><Pencil :size="16" /> Manage</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <footer v-if="pagination.total" class="accounts-pagination"><span>{{ pagination.total }} login accounts</span><div><button :disabled="pagination.page === 1" @click="loadAccounts(pagination.page - 1)"><ChevronLeft :size="17" /></button><b>Page {{ pagination.page }} of {{ pagination.pages }}</b><button :disabled="pagination.page === pagination.pages" @click="loadAccounts(pagination.page + 1)"><ChevronRight :size="17" /></button></div></footer>
        </section>

        <section v-else class="permissions-layout">
          <aside class="roles-list">
            <h2>System roles</h2>
            <button v-for="role in roles" :key="role.id" type="button" :class="{ active: selectedRoleId === role.id }" @click="selectedRoleId = role.id">
              <span><ShieldCheck :size="18" /></span><div><strong>{{ role.name }}</strong><small>{{ role._count.users }} accounts · {{ role.permissions.length }} permissions</small></div>
            </button>
          </aside>
          <div v-if="permissionRole" class="permissions-panel">
            <div class="permissions-title"><div><p>Role permissions</p><h2>{{ permissionRole.name }}</h2><span>{{ permissionRole.description }}</span></div><button type="button" :disabled="saving || permissionRole.key === 'SUPER_ADMIN'" @click="savePermissions"><KeyRound :size="17" /> {{ saving ? 'Saving…' : 'Save permissions' }}</button></div>
            <p v-if="permissionRole.key === 'SUPER_ADMIN'" class="protected-note">Super Admin access is protected to prevent platform lockout.</p>
            <div class="permission-groups">
              <section v-for="group in permissionGroups" :key="group[0]"><h3>{{ group[0] }}</h3><label v-for="permission in group[1]" :key="permission.id"><input v-model="permissionDraft" type="checkbox" :value="permission.key" :disabled="permissionRole.key === 'SUPER_ADMIN'" /><span><strong>{{ permission.key }}</strong><small>{{ permission.description }}</small></span></label></section>
            </div>
          </div>
        </section>
      </main>
    </div>

    <div v-if="drawerOpen" class="account-drawer-backdrop" @click.self="drawerOpen = false">
      <aside class="account-drawer">
        <button class="drawer-close" type="button" @click="drawerOpen = false"><X :size="21" /></button>
        <span class="drawer-icon"><UserCog :size="25" /></span><p>{{ editingId ? 'Manage access' : 'New login account' }}</p><h2>{{ editingId ? `${form.firstName} ${form.lastName}` : 'Create account' }}</h2>
        <p v-if="formError" class="access-message error">{{ formError }}</p>
        <form @submit.prevent="saveAccount">
          <div class="form-row"><label>First name<input v-model="form.firstName" required /></label><label>Last name<input v-model="form.lastName" required /></label></div>
          <label>Email address<input v-model="form.email" type="email" required :disabled="Boolean(editingId)" /></label>
          <label>Phone number<input v-model="form.phone" type="tel" /></label>
          <label v-if="!editingId">Temporary password<input v-model="form.password" type="password" minlength="10" required /></label>
          <label>Organization<select v-model="form.organizationId" required @change="organizationChanged"><option disabled value="">Select organization</option><option v-for="organization in organizations" :key="organization.id" :value="organization.id">{{ organization.name }}</option></select></label>
          <label>Role<select v-model="form.roleId" required @change="roleChanged"><option disabled value="">Select role</option><option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option></select></label>
          <label v-if="scopeType">{{ selectedRole?.key === 'FACILITY_MANAGER' ? 'Local government area (LGA)' : `${scopeType.toLowerCase()} scope` }}<select v-model="form.scopeUnitId" required @change="scopeChanged"><option disabled value="">Select {{ selectedRole?.key === 'FACILITY_MANAGER' ? 'LGA' : 'scope' }}</option><option v-for="unit in scopeOptions" :key="unit.id" :value="unit.id">{{ unit.name }}</option></select></label>
          <label v-if="selectedRole?.key === 'FACILITY_MANAGER'">Health facility<select v-model="form.facilityId" required :disabled="!form.scopeUnitId"><option disabled value="">{{ form.scopeUnitId ? 'Select health facility' : 'Select an LGA first' }}</option><option v-for="facility in facilityOptions" :key="facility.id" :value="facility.id">{{ facility.name }}</option></select><small v-if="form.scopeUnitId && !facilityOptions.length" class="field-help">No active health facilities are registered under this LGA.</small></label>
          <label v-if="editingId">Account status<select v-model="form.status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></select></label>
          <button class="save-account" type="submit" :disabled="saving">{{ saving ? 'Saving changes…' : editingId ? 'Save access changes' : 'Create login account' }}</button>
        </form>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.accounts-page { padding: 24px; }.accounts-heading { display:flex;justify-content:space-between;align-items:flex-start;gap:20px }.accounts-heading p,.permissions-title p,.account-drawer>p { margin:0 0 5px;color:var(--blue);font-size:12px;font-weight:650 }.accounts-heading h1 { margin:0;font-size:28px }.accounts-heading>div>span { color:var(--muted);font-size:14px }.accounts-heading>button,.permissions-title button { padding:10px 14px;display:flex;align-items:center;gap:8px;border:0;border-radius:9px;color:#fff;background:var(--blue);font-size:12px;font-weight:650;cursor:pointer }.access-tabs { margin:22px 0 15px;display:flex;gap:6px;border-bottom:1px solid var(--border) }.access-tabs a { padding:10px 13px;display:flex;align-items:center;gap:7px;color:#667085;font-size:12px;font-weight:600;border-bottom:2px solid transparent }.access-tabs a.router-link-exact-active { color:var(--blue);border-color:var(--blue) }.access-message { padding:10px 12px;border-radius:8px;font-size:12px }.access-message.success { color:#067647;background:#ecfdf3 }.access-message.error { color:#b42318;background:var(--red-soft) }
.accounts-panel,.roles-list,.permissions-panel { border:1px solid var(--border);border-radius:13px;background:#fff;overflow:hidden }.account-filters { padding:13px;display:grid;grid-template-columns:minmax(250px,1fr) repeat(3,minmax(145px,auto));gap:9px;border-bottom:1px solid var(--border) }.account-filters label { height:41px;padding:0 11px;display:flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:8px;color:#98a2b3 }.account-filters input { width:100%;border:0;outline:0;font-size:12px }.account-filters select { padding:0 9px;border:1px solid var(--border);border-radius:8px;background:#fff;font-size:11px }.access-loading { min-height:280px;display:flex;align-items:center;justify-content:center;gap:8px;color:var(--muted);font-size:12px }.spin { animation:spin 1s linear infinite }@keyframes spin{to{transform:rotate(360deg)}}.accounts-table-wrap{overflow-x:auto}.accounts-table{width:100%;min-width:1050px;border-collapse:collapse}.accounts-table th{padding:11px 13px;background:#f8fafc;color:#667085;font-size:10px;letter-spacing:.05em;text-align:left;text-transform:uppercase}.accounts-table td{padding:13px;border-top:1px solid #eef1f5;color:#475467;font-size:11px}.accounts-table td>strong,.account-person strong{display:block;color:#1d2939;font-size:12px}.accounts-table td>small,.account-person small{display:block;margin-top:3px;color:var(--muted);font-size:10px}.account-person{display:flex;align-items:center;gap:9px}.account-person>span{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;color:var(--blue);background:var(--blue-soft);font-size:11px;font-weight:700}.role-pill,.account-status{padding:4px 8px;border-radius:999px;font-size:10px;font-weight:650}.role-pill{color:var(--blue);background:var(--blue-soft)}.account-status.active{color:#067647;background:#ecfdf3}.account-status.inactive{color:#b42318;background:#fef3f2}.account-status.suspended{color:#b54708;background:#fff7ed}.edit-account{padding:7px 9px;display:flex;align-items:center;gap:5px;border:1px solid #cfe0f8;border-radius:7px;color:var(--blue);background:#fff;font-size:10px;font-weight:650;cursor:pointer}.accounts-pagination{padding:11px 13px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);color:var(--muted);font-size:11px}.accounts-pagination div{display:flex;align-items:center;gap:9px}.accounts-pagination button{width:32px;height:30px;display:grid;place-items:center;border:1px solid var(--border);border-radius:7px;background:#fff}.accounts-pagination button:disabled{opacity:.4}
.permissions-layout{display:grid;grid-template-columns:270px minmax(0,1fr);gap:14px;align-items:start}.roles-list{padding:12px}.roles-list h2{margin:3px 7px 10px;font-size:14px}.roles-list button{width:100%;padding:10px;display:flex;align-items:center;gap:9px;border:0;border-radius:9px;background:transparent;text-align:left;cursor:pointer}.roles-list button.active{background:var(--blue-soft)}.roles-list button>span{width:34px;height:34px;display:grid;place-items:center;border-radius:8px;color:var(--blue);background:#f2f6fc}.roles-list button div{display:flex;flex-direction:column}.roles-list strong{font-size:11px}.roles-list small{margin-top:2px;color:var(--muted);font-size:9px}.permissions-panel{padding:19px}.permissions-title{display:flex;justify-content:space-between;gap:18px}.permissions-title h2{margin:0;font-size:21px}.permissions-title span{display:block;margin-top:4px;color:var(--muted);font-size:11px}.permissions-title button:disabled{opacity:.5;cursor:not-allowed}.protected-note{padding:10px;border-radius:8px;color:#b54708;background:#fff7ed;font-size:11px}.permission-groups{margin-top:18px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.permission-groups section{padding:13px;border:1px solid var(--border);border-radius:10px}.permission-groups h3{margin:0 0 9px;text-transform:capitalize;font-size:12px}.permission-groups label{padding:7px 0;display:flex;align-items:flex-start;gap:8px}.permission-groups input{margin-top:3px;accent-color:var(--blue)}.permission-groups label span{display:flex;flex-direction:column}.permission-groups strong{font-size:10px}.permission-groups small{margin-top:2px;color:var(--muted);font-size:9px;line-height:1.4}
.account-drawer-backdrop{position:fixed;inset:0;z-index:80;display:flex;justify-content:flex-end;background:rgba(16,24,40,.42)}.account-drawer{position:relative;width:min(470px,100%);height:100%;padding:26px;overflow-y:auto;background:#fff;box-shadow:-18px 0 45px rgba(16,24,40,.16)}.drawer-close{position:absolute;right:20px;top:20px;width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--border);border-radius:8px;background:#fff}.drawer-icon{width:49px;height:49px;display:grid;place-items:center;border-radius:12px;color:var(--blue);background:var(--blue-soft)}.account-drawer>p{margin-top:14px}.account-drawer h2{margin:0 0 17px;font-size:21px}.account-drawer form{display:grid;gap:12px}.account-drawer label{display:flex;flex-direction:column;gap:5px;color:#344054;font-size:11px;font-weight:600}.account-drawer input,.account-drawer select{height:41px;padding:0 10px;border:1px solid var(--border);border-radius:8px;background:#fff;font-size:12px}.account-drawer input:disabled{color:#667085;background:#f8fafc}.form-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.save-account{margin-top:5px;height:43px;border:0;border-radius:9px;color:#fff;background:var(--blue);font-size:12px;font-weight:650}.save-account:disabled{opacity:.6}
@media(max-width:950px){.account-filters{grid-template-columns:1fr 1fr}.permissions-layout{grid-template-columns:1fr}.roles-list{display:flex;overflow-x:auto}.roles-list h2{display:none}.roles-list button{min-width:190px}.permission-groups{grid-template-columns:1fr}}@media(max-width:650px){.accounts-page{padding:14px 10px}.accounts-heading{flex-direction:column}.account-filters{grid-template-columns:1fr}.permission-groups{grid-template-columns:1fr}.permissions-title{flex-direction:column}.form-row{grid-template-columns:1fr}}
.account-drawer select:disabled{color:#667085;background:#f8fafc}.field-help{color:#b54708;font-size:10px;font-weight:500}
</style>
