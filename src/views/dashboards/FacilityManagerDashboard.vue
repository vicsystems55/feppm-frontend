<script setup>
import { BellRing, Box, CalendarCheck, CircleCheckBig, Clock3, CloudSun, Flame, Play, QrCode, Trophy, Wrench } from '@lucide/vue';
import { computed } from 'vue';
import DashboardVisuals from '../../components/dashboard/DashboardVisuals.vue';
import ImpactCarousel from '../../components/dashboard/ImpactCarousel.vue';
import MissionAlerts from '../../components/dashboard/MissionAlerts.vue';
import MissionMetric from '../../components/dashboard/MissionMetric.vue';
import MissionPanel from '../../components/dashboard/MissionPanel.vue';
const props = defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
const date = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
const progress = computed(() => props.data.summary.tasksToday ? Math.round((props.data.summary.completedToday / props.data.summary.tasksToday) * 100) : 0);
function taskName(task) { return task.equipment?.equipmentType?.name || task.equipment?.assetCode || 'Maintenance task'; }
function taskTime(value) { return new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
</script>
<template>
  <div class="role-dashboard mission-facility">
    <section class="facility-hero"><div><span class="mission-kicker">Your workday</span><h1>Good day, {{ user.firstName }} <span aria-hidden="true">👋</span></h1><p>{{ data.scope?.name || user.facility?.name || 'Your facility' }}</p><time>{{ date }}</time></div><div class="daily-progress"><div class="daily-progress__ring" :style="{ '--progress': `${progress * 3.6}deg` }"><span><strong>{{ progress }}%</strong>complete</span></div><div><strong>Today's progress</strong><span>{{ data.summary.completedToday }} of {{ data.summary.tasksToday }} tasks completed</span><small>{{ data.summary.inProgressToday }} in progress · {{ data.summary.pendingToday }} pending</small></div></div></section>
    <div class="facility-action-grid"><RouterLink class="scan-action" to="/modules/equipment"><QrCode :size="42" /><span><strong>Scan Equipment QR</strong><small>Open a record, checklist, or fault report</small></span><b>Scan now →</b></RouterLink><div class="mission-metrics mission-metrics--facility"><MissionMetric label="Today's tasks" :value="data.summary.tasksToday" :icon="CalendarCheck" /><MissionMetric label="Pending faults" :value="data.summary.openWorkOrders" :icon="Wrench" tone="red" /><MissionMetric label="Temperature alerts" :value="data.summary.criticalAlerts" :icon="BellRing" tone="orange" /></div></div>
    <ImpactCarousel />
    <div class="facility-work-grid"><MissionPanel title="My tasks" eyebrow="Today's priorities" link-label="View all tasks" link-to="/modules/todays-tasks"><div v-if="data.myTasks.length" class="task-cards"><article v-for="task in data.myTasks" :key="task.id"><span class="task-time"><Clock3 :size="17" />{{ taskTime(task.scheduledAt) }}</span><div><strong>{{ taskName(task) }}</strong><small>{{ task.facility.name }}</small></div><button type="button"><Play :size="15" />{{ task.status === 'IN_PROGRESS' ? 'Continue' : 'Start' }}</button></article></div><div v-else class="mission-empty mission-empty--center"><CircleCheckBig :size="30" /><span>No tasks are assigned to you today.</span></div></MissionPanel><MissionPanel title="Equipment health" eyebrow="Your facility"><DashboardVisuals :equipment="data.equipmentStatus" /></MissionPanel><MissionPanel title="Current alerts" eyebrow="Act now"><MissionAlerts :alerts="data.recentAlerts" /></MissionPanel><MissionPanel title="Weather & power risk" eyebrow="Field conditions"><div class="weather-placeholder"><CloudSun :size="38" /><div><strong>Weather connection pending</strong><span>Connect a weather provider to see temperature, humidity, rain, and outage risk.</span></div></div></MissionPanel></div>
    <section class="achievement-strip"><div><Flame :size="25" /><span><strong>{{ data.reward.streakDays }} day streak</strong><small>Keep completing your checks</small></span></div><div><Trophy :size="25" /><span><strong>{{ data.reward.level }}</strong><small>Current technician level</small></span></div><div><Box :size="25" /><span><strong>{{ data.reward.credits }} credits</strong><small>Reward balance</small></span></div></section>
  </div>
</template>
