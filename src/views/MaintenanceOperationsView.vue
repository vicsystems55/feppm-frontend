<script setup>
import { AlertTriangle, BriefcaseBusiness, Building2, ClipboardList, HardHat, LoaderCircle, Plus, Search, ShieldAlert, Truck, Users, Wrench, X } from '@lucide/vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { maintenanceOperationsApi } from '../services/maintenanceOperationsService.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');
const dashboard = ref({ summary: {} });
const requests = ref([]);
const workOrders = ref([]);
const technicians = ref([]);
const contracts = ref([]);
const options = ref({ users: [], units: [], facilities: [], vendors: [], equipmentTypes: [], skills: [] });
const selectedRequest = ref(null);
const selectedWorkOrder = ref(null);
const drawer = ref('');
const filters = reactive({ search: '', triage: '', page: 1, limit: 50 });
const triageForm = reactive({ decision: 'FIELD_VISIT', assessment: '', recommendedAction: '', safetyRisk: false, vaccineRisk: false, remoteResolutionPossible: false });
const workOrderForm = reactive({ title: '', description: '', assignedTechnicianId: '', vendorContractId: '', plannedStartAt: '', plannedEndAt: '', estimatedCost: '' });
const technicianForm = reactive({ userId: '', workerType: 'GOVERNMENT', baseAdministrativeUnitId: '', vendorId: '', jobTitle: '', yearsExperience: '', availabilityStatus: 'AVAILABLE', skillIds: [] });
const vendorForm = reactive({ name: '', email: '', phone: '', address: '' });
const contractForm = reactive({ vendorId: '', contractNumber: '', name: '', serviceDescription: '', startsAt: '', endsAt: '', responseTargetHours: '', spendingLimit: '', status: 'DRAFT', facilityIds: [], equipmentTypeIds: [] });
const approvalNote = ref('');
const assignmentForm = reactive({ assignedTechnicianId: '', vendorContractId: '', plannedStartAt: '', plannedEndAt: '', note: '' });
const verificationForm = reactive({ approved: true, note: '' });
let searchTimer;

const tabs = [
  { key: 'requests', label: 'Request queue', icon: ClipboardList },
  { key: 'work-orders', label: 'Work orders', icon: Wrench },
  { key: 'technicians', label: 'Technicians', icon: Users },
  { key: 'contracts', label: 'Vendor contracts', icon: Truck },
];
const activeTab = computed(() => tabs.some(({ key }) => key === route.query.tab) ? route.query.tab : 'requests');
const permissionSet = computed(() => new Set(auth.user?.permissions ?? []));
const canTriage = computed(() => permissionSet.value.has('maintenance_requests.triage'));
const canCreateWorkOrder = computed(() => permissionSet.value.has('work_orders.create'));
const canManageTechnicians = computed(() => permissionSet.value.has('technicians.manage'));
const canManageContracts = computed(() => permissionSet.value.has('vendor_contracts.manage'));
const canAssignWorkOrders = computed(() => permissionSet.value.has('work_orders.assign'));
const canVerifyWorkOrders = computed(() => permissionSet.value.has('work_orders.verify'));
const canOpenTicketDetails = computed(() => auth.user?.roles?.some((role) => [
  'STATE_MAINTENANCE_MANAGER',
  'TECHNICIAN',
  'WORKSHOP_MANAGER',
].includes(role.key)));
const eligibleContracts = computed(() => {
  if (!selectedRequest.value) return [];
  const facilityId = selectedRequest.value.facility?.id;
  const equipmentTypeId = selectedRequest.value.equipment?.equipmentType?.id;
  return contracts.value.filter((contract) => contract.status === 'ACTIVE'
    && contract.facilities.some((item) => item.facility.id === facilityId)
    && contract.equipmentTypes.some((item) => item.equipmentType.id === equipmentTypeId));
});
const statCards = computed(() => [
  { label: 'Active requests', value: dashboard.value.summary?.activeRequests ?? 0, icon: ClipboardList, tone: 'blue' },
  { label: 'Awaiting triage', value: dashboard.value.summary?.untriagedRequests ?? 0, icon: AlertTriangle, tone: 'orange' },
  { label: 'Critical', value: dashboard.value.summary?.criticalRequests ?? 0, icon: ShieldAlert, tone: 'red' },
  { label: 'Active work orders', value: dashboard.value.summary?.activeWorkOrders ?? 0, icon: HardHat, tone: 'green' },
]);

function label(value) { return String(value ?? '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function date(value) { return value ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not set'; }
function fullName(person) { return person ? `${person.firstName} ${person.lastName}`.trim() : 'Unassigned'; }
function setTab(tab) { router.replace({ query: { ...route.query, tab } }); }
function clearMessages() { error.value = ''; success.value = ''; }

async function loadData(preserveMessages = false) {
  loading.value = true;
  if (!preserveMessages) clearMessages();
  try {
    const calls = [
      maintenanceOperationsApi.dashboard(auth),
      maintenanceOperationsApi.requests(auth, filters),
      maintenanceOperationsApi.workOrders(auth),
      maintenanceOperationsApi.technicians(auth),
      maintenanceOperationsApi.contracts(auth),
    ];
    if (canManageTechnicians.value || canManageContracts.value || canCreateWorkOrder.value) calls.push(maintenanceOperationsApi.options(auth));
    const [dashboardData, requestData, workOrderData, technicianData, contractData, optionData] = await Promise.all(calls);
    dashboard.value = dashboardData;
    requests.value = requestData.requests;
    workOrders.value = workOrderData.workOrders;
    technicians.value = technicianData.technicians;
    contracts.value = contractData.contracts;
    if (optionData) options.value = optionData;
  } catch (loadError) { error.value = loadError.message; } finally { loading.value = false; }
}

async function loadRequests() {
  try { requests.value = (await maintenanceOperationsApi.requests(auth, filters)).requests; } catch (loadError) { error.value = loadError.message; }
}

async function openRequest(ticket) {
  clearMessages();
  try {
    selectedRequest.value = (await maintenanceOperationsApi.request(auth, ticket.id)).request;
    const current = selectedRequest.value.triage;
    Object.assign(triageForm, { decision: current?.decision ?? 'FIELD_VISIT', assessment: current?.assessment ?? '', recommendedAction: current?.recommendedAction ?? '', safetyRisk: current?.safetyRisk ?? false, vaccineRisk: current?.vaccineRisk ?? false, remoteResolutionPossible: current?.remoteResolutionPossible ?? false });
    Object.assign(workOrderForm, { title: selectedRequest.value.title, description: current?.recommendedAction ?? selectedRequest.value.faultDescription, assignedTechnicianId: '', vendorContractId: '', plannedStartAt: '', plannedEndAt: '', estimatedCost: '' });
    drawer.value = 'request';
  } catch (loadError) { error.value = loadError.message; }
}

async function openWorkOrder(order) {
  clearMessages();
  try {
    selectedWorkOrder.value = (await maintenanceOperationsApi.workOrder(auth, order.id)).workOrder;
    Object.assign(assignmentForm, { assignedTechnicianId: selectedWorkOrder.value.assignedTechnicianId ?? '', vendorContractId: selectedWorkOrder.value.vendorContractId ?? '', plannedStartAt: selectedWorkOrder.value.plannedStartAt?.slice(0, 16) ?? '', plannedEndAt: selectedWorkOrder.value.plannedEndAt?.slice(0, 16) ?? '', note: '' });
    Object.assign(verificationForm, { approved: true, note: '' });
    approvalNote.value = '';
    drawer.value = 'work-order';
  } catch (loadError) { error.value = loadError.message; }
}

async function refreshSelectedWorkOrder() {
  selectedWorkOrder.value = (await maintenanceOperationsApi.workOrder(auth, selectedWorkOrder.value.id)).workOrder;
  await loadData(true);
}

async function submitWorkOrder() {
  saving.value = true; clearMessages();
  try { await maintenanceOperationsApi.submitWorkOrder(auth, selectedWorkOrder.value.id, { note: approvalNote.value }); success.value = 'Work order submitted for approval.'; await refreshSelectedWorkOrder(); }
  catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function approveSelectedWorkOrder() {
  saving.value = true; clearMessages();
  try { await maintenanceOperationsApi.approveWorkOrder(auth, selectedWorkOrder.value.id, { note: approvalNote.value }); success.value = 'Work order approved.'; await refreshSelectedWorkOrder(); }
  catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function assignSelectedWorkOrder() {
  saving.value = true; clearMessages();
  try { await maintenanceOperationsApi.assignWorkOrder(auth, selectedWorkOrder.value.id, { ...assignmentForm, assignedTechnicianId: assignmentForm.assignedTechnicianId || null, vendorContractId: assignmentForm.vendorContractId || null, plannedStartAt: assignmentForm.plannedStartAt || null, plannedEndAt: assignmentForm.plannedEndAt || null }); success.value = 'Assignment and schedule updated.'; await refreshSelectedWorkOrder(); }
  catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function verifySelectedWorkOrder() {
  saving.value = true; clearMessages();
  try { await maintenanceOperationsApi.verifyWorkOrder(auth, selectedWorkOrder.value.id, verificationForm); success.value = verificationForm.approved ? 'Completion verified.' : 'Work returned to the technician.'; await refreshSelectedWorkOrder(); }
  catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function saveTriage() {
  saving.value = true; clearMessages();
  try {
    await maintenanceOperationsApi.triage(auth, selectedRequest.value.id, triageForm);
    success.value = 'Technical triage saved.';
    selectedRequest.value = (await maintenanceOperationsApi.request(auth, selectedRequest.value.id)).request;
    await loadData();
  } catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function createWorkOrder() {
  saving.value = true; clearMessages();
  try {
    const { workOrder } = await maintenanceOperationsApi.createWorkOrder(auth, selectedRequest.value.id, { ...workOrderForm, assignedTechnicianId: workOrderForm.assignedTechnicianId || null, vendorContractId: workOrderForm.vendorContractId || null, plannedStartAt: workOrderForm.plannedStartAt || null, plannedEndAt: workOrderForm.plannedEndAt || null, estimatedCost: workOrderForm.estimatedCost || null });
    success.value = `${workOrder.workOrderNumber} created successfully.`;
    drawer.value = '';
    await loadData();
    setTab('work-orders');
  } catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function saveTechnician() {
  saving.value = true; clearMessages();
  try { await maintenanceOperationsApi.saveTechnician(auth, technicianForm); success.value = 'Technician profile saved.'; drawer.value = ''; await loadData(); }
  catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function saveContract() {
  saving.value = true; clearMessages();
  try { await maintenanceOperationsApi.createContract(auth, contractForm); success.value = 'Vendor contract created.'; drawer.value = ''; await loadData(); }
  catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

async function saveVendor() {
  saving.value = true; clearMessages();
  try {
    const { vendor } = await maintenanceOperationsApi.createVendor(auth, vendorForm);
    success.value = `${vendor.name} is ready for contract setup.`;
    Object.assign(vendorForm, { name: '', email: '', phone: '', address: '' });
    options.value = await maintenanceOperationsApi.options(auth);
    contractForm.vendorId = vendor.id;
    drawer.value = 'contract';
  } catch (saveError) { error.value = saveError.message; } finally { saving.value = false; }
}

watch(() => filters.triage, loadRequests);
watch(() => filters.search, () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadRequests, 350); });
onMounted(loadData);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="maintenance-page">
        <section class="maintenance-hero">
          <div><span>FEPPM Maintenance Operations</span><h1>Technical mission control</h1><p>Turn facility feedback into assessed, assigned and accountable maintenance work.</p></div>
          <div class="maintenance-hero__actions">
            <button v-if="canManageTechnicians" type="button" @click="drawer = 'technician'"><Plus :size="17" /> Technician</button>
            <button v-if="canManageContracts" type="button" @click="drawer = 'vendor'"><Plus :size="17" /> Vendor</button>
            <button v-if="canManageContracts" type="button" @click="drawer = 'contract'"><Plus :size="17" /> Contract</button>
          </div>
        </section>

        <p v-if="error" class="maintenance-message is-error">{{ error }}</p>
        <p v-if="success" class="maintenance-message is-success">{{ success }}</p>

        <section class="maintenance-stats">
          <article v-for="card in statCards" :key="card.label" :class="`is-${card.tone}`"><component :is="card.icon" :size="21" /><div><small>{{ card.label }}</small><strong>{{ card.value }}</strong></div></article>
        </section>

        <nav class="maintenance-tabs">
          <button v-for="tab in tabs" :key="tab.key" :class="{ active: activeTab === tab.key }" type="button" @click="setTab(tab.key)"><component :is="tab.icon" :size="18" />{{ tab.label }}</button>
        </nav>

        <section v-if="loading" class="maintenance-loading"><LoaderCircle :size="28" /> Loading maintenance operations…</section>

        <section v-else-if="activeTab === 'requests'" class="maintenance-panel">
          <header><div><h2>Maintenance request queue</h2><p>Facility issues requiring technical review and action.</p></div><div class="maintenance-filters"><label><Search :size="17" /><input v-model="filters.search" placeholder="Search ticket or facility" /></label><select v-model="filters.triage"><option value="">All triage states</option><option value="pending">Awaiting triage</option><option value="completed">Triaged</option></select></div></header>
          <div class="maintenance-table-wrap"><table><thead><tr><th>Request</th><th>Facility / equipment</th><th>Priority</th><th>Triage</th><th>Status</th><th /></tr></thead><tbody>
            <tr v-for="ticket in requests" :key="ticket.id"><td><strong>{{ ticket.ticketNumber }}</strong><span>{{ ticket.title }}</span><small>{{ date(ticket.reportedAt) }}</small></td><td><strong>{{ ticket.facility?.name ?? 'No facility' }}</strong><span>{{ ticket.equipment?.assetCode ?? 'No equipment selected' }}</span></td><td><b :class="`priority p${ticket.priority}`">P{{ ticket.priority }}</b></td><td><span :class="['triage-state', { done: ticket.triage }]">{{ ticket.triage ? label(ticket.triage.decision) : 'Awaiting triage' }}</span></td><td>{{ label(ticket.status) }}</td><td class="request-actions"><button class="link-button" type="button" @click="openRequest(ticket)">Proceed to assign</button><RouterLink v-if="canOpenTicketDetails" class="details-link" :to="`/modules/issues/${ticket.id}`">View details</RouterLink></td></tr>
            <tr v-if="!requests.length"><td colspan="6" class="empty">No maintenance requests match this view.</td></tr>
          </tbody></table></div>
        </section>

        <section v-else-if="activeTab === 'work-orders'" class="maintenance-panel">
          <header><div><h2>Work orders</h2><p>Technical work authorized from assessed maintenance requests.</p></div></header>
          <div class="maintenance-card-grid"><article v-for="order in workOrders" :key="order.id" class="work-card"><div><b :class="`priority p${order.priority}`">P{{ order.priority }}</b><span>{{ label(order.status) }}</span></div><h3>{{ order.workOrderNumber }}</h3><p>{{ order.title }}</p><dl><div><dt>Facility</dt><dd>{{ order.facility?.name ?? 'Not specified' }}</dd></div><div><dt>Assigned to</dt><dd>{{ order.assignedTechnician ? fullName(order.assignedTechnician.user) : order.vendorContract?.vendor?.name ?? 'Not assigned' }}</dd></div><div><dt>Planned start</dt><dd>{{ date(order.plannedStartAt) }}</dd></div></dl><button class="work-card__open" type="button" @click="openWorkOrder(order)">Open work order</button></article><div v-if="!workOrders.length" class="empty-card">No work orders have been created yet.</div></div>
        </section>

        <section v-else-if="activeTab === 'technicians'" class="maintenance-panel">
          <header><div><h2>Technicians and engineers</h2><p>Skills, availability and organizational placement.</p></div><button v-if="canManageTechnicians" class="primary" type="button" @click="drawer = 'technician'"><Plus :size="17" /> Add profile</button></header>
          <div class="maintenance-card-grid"><article v-for="technician in technicians" :key="technician.id" class="person-card"><div class="person-avatar">{{ technician.user.firstName[0] }}{{ technician.user.lastName[0] }}</div><div><h3>{{ fullName(technician.user) }}</h3><p>{{ technician.jobTitle ?? label(technician.workerType) }}</p><span>{{ technician.baseAdministrativeUnit?.name ?? technician.vendor?.name ?? 'National / unassigned base' }}</span><div class="skills"><b v-for="item in technician.skills" :key="item.maintenanceSkillId">{{ item.maintenanceSkill.name }}</b></div></div><em :class="technician.availabilityStatus.toLowerCase()">{{ label(technician.availabilityStatus) }}</em></article><div v-if="!technicians.length" class="empty-card">No technician profiles have been registered.</div></div>
        </section>

        <section v-else class="maintenance-panel">
          <header><div><h2>Vendor contracts</h2><p>Restrict vendor access to approved facilities and equipment types.</p></div><button v-if="canManageContracts" class="primary" type="button" @click="drawer = 'contract'"><Plus :size="17" /> New contract</button></header>
          <div class="maintenance-card-grid"><article v-for="contract in contracts" :key="contract.id" class="contract-card"><div><Truck :size="20" /><b>{{ label(contract.status) }}</b></div><h3>{{ contract.name }}</h3><p>{{ contract.contractNumber }} · {{ contract.vendor.name }}</p><dl><div><dt>Facilities</dt><dd>{{ contract.facilities.length }}</dd></div><div><dt>Equipment types</dt><dd>{{ contract.equipmentTypes.length }}</dd></div><div><dt>Work orders</dt><dd>{{ contract._count.workOrders }}</dd></div></dl><small>{{ date(contract.startsAt) }} — {{ contract.endsAt ? date(contract.endsAt) : 'Open-ended' }}</small></article><div v-if="!contracts.length" class="empty-card">No vendor contracts have been configured.</div></div>
        </section>
      </main>
    </div>

    <div v-if="drawer" class="maintenance-overlay" @click.self="drawer = ''"><aside class="maintenance-drawer">
      <button class="drawer-close" type="button" @click="drawer = ''"><X :size="20" /></button>

      <template v-if="drawer === 'request' && selectedRequest">
        <span class="eyebrow">{{ selectedRequest.ticketNumber }}</span><h2>{{ selectedRequest.title }}</h2><p>{{ selectedRequest.faultDescription }}</p>
        <div class="request-context"><div><Building2 :size="18" /><span><b>{{ selectedRequest.facility?.name ?? 'No facility' }}</b>{{ selectedRequest.equipment?.assetCode ?? 'No equipment selected' }}</span></div><div><BriefcaseBusiness :size="18" /><span><b>Reported by</b>{{ fullName(selectedRequest.reportedBy) }}</span></div></div>
        <form v-if="canTriage" class="drawer-form" @submit.prevent="saveTriage"><h3>Technical triage</h3><label>Decision<select v-model="triageForm.decision"><option v-for="value in ['INFORMATION_REQUIRED','REMOTE_SUPPORT','FIELD_VISIT','VENDOR_REFERRAL','PARTS_REQUIRED','REPLACEMENT_RECOMMENDED','NO_ACTION']" :key="value" :value="value">{{ label(value) }}</option></select></label><label>Technical assessment<textarea v-model="triageForm.assessment" rows="4" required /></label><label>Recommended action<textarea v-model="triageForm.recommendedAction" rows="3" /></label><div class="checks"><label><input v-model="triageForm.safetyRisk" type="checkbox" /> Safety risk</label><label><input v-model="triageForm.vaccineRisk" type="checkbox" /> Vaccine risk</label><label><input v-model="triageForm.remoteResolutionPossible" type="checkbox" /> Remote resolution possible</label></div><button class="primary" :disabled="saving" type="submit">{{ saving ? 'Saving…' : 'Save triage' }}</button></form>
        <form v-if="canCreateWorkOrder && selectedRequest.triage" class="drawer-form" @submit.prevent="createWorkOrder"><h3>Create work order</h3><label>Title<input v-model="workOrderForm.title" required /></label><label>Work required<textarea v-model="workOrderForm.description" rows="4" required /></label><div class="two-cols"><label>Internal technician<select v-model="workOrderForm.assignedTechnicianId" :disabled="Boolean(workOrderForm.vendorContractId)"><option value="">Not assigned</option><option v-for="technician in technicians" :key="technician.id" :value="technician.id">{{ fullName(technician.user) }}</option></select></label><label>Eligible vendor contract<select v-model="workOrderForm.vendorContractId" :disabled="Boolean(workOrderForm.assignedTechnicianId)"><option value="">No vendor</option><option v-for="contract in eligibleContracts" :key="contract.id" :value="contract.id">{{ contract.name }}</option></select></label></div><div class="two-cols"><label>Planned start<input v-model="workOrderForm.plannedStartAt" type="datetime-local" /></label><label>Estimated cost<input v-model="workOrderForm.estimatedCost" min="0" type="number" /></label></div><button class="primary" :disabled="saving" type="submit"><Wrench :size="17" /> Create work order</button></form>
      </template>

      <template v-else-if="drawer === 'work-order' && selectedWorkOrder">
        <span class="eyebrow">{{ selectedWorkOrder.workOrderNumber }}</span><h2>{{ selectedWorkOrder.title }}</h2><p>{{ selectedWorkOrder.description }}</p>
        <div class="work-order-status"><b>{{ label(selectedWorkOrder.status) }}</b><span>P{{ selectedWorkOrder.priority }} · {{ selectedWorkOrder.facility?.name ?? 'No facility' }}</span></div>
        <section class="execution-summary"><h3>Field execution</h3><dl><div><dt>Technician</dt><dd>{{ selectedWorkOrder.assignedTechnician ? fullName(selectedWorkOrder.assignedTechnician.user) : 'Not assigned' }}</dd></div><div><dt>Started</dt><dd>{{ date(selectedWorkOrder.startedAt) }}</dd></div><div><dt>Evidence</dt><dd>{{ selectedWorkOrder.evidence?.length ?? 0 }} image(s)</dd></div><div><dt>Parts used</dt><dd>{{ selectedWorkOrder.partsUsed?.length ?? 0 }}</dd></div></dl><p v-if="selectedWorkOrder.fieldReport"><strong>Outcome:</strong> {{ selectedWorkOrder.fieldReport.repairOutcome ?? 'Field report in progress' }}</p></section>
        <form v-if="selectedWorkOrder.status === 'DRAFT' && canCreateWorkOrder" class="drawer-form" @submit.prevent="submitWorkOrder"><h3>Submit for approval</h3><label>Submission note<textarea v-model="approvalNote" rows="3" /></label><button class="primary" :disabled="saving" type="submit">Submit for approval</button></form>
        <form v-if="selectedWorkOrder.status === 'PENDING_APPROVAL' && canVerifyWorkOrders" class="drawer-form" @submit.prevent="approveSelectedWorkOrder"><h3>Management approval</h3><label>Approval note<textarea v-model="approvalNote" rows="3" /></label><button class="primary" :disabled="saving" type="submit">Approve work order</button></form>
        <form v-if="['APPROVED','ASSIGNED'].includes(selectedWorkOrder.status) && canAssignWorkOrders" class="drawer-form" @submit.prevent="assignSelectedWorkOrder"><h3>Schedule and assign</h3><div class="two-cols"><label>Technician<select v-model="assignmentForm.assignedTechnicianId" :disabled="Boolean(assignmentForm.vendorContractId)"><option value="">Select technician</option><option v-for="technician in technicians" :key="technician.id" :value="technician.id">{{ fullName(technician.user) }}</option></select></label><label>Vendor contract<select v-model="assignmentForm.vendorContractId" :disabled="Boolean(assignmentForm.assignedTechnicianId)"><option value="">Select vendor contract</option><option v-for="contract in contracts.filter((item) => item.status === 'ACTIVE')" :key="contract.id" :value="contract.id">{{ contract.name }}</option></select></label></div><div class="two-cols"><label>Planned start<input v-model="assignmentForm.plannedStartAt" type="datetime-local" /></label><label>Planned completion<input v-model="assignmentForm.plannedEndAt" type="datetime-local" /></label></div><label>Assignment note<textarea v-model="assignmentForm.note" rows="2" /></label><button class="primary" :disabled="saving" type="submit">Save assignment</button></form>
        <form v-if="selectedWorkOrder.status === 'AWAITING_VERIFICATION' && canVerifyWorkOrders" class="drawer-form" @submit.prevent="verifySelectedWorkOrder"><h3>Verify completion</h3><label>Decision<select v-model="verificationForm.approved"><option :value="true">Approve and complete</option><option :value="false">Return for correction</option></select></label><label>Verification note<textarea v-model="verificationForm.note" :required="!verificationForm.approved" rows="4" /></label><button class="primary" :disabled="saving" type="submit">Save verification decision</button></form>
        <section v-if="selectedWorkOrder.activities?.length" class="activity-timeline"><h3>Work-order history</h3><article v-for="item in selectedWorkOrder.activities" :key="item.id"><b>{{ label(item.action) }}</b><span>{{ fullName(item.actor) }} · {{ date(item.createdAt) }}</span><p v-if="item.note">{{ item.note }}</p></article></section>
      </template>

      <form v-else-if="drawer === 'technician'" class="drawer-form" @submit.prevent="saveTechnician"><span class="eyebrow">Maintenance team</span><h2>Technician profile</h2><label>FEPPM account<select v-model="technicianForm.userId" required><option value="">Select user</option><option v-for="user in options.users" :key="user.id" :value="user.id">{{ fullName(user) }} — {{ user.email }}</option></select></label><div class="two-cols"><label>Worker type<select v-model="technicianForm.workerType"><option>GOVERNMENT</option><option>PARTNER</option><option>VENDOR</option></select></label><label>Availability<select v-model="technicianForm.availabilityStatus"><option>AVAILABLE</option><option>ASSIGNED</option><option>ON_LEAVE</option><option>INACTIVE</option></select></label></div><label>Job title<input v-model="technicianForm.jobTitle" placeholder="Cold Chain Technician" /></label><label>Base administrative unit<select v-model="technicianForm.baseAdministrativeUnitId"><option value="">National / none</option><option v-for="unit in options.units" :key="unit.id" :value="unit.id">{{ unit.name }} ({{ label(unit.type) }})</option></select></label><label v-if="technicianForm.workerType === 'VENDOR'">Vendor<select v-model="technicianForm.vendorId" required><option value="">Select vendor</option><option v-for="vendor in options.vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label><label>Years of experience<input v-model="technicianForm.yearsExperience" min="0" max="80" type="number" /></label><fieldset><legend>Technical skills</legend><label v-for="skill in options.skills" :key="skill.id" class="check-option"><input v-model="technicianForm.skillIds" :value="skill.id" type="checkbox" />{{ skill.name }}</label></fieldset><button class="primary" :disabled="saving" type="submit">Save technician profile</button></form>

      <form v-else-if="drawer === 'vendor'" class="drawer-form" @submit.prevent="saveVendor"><span class="eyebrow">Vendor directory</span><h2>Add maintenance vendor</h2><p>Create the service provider first, then define exactly which facilities and equipment its contract covers.</p><label>Company name<input v-model="vendorForm.name" required /></label><div class="two-cols"><label>Email address<input v-model="vendorForm.email" type="email" /></label><label>Phone number<input v-model="vendorForm.phone" /></label></div><label>Office address<textarea v-model="vendorForm.address" rows="3" /></label><button class="primary" :disabled="saving" type="submit">{{ saving ? 'Saving…' : 'Save vendor and continue' }}</button></form>

      <form v-else class="drawer-form" @submit.prevent="saveContract"><span class="eyebrow">Vendor governance</span><h2>New vendor contract</h2><p v-if="!options.vendors.length" class="inline-hint">No vendor exists yet. <button type="button" @click="drawer = 'vendor'">Add a vendor first</button>.</p><label>Vendor<select v-model="contractForm.vendorId" required><option value="">Select vendor</option><option v-for="vendor in options.vendors" :key="vendor.id" :value="vendor.id">{{ vendor.name }}</option></select></label><div class="two-cols"><label>Contract number<input v-model="contractForm.contractNumber" required /></label><label>Status<select v-model="contractForm.status"><option>DRAFT</option><option>ACTIVE</option><option>SUSPENDED</option></select></label></div><label>Contract name<input v-model="contractForm.name" required /></label><label>Service description<textarea v-model="contractForm.serviceDescription" rows="3" /></label><div class="two-cols"><label>Start date<input v-model="contractForm.startsAt" type="date" required /></label><label>End date<input v-model="contractForm.endsAt" type="date" /></label></div><label>Covered facilities<select v-model="contractForm.facilityIds" multiple required><option v-for="facility in options.facilities" :key="facility.id" :value="facility.id">{{ facility.name }}</option></select><small>Hold Ctrl to select multiple facilities.</small></label><fieldset><legend>Covered equipment types</legend><label v-for="type in options.equipmentTypes" :key="type.id" class="check-option"><input v-model="contractForm.equipmentTypeIds" :value="type.id" type="checkbox" />{{ type.name }}</label></fieldset><button class="primary" :disabled="saving || !options.vendors.length" type="submit">Create vendor contract</button></form>
    </aside></div>
  </div>
</template>

<style scoped>
.maintenance-page{padding:20px 24px 40px;color:#14213d}.maintenance-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:25px 27px;border:1px solid #dce6f2;border-radius:18px;background:linear-gradient(125deg,#f4f9ff,#f4fff8)}.maintenance-hero span,.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#0967d2}.maintenance-hero h1{font-size:29px;margin:5px 0}.maintenance-hero p{margin:0;color:#66758a}.maintenance-hero__actions{display:flex;gap:9px}.maintenance-hero button,.primary{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:10px;padding:11px 15px;background:#0967d2;color:#fff;font:inherit;font-weight:700;cursor:pointer}.maintenance-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin:17px 0}.maintenance-stats article{display:flex;gap:12px;align-items:center;padding:16px;border:1px solid #e0e8f1;border-radius:14px;background:#fff}.maintenance-stats svg{color:#0967d2}.maintenance-stats small{display:block;color:#6b788c}.maintenance-stats strong{display:block;font-size:24px}.maintenance-stats .is-orange svg{color:#e77b00}.maintenance-stats .is-red svg{color:#dc2626}.maintenance-stats .is-green svg{color:#059669}.maintenance-tabs{display:flex;gap:6px;border-bottom:1px solid #dce3eb}.maintenance-tabs button{display:flex;align-items:center;gap:7px;padding:12px 14px;border:0;border-bottom:3px solid transparent;background:transparent;color:#68778c;font:inherit;font-weight:650;cursor:pointer}.maintenance-tabs button.active{border-color:#0967d2;color:#0967d2}.maintenance-panel{margin-top:16px;border:1px solid #dfe7ef;border-radius:16px;background:#fff;overflow:hidden}.maintenance-panel>header{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:19px 20px;border-bottom:1px solid #e6ebf1}.maintenance-panel h2{margin:0 0 3px;font-size:19px}.maintenance-panel header p{margin:0;color:#758297}.maintenance-filters{display:flex;gap:9px}.maintenance-filters label{display:flex;align-items:center;gap:7px;padding:0 10px;border:1px solid #d7e0ea;border-radius:9px}.maintenance-filters input{border:0;outline:0;padding:9px 0}.maintenance-filters select,select,input,textarea{font:inherit}.maintenance-filters select{border:1px solid #d7e0ea;border-radius:9px;padding:9px}.maintenance-table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:13px 16px;border-bottom:1px solid #edf0f4;vertical-align:middle}th{font-size:12px;color:#6d798b;background:#fafbfd}td strong,td span,td small{display:block}td span{margin-top:2px;color:#56657a}td small{margin-top:3px;color:#8a95a5}.priority{display:inline-block!important;width:34px;padding:4px;border-radius:7px;text-align:center;background:#eaf2ff;color:#0967d2}.priority.p1{background:#fee8e8;color:#c82020}.priority.p2{background:#fff0dc;color:#d26500}.triage-state{display:inline-block!important;padding:5px 8px;border-radius:999px;background:#fff2df;color:#ad5c00;font-size:12px}.triage-state.done{background:#e7f8ef;color:#087a46}.link-button{border:0;background:transparent;color:#0967d2;font:inherit;font-weight:750;cursor:pointer}.maintenance-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;padding:17px}.work-card,.person-card,.contract-card,.empty-card{border:1px solid #e0e7ef;border-radius:14px;padding:17px}.work-card>div:first-child,.contract-card>div:first-child{display:flex;justify-content:space-between;align-items:center}.work-card h3,.person-card h3,.contract-card h3{margin:12px 0 4px}.work-card p,.person-card p,.contract-card p{margin:0;color:#657287}.work-card dl,.contract-card dl{display:grid;gap:8px;margin:16px 0 0}.work-card dl div,.contract-card dl div{display:flex;justify-content:space-between;gap:10px}.work-card dt,.contract-card dt{color:#7a8798}.work-card dd,.contract-card dd{margin:0;font-weight:650;text-align:right}.person-card{display:grid;grid-template-columns:44px 1fr auto;gap:12px}.person-avatar{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:#eaf2ff;color:#0967d2;font-weight:800}.person-card span{display:block;margin-top:4px;color:#798698;font-size:13px}.person-card em{height:max-content;padding:5px 8px;border-radius:999px;background:#e8f7ef;color:#087a46;font-size:11px;font-style:normal}.skills{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}.skills b{padding:4px 7px;border-radius:6px;background:#f1f5f9;font-size:11px}.empty,.empty-card{text-align:center;color:#7d8998;padding:28px}.maintenance-message{padding:10px 13px;border-radius:9px;margin:12px 0}.maintenance-message.is-error{background:#fff0f0;color:#b42318}.maintenance-message.is-success{background:#eaf8f0;color:#067647}.maintenance-loading{display:flex;align-items:center;justify-content:center;gap:10px;padding:60px}.maintenance-loading svg{animation:spin 1s linear infinite}.maintenance-overlay{position:fixed;inset:0;z-index:100;background:rgba(15,23,42,.38);display:flex;justify-content:flex-end}.maintenance-drawer{width:min(620px,100%);height:100%;overflow:auto;background:#fff;padding:28px;box-shadow:-12px 0 40px rgba(15,23,42,.15);position:relative}.drawer-close{position:absolute;right:20px;top:20px;border:0;background:#f1f5f9;padding:7px;border-radius:8px;cursor:pointer}.maintenance-drawer h2{margin:5px 35px 8px 0}.maintenance-drawer>p{color:#66758a}.request-context{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:18px 0}.request-context>div{display:flex;gap:9px;padding:12px;border-radius:10px;background:#f6f8fb}.request-context span,.request-context b{display:block}.request-context span{font-size:13px;color:#68778a}.request-context b{color:#1f2b3d}.drawer-form{display:grid;gap:13px;margin-top:20px;padding-top:19px;border-top:1px solid #e3e8ef}.drawer-form h3{margin:0}.drawer-form>label,.two-cols label{display:grid;gap:5px;color:#445268;font-size:13px;font-weight:650}.drawer-form input,.drawer-form select,.drawer-form textarea{width:100%;box-sizing:border-box;border:1px solid #d5dee8;border-radius:9px;padding:10px;background:#fff;color:#1d2939}.drawer-form select[multiple]{min-height:135px}.two-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}.checks{display:flex;flex-wrap:wrap;gap:13px}.checks label,.check-option{display:flex!important;grid-template-columns:none!important;align-items:center;gap:7px!important;font-size:13px!important}.checks input,.check-option input{width:auto}.drawer-form fieldset{border:1px solid #dce4ed;border-radius:10px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.drawer-form legend{padding:0 5px;font-weight:700}.primary:disabled{opacity:.55;cursor:not-allowed}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:1050px){.maintenance-stats{grid-template-columns:1fr 1fr}.maintenance-card-grid{grid-template-columns:1fr 1fr}}@media(max-width:720px){.maintenance-page{padding:14px}.maintenance-hero,.maintenance-panel>header{flex-direction:column}.maintenance-stats,.maintenance-card-grid,.request-context,.two-cols{grid-template-columns:1fr}.maintenance-filters{width:100%;flex-direction:column}.maintenance-filters label{flex:1}.maintenance-hero__actions{width:100%}.maintenance-hero__actions button{flex:1}.maintenance-tabs{overflow:auto}.drawer-form fieldset{grid-template-columns:1fr}}
.inline-hint{padding:10px 12px;border-radius:9px;background:#fff6e6;color:#8a4b08}.inline-hint button{border:0;background:transparent;color:#0967d2;font:inherit;font-weight:750;cursor:pointer}
.work-card__open{width:100%;margin-top:15px;border:1px solid #bfd5ef;border-radius:9px;padding:9px;background:#f5f9ff;color:#0967d2;font:inherit;font-weight:750;cursor:pointer}.request-actions{display:flex;align-items:center;gap:10px;min-width:180px}.details-link{color:#0967d2;font-size:12px;font-weight:750;text-decoration:none;white-space:nowrap}.details-link:hover{text-decoration:underline}.work-order-status{display:flex;justify-content:space-between;gap:12px;margin:18px 0;padding:12px 14px;border-radius:10px;background:#eef6ff}.work-order-status b{color:#0967d2}.work-order-status span{color:#52627a}.execution-summary{padding:15px;border:1px solid #dfe7ef;border-radius:12px}.execution-summary h3,.activity-timeline h3{margin:0 0 12px}.execution-summary dl{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0}.execution-summary dl div{padding:9px;border-radius:8px;background:#f7f9fc}.execution-summary dt{font-size:12px;color:#748196}.execution-summary dd{margin:3px 0 0;font-weight:700}.activity-timeline{margin-top:20px;padding-top:18px;border-top:1px solid #e3e8ef}.activity-timeline article{padding:11px 0 11px 15px;border-left:2px solid #cfe0f3}.activity-timeline article b,.activity-timeline article span{display:block}.activity-timeline article span{margin-top:3px;color:#778499;font-size:12px}.activity-timeline article p{margin:6px 0 0;color:#4f5f73}
</style>
