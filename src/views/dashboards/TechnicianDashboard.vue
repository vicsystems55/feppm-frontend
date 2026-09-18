<script setup>
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  HardHat,
  LoaderCircle,
  MapPin,
  PackagePlus,
  Play,
  RefreshCw,
  Send,
  Timer,
  X,
} from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import TicketPhotoPicker from '../../components/tickets/TicketPhotoPicker.vue';
import { maintenanceOperationsApi } from '../../services/maintenanceOperationsService.js';
import { uploadTicketPhotos } from '../../services/photoUploadService.js';
import { useAuthStore } from '../../stores/auth.js';

const props = defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
const auth = useAuthStore();
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');
const orders = ref([]);
const now = ref(new Date());
const selectedDay = ref(new Date().toDateString());
const reportOpen = ref(false);
const reportPhotos = ref([]);
const uploadLabel = ref('');
const reportForm = reactive({
  arrivedAt: '',
  departedAt: '',
  diagnosis: '',
  rootCause: '',
  actionTaken: '',
  observation: '',
  repairOutcome: '',
  equipmentStatusAfterRepair: 'FUNCTIONAL',
  laborMinutes: '',
});
let ticker;

const activeStatuses = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'AWAITING_PARTS', 'AWAITING_VERIFICATION'];
const activeOrders = computed(() => orders.value.filter((order) => activeStatuses.includes(order.status)));
const latestOrder = computed(() => activeOrders.value[0] ?? orders.value[0] ?? null);
const counts = computed(() => ({
  assigned: orders.value.filter(({ status }) => ['ASSIGNED', 'ACCEPTED'].includes(status)).length,
  active: orders.value.filter(({ status }) => ['IN_PROGRESS', 'AWAITING_PARTS'].includes(status)).length,
  review: orders.value.filter(({ status }) => status === 'AWAITING_VERIFICATION').length,
  completed: orders.value.filter(({ status }) => status === 'COMPLETED').length,
}));

const calendarDays = computed(() => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dayOrders = orders.value.filter((order) => order.plannedStartAt && new Date(order.plannedStartAt).toDateString() === date.toDateString());
    return { date, orders: dayOrders };
  });
});
const selectedDayOrders = computed(() => orders.value.filter((order) => {
  const date = order.plannedStartAt ? new Date(order.plannedStartAt) : null;
  return date?.toDateString() === selectedDay.value;
}));

const scheduleTarget = computed(() => {
  if (latestOrder.value?.plannedStartAt) return { date: new Date(latestOrder.value.plannedStartAt), placeholder: false };
  const fallback = new Date(now.value);
  fallback.setMinutes(0, 0, 0);
  fallback.setHours(fallback.getHours() + 3);
  return { date: fallback, placeholder: true };
});

const countdown = computed(() => {
  if (!latestOrder.value || ['IN_PROGRESS', 'AWAITING_PARTS', 'AWAITING_VERIFICATION', 'COMPLETED'].includes(latestOrder.value.status)) return null;
  const distance = scheduleTarget.value.date.getTime() - now.value.getTime();
  const absolute = Math.abs(distance);
  const hours = Math.floor(absolute / 3600000);
  const minutes = Math.floor((absolute % 3600000) / 60000);
  const seconds = Math.floor((absolute % 60000) / 1000);
  return { late: distance < 0, value: [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':') };
});

const timingState = computed(() => {
  const order = latestOrder.value;
  if (!order) return { tone: 'neutral', label: 'No active assignment', detail: 'New work orders will appear here.' };
  if (order.status === 'IN_PROGRESS') return { tone: 'green', label: 'Work started', detail: order.startedAt ? `Started ${formatDateTime(order.startedAt)}` : 'Field execution is in progress.' };
  if (order.status === 'AWAITING_PARTS') return { tone: 'orange', label: 'Waiting for resources', detail: 'The work order is paused while tools or parts are sourced.' };
  if (order.status === 'AWAITING_VERIFICATION') return { tone: 'blue', label: 'Report submitted', detail: 'Your completion report is awaiting manager verification.' };
  if (order.status === 'COMPLETED') return { tone: 'green', label: 'Work completed', detail: formatDateTime(order.completedAt) };
  const arrivedAt = order.fieldReport?.arrivedAt;
  if (arrivedAt && order.plannedStartAt) {
    const late = new Date(arrivedAt) > new Date(order.plannedStartAt);
    return { tone: late ? 'red' : 'green', label: late ? 'Arrived late' : 'Arrived on time', detail: formatDateTime(arrivedAt) };
  }
  if (countdown.value?.late) return { tone: 'red', label: 'Late to arrive', detail: `${countdown.value.value} beyond the planned start time.` };
  const distance = scheduleTarget.value.date.getTime() - now.value.getTime();
  if (distance <= 30 * 60000) return { tone: 'orange', label: 'Arrival window open', detail: 'Confirm arrival and start work as soon as you are on site.' };
  return { tone: 'blue', label: 'On schedule', detail: 'Prepare tools, parts and travel arrangements.' };
});

function humanStatus(value) {
  return String(value ?? '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function formatDate(value, options = { dateStyle: 'medium' }) {
  return value ? new Intl.DateTimeFormat(undefined, options).format(new Date(value)) : 'Not scheduled';
}
function formatDateTime(value) {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
}
function localInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function clearMessages() { error.value = ''; success.value = ''; }

async function loadOrders() {
  loading.value = true;
  clearMessages();
  try {
    const payload = await maintenanceOperationsApi.workOrders(auth);
    orders.value = [...(payload.workOrders ?? [])].sort((a, b) => {
      const first = new Date(a.assignedAt ?? a.createdAt ?? 0).getTime();
      const second = new Date(b.assignedAt ?? b.createdAt ?? 0).getTime();
      return second - first;
    });
  } catch (loadError) {
    error.value = loadError.message;
  } finally {
    loading.value = false;
  }
}

async function runAction(action, message) {
  const order = latestOrder.value;
  if (!order) return;
  saving.value = true;
  clearMessages();
  try {
    await action(order.id);
    success.value = message;
    await loadOrders();
  } catch (actionError) {
    error.value = actionError.message;
  } finally {
    saving.value = false;
  }
}

function openReport() {
  const report = latestOrder.value?.fieldReport ?? {};
  Object.assign(reportForm, {
    arrivedAt: localInput(report.arrivedAt ?? new Date()),
    departedAt: localInput(report.departedAt),
    diagnosis: report.diagnosis ?? '',
    rootCause: report.rootCause ?? '',
    actionTaken: report.actionTaken ?? '',
    observation: report.observation ?? '',
    repairOutcome: report.repairOutcome ?? '',
    equipmentStatusAfterRepair: report.equipmentStatusAfterRepair ?? 'FUNCTIONAL',
    laborMinutes: report.laborMinutes ?? '',
  });
  reportPhotos.value = [];
  reportOpen.value = true;
}

async function submitReport() {
  const order = latestOrder.value;
  if (!order) return;
  saving.value = true;
  clearMessages();
  try {
    const data = {
      ...reportForm,
      arrivedAt: reportForm.arrivedAt ? new Date(reportForm.arrivedAt).toISOString() : null,
      departedAt: reportForm.departedAt ? new Date(reportForm.departedAt).toISOString() : new Date().toISOString(),
      laborMinutes: reportForm.laborMinutes === '' ? null : Number(reportForm.laborMinutes),
    };
    await maintenanceOperationsApi.saveFieldReport(auth, order.id, data);
    if (reportPhotos.value.length) {
      const uploads = await uploadTicketPhotos(reportPhotos.value, (complete, total) => {
        uploadLabel.value = `Uploaded ${complete} of ${total} evidence photos.`;
      });
      for (const photo of uploads) {
        await maintenanceOperationsApi.addWorkOrderEvidence(auth, order.id, { ...photo, category: 'AFTER_REPAIR', caption: 'Completion evidence uploaded from the Technician web dashboard.' });
      }
    }
    await maintenanceOperationsApi.completeWorkOrder(auth, order.id, { note: 'Completion report submitted from the Technician web dashboard.' });
    reportOpen.value = false;
    reportPhotos.value = [];
    uploadLabel.value = '';
    success.value = 'Completion report submitted for verification.';
    await loadOrders();
  } catch (submitError) {
    error.value = submitError.message;
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadOrders();
  ticker = window.setInterval(() => { now.value = new Date(); }, 1000);
});
onBeforeUnmount(() => window.clearInterval(ticker));
</script>

<template>
  <section class="technician-dashboard">
    <header class="tech-hero">
      <div>
        <span>Technician workspace</span>
        <h1>Good day, {{ user.firstName }}</h1>
        <p>Your next assignment, schedule and field actions are organized in one place.</p>
      </div>
      <button type="button" :disabled="loading" @click="loadOrders"><RefreshCw :size="17" /> Refresh assignments</button>
    </header>

    <p v-if="error" class="message error"><AlertCircle :size="17" /> {{ error }}</p>
    <p v-if="success" class="message success"><CheckCircle2 :size="17" /> {{ success }}</p>

    <section class="summary-grid">
      <article><HardHat :size="22" /><div><small>New assignments</small><strong>{{ counts.assigned }}</strong></div></article>
      <article class="green"><Play :size="22" /><div><small>Work in progress</small><strong>{{ counts.active }}</strong></div></article>
      <article class="orange"><ClipboardCheck :size="22" /><div><small>Awaiting review</small><strong>{{ counts.review }}</strong></div></article>
      <article class="purple"><CheckCircle2 :size="22" /><div><small>Completed</small><strong>{{ counts.completed }}</strong></div></article>
    </section>

    <div v-if="loading" class="loading-card"><LoaderCircle :size="28" class="spin" /> Loading your work orders&</div>

    <template v-else>
      <section v-if="latestOrder" class="latest-order">
        <div class="latest-main">
          <div class="section-heading"><div><span>Latest work order</span><h2>{{ latestOrder.workOrderNumber }}</h2></div><b :class="`status ${latestOrder.status.toLowerCase()}`">{{ humanStatus(latestOrder.status) }}</b></div>
          <h3>{{ latestOrder.title }}</h3>
          <p>{{ latestOrder.description }}</p>
          <div class="order-meta">
            <span><MapPin :size="16" /> {{ latestOrder.facility?.name ?? 'Facility not recorded' }}</span>
            <span><HardHat :size="16" /> {{ latestOrder.equipment?.assetCode ?? latestOrder.equipment?.equipmentType?.name ?? 'Equipment not recorded' }}</span>
            <span><CalendarDays :size="16" /> {{ formatDateTime(latestOrder.plannedStartAt) }}</span>
          </div>
          <div class="action-row">
            <button v-if="latestOrder.status === 'ASSIGNED'" class="primary" :disabled="saving" @click="runAction((id) => maintenanceOperationsApi.acceptWorkOrder(auth, id), 'Work order accepted.')"><CheckCircle2 :size="17" /> Accept assignment</button>
            <button v-if="latestOrder.status === 'ACCEPTED'" class="primary green-button" :disabled="saving" @click="runAction((id) => maintenanceOperationsApi.startWorkOrder(auth, id), 'Work started. Your start time has been recorded.')"><Play :size="17" /> Started work</button>
            <RouterLink v-if="['ASSIGNED','ACCEPTED','IN_PROGRESS','AWAITING_PARTS'].includes(latestOrder.status)" :to="{ path: '/modules/resource-requests', query: { create: '1', workOrderId: latestOrder.id } }"><PackagePlus :size="17" /> Request tools or parts</RouterLink>
            <button v-if="latestOrder.status === 'IN_PROGRESS'" class="report-button" type="button" @click="openReport"><ClipboardCheck :size="17" /> Complete field report</button>
            <RouterLink :to="{ path: '/modules/maintenance-operations', query: { tab: 'work-orders' } }">View all work orders</RouterLink>
          </div>
        </div>

        <aside class="timing-card" :class="`is-${timingState.tone}`">
          <div class="timing-icon"><Timer :size="25" /></div>
          <small>{{ scheduleTarget.placeholder ? 'Schedule countdown preview' : 'Arrival countdown' }}</small>
          <strong v-if="countdown">{{ countdown.late ? '+' : '' }}{{ countdown.value }}</strong>
          <strong v-else class="state-text">{{ timingState.label }}</strong>
          <b>{{ timingState.label }}</b>
          <p>{{ timingState.detail }}</p>
          <em v-if="scheduleTarget.placeholder">Placeholder until a planned start time is assigned.</em>
        </aside>
      </section>

      <section v-else class="empty-state"><HardHat :size="42" /><h2>No work orders assigned</h2><p>Your latest approved assignment will appear here.</p></section>

      <section class="calendar-panel">
        <header><div><span>My schedule</span><h2>Next seven days</h2></div><p>Work orders appear on their planned start date.</p></header>
        <div class="calendar-strip">
          <button v-for="day in calendarDays" :key="day.date.toISOString()" :class="{ active: selectedDay === day.date.toDateString(), busy: day.orders.length }" @click="selectedDay = day.date.toDateString()">
            <small>{{ formatDate(day.date, { weekday: 'short' }) }}</small><strong>{{ day.date.getDate() }}</strong><span>{{ day.orders.length || '' }}</span>
          </button>
        </div>
        <div class="day-agenda">
          <article v-for="order in selectedDayOrders" :key="order.id"><Clock3 :size="18" /><div><strong>{{ formatDate(order.plannedStartAt, { timeStyle: 'short' }) }} · {{ order.workOrderNumber }}</strong><p>{{ order.facility?.name }}  {{ order.title }}</p></div><b>{{ humanStatus(order.status) }}</b></article>
          <div v-if="!selectedDayOrders.length" class="no-agenda"><CalendarDays :size="24" /><span>No scheduled visit for this date.</span></div>
        </div>
      </section>
    </template>

    <div v-if="reportOpen" class="report-modal" @click.self="reportOpen = false">
      <form @submit.prevent="submitReport">
        <header><div><span>Field completion</span><h2>Submit maintenance report</h2><p>{{ latestOrder?.workOrderNumber }} · {{ latestOrder?.facility?.name }}</p></div><button type="button" @click="reportOpen = false"><X :size="21" /></button></header>
        <div class="report-grid">
          <label>Arrival time<input v-model="reportForm.arrivedAt" type="datetime-local" required /></label>
          <label>Departure time<input v-model="reportForm.departedAt" type="datetime-local" /></label>
          <label class="wide">Diagnosis<textarea v-model="reportForm.diagnosis" rows="3" required /></label>
          <label class="wide">Root cause<textarea v-model="reportForm.rootCause" rows="3" /></label>
          <label class="wide">Action taken<textarea v-model="reportForm.actionTaken" rows="4" minlength="10" required /></label>
          <label class="wide">Repair outcome<textarea v-model="reportForm.repairOutcome" rows="4" required /></label>
          <label>Equipment condition<select v-model="reportForm.equipmentStatusAfterRepair"><option value="FUNCTIONAL">Functional</option><option value="PARTIALLY_FUNCTIONAL">Partially functional</option><option value="NON_FUNCTIONAL">Non-functional</option><option value="DECOMMISSIONED">Decommissioned</option><option value="UNKNOWN">Unknown</option></select></label>
          <label>Labour time (minutes)<input v-model="reportForm.laborMinutes" min="0" type="number" /></label>
          <label class="wide">Additional observations<textarea v-model="reportForm.observation" rows="3" /></label>
          <TicketPhotoPicker v-model="reportPhotos" class="wide" :disabled="saving" :uploading-label="uploadLabel" />
        </div>
        <footer><button type="button" @click="reportOpen = false">Cancel</button><button class="primary" :disabled="saving"><LoaderCircle v-if="saving" :size="17" class="spin" /><Send v-else :size="17" /> Submit for verification</button></footer>
      </form>
    </div>
  </section>
</template>

<style scoped>
.technician-dashboard{padding:4px;color:#172b4d}.tech-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:28px;border:1px solid #d9e5f2;border-radius:19px;background:linear-gradient(125deg,#f2f8ff,#f2fff9)}.tech-hero span,.section-heading span,.calendar-panel header span,.report-modal header span{color:#0967d2;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.tech-hero h1{margin:6px 0;font-size:30px}.tech-hero p{margin:0;color:#607087}.tech-hero button{display:flex;align-items:center;gap:7px;padding:11px 15px;border:1px solid #b9cbe2;border-radius:10px;color:#0967d2;background:#fff;font-weight:750}.message{display:flex;align-items:center;gap:8px;margin:14px 0 0;padding:11px 13px;border-radius:10px}.message.error{color:#b42318;background:#fef3f2}.message.success{color:#067647;background:#ecfdf3}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:17px}.summary-grid article{--tone:#0967d2;display:flex;align-items:center;gap:12px;padding:16px;border:1px solid #dce5ef;border-radius:14px;color:var(--tone);background:#fff}.summary-grid article div{color:#172b4d}.summary-grid small{display:block;color:#6b778c;font-size:10px}.summary-grid strong{font-size:25px}.summary-grid .green{--tone:#079455}.summary-grid .orange{--tone:#e47b09}.summary-grid .purple{--tone:#7f56d9}.loading-card,.empty-state{min-height:280px;margin-top:17px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:9px;border:1px solid #dce5ef;border-radius:17px;color:#66758a;background:#fff}.latest-order{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;margin-top:17px}.latest-main,.timing-card,.calendar-panel{border:1px solid #dce5ef;border-radius:17px;background:#fff}.latest-main{padding:22px}.section-heading{display:flex;justify-content:space-between}.section-heading h2{margin:4px 0 0;font-size:22px}.status{height:max-content;padding:5px 9px;border-radius:999px;color:#175cd3;background:#eaf2ff;font-size:9px;text-transform:uppercase}.status.in_progress,.status.completed{color:#067647;background:#e9f8f0}.status.awaiting_parts{color:#b54708;background:#fff3df}.latest-main>h3{margin:19px 0 5px}.latest-main>p{margin:0;color:#66758a;line-height:1.6}.order-meta{display:flex;flex-wrap:wrap;gap:15px;margin-top:17px;padding:13px;border-radius:11px;background:#f6f8fb}.order-meta span{display:flex;align-items:center;gap:6px;color:#506176;font-size:11px}.action-row{display:flex;flex-wrap:wrap;gap:9px;margin-top:17px}.action-row button,.action-row a{min-height:40px;padding:0 13px;display:flex;align-items:center;gap:7px;border:1px solid #cbd6e5;border-radius:9px;color:#0967d2;background:#fff;font-size:11px;font-weight:750;text-decoration:none;cursor:pointer}.action-row .primary{border:0;color:#fff;background:#0967d2}.action-row .green-button{background:#079455}.action-row .report-button{color:#fff;background:#7f56d9;border-color:#7f56d9}.timing-card{--tone:#0967d2;padding:22px;display:flex;align-items:center;text-align:center;flex-direction:column;background:linear-gradient(155deg,#fff,#f1f7ff)}.timing-card.is-green{--tone:#079455;background:linear-gradient(155deg,#fff,#edfbf4)}.timing-card.is-orange{--tone:#e47b09;background:linear-gradient(155deg,#fff,#fff5e7)}.timing-card.is-red{--tone:#d92d20;background:linear-gradient(155deg,#fff,#fff0ef)}.timing-icon{width:50px;height:50px;display:grid;place-items:center;border-radius:15px;color:#fff;background:var(--tone)}.timing-card small{margin-top:14px;color:#66758a;text-transform:uppercase}.timing-card>strong{margin-top:5px;color:var(--tone);font-size:34px;letter-spacing:.04em}.timing-card .state-text{font-size:23px}.timing-card>b{margin-top:6px}.timing-card p{margin:5px 0;color:#66758a;font-size:11px;line-height:1.5}.timing-card em{margin-top:auto;padding-top:12px;color:#956018;font-size:9px}.calendar-panel{margin-top:17px;padding:21px}.calendar-panel>header{display:flex;justify-content:space-between;gap:20px}.calendar-panel h2{margin:4px 0}.calendar-panel header p{color:#66758a}.calendar-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:14px}.calendar-strip button{position:relative;min-height:79px;border:1px solid #dce5ef;border-radius:12px;background:#f9fbfd;color:#66758a}.calendar-strip button.active{border-color:#0967d2;color:#0967d2;background:#edf5ff}.calendar-strip small,.calendar-strip strong{display:block}.calendar-strip strong{font-size:21px}.calendar-strip span{position:absolute;top:7px;right:7px;width:19px;height:19px;display:grid;place-items:center;border-radius:50%;color:#fff;background:#e47b09;font-size:9px}.day-agenda{margin-top:13px}.day-agenda article{display:flex;align-items:center;gap:11px;padding:12px;border-top:1px solid #edf0f4}.day-agenda article svg{color:#0967d2}.day-agenda article div{flex:1}.day-agenda article p{margin:3px 0 0;color:#66758a;font-size:10px}.day-agenda article>b{color:#0967d2;font-size:9px}.no-agenda{padding:25px;display:flex;align-items:center;justify-content:center;gap:9px;color:#7a8798}.report-modal{position:fixed;inset:0;z-index:100;padding:20px;display:grid;place-items:center;background:rgba(15,23,42,.62)}.report-modal form{width:min(850px,100%);max-height:94vh;overflow:auto;border-radius:17px;background:#fff}.report-modal form>header{position:sticky;top:0;z-index:2;padding:18px 21px;display:flex;justify-content:space-between;border-bottom:1px solid #e5eaf0;background:#fff}.report-modal h2{margin:4px 0}.report-modal header p{margin:0;color:#66758a}.report-modal header button{border:0;background:transparent}.report-grid{padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:13px}.report-grid label{display:flex;flex-direction:column;gap:6px;color:#344054;font-size:11px;font-weight:700}.report-grid input,.report-grid textarea,.report-grid select{padding:10px;border:1px solid #cfd9e6;border-radius:8px;font:inherit}.report-grid .wide{grid-column:1/-1}.report-modal footer{position:sticky;bottom:0;padding:14px 20px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e5eaf0;background:#fff}.report-modal footer button{min-height:40px;padding:0 14px;display:flex;align-items:center;gap:7px;border:1px solid #cfd9e6;border-radius:8px;background:#fff;font-weight:700}.report-modal footer .primary{border:0;color:#fff;background:#0967d2}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:950px){.latest-order{grid-template-columns:1fr}.summary-grid{grid-template-columns:1fr 1fr}}@media(max-width:650px){.tech-hero,.calendar-panel>header{flex-direction:column}.summary-grid{grid-template-columns:1fr}.calendar-strip{overflow-x:auto;grid-template-columns:repeat(7,75px)}.report-grid{grid-template-columns:1fr}.report-grid .wide{grid-column:auto}.report-modal{padding:0}.report-modal form{height:100%;max-height:none;border-radius:0}}
</style>
