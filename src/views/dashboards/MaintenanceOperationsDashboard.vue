<script setup>
import { AlertTriangle, ClipboardList, HardHat, ShieldAlert, TimerReset, Users } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
const cards = computed(() => [
  { label: 'Active requests', value: props.data.summary.activeRequests, icon: ClipboardList, tone: 'blue' },
  { label: 'Awaiting triage', value: props.data.summary.untriagedRequests, icon: TimerReset, tone: 'orange' },
  { label: 'Critical requests', value: props.data.summary.criticalRequests, icon: ShieldAlert, tone: 'red' },
  { label: 'Active work orders', value: props.data.summary.activeWorkOrders, icon: HardHat, tone: 'green' },
  { label: 'Available technicians', value: props.data.summary.availableTechnicians, icon: Users, tone: 'blue' },
  { label: 'Contracts expiring', value: props.data.summary.expiringContracts, icon: AlertTriangle, tone: 'orange' },
]);
</script>

<template>
  <section class="maintenance-dashboard">
    <div class="maintenance-dashboard__hero">
      <div><span>Maintenance Operations</span><h1>Good day, {{ user.firstName }}</h1><p>Coordinate technical response, resources and restoration across your authorized scope.</p></div>
      <RouterLink to="/modules/maintenance-operations">Open mission control</RouterLink>
    </div>
    <div class="maintenance-dashboard__grid">
      <article v-for="card in cards" :key="card.label" :class="`maintenance-dashboard__card is-${card.tone}`">
        <component :is="card.icon" :size="22" /><small>{{ card.label }}</small><strong>{{ card.value ?? 0 }}</strong>
      </article>
    </div>
  </section>
</template>

<style scoped>
.maintenance-dashboard{padding:4px}.maintenance-dashboard__hero{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:28px;border:1px solid #dbe5f1;border-radius:18px;background:linear-gradient(125deg,#f4f9ff,#f3fff8)}.maintenance-dashboard__hero span{color:#0967d2;font-weight:700}.maintenance-dashboard__hero h1{margin:5px 0;font-size:30px}.maintenance-dashboard__hero p{margin:0;color:#607087}.maintenance-dashboard__hero a{background:#0967d2;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700}.maintenance-dashboard__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:18px}.maintenance-dashboard__card{display:grid;grid-template-columns:auto 1fr;gap:8px 12px;padding:20px;border:1px solid #e0e7ef;border-radius:15px;background:#fff}.maintenance-dashboard__card svg{grid-row:1/3;color:#0967d2}.maintenance-dashboard__card small{color:#64748b}.maintenance-dashboard__card strong{font-size:27px}.is-red svg{color:#dc2626}.is-orange svg{color:#ea7c00}.is-green svg{color:#079455}@media(max-width:800px){.maintenance-dashboard__grid{grid-template-columns:1fr 1fr}.maintenance-dashboard__hero{flex-direction:column}}@media(max-width:520px){.maintenance-dashboard__grid{grid-template-columns:1fr}}
</style>
