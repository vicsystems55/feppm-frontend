<script setup>
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  History,
  LoaderCircle,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  Store,
  UserRound,
  Warehouse,
  Wrench,
  X,
} from '@lucide/vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { workshopResourceApi } from '../services/workshopResourceService.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');
const overview = ref({ summary: {}, workshops: [] });
const assets = ref([]);
const storeData = ref({ balances: [], recentMovements: [] });
const options = ref({ catalog: [], recipients: [] });
const selectedWorkshopId = ref('');
const selectedStoreId = ref('');
const search = ref('');
const statusFilter = ref('');
const dialog = ref('');
const selectedAsset = ref(null);
const form = reactive({ toolCatalogItemId: '', assetTag: '', serialNumber: '', acquiredAt: '', condition: 'NEW', custodianId: '', referenceNumber: '', notes: '' });

const tabs = [
  { key: 'workshops', label: 'Workshops', path: '/modules/workshops', icon: Warehouse },
  { key: 'inventory', label: 'Store inventory', path: '/modules/spare-parts', icon: Boxes },
  { key: 'tools', label: 'Tool register', path: '/modules/tool-register', icon: Wrench },
];
const activeTab = computed(() => route.meta.resourceTab || 'workshops');
const permissionSet = computed(() => new Set(auth.user?.permissions ?? []));
const canReceive = computed(() => permissionSet.value.has('inventory.receive'));
const canIssue = computed(() => permissionSet.value.has('tools.issue'));
const canReturn = computed(() => permissionSet.value.has('tools.return'));
const canAudit = computed(() => permissionSet.value.has('inventory.audit'));
const workshops = computed(() => overview.value.workshops ?? []);
const selectedWorkshop = computed(() => workshops.value.find(({ id }) => id === selectedWorkshopId.value) ?? workshops.value[0] ?? null);
const selectedStore = computed(() => selectedWorkshop.value?.stores?.find(({ id }) => id === selectedStoreId.value) ?? selectedWorkshop.value?.stores?.[0] ?? null);
const kitItems = computed(() => selectedWorkshop.value?.kitAssignments?.flatMap(({ kitTemplate }) => kitTemplate.items.map((item) => ({ ...item, kitName: kitTemplate.name }))) ?? []);
const visibleAssets = computed(() => assets.value.filter((asset) => {
  const needle = search.value.trim().toLowerCase();
  const matchesText = !needle || [asset.assetTag, asset.serialNumber, asset.toolCatalogItem?.name].some((value) => String(value ?? '').toLowerCase().includes(needle));
  return matchesText && (!statusFilter.value || asset.status === statusFilter.value);
}));
const toolCountByCatalog = computed(() => assets.value.reduce((counts, asset) => {
  counts[asset.toolCatalogItemId] = (counts[asset.toolCatalogItemId] ?? 0) + 1;
  return counts;
}, {}));
const pageTitle = computed(() => activeTab.value === 'inventory' ? 'Workshop Store Inventory' : activeTab.value === 'tools' ? 'Tool Register' : 'Maintenance Workshops');

function label(value) { return String(value ?? '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function personName(person) { return person ? `${person.firstName} ${person.lastName}`.trim() : 'Not assigned'; }
function date(value) { return value ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(new Date(value)) : 'Not recorded'; }
function clearMessages() { error.value = ''; success.value = ''; }

async function loadOverview() {
  loading.value = true;
  clearMessages();
  try {
    const payload = await workshopResourceApi.overview(auth);
    overview.value = payload.data;
    if (!workshops.value.some(({ id }) => id === selectedWorkshopId.value)) selectedWorkshopId.value = workshops.value[0]?.id ?? '';
    selectedStoreId.value = selectedWorkshop.value?.stores?.[0]?.id ?? '';
    await loadSelectedResources();
  } catch (loadError) {
    error.value = loadError.message;
  } finally {
    loading.value = false;
  }
}

async function loadSelectedResources() {
  if (!selectedWorkshop.value) return;
  const storeId = selectedStore.value?.id;
  try {
    const calls = [workshopResourceApi.tools(auth, { storeId })];
    if (storeId && permissionSet.value.has('inventory.view')) calls.push(workshopResourceApi.store(auth, storeId));
    else calls.push(Promise.resolve({ data: { balances: [], recentMovements: [] } }));
    calls.push(workshopResourceApi.options(auth, selectedWorkshop.value.id));
    const [toolsPayload, storePayload, optionsPayload] = await Promise.all(calls);
    assets.value = toolsPayload.data.assets;
    storeData.value = storePayload.data;
    options.value = optionsPayload.data;
  } catch (loadError) {
    error.value = loadError.message;
  }
}

function chooseWorkshop() {
  selectedStoreId.value = selectedWorkshop.value?.stores?.[0]?.id ?? '';
  loadSelectedResources();
}

function resetForm() {
  Object.assign(form, { toolCatalogItemId: '', assetTag: '', serialNumber: '', acquiredAt: new Date().toISOString().slice(0, 10), condition: 'NEW', custodianId: '', referenceNumber: '', notes: '' });
}

function openDialog(type, asset = null) {
  clearMessages();
  selectedAsset.value = asset;
  resetForm();
  if (asset) form.condition = asset.condition;
  dialog.value = type;
}

async function submitDialog() {
  saving.value = true;
  clearMessages();
  try {
    let payload;
    if (dialog.value === 'receive') payload = await workshopResourceApi.receiveTool(auth, { ...form, storeId: selectedStore.value?.id });
    if (dialog.value === 'issue') payload = await workshopResourceApi.issueTool(auth, selectedAsset.value.id, form);
    if (dialog.value === 'return') payload = await workshopResourceApi.returnTool(auth, selectedAsset.value.id, form);
    if (dialog.value === 'audit') payload = await workshopResourceApi.auditTool(auth, selectedAsset.value.id, form);
    success.value = payload.message;
    dialog.value = '';
    await loadOverview();
    success.value = payload.message;
  } catch (saveError) {
    error.value = saveError.message;
  } finally {
    saving.value = false;
  }
}

watch(() => route.meta.resourceTab, () => clearMessages());
onMounted(loadOverview);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="resources-page">
        <section class="resource-hero">
          <div><span>Maintenance resources</span><h1>{{ pageTitle }}</h1><p>Control workshop staffing, required toolkits, physical tools and accountable store records within your authorized scope.</p></div>
          <label v-if="workshops.length > 1">State workshop<select v-model="selectedWorkshopId" @change="chooseWorkshop"><option v-for="workshop in workshops" :key="workshop.id" :value="workshop.id">{{ workshop.administrativeUnit.name }} — {{ workshop.name }}</option></select></label>
        </section>

        <nav class="resource-tabs" aria-label="Workshop resources">
          <button v-for="tab in tabs" :key="tab.key" :class="{ active: activeTab === tab.key }" type="button" @click="router.push(tab.path)"><component :is="tab.icon" :size="18" />{{ tab.label }}</button>
        </nav>

        <p v-if="error" class="resource-message is-error">{{ error }}</p>
        <p v-if="success" class="resource-message is-success">{{ success }}</p>
        <div v-if="loading" class="resource-loading"><LoaderCircle :size="25" class="spin" /> Loading workshop resources…</div>
        <div v-else-if="!selectedWorkshop" class="resource-empty"><Warehouse :size="38" /><h2>No workshop is available in your scope</h2><p>A Super Admin must create or seed a workshop for this state.</p></div>

        <template v-else>
          <section class="resource-stats">
            <article><span><Warehouse :size="22" /></span><div><small>Workshops</small><strong>{{ overview.summary.workshops ?? 0 }}</strong></div></article>
            <article class="green"><span><Store :size="22" /></span><div><small>Stores</small><strong>{{ overview.summary.stores ?? 0 }}</strong></div></article>
            <article class="indigo"><span><Wrench :size="22" /></span><div><small>Registered tools</small><strong>{{ overview.summary.toolAssets ?? 0 }}</strong></div></article>
            <article class="orange"><span><ArrowUpFromLine :size="22" /></span><div><small>Issued tools</small><strong>{{ overview.summary.issuedTools ?? 0 }}</strong></div></article>
          </section>

          <template v-if="activeTab === 'workshops'">
            <section class="workshop-grid">
              <article v-for="workshop in workshops" :key="workshop.id" class="workshop-card">
                <header><span><Warehouse :size="25" /></span><div><small>{{ workshop.administrativeUnit.name }} State</small><h2>{{ workshop.name }}</h2><p>{{ workshop.code }}</p></div><b>Active</b></header>
                <div class="workshop-facts"><div><Store :size="18" /><span><small>Maintenance store</small><strong>{{ workshop.stores[0]?.name ?? 'Not configured' }}</strong></span></div><div><ShieldCheck :size="18" /><span><small>Required toolkit</small><strong>{{ workshop.kitAssignments[0]?.kitTemplate?.items?.length ?? 0 }} items</strong></span></div></div>
                <footer><div v-for="assignment in workshop.staffAssignments" :key="assignment.id"><UserRound :size="17" /><span><small>{{ label(assignment.position) }}</small><strong>{{ personName(assignment.user) }}</strong></span></div></footer>
              </article>
            </section>
            <section class="resource-panel">
              <header><div><small>Baseline requirement</small><h2>{{ selectedWorkshop.kitAssignments[0]?.kitTemplate?.name ?? 'Workshop toolkit' }}</h2><p>Required quantities are planning targets. “Registered” represents assets physically received into the selected store.</p></div></header>
              <div class="table-wrap"><table><thead><tr><th>Tool</th><th>Category</th><th>Required</th><th>Registered</th><th>Readiness</th></tr></thead><tbody><tr v-for="item in kitItems" :key="item.id"><td><strong>{{ item.toolCatalogItem.name }}</strong><small>{{ item.packContents || item.toolCatalogItem.unitOfMeasure }}</small></td><td>{{ item.toolCatalogItem.category }}</td><td>{{ item.requiredQuantity }}</td><td>{{ toolCountByCatalog[item.toolCatalogItemId] ?? 0 }}</td><td><span class="status" :class="(toolCountByCatalog[item.toolCatalogItemId] ?? 0) >= item.requiredQuantity ? 'ready' : 'pending'">{{ (toolCountByCatalog[item.toolCatalogItemId] ?? 0) >= item.requiredQuantity ? 'Ready' : 'Pending receipt' }}</span></td></tr></tbody></table></div>
            </section>
          </template>

          <section v-else-if="activeTab === 'inventory'" class="resource-panel">
            <header><div><small>Physical stock</small><h2>{{ selectedStore?.name }}</h2><p>Spare-part balances appear only after a controlled receipt or verified opening stock count.</p></div></header>
            <div v-if="!storeData.balances.length" class="resource-empty compact"><PackageSearch :size="34" /><h3>No spare parts received yet</h3><p>The catalogue structure is ready. Supply the spare-parts document or record a verified receipt before quantities appear here.</p></div>
            <div v-else class="table-wrap"><table><thead><tr><th>Part</th><th>Code</th><th>On hand</th><th>Reserved</th><th>Available</th><th>Reorder level</th></tr></thead><tbody><tr v-for="balance in storeData.balances" :key="balance.id"><td><strong>{{ balance.sparePart.name }}</strong></td><td>{{ balance.sparePart.code }}</td><td>{{ balance.quantityOnHand }}</td><td>{{ balance.quantityReserved }}</td><td>{{ balance.quantityAvailable }}</td><td>{{ balance.reorderLevel }}</td></tr></tbody></table></div>
          </section>

          <section v-else class="resource-panel">
            <header class="tool-header"><div><small>Custody-controlled assets</small><h2>{{ selectedStore?.name }}</h2><p>Every physical tool receives a unique asset tag and retains its receipt, issue, return and audit history.</p></div><button v-if="canReceive" type="button" @click="openDialog('receive')"><Plus :size="18" /> Receive tool</button></header>
            <div class="tool-toolbar"><label><Search :size="17" /><input v-model="search" placeholder="Search asset tag, serial number or tool" /></label><select v-model="statusFilter"><option value="">All statuses</option><option v-for="status in ['AVAILABLE','ISSUED','IN_USE','UNDER_REPAIR','LOST','RETIRED']" :key="status" :value="status">{{ label(status) }}</option></select></div>
            <div v-if="!visibleAssets.length" class="resource-empty compact"><Wrench :size="36" /><h3>No registered tools</h3><p>The 24-item requirement is visible under Workshops. Receive physical tools here after delivery or stock verification.</p><button v-if="canReceive" type="button" @click="openDialog('receive')"><Plus :size="17" /> Receive first tool</button></div>
            <div v-else class="table-wrap"><table><thead><tr><th>Asset</th><th>Tool</th><th>Condition</th><th>Status</th><th>Custodian</th><th>Next audit</th><th>Actions</th></tr></thead><tbody><tr v-for="asset in visibleAssets" :key="asset.id"><td><strong>{{ asset.assetTag }}</strong><small>{{ asset.serialNumber || 'No serial number' }}</small></td><td>{{ asset.toolCatalogItem.name }}</td><td><span class="condition">{{ label(asset.condition) }}</span></td><td><span class="status" :class="asset.status === 'AVAILABLE' ? 'ready' : asset.status === 'UNDER_REPAIR' ? 'danger' : 'pending'">{{ label(asset.status) }}</span></td><td>{{ personName(asset.currentCustodian) }}</td><td>{{ date(asset.nextAuditDueAt) }}</td><td><div class="row-actions"><button v-if="canIssue && asset.status === 'AVAILABLE'" title="Issue" @click="openDialog('issue', asset)"><ArrowUpFromLine :size="16" /></button><button v-if="canReturn && ['ISSUED','IN_USE','UNDER_REPAIR'].includes(asset.status) && asset.currentCustodian" title="Return" @click="openDialog('return', asset)"><ArrowDownToLine :size="16" /></button><button v-if="canAudit" title="Audit" @click="openDialog('audit', asset)"><ClipboardCheck :size="16" /></button></div></td></tr></tbody></table></div>
          </section>
        </template>
      </main>
    </div>

    <div v-if="dialog" class="resource-modal" @click.self="dialog = ''">
      <form @submit.prevent="submitDialog">
        <header><div><small>Workshop control</small><h2>{{ dialog === 'receive' ? 'Receive physical tool' : dialog === 'issue' ? 'Issue tool' : dialog === 'return' ? 'Return tool' : 'Audit tool' }}</h2><p v-if="selectedAsset">{{ selectedAsset.assetTag }} — {{ selectedAsset.toolCatalogItem.name }}</p></div><button type="button" @click="dialog = ''"><X :size="21" /></button></header>
        <div class="modal-fields">
          <template v-if="dialog === 'receive'"><label>Catalogue item<select v-model="form.toolCatalogItemId" required><option value="" disabled>Select tool</option><option v-for="item in options.catalog" :key="item.id" :value="item.id">{{ item.name }}</option></select></label><label>Asset tag<input v-model="form.assetTag" required placeholder="e.g. GMB-TOOL-0001" /></label><label>Serial number<input v-model="form.serialNumber" placeholder="Optional manufacturer serial" /></label><label>Acquired date<input v-model="form.acquiredAt" type="date" required /></label></template>
          <label v-if="dialog === 'issue'">Issue to<select v-model="form.custodianId" required><option value="" disabled>Select staff or technician</option><option v-for="person in options.recipients" :key="person.id" :value="person.id">{{ personName(person) }} — {{ person.email }}</option></select></label>
          <label v-if="['receive','return','audit'].includes(dialog)">Condition<select v-model="form.condition" required><option v-for="condition in ['NEW','GOOD','FAIR','POOR','DAMAGED','UNSERVICEABLE']" :key="condition" :value="condition">{{ label(condition) }}</option></select></label>
          <label>Reference number<input v-model="form.referenceNumber" placeholder="Delivery note, work order or audit reference" /></label>
          <label class="wide">Notes<textarea v-model="form.notes" rows="3" placeholder="Optional control notes"></textarea></label>
        </div>
        <footer><button type="button" @click="dialog = ''">Cancel</button><button class="primary" :disabled="saving"><LoaderCircle v-if="saving" :size="17" class="spin" /><CheckCircle2 v-else :size="17" /> Save record</button></footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.resources-page{min-height:calc(100vh - 72px);padding:24px;background:#f5f8fc}.resource-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;max-width:1500px;margin:auto;padding:25px 27px;border:1px solid #dce5ef;border-radius:17px;background:linear-gradient(120deg,#fff 55%,#eaf5ff)}.resource-hero>div>span,.resource-panel header small,.workshop-card header small,.resource-modal header small{color:#0967d2;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.resource-hero h1{margin:5px 0;font-size:28px}.resource-hero p,.resource-panel header p{margin:0;color:#66758a;line-height:1.55}.resource-hero label{min-width:310px;color:#344054;font-size:11px;font-weight:700}.resource-hero select{display:block;width:100%;height:42px;margin-top:6px;padding:0 11px;border:1px solid #cfdae8;border-radius:9px;background:#fff}.resource-tabs{display:flex;max-width:1500px;margin:16px auto 0;padding:5px;border:1px solid #dce5ef;border-radius:12px;background:#fff}.resource-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:40px;padding:0 17px;border:0;border-radius:8px;color:#64748b;background:transparent;font:inherit;font-size:12px;font-weight:700;cursor:pointer}.resource-tabs button.active{color:#0967d2;background:#eaf3ff}.resource-message{max-width:1500px;margin:13px auto 0;padding:11px 13px;border-radius:9px}.is-error{color:#b42318;background:#fef3f2}.is-success{color:#067647;background:#ecfdf3}.resource-loading,.resource-empty{max-width:1500px;min-height:340px;margin:16px auto;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:7px;color:#66758a;border:1px solid #dce5ef;border-radius:15px;background:#fff;text-align:center}.resource-empty h2,.resource-empty h3,.resource-empty p{margin:0}.resource-empty.compact{min-height:280px;margin:0;border:0;border-radius:0}.resource-empty button,.tool-header>button{display:flex;align-items:center;gap:7px;margin-top:10px;padding:11px 14px;border:0;border-radius:9px;color:#fff;background:#0967d2;font-weight:700;cursor:pointer}.resource-stats{max-width:1500px;margin:16px auto;display:grid;grid-template-columns:repeat(4,1fr);gap:13px}.resource-stats article{--tone:#0967d2;display:flex;align-items:center;gap:12px;padding:17px;border:1px solid #dce5ef;border-radius:13px;background:#fff}.resource-stats article>span{width:43px;height:43px;display:grid;place-items:center;border-radius:11px;color:var(--tone);background:color-mix(in srgb,var(--tone) 11%,white)}.resource-stats small,.workshop-facts small,.workshop-card footer small{display:block;color:#718096;font-size:10px}.resource-stats strong{font-size:24px}.resource-stats .green{--tone:#079455}.resource-stats .indigo{--tone:#4f46e5}.resource-stats .orange{--tone:#e47b09}.workshop-grid{max-width:1500px;margin:0 auto 16px;display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.workshop-card{padding:20px;border:1px solid #dce5ef;border-radius:15px;background:#fff}.workshop-card header{display:flex;gap:12px;align-items:flex-start}.workshop-card header>span{width:47px;height:47px;display:grid;place-items:center;border-radius:12px;color:#0967d2;background:#eaf3ff}.workshop-card h2{margin:3px 0;font-size:17px}.workshop-card header p{margin:0;color:#7b8798;font-size:11px}.workshop-card header>b{margin-left:auto;padding:5px 8px;border-radius:999px;color:#067647;background:#dcfae6;font-size:9px}.workshop-facts,.workshop-card footer{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-top:17px}.workshop-facts>div,.workshop-card footer>div{display:flex;gap:9px;padding:12px;border-radius:10px;background:#f7f9fc;color:#0967d2}.workshop-facts strong,.workshop-card footer strong{display:block;margin-top:3px;color:#253858;font-size:11px}.resource-panel{max-width:1500px;margin:0 auto;border:1px solid #dce5ef;border-radius:15px;background:#fff;overflow:hidden}.resource-panel>header{padding:19px 21px;border-bottom:1px solid #e8edf3}.resource-panel h2{margin:4px 0;font-size:19px}.tool-header{display:flex;align-items:center;justify-content:space-between;gap:20px}.tool-header>button{margin:0}.tool-toolbar{display:grid;grid-template-columns:1fr 190px;gap:10px;padding:12px 15px;border-bottom:1px solid #e8edf3;background:#fafcff}.tool-toolbar label{display:flex;align-items:center;gap:8px;height:41px;padding:0 11px;border:1px solid #d3dce8;border-radius:9px;background:#fff;color:#8793a5}.tool-toolbar input{flex:1;border:0;outline:0}.tool-toolbar select{padding:0 10px;border:1px solid #d3dce8;border-radius:9px;background:#fff}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;white-space:nowrap}th{padding:11px 14px;color:#667085;background:#f9fafb;font-size:10px;text-align:left;text-transform:uppercase}td{padding:13px 14px;border-top:1px solid #edf0f4;color:#344054;font-size:11px}td strong,td small{display:block}td small{margin-top:3px;color:#8a96a8;font-size:9px}.status,.condition{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:750}.status.ready{color:#067647;background:#dcfae6}.status.pending{color:#b54708;background:#fff0d5}.status.danger{color:#b42318;background:#fee4e2}.condition{color:#344054;background:#f2f4f7}.row-actions{display:flex;gap:5px}.row-actions button{width:31px;height:31px;display:grid;place-items:center;border:1px solid #dce5ef;border-radius:7px;color:#0967d2;background:#fff;cursor:pointer}.resource-modal{position:fixed;inset:0;z-index:100;padding:20px;display:grid;place-items:center;background:rgba(16,24,40,.58)}.resource-modal form{width:min(680px,100%);max-height:94vh;overflow:auto;border-radius:16px;background:#fff}.resource-modal header{padding:19px 21px;display:flex;justify-content:space-between;border-bottom:1px solid #e8edf3}.resource-modal h2{margin:4px 0;font-size:21px}.resource-modal header p{margin:0;color:#66758a}.resource-modal header button{border:0;background:transparent;cursor:pointer}.modal-fields{padding:19px 21px;display:grid;grid-template-columns:repeat(2,1fr);gap:13px}.modal-fields label{display:flex;flex-direction:column;gap:6px;color:#344054;font-size:11px;font-weight:700}.modal-fields input,.modal-fields select,.modal-fields textarea{padding:10px 11px;border:1px solid #d3dce8;border-radius:8px;font:inherit;font-size:12px}.modal-fields .wide{grid-column:1/-1}.resource-modal footer{padding:14px 21px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e8edf3}.resource-modal footer button{min-height:39px;padding:0 14px;border:1px solid #d3dce8;border-radius:8px;background:#fff;font-weight:700;cursor:pointer}.resource-modal footer .primary{display:flex;align-items:center;gap:7px;border:0;color:#fff;background:#0967d2}.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:900px){.resource-stats{grid-template-columns:repeat(2,1fr)}.workshop-grid{grid-template-columns:1fr}.resource-hero{align-items:stretch;flex-direction:column}.resource-hero label{min-width:0}}@media(max-width:620px){.resources-page{padding:13px 10px}.resource-tabs{overflow-x:auto}.resource-tabs button{white-space:nowrap}.resource-stats{grid-template-columns:1fr 1fr}.workshop-facts,.workshop-card footer,.modal-fields,.tool-toolbar{grid-template-columns:1fr}.modal-fields .wide{grid-column:auto}.resource-modal{padding:0}.resource-modal form{width:100%;height:100%;max-height:none;border-radius:0}}
</style>
