<script setup>
import {
  Boxes,
  Building2,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CircleX,
  Eye,
  Hospital,
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  Search,
  UserRound,
  X,
} from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const detailLoading = ref(false);
const errorMessage = ref('');
const facilities = ref([]);
const lgas = ref([]);
const selectedFacility = ref(null);
const search = ref('');
const lgaId = ref('');
const status = ref('');
const facilityType = ref('');
const pagination = ref({ page: 1, pageSize: 20, total: 0, pages: 1 });
const summary = ref({ total: 0, active: 0, inactive: 0, withCoordinates: 0 });
let searchTimer;

const facilityTypes = [
  ['PRIMARY_HEALTH_CENTRE', 'Primary Health Centre'],
  ['GENERAL_HOSPITAL', 'General Hospital'],
  ['TEACHING_HOSPITAL', 'Teaching Hospital'],
  ['SPECIALIST_HOSPITAL', 'Specialist Hospital'],
  ['HEALTH_POST', 'Health Post'],
  ['WAREHOUSE', 'Vaccine Cold Store'],
  ['LABORATORY', 'Laboratory'],
  ['OTHER', 'Other'],
];

const scopeLabel = computed(() => auth.user?.scopes?.find((scope) => scope.type === 'STATE')?.name
  ?? auth.user?.organization?.name
  ?? 'your state');

const summaryCards = computed(() => [
  { label: 'Total facilities', value: summary.value.total, icon: Hospital, tone: 'blue' },
  { label: 'Active facilities', value: summary.value.active, icon: CircleCheckBig, tone: 'green' },
  { label: 'Inactive facilities', value: summary.value.inactive, icon: CircleX, tone: 'red' },
  { label: 'With coordinates', value: summary.value.withCoordinates, icon: MapPin, tone: 'orange' },
]);

function typeLabel(value) {
  return facilityTypes.find(([key]) => key === value)?.[1]
    ?? String(value ?? '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildQuery(page = pagination.value.page) {
  const params = new URLSearchParams({ page, pageSize: pagination.value.pageSize });
  if (search.value.trim()) params.set('search', search.value.trim());
  if (lgaId.value) params.set('lgaId', lgaId.value);
  if (status.value) params.set('status', status.value);
  if (facilityType.value) params.set('facilityType', facilityType.value);
  return params;
}

async function loadFacilities(page = 1) {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await auth.authorizedFetch(`/facilities?${buildQuery(page)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message ?? 'Unable to load facilities.');
    facilities.value = payload.data.facilities;
    pagination.value = payload.data.pagination;
    summary.value = payload.data.summary;
    lgas.value = payload.data.filters.lgas;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function viewFacility(facility) {
  selectedFacility.value = facility;
  detailLoading.value = true;
  try {
    const response = await auth.authorizedFetch(`/facilities/${facility.id}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message ?? 'Unable to load facility details.');
    selectedFacility.value = payload.data.facility;
  } catch (error) {
    errorMessage.value = error.message;
    selectedFacility.value = null;
  } finally {
    detailLoading.value = false;
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.pages || page === pagination.value.page) return;
  loadFacilities(page);
}

function resetFilters() {
  search.value = '';
  lgaId.value = '';
  status.value = '';
  facilityType.value = '';
  loadFacilities(1);
}

watch([lgaId, status, facilityType], () => loadFacilities(1));
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadFacilities(1), 350);
});

onMounted(() => loadFacilities());
onBeforeUnmount(() => clearTimeout(searchTimer));
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />

      <main class="facilities-page">
        <header class="facilities-heading">
          <div>
            <p>Organization / Facilities</p>
            <h1>Health facilities</h1>
            <span>View and monitor every facility within {{ scopeLabel }}.</span>
          </div>
          <div class="scope-chip"><Building2 :size="17" /> {{ scopeLabel }}</div>
        </header>

        <section class="facility-summary-grid" aria-label="Facility summary">
          <article v-for="card in summaryCards" :key="card.label" class="facility-summary-card">
            <span :class="`summary-icon ${card.tone}`"><component :is="card.icon" :size="22" /></span>
            <div><small>{{ card.label }}</small><strong>{{ card.value.toLocaleString() }}</strong></div>
          </article>
        </section>

        <section class="facilities-panel">
          <div class="facility-toolbar">
            <label class="facility-search">
              <Search :size="18" />
              <input v-model="search" type="search" placeholder="Search facility, code or address" />
            </label>
            <select v-model="lgaId" aria-label="Filter by LGA">
              <option value="">All LGAs</option>
              <option v-for="lga in lgas" :key="lga.id" :value="lga.id">{{ lga.name }}</option>
            </select>
            <select v-model="facilityType" aria-label="Filter by facility type">
              <option value="">All facility types</option>
              <option v-for="item in facilityTypes" :key="item[0]" :value="item[0]">{{ item[1] }}</option>
            </select>
            <select v-model="status" aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <button class="reset-filters" type="button" @click="resetFilters">Reset</button>
          </div>

          <p v-if="errorMessage" class="facilities-error">{{ errorMessage }}</p>

          <div v-if="loading" class="facilities-loading">
            <LoaderCircle :size="25" class="spin" /> Loading facilities…
          </div>

          <div v-else-if="facilities.length" class="facility-table-wrap">
            <table class="facility-table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Location</th>
                  <th>Officer in charge</th>
                  <th>Type</th>
                  <th>Equipment</th>
                  <th>Status</th>
                  <th><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="facility in facilities" :key="facility.id">
                  <td>
                    <div class="facility-name-cell">
                      <span><Hospital :size="19" /></span>
                      <div><strong>{{ facility.name }}</strong><small>{{ facility.facilityCode }}</small></div>
                    </div>
                  </td>
                  <td><strong>{{ facility.lga?.name ?? '—' }}</strong><small>{{ facility.ward?.name ?? 'Ward not set' }}</small></td>
                  <td><strong>{{ facility.primaryContact?.fullName ?? 'Not assigned' }}</strong><small>{{ facility.primaryContact?.normalizedPhone ?? facility.primaryContact?.phone ?? 'No phone' }}</small></td>
                  <td>{{ typeLabel(facility.facilityType) }}</td>
                  <td><span class="equipment-count"><Boxes :size="15" /> {{ facility._count.equipment }}</span></td>
                  <td><span class="status-pill" :class="facility.status.toLowerCase()">{{ facility.status }}</span></td>
                  <td><button class="view-facility" type="button" @click="viewFacility(facility)"><Eye :size="17" /> View</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="facilities-empty">
            <Hospital :size="30" />
            <strong>No facilities found</strong>
            <span>Try changing the search term or filters.</span>
          </div>

          <footer v-if="!loading && pagination.total" class="facility-pagination">
            <span>Showing {{ (pagination.page - 1) * pagination.pageSize + 1 }}–{{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} of {{ pagination.total }}</span>
            <div>
              <button type="button" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)"><ChevronLeft :size="17" /> Previous</button>
              <b>Page {{ pagination.page }} of {{ pagination.pages }}</b>
              <button type="button" :disabled="pagination.page === pagination.pages" @click="changePage(pagination.page + 1)">Next <ChevronRight :size="17" /></button>
            </div>
          </footer>
        </section>
      </main>
    </div>

    <div v-if="selectedFacility" class="facility-detail-backdrop" @click.self="selectedFacility = null">
      <aside class="facility-detail" aria-label="Facility details">
        <button class="detail-close" type="button" aria-label="Close details" @click="selectedFacility = null"><X :size="21" /></button>
        <div v-if="detailLoading" class="detail-loading"><LoaderCircle :size="27" class="spin" /> Loading details…</div>
        <template v-else>
          <span class="detail-icon"><Hospital :size="27" /></span>
          <p>{{ selectedFacility.facilityCode }}</p>
          <h2>{{ selectedFacility.name }}</h2>
          <span class="status-pill" :class="selectedFacility.status.toLowerCase()">{{ selectedFacility.status }}</span>

          <section class="detail-section">
            <h3>Facility information</h3>
            <dl>
              <div><dt><MapPin :size="16" /> Location</dt><dd>{{ selectedFacility.ward?.name }}, {{ selectedFacility.lga?.name }} LGA</dd></div>
              <div><dt><Building2 :size="16" /> Type</dt><dd>{{ typeLabel(selectedFacility.facilityType) }}</dd></div>
              <div><dt><Navigation :size="16" /> Coordinates</dt><dd>{{ selectedFacility.latitude ?? '—' }}, {{ selectedFacility.longitude ?? '—' }}</dd></div>
              <div><dt><MapPin :size="16" /> Address</dt><dd>{{ selectedFacility.address || 'Not provided' }}</dd></div>
            </dl>
          </section>

          <section class="detail-section">
            <h3>Officer in charge</h3>
            <article v-for="contact in selectedFacility.contacts" :key="contact.id" class="contact-card">
              <span><UserRound :size="19" /></span>
              <div><strong>{{ contact.fullName }}</strong><small>{{ contact.jobTitle }}</small></div>
              <a v-if="contact.normalizedPhone" :href="`tel:${contact.normalizedPhone}`"><Phone :size="16" /> {{ contact.normalizedPhone }}</a>
              <em v-else>No valid phone</em>
            </article>
            <p v-if="!selectedFacility.contacts?.length" class="no-contact">No officer has been recorded.</p>
          </section>

          <section class="detail-section detail-counts">
            <div><strong>{{ selectedFacility._count.equipment }}</strong><span>Equipment</span></div>
            <div><strong>{{ selectedFacility._count.users }}</strong><span>Users</span></div>
            <div><strong>{{ selectedFacility._count.tasks }}</strong><span>Tasks</span></div>
            <div><strong>{{ selectedFacility._count.alerts }}</strong><span>Alerts</span></div>
          </section>
        </template>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.facilities-page { padding: 24px; }
.facilities-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.facilities-heading p { margin: 0 0 5px; color: var(--blue); font-size: 12px; font-weight: 650; }
.facilities-heading h1 { margin: 0; font-size: 28px; line-height: 1.25; }
.facilities-heading > div > span { display: block; margin-top: 6px; color: var(--muted); font-size: 14px; }
.scope-chip { padding: 9px 13px; display: flex; align-items: center; gap: 8px; border: 1px solid #d9e7fb; border-radius: 9px; color: var(--blue); background: var(--blue-soft); font-size: 12px; font-weight: 600; }
.facility-summary-grid { margin: 22px 0 16px; display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
.facility-summary-card { padding: 17px; display: flex; align-items: center; gap: 13px; border: 1px solid var(--border); border-radius: 12px; background: #fff; }
.summary-icon { width: 43px; height: 43px; display: grid; place-items: center; border-radius: 11px; }
.summary-icon.blue { color: var(--blue); background: var(--blue-soft); }.summary-icon.green { color: var(--green); background: var(--green-soft); }.summary-icon.red { color: var(--red); background: var(--red-soft); }.summary-icon.orange { color: var(--orange); background: var(--orange-soft); }
.facility-summary-card div { display: flex; flex-direction: column; }.facility-summary-card small { color: var(--muted); font-size: 12px; }.facility-summary-card strong { margin-top: 2px; font-size: 23px; }
.facilities-panel { overflow: hidden; border: 1px solid var(--border); border-radius: 13px; background: #fff; }
.facility-toolbar { padding: 14px; display: grid; grid-template-columns: minmax(260px,1fr) repeat(3,minmax(145px,auto)) auto; gap: 9px; border-bottom: 1px solid var(--border); }
.facility-search { height: 42px; padding: 0 12px; display: flex; align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: 9px; color: #98a2b3; }
.facility-search input { width: 100%; border: 0; outline: 0; font-size: 13px; }.facility-toolbar select { min-width: 0; padding: 0 10px; border: 1px solid var(--border); border-radius: 9px; color: #344054; background: #fff; font-size: 12px; }
.reset-filters { padding: 0 12px; border: 1px solid var(--border); border-radius: 9px; background: #f8fafc; font-size: 12px; font-weight: 600; cursor: pointer; }
.facilities-loading,.facilities-empty { min-height: 300px; display: flex; align-items: center; justify-content: center; gap: 9px; color: var(--muted); font-size: 13px; }.facilities-empty { flex-direction: column; }.facilities-empty strong { color: var(--ink); font-size: 15px; }.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
.facilities-error { margin: 12px 14px 0; padding: 10px 12px; border-radius: 8px; color: #b42318; background: var(--red-soft); font-size: 12px; }
.facility-table-wrap { overflow-x: auto; }.facility-table { width: 100%; border-collapse: collapse; min-width: 1040px; }.facility-table th { padding: 11px 14px; color: #667085; background: #f8fafc; font-size: 10px; font-weight: 650; letter-spacing: .06em; text-align: left; text-transform: uppercase; }.facility-table td { padding: 13px 14px; border-top: 1px solid #eef1f5; color: #475467; font-size: 12px; }.facility-table tbody tr:hover { background: #fbfdff; }.facility-table td > strong,.facility-name-cell strong { display: block; color: #1d2939; font-size: 12px; }.facility-table td > small,.facility-name-cell small { display: block; margin-top: 3px; color: #7a8699; font-size: 10px; }
.facility-name-cell { min-width: 225px; display: flex; align-items: center; gap: 10px; }.facility-name-cell > span { width: 36px; height: 36px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 9px; color: var(--blue); background: var(--blue-soft); }
.equipment-count { display: inline-flex; align-items: center; gap: 5px; }.status-pill { display: inline-flex; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-style: normal; font-weight: 650; }.status-pill.active { color: #067647; background: #ecfdf3; }.status-pill.inactive { color: #b42318; background: #fef3f2; }
.view-facility { padding: 7px 10px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #cfe0f8; border-radius: 8px; color: var(--blue); background: #fff; font-size: 11px; font-weight: 650; cursor: pointer; }.view-facility:hover { background: var(--blue-soft); }
.facility-pagination { padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; gap: 14px; border-top: 1px solid var(--border); color: var(--muted); font-size: 11px; }.facility-pagination div { display: flex; align-items: center; gap: 10px; }.facility-pagination b { color: #344054; font-size: 11px; }.facility-pagination button { padding: 7px 10px; display: flex; align-items: center; gap: 5px; border: 1px solid var(--border); border-radius: 8px; background: #fff; font-size: 11px; cursor: pointer; }.facility-pagination button:disabled { opacity: .45; cursor: default; }
.facility-detail-backdrop { position: fixed; inset: 0; z-index: 80; display: flex; justify-content: flex-end; background: rgba(16,24,40,.42); }.facility-detail { position: relative; width: min(480px,100%); height: 100%; padding: 27px; overflow-y: auto; background: #fff; box-shadow: -18px 0 45px rgba(16,24,40,.16); }.detail-close { position: absolute; top: 20px; right: 20px; width: 36px; height: 36px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 9px; background: #fff; cursor: pointer; }.detail-icon { width: 52px; height: 52px; display: grid; place-items: center; border-radius: 13px; color: var(--blue); background: var(--blue-soft); }.facility-detail > p { margin: 16px 0 3px; color: var(--muted); font-size: 11px; }.facility-detail h2 { margin: 0 45px 9px 0; font-size: 22px; line-height: 1.35; }.detail-loading { height: 80%; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--muted); }.detail-section { margin-top: 24px; padding-top: 19px; border-top: 1px solid var(--border); }.detail-section h3 { margin: 0 0 12px; font-size: 13px; }.detail-section dl { margin: 0; display: grid; gap: 12px; }.detail-section dl div { display: grid; grid-template-columns: 135px minmax(0,1fr); gap: 10px; }.detail-section dt { display: flex; align-items: center; gap: 7px; color: var(--muted); font-size: 11px; }.detail-section dd { margin: 0; color: #344054; font-size: 12px; }.contact-card { padding: 11px; display: grid; grid-template-columns: 36px minmax(0,1fr) auto; align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: 9px; }.contact-card > span { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; color: var(--green); background: var(--green-soft); }.contact-card div { display: flex; flex-direction: column; }.contact-card strong { font-size: 12px; }.contact-card small,.contact-card em { color: var(--muted); font-size: 10px; font-style: normal; }.contact-card a { display: flex; align-items: center; gap: 5px; font-size: 10px; }.no-contact { color: var(--muted); font-size: 12px; }.detail-counts { display: grid; grid-template-columns: repeat(4,1fr); gap: 7px; }.detail-counts div { padding: 12px 5px; display: flex; flex-direction: column; border-radius: 8px; background: #f8fafc; text-align: center; }.detail-counts strong { font-size: 17px; }.detail-counts span { margin-top: 2px; color: var(--muted); font-size: 9px; }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
@media (max-width: 1200px) { .facility-toolbar { grid-template-columns: 1fr 1fr 1fr; }.facility-search { grid-column: span 2; } }
@media (max-width: 760px) { .facilities-page { padding: 14px 10px; }.facilities-heading { flex-direction: column; }.facility-summary-grid { grid-template-columns: repeat(2,1fr); }.facility-toolbar { grid-template-columns: 1fr; }.facility-search { grid-column: auto; }.facility-toolbar select,.reset-filters { height: 42px; }.facility-pagination { align-items: flex-start; flex-direction: column; }.facility-pagination div { width: 100%; justify-content: space-between; }.facility-pagination b { display: none; } }
@media (max-width: 430px) { .facility-summary-grid { grid-template-columns: 1fr; }.facility-detail { padding: 22px 17px; }.detail-section dl div { grid-template-columns: 1fr; gap: 3px; }.contact-card { grid-template-columns: 36px minmax(0,1fr); }.contact-card a,.contact-card em { grid-column: 2; } }
</style>
