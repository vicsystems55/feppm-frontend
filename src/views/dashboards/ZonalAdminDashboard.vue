<script setup>
import { Boxes, Building2, CircleCheckBig, MapPinned, TriangleAlert, Users, Wrench } from '@lucide/vue';
import DashboardVisuals from '../../components/dashboard/DashboardVisuals.vue';
import MaintenanceTrend from '../../components/dashboard/MaintenanceTrend.vue';
import MissionAlerts from '../../components/dashboard/MissionAlerts.vue';
import MissionMetric from '../../components/dashboard/MissionMetric.vue';
import MissionPanel from '../../components/dashboard/MissionPanel.vue';
defineProps({ data: { type: Object, required: true } });
</script>
<template>
  <div class="role-dashboard mission-zonal">
    <section class="mission-hero"><div><span class="mission-kicker">Regional mission control</span><h1>{{ data.scope?.name || 'Zonal' }} Performance</h1><p>Compare states, surface operational risks, and coordinate the zone.</p></div><MapPinned class="hero-watermark" :size="92" /></section>
    <div class="mission-metrics"><MissionMetric label="States" :value="data.breakdown.length" :icon="MapPinned" /><MissionMetric label="Facilities" :value="data.summary.facilities" :icon="Building2" tone="green" /><MissionMetric label="Equipment" :value="data.summary.equipment" :icon="Boxes" /><MissionMetric label="Open faults" :value="data.summary.openWorkOrders" :icon="Wrench" tone="red" /><MissionMetric label="Compliance" :value="data.summary.compliance === null ? null : `${data.summary.compliance}%`" :icon="CircleCheckBig" tone="green" /><MissionMetric label="Active users" :value="data.summary.activeUsers" :icon="Users" tone="violet" /></div>
    <div class="mission-grid"><MissionPanel title="State leaderboard" eyebrow="Performance within your zone" link-label="View states" link-to="/modules/states"><DashboardVisuals :breakdown="data.breakdown" /></MissionPanel><MissionPanel title="Equipment health" eyebrow="Zone registry"><DashboardVisuals :equipment="data.equipmentStatus" /></MissionPanel><MissionPanel title="Compliance trend" eyebrow="12-month movement"><MaintenanceTrend :months="data.maintenanceTrend" /></MissionPanel><MissionPanel title="Critical alerts" eyebrow="Escalations"><MissionAlerts :alerts="data.recentAlerts" /></MissionPanel></div>
  </div>
</template>
