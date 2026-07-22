<script setup>
import { Boxes, Building2, CalendarCheck, CircleCheckBig, MapPinned, TriangleAlert } from '@lucide/vue';
import DashboardVisuals from '../../components/dashboard/DashboardVisuals.vue';
import MaintenanceTrend from '../../components/dashboard/MaintenanceTrend.vue';
import MissionAlerts from '../../components/dashboard/MissionAlerts.vue';
import MissionMetric from '../../components/dashboard/MissionMetric.vue';
import MissionPanel from '../../components/dashboard/MissionPanel.vue';
defineProps({ data: { type: Object, required: true } });
</script>
<template>
  <div class="role-dashboard mission-state">
    <section class="mission-hero"><div><span class="mission-kicker">State operations</span><h1>{{ data.scope?.name || 'State' }} State</h1><p>{{ data.breakdown.length }} LGAs · {{ data.summary.facilities.toLocaleString() }} facilities under your coordination.</p></div><RouterLink class="hero-action" to="/modules/facilities">Open facility directory →</RouterLink></section>
    <div class="mission-metrics mission-metrics--four"><MissionMetric label="Equipment" :value="data.summary.equipment" :icon="Boxes" /><MissionMetric label="Today's tasks" :value="data.summary.tasksToday" :icon="CalendarCheck" tone="green" /><MissionMetric label="Fault reports" :value="data.summary.openWorkOrders" :icon="TriangleAlert" tone="red" /><MissionMetric label="State compliance" :value="data.summary.compliance === null ? null : `${data.summary.compliance}%`" :icon="CircleCheckBig" tone="orange" /></div>
    <div class="mission-grid mission-grid--state"><MissionPanel title="LGA performance" eyebrow="Coverage and readiness" link-label="View LGAs" link-to="/modules/lgas"><DashboardVisuals :breakdown="data.breakdown" /></MissionPanel><MissionPanel title="Equipment status" eyebrow="Across the state"><DashboardVisuals :equipment="data.equipmentStatus" /></MissionPanel><MissionPanel title="Maintenance calendar trend" eyebrow="12-month view"><MaintenanceTrend :months="data.maintenanceTrend" /></MissionPanel><MissionPanel title="Escalated issues" eyebrow="Immediate attention" link-label="View alerts" link-to="/modules/alerts"><MissionAlerts :alerts="data.recentAlerts" /></MissionPanel></div>
    <section class="scope-callout"><MapPinned :size="24" /><div><strong>{{ data.summary.activeFacilities.toLocaleString() }} active facilities</strong><span>out of {{ data.summary.facilities.toLocaleString() }} facilities in the current state scope</span></div><RouterLink to="/modules/facilities">Review status</RouterLink></section>
  </div>
</template>
