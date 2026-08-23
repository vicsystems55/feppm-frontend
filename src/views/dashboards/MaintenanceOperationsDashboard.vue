<script setup>
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Boxes,
  ClipboardList,
  HardHat,
  MapPinned,
  ShieldAlert,
  TimerReset,
  Truck,
  Users,
} from '@lucide/vue';
import { computed } from 'vue';
import StateFacilityMap from '../../components/maintenance/StateFacilityMap.vue';

const props = defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
const cards = computed(() => [
  { label: 'Active requests', value: props.data.summary.activeRequests, icon: ClipboardList, tone: 'blue' },
  { label: 'Awaiting triage', value: props.data.summary.untriagedRequests, icon: TimerReset, tone: 'orange' },
  { label: 'Critical requests', value: props.data.summary.criticalRequests, icon: ShieldAlert, tone: 'red' },
  { label: 'Active work orders', value: props.data.summary.activeWorkOrders, icon: HardHat, tone: 'green' },
  { label: 'Available technicians', value: props.data.summary.availableTechnicians, icon: Users, tone: 'blue' },
  { label: 'Contracts expiring', value: props.data.summary.expiringContracts, icon: AlertTriangle, tone: 'orange' },
]);

const showModuleLauncher = computed(() => props.data.roleKey === 'STATE_MAINTENANCE_MANAGER');
const maintenanceModules = [
  {
    title: 'Request queue',
    stage: 'Identify & triage',
    description: 'Review facility concerns, assess risk and choose the right technical response.',
    icon: ClipboardList,
    tone: 'blue',
    to: { path: '/modules/maintenance-operations', query: { tab: 'requests' } },
  },
  {
    title: 'Work orders',
    stage: 'Plan & control',
    description: 'Create, approve, schedule and verify accountable maintenance work.',
    icon: HardHat,
    tone: 'orange',
    to: { path: '/modules/maintenance-operations', query: { tab: 'work-orders' } },
  },
  {
    title: 'Technicians',
    stage: 'Field execution',
    description: 'Manage technical profiles, skills, availability and assigned personnel.',
    icon: Users,
    tone: 'green',
    to: { path: '/modules/maintenance-operations', query: { tab: 'technicians' } },
  },
  {
    title: 'Vendor contracts',
    stage: 'External support',
    description: 'Control approved service providers, coverage and contract response targets.',
    icon: Truck,
    tone: 'purple',
    to: { path: '/modules/maintenance-operations', query: { tab: 'contracts' } },
  },
  {
    title: 'Facility condition map',
    stage: 'Monitor the state',
    description: 'Locate facilities and inspect health, equipment, alerts and active issues.',
    icon: MapPinned,
    tone: 'teal',
    href: '#state-facility-map',
  },
  {
    title: 'Notifications',
    stage: 'Stay informed',
    description: 'Track operational updates, assignments, completions and escalations.',
    icon: Bell,
    tone: 'red',
    to: '/modules/notifications',
  },
  {
    title: 'Equipment registry',
    stage: 'Asset intelligence',
    description: 'Browse equipment and maintenance coverage across your authorized facility hierarchy.',
    icon: Boxes,
    tone: 'indigo',
    to: '/modules/equipment-registry',
  },
];
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

    <section v-if="showModuleLauncher" class="maintenance-modules">
      <header class="maintenance-modules__header">
        <div>
          <span>State maintenance workspace</span>
          <h2>What would you like to manage?</h2>
          <p>Move quickly between the technical modules that keep facilities and equipment operational.</p>
        </div>
        <div class="maintenance-modules__key"><i /> Available now</div>
      </header>

      <div class="maintenance-modules__grid">
        <component
          :is="module.to ? 'RouterLink' : 'a'"
          v-for="(module, index) in maintenanceModules"
          :key="module.title"
          :to="module.to"
          :href="module.href"
          :class="['maintenance-module-card', `is-${module.tone}`]"
        >
          <div class="maintenance-module-card__top">
            <span class="maintenance-module-card__number">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="maintenance-module-card__status">Open module</span>
          </div>
          <span class="maintenance-module-card__icon"><component :is="module.icon" :size="30" stroke-width="1.8" /></span>
          <small>{{ module.stage }}</small>
          <h3>{{ module.title }}</h3>
          <p>{{ module.description }}</p>
          <span class="maintenance-module-card__action">Explore <ArrowUpRight :size="17" /></span>
        </component>
      </div>
    </section>

    <div id="state-facility-map">
      <StateFacilityMap v-if="data.facilityMap?.markers?.length" :facility-map="data.facilityMap" />
    </div>
  </section>
</template>

<style scoped>
.maintenance-dashboard{padding:4px}.maintenance-dashboard__hero{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;padding:28px;border:1px solid #dbe5f1;border-radius:18px;background:linear-gradient(125deg,#f4f9ff,#f3fff8)}.maintenance-dashboard__hero span{color:#0967d2;font-weight:700}.maintenance-dashboard__hero h1{margin:5px 0;font-size:30px}.maintenance-dashboard__hero p{margin:0;color:#607087}.maintenance-dashboard__hero a{background:#0967d2;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700}.maintenance-dashboard__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:18px}.maintenance-dashboard__card{display:grid;grid-template-columns:auto 1fr;gap:8px 12px;padding:20px;border:1px solid #e0e7ef;border-radius:15px;background:#fff}.maintenance-dashboard__card svg{grid-row:1/3;color:#0967d2}.maintenance-dashboard__card small{color:#64748b}.maintenance-dashboard__card strong{font-size:27px}.is-red svg{color:#dc2626}.is-orange svg{color:#ea7c00}.is-green svg{color:#079455}@media(max-width:800px){.maintenance-dashboard__grid{grid-template-columns:1fr 1fr}.maintenance-dashboard__hero{flex-direction:column}}@media(max-width:520px){.maintenance-dashboard__grid{grid-template-columns:1fr}}
.maintenance-modules{margin-top:22px;padding:24px;border:1px solid #dce6f2;border-radius:20px;background:linear-gradient(145deg,#f8fbff 0%,#f6fffb 52%,#fffaf3 100%)}
.maintenance-modules__header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:18px}.maintenance-modules__header>div:first-child>span{color:#0967d2;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.maintenance-modules__header h2{margin:5px 0 4px;color:#172b4d;font-size:23px}.maintenance-modules__header p{margin:0;color:#66758a}.maintenance-modules__key{display:flex;align-items:center;gap:7px;white-space:nowrap;color:#657287;font-size:12px;font-weight:650}.maintenance-modules__key i{width:8px;height:8px;border-radius:50%;background:#079455}
.maintenance-modules__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.maintenance-module-card{--tone:#0967d2;--soft:#eaf2ff;position:relative;display:flex;min-height:235px;box-sizing:border-box;flex-direction:column;padding:17px;border:1px solid color-mix(in srgb,var(--tone) 22%,#dce5ef);border-radius:17px;background:linear-gradient(155deg,#fff 35%,var(--soft));box-shadow:0 8px 22px rgba(31,54,85,.06);color:#172b4d;text-decoration:none;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;overflow:hidden}.maintenance-module-card:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--tone) 55%,#fff);box-shadow:0 14px 28px rgba(31,54,85,.13)}.maintenance-module-card::after{content:"";position:absolute;right:-35px;bottom:-42px;width:115px;height:115px;border-radius:50%;background:color-mix(in srgb,var(--tone) 10%,transparent)}
.maintenance-module-card__top{display:flex;align-items:center;justify-content:space-between;gap:6px}.maintenance-module-card__number{font-size:12px;font-weight:850;color:var(--tone)}.maintenance-module-card__status{padding:4px 7px;border-radius:999px;background:#e9f8f0;color:#087a46;font-size:9px;font-weight:800;letter-spacing:.025em;text-transform:uppercase}.maintenance-module-card__icon{display:grid;place-items:center;width:58px;height:58px;margin:17px 0 12px;border-radius:17px;background:var(--tone);color:#fff;box-shadow:0 8px 18px color-mix(in srgb,var(--tone) 27%,transparent)}.maintenance-module-card small{color:var(--tone);font-size:10px;font-weight:800;letter-spacing:.055em;text-transform:uppercase}.maintenance-module-card h3{margin:5px 0 6px;font-size:16px;line-height:1.25}.maintenance-module-card p{position:relative;z-index:1;margin:0;color:#607087;font-size:11.5px;line-height:1.55}.maintenance-module-card__action{position:relative;z-index:1;display:flex;align-items:center;gap:5px;margin-top:auto;padding-top:13px;color:var(--tone);font-size:11px;font-weight:800}
.maintenance-module-card.is-orange{--tone:#ee7d00;--soft:#fff2df}.maintenance-module-card.is-green{--tone:#079455;--soft:#e9f8f0}.maintenance-module-card.is-purple{--tone:#7f56d9;--soft:#f2edff}.maintenance-module-card.is-teal{--tone:#0e9384;--soft:#e7f8f5}.maintenance-module-card.is-red{--tone:#d92d20;--soft:#feeceb}.maintenance-module-card.is-indigo{--tone:#4f46e5;--soft:#eeedff}#state-facility-map{scroll-margin-top:24px}
@media(max-width:1200px){.maintenance-modules__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:800px){.maintenance-modules{padding:18px}.maintenance-modules__header{align-items:flex-start;flex-direction:column}.maintenance-modules__grid{grid-template-columns:1fr 1fr}.maintenance-module-card{min-height:235px}}@media(max-width:520px){.maintenance-modules__grid{grid-template-columns:1fr}.maintenance-module-card{min-height:215px}}
</style>
