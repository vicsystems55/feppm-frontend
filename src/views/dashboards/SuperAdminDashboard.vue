<script setup>
import { Activity, Boxes, Building2, CircleCheckBig, Server, Settings, ShieldCheck, UserPlus, Users } from '@lucide/vue';
import DashboardVisuals from '../../components/dashboard/DashboardVisuals.vue';
import MaintenanceTrend from '../../components/dashboard/MaintenanceTrend.vue';
import MissionAlerts from '../../components/dashboard/MissionAlerts.vue';
import MissionMetric from '../../components/dashboard/MissionMetric.vue';
import MissionPanel from '../../components/dashboard/MissionPanel.vue';

defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
</script>

<template>
  <div class="role-dashboard mission-super">
    <section class="mission-hero">
      <div><span class="mission-kicker">Platform mission control</span><h1>Good {{ new Date().getHours() < 12 ? 'morning' : 'day' }}, {{ user.firstName }}</h1><p>FEPPM system overview across every connected organization.</p></div>
      <div class="hero-totals"><span><strong>{{ data.summary.equipment.toLocaleString() }}</strong> equipment</span><span><strong>{{ data.summary.facilities.toLocaleString() }}</strong> facilities</span><span><strong>{{ data.summary.activeUsers.toLocaleString() }}</strong> active users</span></div>
    </section>
    <div class="mission-metrics mission-metrics--six">
      <MissionMetric label="Total equipment" :value="data.summary.equipment" :icon="Boxes" />
      <MissionMetric label="Total facilities" :value="data.summary.facilities" :icon="Building2" tone="green" />
      <MissionMetric label="Active users" :value="data.summary.activeUsers" :icon="Users" tone="violet" />
      <MissionMetric label="PM compliance" :value="data.summary.compliance === null ? null : `${data.summary.compliance}%`" caption="Today's scheduled tasks" :icon="CircleCheckBig" tone="orange" />
      <MissionMetric label="Equipment health" :value="data.summary.equipmentHealth === null ? null : `${data.summary.equipmentHealth}%`" :icon="Activity" tone="green" />
      <MissionMetric label="API status" value="Online" caption="Live dashboard connection" :icon="Server" />
    </div>
    <div class="mission-grid mission-grid--wide">
      <MissionPanel title="National equipment status" eyebrow="All organizations"><DashboardVisuals :equipment="data.equipmentStatus" /></MissionPanel>
      <MissionPanel title="Organization coverage" eyebrow="Operational ranking" link-label="View facilities" link-to="/modules/facilities"><DashboardVisuals :breakdown="data.breakdown" /></MissionPanel>
      <MissionPanel title="12-month maintenance trend" eyebrow="Performance"><MaintenanceTrend :months="data.maintenanceTrend" /></MissionPanel>
      <MissionPanel title="Recent critical alerts" eyebrow="Requires attention" link-label="View alerts" link-to="/modules/alerts"><MissionAlerts :alerts="data.recentAlerts" /></MissionPanel>
    </div>
    <div class="platform-strip"><span><b>{{ data.platform.dailyLogins }}</b> daily logins</span><span><b>{{ data.platform.registeredDevices }}</b> registered devices</span><span><b>{{ data.platform.offlineDevices }}</b> offline devices</span><span><b>{{ data.platform.trustedDevices }}</b> trusted devices</span></div>
    <section class="quick-actions"><h2>Quick actions</h2><div><RouterLink to="/modules/users"><UserPlus :size="20" />Add user</RouterLink><RouterLink to="/modules/facilities"><Building2 :size="20" />Register facility</RouterLink><RouterLink to="/modules/analytics"><ShieldCheck :size="20" />Generate report</RouterLink><RouterLink to="/modules/settings"><Settings :size="20" />System settings</RouterLink></div></section>
  </div>
</template>
