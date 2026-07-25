<script setup>
import { Boxes, Building2, CalendarCheck, CircleCheckBig, FileText, TriangleAlert } from '@lucide/vue';
import DashboardVisuals from '../../components/dashboard/DashboardVisuals.vue';
import MissionAlerts from '../../components/dashboard/MissionAlerts.vue';
import MissionMetric from '../../components/dashboard/MissionMetric.vue';
import MissionPanel from '../../components/dashboard/MissionPanel.vue';
defineProps({ data: { type: Object, required: true } });
</script>
<template>
  <div class="role-dashboard mission-lga">
    <section class="mission-hero"><div><span class="mission-kicker">Local operations desk</span><h1>{{ data.scope?.name || 'LGA' }} LGA</h1><p>Keep every facility in your local government area functioning.</p></div><div class="hero-totals"><span><strong>{{ data.summary.facilities }}</strong> facilities</span><span><strong>{{ data.summary.equipment }}</strong> equipment</span></div></section>
    <div class="mission-metrics mission-metrics--four"><MissionMetric label="Today's maintenance" :value="data.summary.tasksToday" :icon="CalendarCheck" /><MissionMetric label="Overdue" :value="data.summary.overdueTasks" :icon="TriangleAlert" tone="orange" /><MissionMetric label="Open faults" :value="data.summary.openWorkOrders" :icon="Boxes" tone="red" /><MissionMetric label="Compliance" :value="data.summary.compliance === null ? null : `${data.summary.compliance}%`" :icon="CircleCheckBig" tone="green" /></div>
    <div class="mission-grid mission-grid--lga"><MissionPanel title="Facility comparison" eyebrow="Readiness at a glance" link-label="Open facilities" link-to="/modules/facilities"><DashboardVisuals :breakdown="data.breakdown" empty-label="Facilities will appear once assigned to this LGA." /></MissionPanel><MissionPanel title="Equipment health" eyebrow="All local facilities" link-label="Open equipment" link-to="/modules/lga-equipment"><DashboardVisuals :equipment="data.equipmentStatus" /></MissionPanel><MissionPanel title="Issues requiring attention" eyebrow="Faults and escalations"><MissionAlerts :alerts="data.recentAlerts" /></MissionPanel><MissionPanel title="Submission records" eyebrow="Daily, weekly and monthly"><div class="mission-empty mission-empty--center"><FileText :size="30" /><span>Review completed task reports and uploaded evidence from facilities.</span><RouterLink to="/modules/lga-reports">Open task reports</RouterLink></div></MissionPanel></div>
    <section class="quick-actions"><h2>Operational shortcuts</h2><div><RouterLink to="/modules/facilities"><Building2 :size="20" />Compare facilities</RouterLink><RouterLink to="/modules/lga-equipment"><Boxes :size="20" />Equipment registry</RouterLink><RouterLink to="/modules/lga-daily-tasks"><CalendarCheck :size="20" />Today's tasks</RouterLink></div></section>
  </div>
</template>
