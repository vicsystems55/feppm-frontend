<script setup>
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Cloud,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Hospital,
  Image,
  Images,
  LoaderCircle,
  MapPin,
  Search,
  WifiOff,
  X,
} from '@lucide/vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { useAuthStore } from '../stores/auth.js';

const route = useRoute();
const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const exporting = ref(false);
const detailLoading = ref(false);
const errorMessage = ref('');
const reports = ref([]);
const media = ref([]);
const facilities = ref([]);
const selectedReport = ref(null);
const selectedMedia = ref(null);
const reportSummary = ref({
  total: 0, onTime: 0, late: 0, daily: 0, weekly: 0, monthly: 0,
});
const pagination = ref({ page: 1, pageSize: 20, total: 0, pages: 1 });

function dateInput(value) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const filters = reactive({
  search: '',
  frequency: '',
  facilityId: '',
  completion: '',
  from: dateInput(thirtyDaysAgo),
  to: dateInput(today),
});

const activeSection = computed(() => route.name === 'lga-media' ? 'media' : 'reports');
const scopeName = computed(() => auth.user?.scopes?.[0]?.name ?? auth.user?.organization?.name ?? 'your LGA');
const summaryCards = computed(() => [
  { label: 'Submitted reports', value: reportSummary.value.total, icon: FileCheck2, tone: 'blue' },
  { label: 'Completed on time', value: reportSummary.value.onTime, icon: CheckCircle2, tone: 'green' },
  { label: 'Completed late', value: reportSummary.value.late, icon: CircleAlert, tone: 'red' },
  { label: 'Daily', value: reportSummary.value.daily, icon: CalendarDays, tone: 'orange' },
  { label: 'Weekly', value: reportSummary.value.weekly, icon: CalendarDays, tone: 'violet' },
  { label: 'Monthly', value: reportSummary.value.monthly, icon: CalendarDays, tone: 'teal' },
]);

function buildQuery(page = 1, { exportRequest = false } = {}) {
  const params = new URLSearchParams();
  if (!exportRequest) {
    params.set('page', page);
    params.set('pageSize', activeSection.value === 'media' ? 24 : 20);
  }
  Object.entries(filters).forEach(([key, value]) => {
    if (!value || (activeSection.value === 'media' && ['search', 'completion'].includes(key))) return;
    params.set(key, value);
  });
  return params;
}

async function readPayload(response, fallback) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? fallback);
  return payload.data;
}

async function loadReports(page = 1) {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await auth.authorizedFetch(`/lga/task-reports?${buildQuery(page)}`);
    const data = await readPayload(response, 'Unable to load submitted task reports.');
    reports.value = data.reports;
    reportSummary.value = data.summary;
    facilities.value = data.filters.facilities;
    pagination.value = data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function loadMedia(page = 1) {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await auth.authorizedFetch(`/lga/media?${buildQuery(page)}`);
    const data = await readPayload(response, 'Unable to load uploaded evidence.');
    media.value = data.media;
    facilities.value = data.filters.facilities;
    pagination.value = data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

function loadSection(page = 1) {
  if (activeSection.value === 'media') loadMedia(page);
  else loadReports(page);
}

async function viewReport(report) {
  selectedReport.value = report;
  detailLoading.value = true;
  try {
    const response = await auth.authorizedFetch(`/lga/task-reports/${report.id}`);
    const data = await readPayload(response, 'Unable to load this submitted report.');
    selectedReport.value = data.report;
  } catch (error) {
    errorMessage.value = error.message;
    selectedReport.value = null;
  } finally {
    detailLoading.value = false;
  }
}

async function exportReports() {
  exporting.value = true;
  errorMessage.value = '';
  try {
    const response = await auth.authorizedFetch(
      `/lga/task-reports/export?${buildQuery(1, { exportRequest: true })}`,
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? 'Unable to export task reports.');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const disposition = response.headers.get('content-disposition') ?? '';
    const fileName = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'lga-task-reports.csv';
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    exporting.value = false;
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.pages || page === pagination.value.page) return;
  loadSection(page);
}

function formatDate(value, withTime = true) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(value));
}

function statusLabel(value) {
  return value === 'COMPLETED_ON_TIME' ? 'On time' : value === 'COMPLETED_LATE' ? 'Late' : value;
}

function responseValue(item) {
  if (item.responseBoolean !== null) return item.responseBoolean ? 'Yes' : 'No';
  if (item.responseNumber !== null) return item.responseNumber;
  return item.responseText || item.responseOptionId || 'Photo evidence';
}

watch(() => route.name, () => {
  selectedReport.value = null;
  selectedMedia.value = null;
  errorMessage.value = '';
  loadSection(1);
});

onMounted(() => loadSection());
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />

      <main class="lga-records-page">
        <header class="lga-records-heading">
          <div>
            <p>LGA oversight · {{ scopeName }}</p>
            <h1>Task reports and evidence</h1>
            <span>Review submitted maintenance checklists and the photo evidence uploaded by facilities.</span>
          </div>
          <span class="lga-scope-chip"><MapPin :size="17" /> {{ scopeName }}</span>
        </header>

        <nav class="records-tabs" aria-label="Report sections">
          <RouterLink to="/modules/lga-reports" :class="{ active: activeSection === 'reports' }">
            <FileText :size="18" /> Task reports
          </RouterLink>
          <RouterLink to="/modules/lga-media" :class="{ active: activeSection === 'media' }">
            <Images :size="18" /> Media library
          </RouterLink>
        </nav>

        <p v-if="errorMessage" class="records-error">{{ errorMessage }}</p>

        <template v-if="activeSection === 'reports'">
          <section class="report-summary-grid" aria-label="Report summary">
            <article v-for="card in summaryCards" :key="card.label" class="report-summary-card">
              <span :class="card.tone"><component :is="card.icon" :size="20" /></span>
              <div><small>{{ card.label }}</small><strong>{{ card.value.toLocaleString() }}</strong></div>
            </article>
          </section>

          <section class="records-panel">
            <form class="report-filters" @submit.prevent="loadReports(1)">
              <label class="report-search"><Search :size="17" /><input v-model="filters.search" type="search" placeholder="Search facility, checklist or asset code" /></label>
              <select v-model="filters.frequency" aria-label="Frequency"><option value="">All frequencies</option><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option></select>
              <select v-model="filters.facilityId" aria-label="Facility"><option value="">All facilities</option><option v-for="facility in facilities" :key="facility.id" :value="facility.id">{{ facility.name }}</option></select>
              <select v-model="filters.completion" aria-label="Completion"><option value="">All completions</option><option value="ON_TIME">Completed on time</option><option value="LATE">Completed late</option></select>
              <label class="date-filter"><span>From</span><input v-model="filters.from" type="date" /></label>
              <label class="date-filter"><span>To</span><input v-model="filters.to" type="date" /></label>
              <button class="apply-filter" type="submit"><Filter :size="16" /> Apply</button>
              <button class="export-reports" type="button" :disabled="exporting" @click="exportReports">
                <LoaderCircle v-if="exporting" class="spin" :size="16" /><Download v-else :size="16" />
                {{ exporting ? 'Exporting…' : 'Export CSV' }}
              </button>
            </form>

            <div v-if="loading" class="records-state"><LoaderCircle class="spin" :size="27" /> Loading submitted reports…</div>
            <div v-else-if="reports.length" class="report-table-wrap">
              <table class="report-table">
                <thead><tr><th>Submitted</th><th>Facility</th><th>Checklist</th><th>Equipment</th><th>Frequency</th><th>Completed by</th><th>Status</th><th>Evidence</th><th><span class="sr-only">Action</span></th></tr></thead>
                <tbody>
                  <tr v-for="report in reports" :key="report.id">
                    <td><strong>{{ formatDate(report.submittedAt, false) }}</strong><small>{{ formatDate(report.submittedAt).split(',').at(-1) }}</small></td>
                    <td><strong>{{ report.facility.name }}</strong></td>
                    <td><strong>{{ report.checklist.name }}</strong><small>Version {{ report.checklist.version }}</small></td>
                    <td><strong>{{ report.equipment.assetCode }}</strong><small>{{ report.equipment.equipmentType.name }}</small></td>
                    <td><span class="frequency-pill">{{ report.frequency }}</span></td>
                    <td><strong>{{ report.completedBy?.fullName || 'Not recorded' }}</strong><small v-if="report.submittedOffline"><WifiOff :size="12" /> Synced offline</small></td>
                    <td><span class="completion-pill" :class="report.status.toLowerCase()">{{ statusLabel(report.status) }}</span></td>
                    <td><span class="evidence-count"><Camera :size="14" /> {{ report._count.evidence }}</span></td>
                    <td><button class="view-record" type="button" @click="viewReport(report)"><Eye :size="15" /> View</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="records-empty"><FileText :size="34" /><strong>No submitted reports found</strong><span>Try a wider date range or a different facility and frequency.</span></div>

            <footer v-if="!loading && pagination.total" class="records-pagination">
              <span>Showing {{ (pagination.page - 1) * pagination.pageSize + 1 }}–{{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} of {{ pagination.total }}</span>
              <div><button type="button" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)"><ChevronLeft :size="16" /> Previous</button><b>Page {{ pagination.page }} of {{ pagination.pages }}</b><button type="button" :disabled="pagination.page === pagination.pages" @click="changePage(pagination.page + 1)">Next <ChevronRight :size="16" /></button></div>
            </footer>
          </section>
        </template>

        <template v-else>
          <section class="records-panel media-panel">
            <form class="media-filters" @submit.prevent="loadMedia(1)">
              <select v-model="filters.frequency" aria-label="Frequency"><option value="">All frequencies</option><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option></select>
              <select v-model="filters.facilityId" aria-label="Facility"><option value="">All facilities</option><option v-for="facility in facilities" :key="facility.id" :value="facility.id">{{ facility.name }}</option></select>
              <label class="date-filter"><span>From</span><input v-model="filters.from" type="date" /></label>
              <label class="date-filter"><span>To</span><input v-model="filters.to" type="date" /></label>
              <button class="apply-filter" type="submit"><Filter :size="16" /> Apply</button>
            </form>

            <header class="media-heading"><div><Image :size="20" /><span><strong>Uploaded evidence</strong><small>{{ pagination.total.toLocaleString() }} images within the selected period</small></span></div><p><Cloud :size="15" /> Cloudinary and verified local evidence</p></header>

            <div v-if="loading" class="records-state"><LoaderCircle class="spin" :size="27" /> Loading uploaded evidence…</div>
            <div v-else-if="media.length" class="media-grid">
              <button v-for="item in media" :key="item.id" class="media-card" type="button" @click="selectedMedia = item">
                <span class="media-image"><img :src="item.thumbnailUrl || item.fileUrl" :alt="`Evidence from ${item.facility?.name || 'facility'}`" loading="lazy" /><em :class="item.source.toLowerCase()">{{ item.source === 'CLOUDINARY' ? 'Cloudinary' : 'Local' }}</em></span>
                <span class="media-copy"><strong>{{ item.facility?.name || 'Unknown facility' }}</strong><small>{{ item.question || item.equipment?.assetCode || 'Checklist evidence' }}</small><time>{{ formatDate(item.capturedAtDevice) }}</time></span>
              </button>
            </div>
            <div v-else class="records-empty"><Images :size="36" /><strong>No evidence images found</strong><span>Images will appear after facility managers submit checklists with photo evidence.</span></div>

            <footer v-if="!loading && pagination.total" class="records-pagination">
              <span>Showing {{ (pagination.page - 1) * pagination.pageSize + 1 }}–{{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} of {{ pagination.total }}</span>
              <div><button type="button" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)"><ChevronLeft :size="16" /> Previous</button><b>Page {{ pagination.page }} of {{ pagination.pages }}</b><button type="button" :disabled="pagination.page === pagination.pages" @click="changePage(pagination.page + 1)">Next <ChevronRight :size="16" /></button></div>
            </footer>
          </section>
        </template>
      </main>
    </div>

    <div v-if="selectedReport" class="record-backdrop" @click.self="selectedReport = null">
      <aside class="report-detail">
        <button class="record-close" type="button" aria-label="Close report" @click="selectedReport = null"><X :size="20" /></button>
        <div v-if="detailLoading" class="records-state"><LoaderCircle class="spin" :size="27" /> Loading report…</div>
        <template v-else>
          <span class="detail-mark"><FileCheck2 :size="26" /></span><p>{{ selectedReport.frequency }} TASK REPORT</p><h2>{{ selectedReport.checklist.name }}</h2>
          <span class="completion-pill" :class="selectedReport.status.toLowerCase()">{{ statusLabel(selectedReport.status) }}</span>
          <dl class="report-meta"><div><dt>Facility</dt><dd>{{ selectedReport.facility.name }}</dd></div><div><dt>Equipment</dt><dd>{{ selectedReport.equipment.assetCode }} · {{ selectedReport.equipment.equipmentType.name }}</dd></div><div><dt>Submitted</dt><dd>{{ formatDate(selectedReport.submittedAt) }}</dd></div><div><dt>Completed by</dt><dd>{{ selectedReport.completedBy?.fullName || 'Not recorded' }}</dd></div><div><dt>Compliance</dt><dd>{{ selectedReport.complianceScore ?? '—' }}{{ selectedReport.complianceScore !== null ? '%' : '' }}</dd></div></dl>
          <section class="response-list"><h3>Checklist responses</h3><article v-for="(item,index) in selectedReport.responses" :key="item.id"><b>{{ index + 1 }}</b><div><strong>{{ item.checklistItem.title }}</strong><span>{{ responseValue(item) }}</span><small v-if="item.comment">{{ item.comment }}</small><div v-if="item.evidence.length" class="response-images"><a v-for="photo in item.evidence" :key="photo.id" :href="photo.fileUrl" target="_blank" rel="noopener"><img :src="photo.thumbnailUrl || photo.fileUrl" alt="Checklist evidence" /></a></div></div></article></section>
        </template>
      </aside>
    </div>

    <div v-if="selectedMedia" class="record-backdrop media-backdrop" @click.self="selectedMedia = null">
      <article class="media-preview">
        <button class="record-close" type="button" aria-label="Close image" @click="selectedMedia = null"><X :size="20" /></button>
        <img :src="selectedMedia.fileUrl" :alt="`Evidence from ${selectedMedia.facility?.name || 'facility'}`" />
        <div><span :class="`source-badge ${selectedMedia.source.toLowerCase()}`">{{ selectedMedia.source === 'CLOUDINARY' ? 'Cloudinary' : 'Local storage' }}</span><h2>{{ selectedMedia.facility?.name || 'Facility evidence' }}</h2><p>{{ selectedMedia.question || 'Checklist photo evidence' }}</p><dl><div><dt>Captured</dt><dd>{{ formatDate(selectedMedia.capturedAtDevice) }}</dd></div><div><dt>Uploaded by</dt><dd>{{ selectedMedia.uploadedBy.fullName }}</dd></div><div><dt>Frequency</dt><dd>{{ selectedMedia.frequency || '—' }}</dd></div><div><dt>Equipment</dt><dd>{{ selectedMedia.equipment?.assetCode || '—' }}</dd></div><div><dt>Location</dt><dd>{{ selectedMedia.latitude ?? '—' }}, {{ selectedMedia.longitude ?? '—' }}</dd></div></dl><a :href="selectedMedia.fileUrl" target="_blank" rel="noopener"><Eye :size="16" /> Open original image</a></div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.lga-records-page { padding: 24px; }
.lga-records-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.lga-records-heading p { margin: 0 0 5px; color: var(--blue); font-size: 12px; font-weight: 650; }
.lga-records-heading h1 { margin: 0; font-size: 28px; line-height: 1.25; }
.lga-records-heading > div > span { display: block; margin-top: 6px; color: var(--muted); font-size: 13px; }
.lga-scope-chip { padding: 9px 12px; display: flex; align-items: center; gap: 7px; border-radius: 9px; color: #175cd3; background: #eaf2ff; font-size: 11px; font-weight: 650; }
.records-tabs { margin: 22px 0 14px; display: flex; gap: 7px; border-bottom: 1px solid var(--border); }
.records-tabs a { margin-bottom: -1px; padding: 11px 15px; display: flex; align-items: center; gap: 7px; border-bottom: 2px solid transparent; color: #667085; font-size: 12px; font-weight: 650; }
.records-tabs a.active { color: #1570ef; border-color: #1570ef; }
.records-error { margin: 0 0 12px; padding: 10px 12px; border-radius: 8px; color: #b42318; background: #feeceb; font-size: 11px; }
.report-summary-grid { margin-bottom: 14px; display: grid; grid-template-columns: repeat(6,minmax(0,1fr)); gap: 9px; }
.report-summary-card { min-width: 0; padding: 13px; display: flex; align-items: center; gap: 9px; border: 1px solid var(--border); border-radius: 10px; background: #fff; }
.report-summary-card > span { width: 34px; height: 34px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 8px; }
.report-summary-card > span.blue { color: #175cd3; background: #eaf2ff; }.report-summary-card > span.green { color: #067647; background: #e7f8ef; }.report-summary-card > span.red { color: #b42318; background: #feeceb; }.report-summary-card > span.orange { color: #b54708; background: #fff3df; }.report-summary-card > span.violet { color: #6941c6; background: #f0ebff; }.report-summary-card > span.teal { color: #0e7090; background: #e5f6fa; }
.report-summary-card div { min-width: 0; display: flex; flex-direction: column; }.report-summary-card small { overflow: hidden; color: #667085; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }.report-summary-card strong { margin-top: 2px; font-size: 19px; }
.records-panel { overflow: hidden; border: 1px solid var(--border); border-radius: 12px; background: #fff; }
.report-filters { padding: 12px; display: grid; grid-template-columns: minmax(240px,1.3fr) repeat(3,minmax(130px,.7fr)) repeat(2,minmax(135px,.65fr)) auto auto; gap: 7px; border-bottom: 1px solid var(--border); }
.report-search { height: 40px; padding: 0 10px; display: flex; align-items: center; gap: 7px; border: 1px solid var(--border); border-radius: 8px; color: #98a2b3; }.report-search input { width: 100%; border: 0; outline: 0; font-size: 11px; }
.report-filters select,.media-filters select,.date-filter { min-width: 0; height: 40px; border: 1px solid var(--border); border-radius: 8px; color: #475467; background: #fff; font: inherit; font-size: 10px; }
.report-filters select,.media-filters select { padding: 0 8px; }.date-filter { padding: 3px 8px; display: flex; flex-direction: column; }.date-filter span { color: #98a2b3; font-size: 7px; }.date-filter input { min-width: 0; border: 0; outline: 0; color: #475467; font: inherit; font-size: 9px; }
.apply-filter,.export-reports { height: 40px; padding: 0 11px; display: flex; align-items: center; justify-content: center; gap: 6px; border: 0; border-radius: 8px; color: #fff; background: #1570ef; font: inherit; font-size: 10px; font-weight: 650; cursor: pointer; white-space: nowrap; }.export-reports { background: #079455; }.export-reports:disabled { opacity: .6; }
.records-state,.records-empty { min-height: 290px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #667085; font-size: 12px; }.records-empty { flex-direction: column; }.records-empty strong { color: #344054; font-size: 14px; }.records-empty span { max-width: 420px; text-align: center; }
.report-table-wrap { overflow-x: auto; }.report-table { width: 100%; min-width: 1200px; border-collapse: collapse; }.report-table th { padding: 10px 11px; color: #667085; background: #f8fafc; font-size: 8px; font-weight: 700; letter-spacing: .05em; text-align: left; text-transform: uppercase; }.report-table td { padding: 11px; border-top: 1px solid #eef1f5; color: #475467; font-size: 10px; }.report-table td strong,.report-table td small { display: block; }.report-table td strong { color: #344054; font-size: 10px; }.report-table td small { margin-top: 3px; color: #98a2b3; font-size: 8px; }.report-table td small:has(svg) { display: flex; align-items: center; gap: 3px; }
.frequency-pill,.completion-pill { padding: 5px 7px; display: inline-flex; border-radius: 999px; color: #175cd3; background: #eaf2ff; font-size: 8px; font-weight: 700; }.completion-pill.completed_on_time { color: #067647; background: #e7f8ef; }.completion-pill.completed_late { color: #b42318; background: #feeceb; }
.evidence-count { display: flex; align-items: center; gap: 4px; }.view-record { padding: 6px 8px; display: flex; align-items: center; gap: 4px; border: 1px solid #cfe0f8; border-radius: 7px; color: #1570ef; background: #fff; font-size: 9px; cursor: pointer; }
.records-pagination { padding: 11px 13px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid var(--border); color: #667085; font-size: 9px; }.records-pagination div { display: flex; align-items: center; gap: 8px; }.records-pagination b { color: #344054; }.records-pagination button { padding: 6px 8px; display: flex; align-items: center; gap: 4px; border: 1px solid var(--border); border-radius: 7px; background: #fff; font-size: 9px; cursor: pointer; }.records-pagination button:disabled { opacity: .45; cursor: default; }
.media-filters { padding: 12px; display: grid; grid-template-columns: minmax(150px,.5fr) minmax(240px,1fr) repeat(2,minmax(140px,.5fr)) auto; gap: 8px; border-bottom: 1px solid var(--border); }
.media-heading { padding: 13px 15px; display: flex; align-items: center; justify-content: space-between; gap: 15px; border-bottom: 1px solid #eef1f5; }.media-heading > div { display: flex; align-items: center; gap: 8px; color: #1570ef; }.media-heading span { display: flex; flex-direction: column; }.media-heading strong { color: #344054; font-size: 12px; }.media-heading small { margin-top: 2px; color: #98a2b3; font-size: 8px; }.media-heading p { margin: 0; display: flex; align-items: center; gap: 5px; color: #667085; font-size: 9px; }
.media-grid { padding: 13px; display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 11px; }.media-card { min-width: 0; padding: 0; overflow: hidden; border: 1px solid var(--border); border-radius: 10px; background: #fff; text-align: left; cursor: pointer; transition: transform .16s ease, box-shadow .16s ease; }.media-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(16,24,40,.1); }.media-image { position: relative; height: 155px; display: block; overflow: hidden; background: #eef2f6; }.media-image img { width: 100%; height: 100%; display: block; object-fit: cover; }.media-image em { position: absolute; top: 8px; right: 8px; padding: 4px 6px; border-radius: 999px; color: #fff; background: rgba(16,24,40,.72); font-size: 7px; font-style: normal; font-weight: 700; }.media-image em.cloudinary { background: rgba(21,112,239,.88); }.media-copy { padding: 9px 10px; display: flex; min-width: 0; flex-direction: column; }.media-copy strong,.media-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.media-copy strong { color: #344054; font-size: 10px; }.media-copy small { margin-top: 3px; color: #667085; font-size: 8px; }.media-copy time { margin-top: 6px; color: #98a2b3; font-size: 7px; }
.record-backdrop { position: fixed; inset: 0; z-index: 90; display: flex; justify-content: flex-end; background: rgba(16,24,40,.48); }.report-detail { position: relative; width: min(560px,100%); height: 100%; padding: 25px; overflow-y: auto; background: #fff; box-shadow: -18px 0 45px rgba(16,24,40,.18); }.record-close { position: absolute; z-index: 2; top: 17px; right: 17px; width: 35px; height: 35px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 8px; background: #fff; cursor: pointer; }.detail-mark { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 12px; color: #1570ef; background: #eaf2ff; }.report-detail > p { margin: 14px 0 4px; color: #1570ef; font-size: 9px; font-weight: 700; letter-spacing: .08em; }.report-detail h2 { margin: 0 45px 9px 0; font-size: 21px; }.report-meta { margin: 20px 0 0; padding: 15px; display: grid; gap: 10px; border-radius: 10px; background: #f8fafc; }.report-meta div { display: grid; grid-template-columns: 105px 1fr; gap: 9px; }.report-meta dt { color: #98a2b3; font-size: 9px; }.report-meta dd { margin: 0; color: #344054; font-size: 10px; font-weight: 600; }
.response-list { margin-top: 22px; }.response-list h3 { font-size: 13px; }.response-list article { padding: 12px 0; display: grid; grid-template-columns: 27px 1fr; gap: 9px; border-top: 1px solid #eef1f5; }.response-list article > b { width: 27px; height: 27px; display: grid; place-items: center; border-radius: 7px; color: #175cd3; background: #eaf2ff; font-size: 9px; }.response-list article > div { min-width: 0; display: flex; flex-direction: column; }.response-list strong { font-size: 10px; }.response-list span { margin-top: 4px; color: #067647; font-size: 10px; font-weight: 650; }.response-list small { margin-top: 4px; color: #667085; font-size: 9px; }.response-images { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }.response-images img { width: 76px; height: 62px; display: block; border-radius: 7px; object-fit: cover; }
.media-backdrop { padding: 25px; align-items: center; justify-content: center; }.media-preview { position: relative; width: min(980px,100%); max-height: calc(100vh - 50px); display: grid; grid-template-columns: minmax(0,1.45fr) minmax(280px,.55fr); overflow: hidden; border-radius: 14px; background: #fff; }.media-preview > img { width: 100%; height: 100%; min-height: 520px; object-fit: contain; background: #101828; }.media-preview > div { padding: 28px 22px; overflow-y: auto; }.source-badge { padding: 5px 7px; display: inline-flex; border-radius: 999px; color: #475467; background: #eef2f6; font-size: 8px; font-weight: 700; }.source-badge.cloudinary { color: #175cd3; background: #eaf2ff; }.media-preview h2 { margin: 13px 0 4px; font-size: 18px; }.media-preview p { margin: 0; color: #667085; font-size: 10px; }.media-preview dl { margin: 20px 0; display: grid; gap: 10px; }.media-preview dl div { display: grid; grid-template-columns: 80px 1fr; gap: 8px; }.media-preview dt { color: #98a2b3; font-size: 9px; }.media-preview dd { margin: 0; color: #344054; font-size: 10px; }.media-preview > div > a { padding: 9px 11px; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; color: #fff; background: #1570ef; font-size: 9px; font-weight: 650; }
.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
@media (max-width: 1350px) { .report-summary-grid { grid-template-columns: repeat(3,1fr); }.report-filters { grid-template-columns: repeat(4,1fr); }.report-search { grid-column: span 2; }.media-grid { grid-template-columns: repeat(3,1fr); } }
@media (max-width: 850px) { .lga-records-page { padding: 14px 10px; }.lga-records-heading { flex-direction: column; }.report-summary-grid { grid-template-columns: repeat(2,1fr); }.report-filters,.media-filters { grid-template-columns: repeat(2,1fr); }.report-search { grid-column: span 2; }.media-grid { grid-template-columns: repeat(2,1fr); }.media-preview { grid-template-columns: 1fr; overflow-y: auto; }.media-preview > img { min-height: 320px; max-height: 55vh; }.media-heading { align-items: flex-start; flex-direction: column; } }
@media (max-width: 520px) { .records-tabs a { flex: 1; justify-content: center; }.report-summary-grid,.report-filters,.media-filters,.media-grid { grid-template-columns: 1fr; }.report-search { grid-column: auto; }.records-pagination { align-items: flex-start; flex-direction: column; }.records-pagination div { width: 100%; justify-content: space-between; }.report-detail { padding: 21px 16px; }.report-meta div { grid-template-columns: 1fr; gap: 2px; }.media-backdrop { padding: 0; }.media-preview { max-height: 100vh; height: 100%; border-radius: 0; }.media-preview > img { min-height: 280px; } }
</style>
