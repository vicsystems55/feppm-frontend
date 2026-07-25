<script setup>
import {
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Eye,
  Filter,
  LoaderCircle,
  Search,
  Settings2,
  ShieldCheck,
  Wrench,
  X,
} from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const detailLoading = ref(false);
const errorMessage = ref('');
const equipment = ref([]);
const facilities = ref([]);
const equipmentTypes = ref([]);
const selectedEquipment = ref(null);
const pagination = ref({ page: 1, pageSize: 20, total: 0, pages: 1 });
const summary = ref({
  total: 0, functional: 0, partial: 0, nonFunctional: 0, underRepair: 0, unknown: 0,
});
const filters = reactive({
  search: '',
  facilityId: '',
  equipmentTypeId: '',
  functionality: '',
  condition: '',
});

const scopeName = computed(() => auth.user?.scopes?.[0]?.name ?? auth.user?.organization?.name ?? 'your LGA');
const summaryCards = computed(() => [
  { label: 'Total equipment', value: summary.value.total, icon: Boxes, tone: 'blue' },
  { label: 'Functional', value: summary.value.functional, icon: CircleCheckBig, tone: 'green' },
  { label: 'Partially functional', value: summary.value.partial, icon: Settings2, tone: 'orange' },
  { label: 'Non-functional', value: summary.value.nonFunctional, icon: CircleAlert, tone: 'red' },
  { label: 'Under repair', value: summary.value.underRepair, icon: Wrench, tone: 'violet' },
  { label: 'Unknown status', value: summary.value.unknown, icon: ShieldCheck, tone: 'gray' },
]);

function query(page = 1) {
  const params = new URLSearchParams({ page, pageSize: 20 });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

async function loadEquipment(page = 1) {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await auth.authorizedFetch(`/lga/equipment?${query(page)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message ?? 'Unable to load LGA equipment.');
    equipment.value = payload.data.equipment;
    summary.value = payload.data.summary;
    facilities.value = payload.data.filters.facilities;
    equipmentTypes.value = payload.data.filters.equipmentTypes;
    pagination.value = payload.data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function viewEquipment(item) {
  selectedEquipment.value = item;
  detailLoading.value = true;
  try {
    const response = await auth.authorizedFetch(`/lga/equipment/${item.id}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message ?? 'Unable to load equipment details.');
    selectedEquipment.value = payload.data.equipment;
  } catch (error) {
    errorMessage.value = error.message;
    selectedEquipment.value = null;
  } finally {
    detailLoading.value = false;
  }
}

function resetFilters() {
  Object.assign(filters, {
    search: '', facilityId: '', equipmentTypeId: '', functionality: '', condition: '',
  });
  loadEquipment(1);
}

function changePage(page) {
  if (page < 1 || page > pagination.value.pages || page === pagination.value.page) return;
  loadEquipment(page);
}

function label(value) {
  return String(value ?? 'UNKNOWN')
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value));
}

onMounted(() => loadEquipment());
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="lga-equipment-page">
        <header class="equipment-heading">
          <div><p>LGA equipment registry</p><h1>Equipment across {{ scopeName }}</h1><span>Monitor equipment location, condition, functionality and maintenance coverage.</span></div>
          <span class="scope-chip"><Building2 :size="17" /> {{ scopeName }}</span>
        </header>

        <section class="equipment-summary-grid" aria-label="Equipment summary">
          <article v-for="card in summaryCards" :key="card.label">
            <span :class="card.tone"><component :is="card.icon" :size="20" /></span>
            <div><small>{{ card.label }}</small><strong>{{ card.value.toLocaleString() }}</strong></div>
          </article>
        </section>

        <section class="equipment-panel">
          <form class="equipment-filters" @submit.prevent="loadEquipment(1)">
            <label class="equipment-search"><Search :size="17" /><input v-model="filters.search" type="search" placeholder="Search asset code, serial, type or facility" /></label>
            <select v-model="filters.facilityId"><option value="">All facilities</option><option v-for="facility in facilities" :key="facility.id" :value="facility.id">{{ facility.name }}</option></select>
            <select v-model="filters.equipmentTypeId"><option value="">All equipment types</option><option v-for="type in equipmentTypes" :key="type.id" :value="type.id">{{ type.name }}</option></select>
            <select v-model="filters.functionality"><option value="">All functionality</option><option value="FUNCTIONAL">Functional</option><option value="PARTIALLY_FUNCTIONAL">Partially functional</option><option value="NON_FUNCTIONAL">Non-functional</option><option value="UNDER_REPAIR">Under repair</option><option value="DECOMMISSIONED">Decommissioned</option><option value="UNKNOWN">Unknown</option></select>
            <select v-model="filters.condition"><option value="">All conditions</option><option value="EXCELLENT">Excellent</option><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="POOR">Poor</option><option value="CRITICAL">Critical</option><option value="UNKNOWN">Unknown</option></select>
            <button class="apply-filter" type="submit"><Filter :size="15" /> Apply</button>
            <button class="reset-filter" type="button" @click="resetFilters">Reset</button>
          </form>

          <p v-if="errorMessage" class="equipment-error">{{ errorMessage }}</p>
          <div v-if="loading" class="equipment-state"><LoaderCircle class="spin" :size="27" /> Loading equipment registry…</div>
          <div v-else-if="equipment.length" class="equipment-table-wrap">
            <table class="equipment-table">
              <thead><tr><th>Asset</th><th>Facility</th><th>Equipment type</th><th>Model</th><th>Functionality</th><th>Condition</th><th>Schedules</th><th><span class="sr-only">Action</span></th></tr></thead>
              <tbody>
                <tr v-for="item in equipment" :key="item.id">
                  <td><strong>{{ item.assetCode }}</strong><small>{{ item.serialNumber || 'No serial number' }}</small></td>
                  <td><strong>{{ item.facility.name }}</strong><small>{{ item.department?.name || 'No department' }}</small></td>
                  <td><strong>{{ item.equipmentType.name }}</strong><small>{{ item.equipmentType.category.name }}</small></td>
                  <td><strong>{{ item.equipmentModel?.modelName || 'Not recorded' }}</strong><small>{{ item.equipmentModel?.manufacturer?.name || 'Manufacturer unknown' }}</small></td>
                  <td><span class="status-pill" :class="item.functionalityStatus.toLowerCase()">{{ label(item.functionalityStatus) }}</span></td>
                  <td><span class="condition-pill" :class="item.conditionStatus.toLowerCase()">{{ label(item.conditionStatus) }}</span></td>
                  <td><strong>{{ item._count.schedules }}</strong><small>{{ item._count.tasks }} generated tasks</small></td>
                  <td><button class="view-equipment" type="button" @click="viewEquipment(item)"><Eye :size="15" /> View</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="equipment-state equipment-empty"><Boxes :size="34" /><strong>No equipment found</strong><span>Try changing the selected facility or equipment filters.</span></div>
          <footer v-if="!loading && pagination.total" class="equipment-pagination"><span>Showing {{ (pagination.page - 1) * pagination.pageSize + 1 }}–{{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} of {{ pagination.total }}</span><div><button type="button" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)"><ChevronLeft :size="16" /> Previous</button><b>Page {{ pagination.page }} of {{ pagination.pages }}</b><button type="button" :disabled="pagination.page === pagination.pages" @click="changePage(pagination.page + 1)">Next <ChevronRight :size="16" /></button></div></footer>
        </section>
      </main>
    </div>

    <div v-if="selectedEquipment" class="equipment-backdrop" @click.self="selectedEquipment = null">
      <aside class="equipment-detail">
        <button class="detail-close" type="button" aria-label="Close details" @click="selectedEquipment = null"><X :size="20" /></button>
        <div v-if="detailLoading" class="equipment-state"><LoaderCircle class="spin" :size="27" /> Loading equipment…</div>
        <template v-else>
          <span class="detail-icon"><Boxes :size="26" /></span><p>{{ selectedEquipment.assetCode }}</p><h2>{{ selectedEquipment.equipmentType.name }}</h2>
          <div class="detail-statuses"><span class="status-pill" :class="selectedEquipment.functionalityStatus.toLowerCase()">{{ label(selectedEquipment.functionalityStatus) }}</span><span class="condition-pill" :class="selectedEquipment.conditionStatus.toLowerCase()">{{ label(selectedEquipment.conditionStatus) }}</span></div>
          <section class="detail-section"><h3>Equipment information</h3><dl><div><dt>Facility</dt><dd>{{ selectedEquipment.facility.name }}</dd></div><div><dt>Department</dt><dd>{{ selectedEquipment.department?.name || 'Not assigned' }}</dd></div><div><dt>Serial number</dt><dd>{{ selectedEquipment.serialNumber || 'Not recorded' }}</dd></div><div><dt>Model</dt><dd>{{ selectedEquipment.equipmentModel?.modelName || 'Not recorded' }}</dd></div><div><dt>Manufacturer</dt><dd>{{ selectedEquipment.equipmentModel?.manufacturer?.name || 'Not recorded' }}</dd></div><div><dt>Power source</dt><dd>{{ selectedEquipment.powerSource || 'Not recorded' }}</dd></div><div><dt>Installed</dt><dd>{{ formatDate(selectedEquipment.installationDate) }}</dd></div><div><dt>Warranty ends</dt><dd>{{ formatDate(selectedEquipment.warrantyEndDate) }}</dd></div><div><dt>Data source</dt><dd>{{ selectedEquipment.source || 'FEPPM registry' }}</dd></div></dl></section>
          <section class="detail-section"><h3>Maintenance coverage</h3><article v-for="schedule in selectedEquipment.schedules" :key="schedule.id" class="schedule-card"><span>{{ schedule.checklistTemplate.frequencyType }}</span><div><strong>{{ schedule.checklistTemplate.name }}</strong><small>{{ schedule.active ? 'Active schedule' : 'Inactive schedule' }}</small></div></article><p v-if="!selectedEquipment.schedules.length" class="no-records">No maintenance schedule is attached.</p></section>
        </template>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.lga-equipment-page { padding: 24px; }.equipment-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }.equipment-heading p { margin: 0 0 5px; color: var(--blue); font-size: 12px; font-weight: 650; }.equipment-heading h1 { margin: 0; font-size: 28px; }.equipment-heading > div > span { display: block; margin-top: 6px; color: var(--muted); font-size: 13px; }.scope-chip { padding: 9px 12px; display: flex; align-items: center; gap: 7px; border-radius: 9px; color: #175cd3; background: #eaf2ff; font-size: 11px; font-weight: 650; }
.equipment-summary-grid { margin: 20px 0 14px; display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap: 9px; }.equipment-summary-grid article { min-width: 0; padding: 13px; display: flex; align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: 10px; background: #fff; }.equipment-summary-grid article > span { width: 34px; height: 34px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 8px; }.equipment-summary-grid .blue { color: #175cd3; background: #eaf2ff; }.equipment-summary-grid .green { color: #067647; background: #e7f8ef; }.equipment-summary-grid .orange { color: #b54708; background: #fff3df; }.equipment-summary-grid .red { color: #b42318; background: #feeceb; }.equipment-summary-grid .violet { color: #6941c6; background: #f0ebff; }.equipment-summary-grid .gray { color: #475467; background: #eef2f6; }.equipment-summary-grid div { min-width: 0; display: flex; flex-direction: column; }.equipment-summary-grid small { overflow: hidden; color: #667085; font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }.equipment-summary-grid strong { margin-top: 2px; font-size: 19px; }
.equipment-panel { overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: #fff; }.equipment-filters { padding: 12px; display: grid; grid-template-columns: minmax(240px,1.2fr) repeat(4,minmax(140px,.7fr)) auto auto; gap: 7px; border-bottom: 1px solid var(--border); }.equipment-search { height: 40px; padding: 0 10px; display: flex; align-items: center; gap: 7px; border: 1px solid var(--border); border-radius: 8px; color: #98a2b3; }.equipment-search input { width: 100%; border: 0; outline: 0; font-size: 10px; }.equipment-filters select { min-width: 0; height: 40px; padding: 0 8px; border: 1px solid var(--border); border-radius: 8px; color: #475467; background: #fff; font-size: 9px; }.apply-filter,.reset-filter { height: 40px; padding: 0 10px; display: flex; align-items: center; justify-content: center; gap: 5px; border: 0; border-radius: 8px; color: #fff; background: #1570ef; font-size: 9px; font-weight: 650; cursor: pointer; }.reset-filter { color: #475467; border: 1px solid var(--border); background: #fff; }.equipment-error { margin: 10px 12px 0; padding: 9px 11px; border-radius: 8px; color: #b42318; background: #feeceb; font-size: 10px; }.equipment-state { min-height: 290px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #667085; font-size: 11px; }.equipment-empty { flex-direction: column; }.equipment-empty strong { color: #344054; font-size: 14px; }
.equipment-table-wrap { overflow-x: auto; }.equipment-table { width: 100%; min-width: 1100px; border-collapse: collapse; }.equipment-table th { padding: 10px 12px; color: #667085; background: #f8fafc; font-size: 8px; letter-spacing: .05em; text-align: left; text-transform: uppercase; }.equipment-table td { padding: 11px 12px; border-top: 1px solid #eef1f5; color: #475467; font-size: 10px; }.equipment-table td strong,.equipment-table td small { display: block; }.equipment-table td strong { color: #344054; font-size: 10px; }.equipment-table td small { margin-top: 3px; color: #98a2b3; font-size: 8px; }.status-pill,.condition-pill { padding: 5px 7px; display: inline-flex; border-radius: 999px; color: #475467; background: #eef2f6; font-size: 8px; font-weight: 700; }.status-pill.functional { color: #067647; background: #e7f8ef; }.status-pill.partially_functional { color: #b54708; background: #fff3df; }.status-pill.non_functional,.condition-pill.critical,.condition-pill.poor { color: #b42318; background: #feeceb; }.status-pill.under_repair { color: #6941c6; background: #f0ebff; }.condition-pill.excellent,.condition-pill.good { color: #067647; background: #e7f8ef; }.condition-pill.fair { color: #b54708; background: #fff3df; }.view-equipment { padding: 6px 8px; display: flex; align-items: center; gap: 4px; border: 1px solid #cfe0f8; border-radius: 7px; color: #1570ef; background: #fff; font-size: 9px; cursor: pointer; }
.equipment-pagination { padding: 11px 13px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); color: #667085; font-size: 9px; }.equipment-pagination div { display: flex; align-items: center; gap: 8px; }.equipment-pagination button { padding: 6px 8px; display: flex; align-items: center; gap: 4px; border: 1px solid var(--border); border-radius: 7px; background: #fff; font-size: 9px; cursor: pointer; }.equipment-pagination button:disabled { opacity: .45; }
.equipment-backdrop { position: fixed; inset: 0; z-index: 90; display: flex; justify-content: flex-end; background: rgba(16,24,40,.48); }.equipment-detail { position: relative; width: min(520px,100%); height: 100%; padding: 25px; overflow-y: auto; background: #fff; }.detail-close { position: absolute; top: 17px; right: 17px; width: 35px; height: 35px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 8px; background: #fff; cursor: pointer; }.detail-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 12px; color: #1570ef; background: #eaf2ff; }.equipment-detail > p { margin: 13px 0 3px; color: #1570ef; font-size: 9px; font-weight: 700; }.equipment-detail h2 { margin: 0 45px 9px 0; font-size: 21px; }.detail-statuses { display: flex; gap: 6px; }.detail-section { margin-top: 22px; padding-top: 18px; border-top: 1px solid #eef1f5; }.detail-section h3 { margin: 0 0 11px; font-size: 12px; }.detail-section dl { margin: 0; display: grid; gap: 10px; }.detail-section dl div { display: grid; grid-template-columns: 120px 1fr; gap: 9px; }.detail-section dt { color: #98a2b3; font-size: 9px; }.detail-section dd { margin: 0; color: #344054; font-size: 10px; }.schedule-card { padding: 10px; display: grid; grid-template-columns: 62px 1fr; gap: 9px; border: 1px solid var(--border); border-radius: 8px; }.schedule-card + .schedule-card { margin-top: 7px; }.schedule-card > span { padding: 5px; align-self: center; border-radius: 6px; color: #175cd3; background: #eaf2ff; font-size: 7px; font-weight: 700; text-align: center; }.schedule-card div { display: flex; flex-direction: column; }.schedule-card strong { font-size: 10px; }.schedule-card small,.no-records { margin-top: 3px; color: #98a2b3; font-size: 8px; }.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
@media(max-width:1350px){.equipment-summary-grid{grid-template-columns:repeat(3,1fr)}.equipment-filters{grid-template-columns:repeat(4,1fr)}.equipment-search{grid-column:span 2}}@media(max-width:760px){.lga-equipment-page{padding:14px 10px}.equipment-heading{flex-direction:column}.equipment-summary-grid{grid-template-columns:repeat(2,1fr)}.equipment-filters{grid-template-columns:repeat(2,1fr)}.equipment-search{grid-column:span 2}.equipment-pagination{align-items:flex-start;flex-direction:column;gap:9px}.equipment-pagination div{width:100%;justify-content:space-between}}@media(max-width:480px){.equipment-summary-grid,.equipment-filters{grid-template-columns:1fr}.equipment-search{grid-column:auto}.equipment-detail{padding:21px 16px}.detail-section dl div{grid-template-columns:1fr;gap:2px}}
</style>
