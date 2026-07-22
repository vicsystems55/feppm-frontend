<script setup>
import { Boxes, Building2, CalendarClock, CircleCheckBig, Map, TriangleAlert, Wrench } from '@lucide/vue';
import DashboardVisuals from '../../components/dashboard/DashboardVisuals.vue';
import MaintenanceTrend from '../../components/dashboard/MaintenanceTrend.vue';
import MissionAlerts from '../../components/dashboard/MissionAlerts.vue';
import MissionMetric from '../../components/dashboard/MissionMetric.vue';
import MissionPanel from '../../components/dashboard/MissionPanel.vue';
defineProps({ data: { type: Object, required: true } });
</script>
<template>
  <div class="role-dashboard mission-national">
    <section class="mission-hero mission-hero--map"><div><span class="mission-kicker">National cold chain command</span><h1>Nigeria National Maintenance Overview</h1><p>Monitor maintenance readiness and facility performance across the country.</p></div><div class="hero-totals"><span><strong>{{ data.breakdown.length }}</strong> zones reporting</span><span><strong>{{ data.summary.facilities.toLocaleString() }}</strong> facilities</span><span><strong>{{ data.summary.equipment.toLocaleString() }}</strong> equipment</span></div></section>
    <div class="mission-metrics"><MissionMetric label="Equipment operational" :value="data.summary.operationalEquipment" :icon="Boxes" tone="green" /><MissionMetric label="Tasks due today" :value="data.summary.tasksToday" :icon="CalendarClock" /><MissionMetric label="Overdue tasks" :value="data.summary.overdueTasks" :icon="TriangleAlert" tone="orange" /><MissionMetric label="Critical facilities" :value="data.summary.criticalAlerts" :icon="Building2" tone="red" /><MissionMetric label="National compliance" :value="data.summary.compliance === null ? null : `${data.summary.compliance}%`" :icon="CircleCheckBig" tone="green" /><MissionMetric label="Open work orders" :value="data.summary.openWorkOrders" :icon="Wrench" tone="violet" /></div>
    <div class="mission-grid mission-grid--wide"><MissionPanel title="Compliance by zone" eyebrow="Six geopolitical zones" link-label="View national reports" link-to="/modules/national-reports"><DashboardVisuals :breakdown="data.breakdown" /></MissionPanel><MissionPanel title="National equipment health" eyebrow="Current registry"><DashboardVisuals :equipment="data.equipmentStatus" /></MissionPanel><MissionPanel title="Maintenance performance" eyebrow="Last 12 months"><MaintenanceTrend :months="data.maintenanceTrend" /></MissionPanel><MissionPanel title="Recent fault reports" eyebrow="National alerts" link-label="View alerts" link-to="/modules/alerts"><MissionAlerts :alerts="data.recentAlerts" /></MissionPanel></div>
    <section class="quick-actions"><h2>National operations</h2><div><RouterLink to="/modules/states"><Map :size="20" />Review states</RouterLink><RouterLink to="/modules/facilities"><Building2 :size="20" />Browse facilities</RouterLink><RouterLink to="/modules/maintenance-calendar"><CalendarClock :size="20" />National calendar</RouterLink></div></section>
  </div>
</template>
