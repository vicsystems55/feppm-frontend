<script setup>
import { ClipboardCheck, ClipboardList, HardHat, PackageSearch, ShieldAlert, Store, Users, Warehouse, Wrench } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
const { t } = useI18n();
const workOrders = computed(() => props.data.workOrderStatus ?? {});
const cards = computed(() => [
  { key: 'activeWorkOrders', value: props.data.summary.activeWorkOrders ?? 0, icon: HardHat, tone: 'blue' },
  { key: 'awaitingSignOff', value: workOrders.value.AWAITING_VERIFICATION ?? 0, icon: ClipboardCheck, tone: 'green' },
  { key: 'awaitingParts', value: workOrders.value.AWAITING_PARTS ?? 0, icon: PackageSearch, tone: 'orange' },
  { key: 'criticalRequests', value: props.data.summary.criticalRequests ?? 0, icon: ShieldAlert, tone: 'red' },
  { key: 'availableTechnicians', value: props.data.summary.availableTechnicians ?? 0, icon: Users, tone: 'indigo' },
  { key: 'awaitingApproval', value: props.data.summary.awaitingApproval ?? 0, icon: ClipboardList, tone: 'purple' },
]);
</script>

<template>
  <section class="workshop-dashboard">
    <header class="role-hero">
      <div><span>{{ t('workshopDashboard.eyebrow') }}</span><h1>{{ t('workshopDashboard.greeting', { name: user.firstName }) }}</h1><p>{{ t('workshopDashboard.subtitle') }}</p></div>
      <RouterLink :to="{ path: '/modules/maintenance-operations', query: { tab: 'work-orders' } }">{{ t('workshopDashboard.openWorkOrders') }}</RouterLink>
    </header>

    <div class="metric-grid">
      <article v-for="card in cards" :key="card.key" :class="`is-${card.tone}`">
        <span><component :is="card.icon" :size="22" /></span><div><small>{{ t(`workshopDashboard.metrics.${card.key}`) }}</small><strong>{{ card.value }}</strong></div>
      </article>
    </div>

    <div class="action-grid">
      <RouterLink :to="{ path: '/modules/maintenance-operations', query: { tab: 'work-orders' } }"><HardHat :size="27" /><div><strong>{{ t('workshopDashboard.actions.workOrders.title') }}</strong><p>{{ t('workshopDashboard.actions.workOrders.description') }}</p></div></RouterLink>
      <RouterLink :to="{ path: '/modules/maintenance-operations', query: { tab: 'technicians' } }"><Users :size="27" /><div><strong>{{ t('workshopDashboard.actions.technicians.title') }}</strong><p>{{ t('workshopDashboard.actions.technicians.description') }}</p></div></RouterLink>
      <RouterLink :to="{ path: '/modules/maintenance-operations', query: { tab: 'requests' } }"><ClipboardList :size="27" /><div><strong>{{ t('workshopDashboard.actions.facilityRequests.title') }}</strong><p>{{ t('workshopDashboard.actions.facilityRequests.description') }}</p></div></RouterLink>
      <RouterLink to="/modules/workshops"><Warehouse :size="27" /><div><strong>{{ t('workshopDashboard.actions.readiness.title') }}</strong><p>{{ t('workshopDashboard.actions.readiness.description') }}</p></div></RouterLink>
      <RouterLink to="/modules/spare-parts"><Store :size="27" /><div><strong>{{ t('workshopDashboard.actions.inventory.title') }}</strong><p>{{ t('workshopDashboard.actions.inventory.description') }}</p></div></RouterLink>
      <RouterLink to="/modules/tool-register"><Wrench :size="27" /><div><strong>{{ t('workshopDashboard.actions.tools.title') }}</strong><p>{{ t('workshopDashboard.actions.tools.description') }}</p></div></RouterLink>
      <RouterLink to="/modules/resource-requests"><PackageSearch :size="27" /><div><strong>{{ t('workshopDashboard.actions.resources.title') }}</strong><p>{{ t('workshopDashboard.actions.resources.description') }}</p></div></RouterLink>
    </div>
  </section>
</template>

<style scoped>
.workshop-dashboard{padding:4px}.role-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:28px;border:1px solid #d9e5f2;border-radius:18px;background:linear-gradient(125deg,#f4f9ff,#f2fff9)}.role-hero span{color:#0967d2;font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.role-hero h1{margin:6px 0;font-size:30px}.role-hero p{max-width:680px;margin:0;color:#607087;line-height:1.6}.role-hero a{padding:12px 18px;border-radius:10px;background:#0967d2;color:#fff;font-size:13px;font-weight:750;text-decoration:none;white-space:nowrap}.metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-top:18px}.metric-grid article{--tone:#0967d2;display:flex;align-items:center;gap:13px;padding:18px;border:1px solid #e0e7ef;border-radius:14px;background:#fff}.metric-grid article>span{width:43px;height:43px;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--tone) 12%,#fff);color:var(--tone)}.metric-grid small{display:block;color:#66758a;font-size:11px}.metric-grid strong{display:block;margin-top:3px;color:#172b4d;font-size:25px}.metric-grid .is-green{--tone:#079455}.metric-grid .is-orange{--tone:#e47b09}.metric-grid .is-red{--tone:#d92d20}.metric-grid .is-indigo{--tone:#4f46e5}.metric-grid .is-purple{--tone:#7f56d9}.action-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-top:18px}.action-grid a{display:flex;gap:14px;padding:20px;border:1px solid #dce5ef;border-radius:15px;background:#fff;color:#0967d2;text-decoration:none;transition:.2s}.action-grid a:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(31,54,85,.1)}.action-grid strong{color:#172b4d}.action-grid p{margin:5px 0 0;color:#66758a;font-size:12px;line-height:1.55}@media(max-width:900px){.metric-grid,.action-grid{grid-template-columns:1fr 1fr}.role-hero{flex-direction:column}}@media(max-width:560px){.metric-grid,.action-grid{grid-template-columns:1fr}}
</style>
