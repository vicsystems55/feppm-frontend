<script setup>
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, Eye, LoaderCircle, PackagePlus, Plus, Search, ShieldCheck, Trash2, Wrench, X } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { resourceRequestApi } from '../services/workshopResourceService.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const { locale, t, te } = useI18n();
const sidebarOpen = ref(false);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');
const requests = ref([]);
const options = ref({ workshops: [], workOrders: [], tools: [], spareParts: [] });
const search = ref('');
const statusFilter = ref('');
const dialog = ref('');
const selected = ref(null);
const reviewNote = ref('');
const createForm = reactive({ workshopId: '', workOrderId: '', urgency: 'ROUTINE', purpose: '', items: [] });
const permissionSet = computed(() => new Set(auth.user?.permissions ?? []));
const canCreate = computed(() => permissionSet.value.has('resource_requests.create'));
const canReview = computed(() => permissionSet.value.has('resource_requests.review'));
const canFulfill = computed(() => permissionSet.value.has('resource_requests.fulfill'));
const visibleRequests = computed(() => requests.value.filter((item) => {
  const needle = search.value.trim().toLowerCase();
  const matches = !needle || [item.requestNumber, item.purpose, item.workOrder?.workOrderNumber, item.workOrder?.title, item.requestedBy?.firstName, item.requestedBy?.lastName].some((value) => String(value ?? '').toLowerCase().includes(needle));
  return matches && (!statusFilter.value || item.status === statusFilter.value);
}));
const summary = computed(() => ({
  total: requests.value.length,
  workshop: requests.value.filter(({ status }) => status === 'SUBMITTED').length,
  store: requests.value.filter(({ status }) => ['WORKSHOP_APPROVED', 'AWAITING_STOCK'].includes(status)).length,
  authorized: requests.value.filter(({ status }) => status === 'APPROVED_FOR_ISSUE').length,
}));
const selectedWorkshop = computed(() => options.value.workshops.find(({ id }) => id === createForm.workshopId));
const compatibleWorkOrders = computed(() => options.value.workOrders.filter((order) => !selectedWorkshop.value || order.organizationId === selectedWorkshop.value.organizationId));

function label(value) {
  const key = `statuses.${value}`;
  return te(key) ? t(key) : String(value ?? '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function name(person) { return person ? `${person.firstName} ${person.lastName}`.trim() : t('common.notRecorded'); }
function date(value) {
  return value ? new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : t('common.notRecorded');
}
function itemName(item) { return item.toolCatalogItem?.name ?? item.sparePart?.name ?? t('common.unknownItem'); }
function clearMessages() { error.value = ''; success.value = ''; }

async function loadPage() {
  loading.value = true;
  clearMessages();
  try {
    const [listPayload, optionsPayload] = await Promise.all([resourceRequestApi.list(auth), resourceRequestApi.options(auth)]);
    requests.value = listPayload.data.requests;
    options.value = optionsPayload.data;
  } catch (loadError) { error.value = loadError.message; } finally { loading.value = false; }
}

function addItem() { createForm.items.push({ itemType: 'TOOL', toolCatalogItemId: '', sparePartId: '', requestedQuantity: 1, notes: '' }); }
function removeItem(index) { createForm.items.splice(index, 1); }
function resetCreate() {
  Object.assign(createForm, { workshopId: options.value.workshops[0]?.id ?? '', workOrderId: '', urgency: 'ROUTINE', purpose: '', items: [] });
  addItem();
}
function openCreate() { clearMessages(); resetCreate(); dialog.value = 'create'; }
async function openDetails(item) {
  clearMessages();
  try {
    selected.value = (await resourceRequestApi.get(auth, item.id)).data.request;
    selected.value.items.forEach((line) => { line.reviewQuantity = line.approvedQuantity ?? line.requestedQuantity; });
    reviewNote.value = '';
    dialog.value = 'details';
  } catch (loadError) { error.value = loadError.message; }
}

async function submitCreate() {
  saving.value = true; clearMessages();
  try {
    const payload = await resourceRequestApi.create(auth, createForm);
    dialog.value = ''; await loadPage(); success.value = payload.message;
  } catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function workshopDecision(decision) {
  saving.value = true; clearMessages();
  try {
    const payload = await resourceRequestApi.workshopReview(auth, selected.value.id, { decision, note: reviewNote.value, items: selected.value.items.map((item) => ({ id: item.id, approvedQuantity: item.reviewQuantity })) });
    selected.value = payload.data.request; await loadPage(); success.value = payload.message; dialog.value = '';
  } catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function storeDecision(decision) {
  saving.value = true; clearMessages();
  try {
    const payload = await resourceRequestApi.storeReview(auth, selected.value.id, { decision, note: reviewNote.value });
    selected.value = payload.data.request; await loadPage(); success.value = payload.message; dialog.value = '';
  } catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function cancelRequest() {
  saving.value = true; clearMessages();
  try { const payload = await resourceRequestApi.cancel(auth, selected.value.id); dialog.value = ''; await loadPage(); success.value = payload.message; } catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function initializePage() {
  await loadPage();
  if (route.query.create !== '1' || !canCreate.value) return;
  openCreate();
  const requestedWorkOrderId = String(route.query.workOrderId ?? '');
  if (options.value.workOrders.some(({ id }) => id === requestedWorkOrderId)) {
    createForm.workOrderId = requestedWorkOrderId;
  }
}

onMounted(initializePage);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="requests-page">
        <section class="requests-hero"><div><span>{{ t('resourceRequests.eyebrow') }}</span><h1>{{ t('resourceRequests.title') }}</h1><p>{{ t('resourceRequests.subtitle') }}</p></div><button v-if="canCreate" type="button" @click="openCreate"><Plus :size="18" /> {{ t('resourceRequests.new') }}</button></section>
        <p v-if="error" class="message error">{{ error }}</p><p v-if="success" class="message success">{{ success }}</p>
        <section class="request-stats"><article><ClipboardList :size="22" /><div><small>{{ t('resourceRequests.total') }}</small><strong>{{ summary.total }}</strong></div></article><article class="orange"><Clock3 :size="22" /><div><small>{{ t('resourceRequests.workshopReview') }}</small><strong>{{ summary.workshop }}</strong></div></article><article class="purple"><ShieldCheck :size="22" /><div><small>{{ t('resourceRequests.storeReview') }}</small><strong>{{ summary.store }}</strong></div></article><article class="green"><CheckCircle2 :size="22" /><div><small>{{ t('resourceRequests.approvedForIssue') }}</small><strong>{{ summary.authorized }}</strong></div></article></section>
        <section class="request-panel"><header><div><small>{{ t('resourceRequests.queueEyebrow') }}</small><h2>{{ t('resourceRequests.queue') }}</h2></div><div class="filters"><label><Search :size="17" /><input v-model="search" :placeholder="t('resourceRequests.search')" /></label><select v-model="statusFilter"><option value="">{{ t('resourceRequests.allStatuses') }}</option><option v-for="status in ['SUBMITTED','WORKSHOP_APPROVED','AWAITING_STOCK','APPROVED_FOR_ISSUE','PARTIALLY_ISSUED','ISSUED','COMPLETED','REJECTED','CANCELLED']" :key="status" :value="status">{{ label(status) }}</option></select></div></header>
          <div v-if="loading" class="empty"><LoaderCircle :size="26" class="spin" /> {{ t('resourceRequests.loading') }}</div>
          <div v-else-if="!visibleRequests.length" class="empty"><PackagePlus :size="38" /><h3>{{ t('resourceRequests.empty') }}</h3><p>{{ t('resourceRequests.emptyHint') }}</p></div>
          <div v-else class="table-wrap"><table><thead><tr><th>Request</th><th>Work order</th><th>Requested by</th><th>Items</th><th>Urgency</th><th>Status</th><th>Submitted</th><th></th></tr></thead><tbody><tr v-for="item in visibleRequests" :key="item.id"><td><strong>{{ item.requestNumber }}</strong><small>{{ item.workshop.name }}</small></td><td><strong>{{ item.workOrder.workOrderNumber }}</strong><small>{{ item.workOrder.facility?.name || item.workOrder.title }}</small></td><td>{{ name(item.requestedBy) }}</td><td>{{ item.items.length }}</td><td><span class="pill" :class="item.urgency.toLowerCase()">{{ label(item.urgency) }}</span></td><td><span class="pill status">{{ label(item.status) }}</span></td><td>{{ date(item.requestedAt) }}</td><td><button class="icon-button" title="View request" @click="openDetails(item)"><Eye :size="17" /></button></td></tr></tbody></table></div>
        </section>
      </main>
    </div>

    <div v-if="dialog" class="modal" @click.self="dialog = ''"><form @submit.prevent="dialog === 'create' ? submitCreate() : null">
      <header><div><small>Resource workflow</small><h2>{{ dialog === 'create' ? 'Create resource request' : selected?.requestNumber }}</h2><p>{{ dialog === 'create' ? 'Tie every item to authorized maintenance work.' : `${selected?.workOrder.workOrderNumber} · ${selected?.workshop.name}` }}</p></div><button type="button" @click="dialog = ''"><X :size="21" /></button></header>
      <template v-if="dialog === 'create'"><div class="form-grid"><label>Workshop<select v-model="createForm.workshopId" required><option value="" disabled>Select workshop</option><option v-for="workshop in options.workshops" :key="workshop.id" :value="workshop.id">{{ workshop.administrativeUnit.name }} — {{ workshop.name }}</option></select></label><label>Work order<select v-model="createForm.workOrderId" required><option value="" disabled>Select active work order</option><option v-for="order in compatibleWorkOrders" :key="order.id" :value="order.id">{{ order.workOrderNumber }} — {{ order.title }}</option></select></label><label>Urgency<select v-model="createForm.urgency"><option value="ROUTINE">Routine</option><option value="URGENT">Urgent</option><option value="CRITICAL">Critical</option></select></label><label class="wide">Purpose<textarea v-model="createForm.purpose" required rows="3" placeholder="Explain the maintenance need and intended use"></textarea></label></div><section class="items-editor"><header><div><h3>Requested items</h3><p>Tools use whole quantities. Spare parts use their catalogue unit.</p></div><button type="button" @click="addItem"><Plus :size="16" /> Add item</button></header><article v-for="(item,index) in createForm.items" :key="index"><select v-model="item.itemType"><option value="TOOL">Tool</option><option value="SPARE_PART" :disabled="!options.spareParts.length">Spare part</option></select><select v-if="item.itemType === 'TOOL'" v-model="item.toolCatalogItemId" required><option value="" disabled>Select tool</option><option v-for="tool in options.tools" :key="tool.id" :value="tool.id">{{ tool.name }}</option></select><select v-else v-model="item.sparePartId" required><option value="" disabled>Select spare part</option><option v-for="part in options.spareParts" :key="part.id" :value="part.id">{{ part.name }}</option></select><input v-model="item.requestedQuantity" type="number" min="1" :step="item.itemType === 'TOOL' ? 1 : 0.001" required /><button type="button" title="Remove item" :disabled="createForm.items.length === 1" @click="removeItem(index)"><Trash2 :size="16" /></button></article><p v-if="!options.spareParts.length" class="catalog-note">No spare-parts catalogue has been loaded yet; tool requests are available now.</p></section></template>
      <template v-else-if="selected"><div class="detail-summary"><article><small>Status</small><strong>{{ label(selected.status) }}</strong></article><article><small>Urgency</small><strong>{{ label(selected.urgency) }}</strong></article><article><small>Requested by</small><strong>{{ name(selected.requestedBy) }}</strong></article><article><small>Submitted</small><strong>{{ date(selected.requestedAt) }}</strong></article></div><div class="purpose"><small>Purpose</small><p>{{ selected.purpose }}</p></div><section class="detail-items"><h3>Requested items</h3><article v-for="item in selected.items" :key="item.id"><span><component :is="item.itemType === 'TOOL' ? Wrench : PackagePlus" :size="18" /><b>{{ itemName(item) }}</b></span><label v-if="canReview && selected.status === 'SUBMITTED'">Approved quantity<input v-model="item.reviewQuantity" type="number" min="1" :max="item.requestedQuantity" :step="item.itemType === 'TOOL' ? 1 : 0.001" /></label><span v-else><small>Requested</small><b>{{ item.requestedQuantity }}</b></span><span><small>Approved</small><b>{{ item.approvedQuantity ?? 'Pending' }}</b></span></article></section><section class="history"><h3>Activity history</h3><article v-for="activity in selected.activities" :key="activity.id"><span /><div><strong>{{ label(activity.action) }}</strong><p>{{ activity.note || `${label(activity.fromStatus || '')} → ${label(activity.toStatus || '')}` }}</p><small>{{ name(activity.actor) }} · {{ date(activity.createdAt) }}</small></div></article></section><label v-if="(canReview && selected.status === 'SUBMITTED') || (canFulfill && ['WORKSHOP_APPROVED','AWAITING_STOCK'].includes(selected.status))" class="review-note">Decision note<textarea v-model="reviewNote" rows="3" placeholder="Required for rejection or awaiting stock"></textarea></label></template>
      <footer v-if="dialog === 'create'"><button type="button" @click="dialog = ''">Cancel</button><button class="primary" :disabled="saving || !options.workOrders.length"><LoaderCircle v-if="saving" :size="17" class="spin" /><CheckCircle2 v-else :size="17" /> Submit request</button></footer><footer v-else><button v-if="selected?.requestedBy.id === auth.user.id && selected?.status === 'SUBMITTED'" type="button" class="danger-button" :disabled="saving" @click="cancelRequest">Cancel request</button><template v-if="canReview && selected?.status === 'SUBMITTED'"><button type="button" :disabled="saving" @click="workshopDecision('REJECT')">Reject</button><button type="button" class="primary" :disabled="saving" @click="workshopDecision('APPROVE')">Approve quantities</button></template><template v-if="canFulfill && ['WORKSHOP_APPROVED','AWAITING_STOCK'].includes(selected?.status)"><button type="button" :disabled="saving" @click="storeDecision('REJECT')">Reject</button><button type="button" :disabled="saving" @click="storeDecision('AWAITING_STOCK')"><AlertTriangle :size="16" /> Awaiting stock</button><button type="button" class="primary" :disabled="saving" @click="storeDecision('APPROVE')">Authorize issue</button></template><button v-if="!((canReview && selected?.status === 'SUBMITTED') || (canFulfill && ['WORKSHOP_APPROVED','AWAITING_STOCK'].includes(selected?.status)) || (selected?.requestedBy.id === auth.user.id && selected?.status === 'SUBMITTED'))" type="button" @click="dialog = ''">Close</button></footer>
    </form></div>
  </div>
</template>

<style scoped>
.requests-page{min-height:calc(100vh - 72px);padding:24px;background:#f5f8fc}.requests-hero{max-width:1500px;margin:auto;padding:25px 27px;display:flex;align-items:center;justify-content:space-between;gap:24px;border:1px solid #dce5ef;border-radius:17px;background:linear-gradient(120deg,#fff 55%,#eef6ff)}.requests-hero span,.request-panel>header small,.modal header small{color:#0967d2;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.requests-hero h1{margin:5px 0;font-size:28px}.requests-hero p{margin:0;color:#66758a}.requests-hero button,.items-editor header button{display:flex;align-items:center;gap:7px;padding:11px 15px;border:0;border-radius:9px;color:#fff;background:#0967d2;font-weight:750;cursor:pointer}.message{max-width:1500px;margin:13px auto 0;padding:11px 13px;border-radius:9px}.message.error{color:#b42318;background:#fef3f2}.message.success{color:#067647;background:#ecfdf3}.request-stats{max-width:1500px;margin:16px auto;display:grid;grid-template-columns:repeat(4,1fr);gap:13px}.request-stats article{--tone:#0967d2;display:flex;align-items:center;gap:12px;padding:17px;border:1px solid #dce5ef;border-radius:13px;color:var(--tone);background:#fff}.request-stats article>div{color:#172b4d}.request-stats small{display:block;color:#718096;font-size:10px}.request-stats strong{font-size:24px}.request-stats .orange{--tone:#e47b09}.request-stats .purple{--tone:#7f56d9}.request-stats .green{--tone:#079455}.request-panel{max-width:1500px;margin:auto;border:1px solid #dce5ef;border-radius:15px;background:#fff;overflow:hidden}.request-panel>header{padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:20px}.request-panel h2{margin:3px 0;font-size:18px}.filters{display:flex;gap:8px}.filters label{min-width:310px;height:40px;padding:0 10px;display:flex;align-items:center;gap:7px;border:1px solid #d4dce7;border-radius:8px}.filters input{flex:1;border:0;outline:0}.filters select{padding:0 10px;border:1px solid #d4dce7;border-radius:8px;background:#fff}.empty{min-height:320px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;color:#66758a;border-top:1px solid #edf0f4}.empty h3,.empty p{margin:0}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;white-space:nowrap}th{padding:11px 14px;color:#667085;background:#f9fafb;font-size:10px;text-align:left;text-transform:uppercase}td{padding:13px 14px;border-top:1px solid #edf0f4;color:#344054;font-size:11px}td strong,td small{display:block}td small{margin-top:3px;color:#8a96a8;font-size:9px}.pill{display:inline-flex;padding:4px 7px;border-radius:999px;color:#175cd3;background:#eaf2ff;font-size:9px;font-weight:750}.pill.urgent,.pill.awaiting_stock{color:#b54708;background:#fff0d5}.pill.critical{color:#b42318;background:#fee4e2}.pill.status{color:#344054;background:#f2f4f7}.icon-button{width:32px;height:32px;display:grid;place-items:center;border:1px solid #dce5ef;border-radius:7px;color:#0967d2;background:#fff;cursor:pointer}.modal{position:fixed;inset:0;z-index:100;padding:20px;display:grid;place-items:center;background:rgba(16,24,40,.6)}.modal>form{width:min(880px,100%);max-height:94vh;overflow:auto;border-radius:16px;background:#fff}.modal>form>header{position:sticky;top:0;z-index:2;padding:19px 21px;display:flex;justify-content:space-between;border-bottom:1px solid #e8edf3;background:#fff}.modal h2{margin:4px 0;font-size:21px}.modal header p{margin:0;color:#66758a}.modal header button{border:0;background:transparent}.form-grid{padding:18px 21px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.form-grid label,.review-note{display:flex;flex-direction:column;gap:6px;color:#344054;font-size:11px;font-weight:700}.form-grid select,.form-grid textarea,.items-editor select,.items-editor input,.review-note textarea,.detail-items input{padding:10px;border:1px solid #d3dce8;border-radius:8px;font:inherit;font-size:12px}.form-grid .wide{grid-column:1/-1}.items-editor{padding:0 21px 20px}.items-editor>header{display:flex;align-items:center;justify-content:space-between}.items-editor h3,.items-editor p{margin:0}.items-editor header p{color:#718096;font-size:10px}.items-editor article{display:grid;grid-template-columns:130px 1fr 105px 38px;gap:8px;margin-top:9px}.items-editor article>button{border:1px solid #fecaca;border-radius:8px;color:#b42318;background:#fff}.catalog-note{margin-top:10px!important;padding:9px;border-radius:8px;color:#b54708!important;background:#fff6e8}.detail-summary{padding:18px 21px;display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.detail-summary article{padding:11px;border-radius:9px;background:#f7f9fc}.detail-summary small,.purpose small,.detail-items small{display:block;color:#718096;font-size:9px}.detail-summary strong{display:block;margin-top:3px;font-size:11px}.purpose{margin:0 21px;padding:13px;border-radius:10px;background:#f7f9fc}.purpose p{margin:5px 0 0;color:#344054}.detail-items,.history{padding:17px 21px}.detail-items h3,.history h3{margin:0 0 9px;font-size:14px}.detail-items>article{display:grid;grid-template-columns:1fr 150px 100px;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #edf0f4}.detail-items>article>span:first-child{display:flex;align-items:center;gap:8px;color:#0967d2}.detail-items b{color:#253858}.detail-items label{font-size:9px;color:#718096}.detail-items input{width:100%;margin-top:4px}.history article{display:flex;gap:10px;padding:8px 0}.history article>span{width:9px;height:9px;margin-top:4px;border-radius:50%;background:#0967d2}.history strong{font-size:11px}.history p,.history small{margin:3px 0 0;color:#718096;font-size:9px}.review-note{margin:0 21px 18px}.modal footer{position:sticky;bottom:0;padding:14px 21px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e8edf3;background:#fff}.modal footer button{min-height:39px;padding:0 14px;display:flex;align-items:center;gap:6px;border:1px solid #d3dce8;border-radius:8px;background:#fff;font-weight:700;cursor:pointer}.modal footer .primary{border:0;color:#fff;background:#0967d2}.modal footer .danger-button{margin-right:auto;color:#b42318;border-color:#fda29b}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:900px){.request-stats{grid-template-columns:repeat(2,1fr)}.requests-hero,.request-panel>header{align-items:stretch;flex-direction:column}.filters{width:100%}.filters label{min-width:0;flex:1}}@media(max-width:650px){.requests-page{padding:13px 10px}.form-grid,.detail-summary,.detail-items>article{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.items-editor article{grid-template-columns:1fr 80px 38px}.items-editor article select:nth-child(2){grid-column:1/-1}.filters{flex-direction:column}.modal{padding:0}.modal>form{height:100%;max-height:none;border-radius:0}}
</style>


