<script setup>
import { Award, BellRing, Box, CalendarCheck, CircleCheckBig, Clock3, CloudSun, Flame, Play, QrCode, Sparkles, Star, Trophy, Wrench } from '@lucide/vue';
import { computed } from 'vue';
import DashboardVisuals from '../../components/dashboard/DashboardVisuals.vue';
import ImpactCarousel from '../../components/dashboard/ImpactCarousel.vue';
import MissionAlerts from '../../components/dashboard/MissionAlerts.vue';
import MissionMetric from '../../components/dashboard/MissionMetric.vue';
import MissionPanel from '../../components/dashboard/MissionPanel.vue';
const props = defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
const date = new Intl.DateTimeFormat('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
const progress = computed(() => props.data.summary.tasksToday ? Math.round((props.data.summary.completedToday / props.data.summary.tasksToday) * 100) : 0);
const reward = computed(() => props.data.reward ?? {});
const levelProgress = computed(() => {
  if (reward.value.nextLevelPoints == null) return 100;
  const range = reward.value.nextLevelPoints - (reward.value.levelMinimumPoints ?? 0);
  const earned = (reward.value.points ?? 0) - (reward.value.levelMinimumPoints ?? 0);
  return range > 0 ? Math.min(100, Math.max(0, Math.round((earned / range) * 100))) : 0;
});
const badgeIcons = { sparkles: Sparkles, flame: Flame, award: Award, trophy: Trophy, star: Star };
function taskName(task) { return task.equipment?.equipmentType?.name || task.equipment?.assetCode || 'Maintenance task'; }
function taskTime(value) { return new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function badgeDate(value) { return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)); }
</script>
<template>
  <div class="role-dashboard mission-facility">
    <section class="facility-hero"><div><span class="mission-kicker">Your workday</span><h1>Good day, {{ user.firstName }} <span aria-hidden="true">👋</span></h1><p>{{ data.scope?.name || user.facility?.name || 'Your facility' }}</p><time>{{ date }}</time></div><div class="daily-progress"><div class="daily-progress__ring" :style="{ '--progress': `${progress * 3.6}deg` }"><span><strong>{{ progress }}%</strong>complete</span></div><div><strong>Today's progress</strong><span>{{ data.summary.completedToday }} of {{ data.summary.tasksToday }} tasks completed</span><small>{{ data.summary.inProgressToday }} in progress · {{ data.summary.pendingToday }} pending</small></div></div></section>
    <div class="facility-action-grid"><RouterLink class="scan-action" to="/modules/equipment"><QrCode :size="42" /><span><strong>Scan Equipment QR</strong><small>Open a record, checklist, or fault report</small></span><b>Scan now →</b></RouterLink><div class="mission-metrics mission-metrics--facility"><MissionMetric label="Today's tasks" :value="data.summary.tasksToday" :icon="CalendarCheck" /><MissionMetric label="Pending faults" :value="data.summary.openWorkOrders" :icon="Wrench" tone="red" /><MissionMetric label="Temperature alerts" :value="data.summary.criticalAlerts" :icon="BellRing" tone="orange" /></div></div>
    <ImpactCarousel />
    <div class="facility-work-grid"><MissionPanel title="My tasks" eyebrow="Today's priorities" link-label="View all tasks" link-to="/modules/todays-tasks"><div v-if="data.myTasks.length" class="task-cards"><article v-for="task in data.myTasks" :key="task.id"><span class="task-time"><Clock3 :size="17" />{{ taskTime(task.scheduledAt) }}</span><div><strong>{{ taskName(task) }}</strong><small>{{ task.facility.name }}</small></div><button type="button"><Play :size="15" />{{ task.status === 'IN_PROGRESS' ? 'Continue' : 'Start' }}</button></article></div><div v-else class="mission-empty mission-empty--center"><CircleCheckBig :size="30" /><span>No tasks are assigned to you today.</span></div></MissionPanel><MissionPanel title="Equipment health" eyebrow="Your facility"><DashboardVisuals :equipment="data.equipmentStatus" /></MissionPanel><MissionPanel title="Current alerts" eyebrow="Act now"><MissionAlerts :alerts="data.recentAlerts" /></MissionPanel><MissionPanel title="Weather & power risk" eyebrow="Field conditions"><div class="weather-placeholder"><CloudSun :size="38" /><div><strong>Weather connection pending</strong><span>Connect a weather provider to see temperature, humidity, rain, and outage risk.</span></div></div></MissionPanel></div>
    <section class="reward-center">
      <div class="reward-center__summary">
        <div class="reward-level-mark"><Trophy :size="28" /></div>
        <div class="reward-level-copy">
          <span>Your FEPPM level</span>
          <strong>{{ reward.level }}</strong>
          <small v-if="reward.nextLevelPoints">{{ reward.pointsToNextLevel }} points to your next level</small>
          <small v-else>Highest level achieved</small>
        </div>
        <div class="reward-level-progress">
          <span><b>{{ reward.points }} points</b><em>{{ levelProgress }}%</em></span>
          <i><b :style="{ width: `${levelProgress}%` }" /></i>
        </div>
      </div>
      <div class="badge-showcase">
        <div class="badge-showcase__heading">
          <div><span>Achievements</span><h2>Your badges</h2></div>
          <b>{{ reward.badges.length }} earned</b>
        </div>
        <div v-if="reward.badges.length" class="badge-grid">
          <article v-for="badge in reward.badges" :key="badge.id">
            <span><component :is="badgeIcons[badge.icon] || Award" :size="25" /></span>
            <div><strong>{{ badge.name }}</strong><small>{{ badge.description }}</small><time>Earned {{ badgeDate(badge.earnedAt) }}</time></div>
          </article>
        </div>
        <div v-else class="badge-empty">
          <span><Sparkles :size="26" /></span>
          <div><strong>Your first badge is close</strong><small>Complete today's daily checklist to unlock the Starter badge and earn your first 10 points.</small></div>
        </div>
      </div>
    </section>
    <section class="achievement-strip"><div><Flame :size="25" /><span><strong>{{ reward.streakDays }} day streak</strong><small>Longest: {{ reward.longestStreakDays }} days</small></span></div><div><Trophy :size="25" /><span><strong>{{ reward.level }}</strong><small>Current facility-manager level</small></span></div><div><Box :size="25" /><span><strong>{{ reward.points }} points</strong><small>10 points per daily task</small></span></div></section>
  </div>
</template>
