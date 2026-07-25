<script setup>
import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Filter,
  ListChecks,
  LoaderCircle,
  Search,
  Timer,
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
const errorMessage = ref('');
const tasks = ref([]);
const facilities = ref([]);
const period = ref({ from: null, to: null });
const pagination = ref({ page: 1, pageSize: 20, total: 0, pages: 1 });
const summary = ref({ total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0 });
const filters = reactive({ search: '', facilityId: '', status: '', from: '', to: '' });

const frequency = computed(() => ({
  'lga-weekly-tasks': 'WEEKLY',
  'lga-monthly-tasks': 'MONTHLY',
}[route.name] ?? 'DAILY'));
const title = computed(() => `${frequency.value.charAt(0)}${frequency.value.slice(1).toLowerCase()} tasks`);
const scopeName = computed(() => auth.user?.scopes?.[0]?.name ?? auth.user?.organization?.name ?? 'your LGA');
const summaryCards = computed(() => [
  { label: 'Tasks in period', value: summary.value.total, icon: ListChecks, tone: 'blue' },
  { label: 'Completed', value: summary.value.completed, icon: CheckCircle2, tone: 'green' },
  { label: 'Pending', value: summary.value.pending, icon: Clock3, tone: 'orange' },
  { label: 'In progress', value: summary.value.inProgress, icon: Timer, tone: 'violet' },
  { label: 'Overdue or missed', value: summary.value.overdue, icon: CircleAlert, tone: 'red' },
]);

function query(page = 1) {
  const params = new URLSearchParams({ page, pageSize: 20, frequency: frequency.value });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

async function loadTasks(page = 1) {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await auth.authorizedFetch(`/lga/tasks?${query(page)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message ?? 'Unable to load LGA maintenance tasks.');
    tasks.value = payload.data.tasks;
    summary.value = payload.data.summary;
    facilities.value = payload.data.filters.facilities;
    period.value = payload.data.period;
    pagination.value = payload.data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

function changePage(page) {
  if (page < 1 || page > pagination.value.pages || page === pagination.value.page) return;
  loadTasks(page);
}

function formatDate(value, withTime = true) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(value));
}

function label(value) {
  return String(value ?? '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

watch(() => route.name, () => {
  Object.assign(filters, { search: '', facilityId: '', status: '', from: '', to: '' });
  loadTasks(1);
});
onMounted(() => loadTasks());
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="lga-tasks-page">
        <header class="tasks-heading"><div><p>LGA maintenance monitoring</p><h1>{{ title }}</h1><span>Track preventive maintenance tasks across {{ scopeName }}.</span></div><span class="period-chip"><CalendarCheck :size="17" /> {{ formatDate(period.from, false) }} – {{ formatDate(period.to, false) }}</span></header>
        <nav class="frequency-tabs"><RouterLink to="/modules/lga-daily-tasks" :class="{ active: frequency === 'DAILY' }">Daily</RouterLink><RouterLink to="/modules/lga-weekly-tasks" :class="{ active: frequency === 'WEEKLY' }">Weekly</RouterLink><RouterLink to="/modules/lga-monthly-tasks" :class="{ active: frequency === 'MONTHLY' }">Monthly</RouterLink></nav>
        <section class="task-summary-grid"><article v-for="card in summaryCards" :key="card.label"><span :class="card.tone"><component :is="card.icon" :size="20" /></span><div><small>{{ card.label }}</small><strong>{{ card.value.toLocaleString() }}</strong></div></article></section>
        <section class="tasks-panel">
          <form class="task-filters" @submit.prevent="loadTasks(1)"><label class="task-search"><Search :size="17" /><input v-model="filters.search" type="search" placeholder="Search facility, checklist or asset code" /></label><select v-model="filters.facilityId"><option value="">All facilities</option><option v-for="facility in facilities" :key="facility.id" :value="facility.id">{{ facility.name }}</option></select><select v-model="filters.status"><option value="">All statuses</option><option value="UPCOMING">Upcoming</option><option value="DUE">Due</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED_ON_TIME">Completed on time</option><option value="COMPLETED_LATE">Completed late</option><option value="OVERDUE">Overdue</option><option value="MISSED">Missed</option></select><label class="date-filter"><span>From</span><input v-model="filters.from" type="date" /></label><label class="date-filter"><span>To</span><input v-model="filters.to" type="date" /></label><button type="submit"><Filter :size="15" /> Apply</button></form>
          <p v-if="errorMessage" class="tasks-error">{{ errorMessage }}</p>
          <div v-if="loading" class="tasks-state"><LoaderCircle class="spin" :size="27" /> Loading {{ frequency.toLowerCase() }} tasks…</div>
          <div v-else-if="tasks.length" class="tasks-table-wrap"><table class="tasks-table"><thead><tr><th>Due</th><th>Facility</th><th>Checklist</th><th>Equipment</th><th>Assigned manager</th><th>Status</th><th>Submission</th><th>Evidence</th></tr></thead><tbody><tr v-for="task in tasks" :key="task.id"><td><strong>{{ formatDate(task.dueAt, false) }}</strong><small>{{ formatDate(task.dueAt) }}</small></td><td><strong>{{ task.facility.name }}</strong></td><td><strong>{{ task.checklist.name }}</strong><small>Version {{ task.checklist.version }}</small></td><td><strong>{{ task.equipment.assetCode }}</strong><small>{{ task.equipment.equipmentType.name }}</small></td><td><strong>{{ task.assignedUser?.fullName || 'Not assigned' }}</strong></td><td><span class="task-status" :class="task.status.toLowerCase()">{{ label(task.status) }}</span></td><td><strong>{{ task.submittedAt ? formatDate(task.submittedAt) : 'Not submitted' }}</strong><small v-if="task.submittedOffline">Synced offline</small></td><td><strong>{{ task._count.evidence }} images</strong><small>{{ task._count.responses }} responses</small></td></tr></tbody></table></div>
          <div v-else class="tasks-state tasks-empty"><ListChecks :size="34" /><strong>No {{ frequency.toLowerCase() }} tasks found</strong><span>Tasks will appear when active maintenance schedules generate work for this period.</span></div>
          <footer v-if="!loading && pagination.total" class="tasks-pagination"><span>Showing {{ (pagination.page - 1) * pagination.pageSize + 1 }}–{{ Math.min(pagination.page * pagination.pageSize, pagination.total) }} of {{ pagination.total }}</span><div><button type="button" :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)"><ChevronLeft :size="16" /> Previous</button><b>Page {{ pagination.page }} of {{ pagination.pages }}</b><button type="button" :disabled="pagination.page === pagination.pages" @click="changePage(pagination.page + 1)">Next <ChevronRight :size="16" /></button></div></footer>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.lga-tasks-page{padding:24px}.tasks-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.tasks-heading p{margin:0 0 5px;color:var(--blue);font-size:12px;font-weight:650}.tasks-heading h1{margin:0;font-size:28px}.tasks-heading>div>span{display:block;margin-top:6px;color:var(--muted);font-size:13px}.period-chip{padding:9px 12px;display:flex;align-items:center;gap:7px;border-radius:9px;color:#175cd3;background:#eaf2ff;font-size:10px;font-weight:650}.frequency-tabs{margin:20px 0 13px;display:flex;gap:6px;border-bottom:1px solid var(--border)}.frequency-tabs a{margin-bottom:-1px;padding:10px 16px;border-bottom:2px solid transparent;color:#667085;font-size:11px;font-weight:650}.frequency-tabs a.active{color:#1570ef;border-color:#1570ef}.task-summary-grid{margin-bottom:13px;display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.task-summary-grid article{padding:13px;display:flex;align-items:center;gap:9px;border:1px solid var(--border);border-radius:10px;background:#fff}.task-summary-grid article>span{width:34px;height:34px;display:grid;place-items:center;border-radius:8px}.task-summary-grid .blue{color:#175cd3;background:#eaf2ff}.task-summary-grid .green{color:#067647;background:#e7f8ef}.task-summary-grid .orange{color:#b54708;background:#fff3df}.task-summary-grid .violet{color:#6941c6;background:#f0ebff}.task-summary-grid .red{color:#b42318;background:#feeceb}.task-summary-grid article div{display:flex;flex-direction:column}.task-summary-grid small{color:#667085;font-size:9px}.task-summary-grid strong{margin-top:2px;font-size:19px}.tasks-panel{overflow:hidden;border:1px solid var(--border);border-radius:12px;background:#fff}.task-filters{padding:12px;display:grid;grid-template-columns:minmax(240px,1.2fr) minmax(180px,.8fr) minmax(150px,.6fr) repeat(2,minmax(140px,.5fr)) auto;gap:7px;border-bottom:1px solid var(--border)}.task-search{height:40px;padding:0 10px;display:flex;align-items:center;gap:7px;border:1px solid var(--border);border-radius:8px;color:#98a2b3}.task-search input{width:100%;border:0;outline:0;font-size:10px}.task-filters select,.date-filter{min-width:0;height:40px;border:1px solid var(--border);border-radius:8px;color:#475467;background:#fff;font-size:9px}.task-filters select{padding:0 8px}.date-filter{padding:3px 8px;display:flex;flex-direction:column}.date-filter span{color:#98a2b3;font-size:7px}.date-filter input{border:0;outline:0;font-size:9px}.task-filters>button{height:40px;padding:0 11px;display:flex;align-items:center;gap:5px;border:0;border-radius:8px;color:#fff;background:#1570ef;font-size:9px;font-weight:650;cursor:pointer}.tasks-error{margin:10px 12px 0;padding:9px 11px;border-radius:8px;color:#b42318;background:#feeceb;font-size:10px}.tasks-state{min-height:290px;display:flex;align-items:center;justify-content:center;gap:8px;color:#667085;font-size:11px}.tasks-empty{flex-direction:column}.tasks-empty strong{color:#344054;font-size:14px}.tasks-empty span{max-width:420px;text-align:center}.tasks-table-wrap{overflow-x:auto}.tasks-table{width:100%;min-width:1150px;border-collapse:collapse}.tasks-table th{padding:10px 12px;color:#667085;background:#f8fafc;font-size:8px;text-align:left;text-transform:uppercase}.tasks-table td{padding:11px 12px;border-top:1px solid #eef1f5;color:#475467;font-size:10px}.tasks-table td strong,.tasks-table td small{display:block}.tasks-table td strong{color:#344054;font-size:10px}.tasks-table td small{margin-top:3px;color:#98a2b3;font-size:8px}.task-status{padding:5px 7px;display:inline-flex;border-radius:999px;color:#475467;background:#eef2f6;font-size:8px;font-weight:700}.task-status.completed_on_time{color:#067647;background:#e7f8ef}.task-status.completed_late,.task-status.overdue,.task-status.missed{color:#b42318;background:#feeceb}.task-status.due,.task-status.upcoming{color:#b54708;background:#fff3df}.task-status.in_progress{color:#175cd3;background:#eaf2ff}.tasks-pagination{padding:11px 13px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);color:#667085;font-size:9px}.tasks-pagination div{display:flex;align-items:center;gap:8px}.tasks-pagination button{padding:6px 8px;display:flex;align-items:center;gap:4px;border:1px solid var(--border);border-radius:7px;background:#fff;font-size:9px}.tasks-pagination button:disabled{opacity:.45}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:1150px){.task-summary-grid{grid-template-columns:repeat(3,1fr)}.task-filters{grid-template-columns:repeat(3,1fr)}.task-search{grid-column:span 2}}@media(max-width:700px){.lga-tasks-page{padding:14px 10px}.tasks-heading{flex-direction:column}.task-summary-grid{grid-template-columns:repeat(2,1fr)}.task-filters{grid-template-columns:repeat(2,1fr)}.task-search{grid-column:span 2}.tasks-pagination{align-items:flex-start;flex-direction:column;gap:9px}.tasks-pagination div{width:100%;justify-content:space-between}}@media(max-width:450px){.frequency-tabs a{flex:1;padding:10px 4px;text-align:center}.task-summary-grid,.task-filters{grid-template-columns:1fr}.task-search{grid-column:auto}}
</style>
