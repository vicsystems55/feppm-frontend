<script setup>
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  FilterX,
  Headphones,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Search,
  ShieldAlert,
  TicketCheck,
  X,
} from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import TicketPhotoPicker from '../components/tickets/TicketPhotoPicker.vue';
import {
  formatTicketDate,
  labelFor,
  previewPriority,
  riskLevels,
  ticketCategories,
  ticketStatusLabel,
  ticketStatuses,
  ticketTypes,
} from '../config/tickets.js';
import { ticketApi } from '../services/ticketService.js';
import { uploadTicketPhotos } from '../services/photoUploadService.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const router = useRouter();
const { locale, t, te } = useI18n();
const sidebarOpen = ref(false);
const loading = ref(true);
const creating = ref(false);
const modalOpen = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const attachmentFiles = ref([]);
const uploadLabel = ref('');
const tickets = ref([]);
const options = ref({ organizations: [], facilities: [], administrativeUnits: [], assignees: [] });
const summary = ref({ total: 0, active: 0, critical: 0, resolved: 0, escalated: 0 });
const pagination = ref({ page: 1, limit: 20, total: 0, pages: 1 });
const filters = reactive({
  search: '',
  status: '',
  priority: '',
  type: '',
  category: '',
  page: 1,
  limit: 20,
});
const form = reactive({
  organizationId: '',
  facilityId: '',
  equipmentId: '',
  type: 'INCIDENT',
  category: 'EQUIPMENT_FAULT',
  title: '',
  description: '',
  impact: 'MEDIUM',
  urgency: 'MEDIUM',
});
let searchTimer;

const permissions = computed(() => new Set(auth.user?.permissions ?? []));
const canCreate = computed(() => permissions.value.has('tickets.create'));
const isSuperAdmin = computed(() => auth.user?.roles?.some((role) => role.key === 'SUPER_ADMIN'));
const scopeName = computed(() => auth.user?.facility?.name
  ?? auth.user?.scopes?.[0]?.name
  ?? auth.user?.organization?.name
  ?? t('tickets.yourScope'));
const selectedFacility = computed(() =>
  options.value.facilities.find((facility) => facility.id === form.facilityId));
const equipmentOptions = computed(() => selectedFacility.value?.equipment ?? []);
const priorityPreview = computed(() => previewPriority(form.impact, form.urgency));
const summaryCards = computed(() => [
  { label: t('tickets.allTickets'), value: summary.value.total, icon: TicketCheck, tone: 'blue' },
  { label: t('tickets.activeQueue'), value: summary.value.active, icon: CircleDot, tone: 'orange' },
  { label: t('tickets.critical'), value: summary.value.critical, icon: ShieldAlert, tone: 'red' },
  { label: t('tickets.resolved'), value: summary.value.resolved, icon: CheckCircle2, tone: 'green' },
]);
const resultStart = computed(() => pagination.value.total
  ? ((pagination.value.page - 1) * pagination.value.limit) + 1
  : 0);
const resultEnd = computed(() => Math.min(
  pagination.value.page * pagination.value.limit,
  pagination.value.total,
));

async function loadTickets() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await ticketApi.list(auth, filters);
    tickets.value = data.tickets;
    summary.value = data.summary;
    pagination.value = data.pagination;
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function loadOptions(organizationId = '') {
  const data = await ticketApi.options(auth, organizationId);
  options.value = data;
  if (!form.organizationId) form.organizationId = auth.user?.organization?.id ?? data.organizations[0]?.id ?? '';
  if (auth.user?.facility?.id) form.facilityId = auth.user.facility.id;
}

function resetForm() {
  Object.assign(form, {
    organizationId: auth.user?.organization?.id ?? '',
    facilityId: auth.user?.facility?.id ?? '',
    equipmentId: '',
    type: 'INCIDENT',
    category: 'EQUIPMENT_FAULT',
    title: '',
    description: '',
    impact: 'MEDIUM',
    urgency: 'MEDIUM',
  });
  attachmentFiles.value = [];
  uploadLabel.value = '';
}

async function openCreate() {
  resetForm();
  modalOpen.value = true;
  errorMessage.value = '';
  try {
    await loadOptions(form.organizationId);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

function closeCreate() {
  if (creating.value) return;
  modalOpen.value = false;
  attachmentFiles.value = [];
  uploadLabel.value = '';
}

async function organizationChanged() {
  form.facilityId = '';
  form.equipmentId = '';
  await loadOptions(form.organizationId);
}

async function submitTicket() {
  creating.value = true;
  errorMessage.value = '';
  try {
    const attachments = await uploadTicketPhotos(
      attachmentFiles.value,
      (completed, total) => {
        uploadLabel.value = t('tickets.uploadedPhotos', { completed, total });
      },
    );
    const data = await ticketApi.create(auth, {
      ...form,
      facilityId: form.facilityId || null,
      equipmentId: form.equipmentId || null,
      attachments,
    });
    modalOpen.value = false;
    attachmentFiles.value = [];
    uploadLabel.value = '';
    successMessage.value = t('tickets.created', { ticketNumber: data.ticket.ticketNumber });
    await router.push(`/modules/issues/${data.ticket.id}`);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    creating.value = false;
  }
}

function resetFilters() {
  Object.assign(filters, {
    search: '',
    status: '',
    priority: '',
    type: '',
    category: '',
    page: 1,
    limit: 20,
  });
  loadTickets();
}

function goToPage(page) {
  if (page < 1 || page > pagination.value.pages || page === filters.page) return;
  filters.page = page;
  loadTickets();
}

function priorityLabel(priority) {
  return `P${priority}`;
}
function localizedStatus(status) {
  return te(`statuses.${status}`) ? t(`statuses.${status}`) : ticketStatusLabel(status);
}

function localizedOption(options, value, group) {
  const key = `ticketOptions.${group}.${value}`;
  return te(key) ? t(key) : labelFor(options, value);
}

function localizedDate(value) {
  return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '';
}

watch(() => [filters.status, filters.priority, filters.type, filters.category], () => {
  filters.page = 1;
  loadTickets();
});
watch(() => filters.search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.page = 1;
    loadTickets();
  }, 350);
});
watch(() => form.facilityId, () => {
  form.equipmentId = '';
});

onMounted(loadTickets);
onBeforeUnmount(() => clearTimeout(searchTimer));
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />

      <main class="tickets-page">
        <section class="tickets-hero">
          <div>
            <span>{{ t('tickets.eyebrow') }}</span>
            <h1>{{ t('tickets.title') }}</h1>
            <p>{{ t('tickets.subtitle', { scope: scopeName }) }}</p>
          </div>
          <button v-if="canCreate" class="ticket-primary-button" type="button" @click="openCreate">
            <Plus :size="18" />
            {{ t('tickets.register') }}
          </button>
        </section>

        <p v-if="successMessage" class="ticket-success">{{ successMessage }}</p>
        <p v-if="errorMessage && !modalOpen" class="ticket-error">{{ errorMessage }}</p>

        <section class="ticket-summary-grid">
          <article v-for="card in summaryCards" :key="card.label" :class="`ticket-summary ticket-summary--${card.tone}`">
            <span><component :is="card.icon" :size="21" /></span>
            <div><small>{{ card.label }}</small><strong>{{ card.value.toLocaleString() }}</strong></div>
          </article>
        </section>

        <section class="ticket-queue">
          <header>
            <div>
              <span>{{ t('tickets.workload') }}</span>
              <h2>{{ t('tickets.queue') }}</h2>
            </div>
            <p v-if="summary.escalated">{{ t('tickets.escalated', { count: summary.escalated }) }}</p>
          </header>

          <div class="ticket-toolbar">
            <label class="ticket-search">
              <Search :size="18" />
              <input v-model="filters.search" type="search" :placeholder="t('tickets.search')" />
            </label>
            <select v-model="filters.status" :aria-label="t('tickets.filterStatus')">
              <option value="">{{ t('tickets.allStatuses') }}</option>
              <option v-for="[value] in ticketStatuses" :key="value" :value="value">{{ localizedStatus(value) }}</option>
            </select>
            <select v-model="filters.priority" :aria-label="t('tickets.filterPriority')">
              <option value="">{{ t('tickets.allPriorities') }}</option>
              <option v-for="priority in [1, 2, 3, 4]" :key="priority" :value="priority">{{ t(`ticketOptions.priorities.P${priority}`) }}</option>
            </select>
            <select v-model="filters.category" :aria-label="t('tickets.filterCategory')">
              <option value="">{{ t('tickets.allCategories') }}</option>
              <option v-for="[value] in ticketCategories" :key="value" :value="value">{{ localizedOption(ticketCategories, value, 'categories') }}</option>
            </select>
            <button type="button" :title="t('tickets.resetFilters')" @click="resetFilters"><FilterX :size="18" /></button>
          </div>

          <div v-if="loading" class="ticket-loading">
            <LoaderCircle class="spin" :size="24" /> {{ t('tickets.loading') }}
          </div>
          <div v-else-if="!tickets.length" class="ticket-empty">
            <span><Headphones :size="30" /></span>
            <h3>{{ t('tickets.empty') }}</h3>
            <p>{{ t('tickets.emptyHint') }}</p>
            <button v-if="canCreate" type="button" @click="openCreate">{{ t('tickets.first') }}</button>
          </div>
          <div v-else class="ticket-table-wrap">
            <table class="ticket-table">
              <thead><tr><th>{{ t('tickets.columns.ticket') }}</th><th>{{ t('tickets.columns.issue') }}</th><th>{{ t('tickets.columns.facility') }}</th><th>{{ t('tickets.columns.priority') }}</th><th>{{ t('tickets.columns.status') }}</th><th>{{ t('tickets.columns.updated') }}</th><th></th></tr></thead>
              <tbody>
                <tr v-for="ticket in tickets" :key="ticket.id" @click="router.push(`/modules/issues/${ticket.id}`)">
                  <td><strong>{{ ticket.ticketNumber }}</strong><small>{{ localizedOption(ticketTypes, ticket.type, 'types') }}</small></td>
                  <td><strong>{{ ticket.title }}</strong><small>{{ localizedOption(ticketCategories, ticket.category, 'categories') }} · {{ t('tickets.comments', { count: ticket._count.comments }) }}</small></td>
                  <td><span>{{ ticket.facility?.name ?? ticket.administrativeUnit?.name ?? ticket.organization?.name ?? t('tickets.organizationWide') }}</span><small>{{ ticket.equipment?.assetCode ?? t('tickets.noEquipment') }}</small></td>
                  <td><b class="priority-pill" :class="`priority-pill--${ticket.priority}`">{{ priorityLabel(ticket.priority) }}</b></td>
                  <td><b class="status-pill" :class="`status-pill--${ticket.status.toLowerCase()}`">{{ localizedStatus(ticket.status) }}</b></td>
                  <td><span>{{ localizedDate(ticket.updatedAt) }}</span><small>{{ t('tickets.by', { name: `${ticket.reportedBy.firstName} ${ticket.reportedBy.lastName}` }) }}</small></td>
                  <td><ArrowRight :size="17" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer v-if="pagination.total" class="ticket-pagination">
            <span>{{ t('tickets.showing', { start: resultStart, end: resultEnd, total: pagination.total }) }}</span>
            <div>
              <button type="button" :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)"><ChevronLeft :size="17" /></button>
              <b>{{ t('tickets.page', { page: pagination.page, pages: pagination.pages }) }}</b>
              <button type="button" :disabled="pagination.page >= pagination.pages" @click="goToPage(pagination.page + 1)"><ChevronRight :size="17" /></button>
            </div>
          </footer>
        </section>
      </main>
    </div>

    <div v-if="modalOpen" class="ticket-modal" @click.self="closeCreate">
      <form @submit.prevent="submitTicket">
        <header>
          <div><span>{{ t('tickets.newEyebrow') }}</span><h2>{{ t('tickets.newTitle') }}</h2><p>{{ t('tickets.newHint') }}</p></div>
          <button type="button" :aria-label="t('tickets.close')" :disabled="creating" @click="closeCreate"><X :size="21" /></button>
        </header>

        <p v-if="errorMessage" class="ticket-error ticket-modal-error">{{ errorMessage }}</p>

        <div class="ticket-form-grid">
          <label v-if="isSuperAdmin">{{ t('tickets.organization') }}
            <select v-model="form.organizationId" required @change="organizationChanged">
              <option disabled value="">{{ t('tickets.selectOrganization') }}</option>
              <option v-for="organization in options.organizations" :key="organization.id" :value="organization.id">{{ organization.name }}</option>
            </select>
          </label>
          <label>{{ t('tickets.issueType') }}
            <select v-model="form.type" required>
              <option v-for="[value] in ticketTypes" :key="value" :value="value">{{ localizedOption(ticketTypes, value, 'types') }}</option>
            </select>
          </label>
          <label>{{ t('tickets.category') }}
            <select v-model="form.category" required>
              <option v-for="[value] in ticketCategories" :key="value" :value="value">{{ localizedOption(ticketCategories, value, 'categories') }}</option>
            </select>
          </label>
          <label>{{ t('tickets.facility') }}
            <select v-model="form.facilityId" :disabled="Boolean(auth.user?.facility?.id)">
              <option value="">{{ t('tickets.scopeWideIssue') }}</option>
              <option v-for="facility in options.facilities" :key="facility.id" :value="facility.id">{{ facility.name }}</option>
            </select>
          </label>
          <label>{{ t('tickets.equipment') }}
            <select v-model="form.equipmentId" :disabled="!form.facilityId || !equipmentOptions.length">
              <option value="">{{ equipmentOptions.length ? t('tickets.noSpecificEquipment') : t('tickets.noActiveEquipment') }}</option>
              <option v-for="equipment in equipmentOptions" :key="equipment.id" :value="equipment.id">{{ equipment.assetCode }} · {{ equipment.equipmentType.name }}</option>
            </select>
          </label>
          <label class="ticket-form-wide">{{ t('tickets.issueTitle') }}
            <input v-model.trim="form.title" minlength="5" maxlength="160" required :placeholder="t('tickets.issueTitlePlaceholder')" />
          </label>
          <label class="ticket-form-wide">{{ t('tickets.detailedDescription') }}
            <textarea v-model.trim="form.description" minlength="10" maxlength="10000" rows="5" required :placeholder="t('tickets.detailedDescriptionPlaceholder')" />
          </label>
          <TicketPhotoPicker
            v-model="attachmentFiles"
            class="ticket-form-wide"
            :disabled="creating"
            :uploading-label="uploadLabel"
          />
          <label>{{ t('tickets.impact') }}
            <select v-model="form.impact">
              <option v-for="[value] in riskLevels" :key="value" :value="value">{{ localizedOption(riskLevels, value, 'risk') }}</option>
            </select>
            <small>{{ t('tickets.impactHint') }}</small>
          </label>
          <label>{{ t('tickets.urgency') }}
            <select v-model="form.urgency">
              <option v-for="[value] in riskLevels" :key="value" :value="value">{{ localizedOption(riskLevels, value, 'risk') }}</option>
            </select>
            <small>{{ t('tickets.urgencyHint') }}</small>
          </label>
          <div class="priority-preview" :class="`priority-preview--${priorityPreview}`">
            <AlertTriangle :size="22" />
            <div><span>{{ t('tickets.calculatedPriority') }}</span><strong>P{{ priorityPreview }}</strong></div>
            <p>{{ t('tickets.priorityHint') }}</p>
          </div>
        </div>

        <footer>
          <button type="button" :disabled="creating" @click="closeCreate">{{ t('tickets.cancel') }}</button>
          <button class="ticket-primary-button" type="submit" :disabled="creating">
            <LoaderCircle v-if="creating" class="spin" :size="17" />
            <MessageSquareText v-else :size="17" />
            {{ creating ? (uploadLabel || t('tickets.registering')) : t('tickets.registerTicket') }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.tickets-page{min-height:calc(100vh - 72px);padding:24px;background:#f5f7fa}.tickets-hero{max-width:1450px;margin:0 auto 16px;padding:24px 26px;display:flex;align-items:center;justify-content:space-between;gap:24px;border:1px solid var(--border);border-radius:16px;background:linear-gradient(125deg,#fff 55%,#eef5ff)}.tickets-hero span,.ticket-queue>header span,.ticket-modal header span{color:var(--blue);font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.tickets-hero h1{margin:3px 0 2px;font-size:27px;line-height:1.3}.tickets-hero p{margin:0;color:var(--muted);font-size:13px}.ticket-primary-button{min-height:42px;padding:0 16px;display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:9px;color:#fff;background:var(--blue);font-size:13px;font-weight:650;cursor:pointer}.ticket-primary-button:hover{background:var(--blue-dark)}.ticket-primary-button:disabled{opacity:.6;cursor:wait}.ticket-error,.ticket-success{max-width:1450px;margin:0 auto 14px;padding:11px 13px;border-radius:9px;font-size:12px}.ticket-error{border:1px solid #fecdca;color:#b42318;background:#fef3f2}.ticket-success{border:1px solid #a6f4c5;color:#067647;background:#ecfdf3}.ticket-summary-grid{max-width:1450px;margin:0 auto 16px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.ticket-summary{padding:17px 18px;display:flex;align-items:center;gap:12px;border:1px solid var(--border);border-radius:13px;background:#fff}.ticket-summary>span{width:42px;height:42px;display:grid;place-items:center;border-radius:11px}.ticket-summary div{display:flex;flex-direction:column}.ticket-summary small{color:var(--muted);font-size:11px}.ticket-summary strong{font-size:23px;line-height:1.25}.ticket-summary--blue>span{color:var(--blue);background:var(--blue-soft)}.ticket-summary--orange>span{color:var(--orange);background:var(--orange-soft)}.ticket-summary--red>span{color:var(--red);background:var(--red-soft)}.ticket-summary--green>span{color:var(--green);background:var(--green-soft)}.ticket-queue{max-width:1450px;margin:auto;overflow:hidden;border:1px solid var(--border);border-radius:15px;background:#fff}.ticket-queue>header{padding:17px 19px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}.ticket-queue>header h2{margin:2px 0 0;font-size:17px}.ticket-queue>header p{margin:0;padding:5px 9px;border-radius:999px;color:#b54708;background:#fff4e5;font-size:10px;font-weight:650}.ticket-toolbar{padding:12px 15px;display:grid;grid-template-columns:minmax(260px,1fr) 170px 145px 190px 42px;gap:9px;border-bottom:1px solid var(--border);background:#fafbfc}.ticket-toolbar select,.ticket-search{height:41px;border:1px solid #d5dce6;border-radius:9px;background:#fff}.ticket-toolbar select{padding:0 10px;color:#344054;font:inherit;font-size:11px}.ticket-search{padding:0 11px;display:flex;align-items:center;gap:8px;color:#98a2b3}.ticket-search input{min-width:0;flex:1;border:0;outline:0;background:transparent;font-size:12px}.ticket-toolbar>button{border:1px solid #d5dce6;border-radius:9px;color:#667085;background:#fff;cursor:pointer}.ticket-loading,.ticket-empty{min-height:330px;display:flex;align-items:center;justify-content:center;gap:9px;color:var(--muted);font-size:13px}.ticket-empty{flex-direction:column;text-align:center}.ticket-empty>span{width:58px;height:58px;display:grid;place-items:center;border-radius:16px;color:var(--blue);background:var(--blue-soft)}.ticket-empty h3{margin:10px 0 0;color:var(--ink);font-size:17px}.ticket-empty p{margin:0}.ticket-empty button{margin-top:8px;border:0;color:var(--blue);background:transparent;font-weight:650;cursor:pointer}.ticket-table-wrap{overflow-x:auto}.ticket-table{width:100%;border-collapse:collapse;white-space:nowrap}.ticket-table th{padding:11px 14px;color:#667085;background:#fafbfc;font-size:10px;font-weight:650;text-align:left;text-transform:uppercase;letter-spacing:.04em}.ticket-table td{padding:14px;border-top:1px solid #edf0f4;color:#344054;font-size:11px}.ticket-table tbody tr{cursor:pointer;transition:.15s}.ticket-table tbody tr:hover{background:#f7faff}.ticket-table td>strong,.ticket-table td>span{display:block;max-width:310px;overflow:hidden;color:#1d2939;font-size:12px;text-overflow:ellipsis}.ticket-table td>small{display:block;margin-top:3px;color:#98a2b3;font-size:9px}.priority-pill,.status-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:700}.priority-pill--1{color:#b42318;background:#fee4e2}.priority-pill--2{color:#b54708;background:#ffead5}.priority-pill--3{color:#175cd3;background:#dbeafe}.priority-pill--4{color:#475467;background:#f2f4f7}.status-pill{color:#344054;background:#f2f4f7}.status-pill--open,.status-pill--reopened{color:#175cd3;background:#eff6ff}.status-pill--in_progress,.status-pill--assigned,.status-pill--acknowledged{color:#026aa2;background:#e0f2fe}.status-pill--escalated{color:#b42318;background:#fee4e2}.status-pill--resolved,.status-pill--verified,.status-pill--closed{color:#067647;background:#dcfae6}.status-pill--waiting_on_reporter,.status-pill--awaiting_parts,.status-pill--waiting_on_vendor{color:#b54708;background:#fff4e5}.ticket-pagination{padding:12px 15px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);color:var(--muted);font-size:10px}.ticket-pagination div{display:flex;align-items:center;gap:10px}.ticket-pagination button{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--border);border-radius:8px;background:#fff;cursor:pointer}.ticket-pagination button:disabled{opacity:.4;cursor:default}.ticket-pagination b{color:#344054;font-size:10px}.ticket-modal{position:fixed;inset:0;z-index:100;padding:24px;display:grid;place-items:center;background:rgba(16,24,40,.58)}.ticket-modal>form{width:min(860px,100%);max-height:94vh;overflow-y:auto;border-radius:17px;background:#fff;box-shadow:0 25px 60px rgba(16,24,40,.25)}.ticket-modal header{position:sticky;top:0;z-index:2;padding:20px 22px;display:flex;justify-content:space-between;border-bottom:1px solid var(--border);background:#fff}.ticket-modal header h2{margin:3px 0 1px;font-size:21px}.ticket-modal header p{margin:0;color:var(--muted);font-size:11px}.ticket-modal header button{border:0;background:transparent;cursor:pointer}.ticket-modal-error{margin:14px 22px 0}.ticket-form-grid{padding:19px 22px;display:grid;grid-template-columns:repeat(2,1fr);gap:13px}.ticket-form-grid label{display:flex;flex-direction:column;gap:6px;color:#344054;font-size:11px;font-weight:650}.ticket-form-grid input,.ticket-form-grid select,.ticket-form-grid textarea{width:100%;padding:10px 11px;border:1px solid #d5dce6;border-radius:9px;outline:0;color:var(--ink);background:#fff;font:inherit;font-size:12px}.ticket-form-grid input:focus,.ticket-form-grid select:focus,.ticket-form-grid textarea:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(18,100,216,.1)}.ticket-form-grid select:disabled{color:#98a2b3;background:#f8fafc}.ticket-form-grid textarea{resize:vertical}.ticket-form-grid label small{color:var(--muted);font-size:9px;font-weight:400}.ticket-form-wide{grid-column:1/-1}.priority-preview{grid-column:1/-1;padding:13px 15px;display:grid;grid-template-columns:36px auto 1fr;align-items:center;gap:8px;border-radius:10px;background:#f8fafc}.priority-preview>div{display:flex;flex-direction:column}.priority-preview span{color:var(--muted);font-size:9px;text-transform:uppercase}.priority-preview strong{font-size:18px}.priority-preview p{margin-left:auto;color:var(--muted);font-size:10px}.priority-preview--1{color:#b42318;background:#fef3f2}.priority-preview--2{color:#b54708;background:#fff4e5}.priority-preview--3{color:#175cd3;background:#eff6ff}.priority-preview--4{color:#475467}.ticket-modal footer{position:sticky;bottom:0;padding:14px 22px;display:flex;justify-content:flex-end;gap:9px;border-top:1px solid var(--border);background:#fff}.ticket-modal footer>button:not(.ticket-primary-button){padding:0 15px;border:1px solid var(--border);border-radius:9px;background:#fff;font-size:12px;cursor:pointer}
@media(max-width:1100px){.ticket-summary-grid{grid-template-columns:repeat(2,1fr)}.ticket-toolbar{grid-template-columns:1fr 1fr 1fr}.ticket-search{grid-column:span 2}}@media(max-width:700px){.tickets-page{padding:13px 10px}.tickets-hero{padding:19px;align-items:flex-start;flex-direction:column}.tickets-hero .ticket-primary-button{width:100%}.ticket-summary-grid{grid-template-columns:1fr 1fr}.ticket-toolbar{grid-template-columns:1fr}.ticket-search{grid-column:auto}.ticket-toolbar>button{height:41px}.ticket-modal{padding:0}.ticket-modal>form{height:100%;max-height:none;border-radius:0}.ticket-form-grid{grid-template-columns:1fr}.ticket-form-wide,.priority-preview{grid-column:auto}.priority-preview{grid-template-columns:32px 1fr}.priority-preview p{grid-column:1/-1;margin:0}.ticket-modal footer .ticket-primary-button{flex:1}}@media(max-width:430px){.ticket-summary-grid{grid-template-columns:1fr}.ticket-queue>header{align-items:flex-start;flex-direction:column;gap:8px}}
</style>
