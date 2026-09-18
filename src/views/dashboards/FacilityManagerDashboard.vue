<script setup>
import { Award, BellRing, Box, CalendarCheck, CircleCheckBig, Clock3, CloudSun, Flame, Play, QrCode, Sparkles, Star, Trophy, Wrench } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DashboardVisuals from '../../components/dashboard/DashboardVisuals.vue';
import ImpactCarousel from '../../components/dashboard/ImpactCarousel.vue';
import MissionAlerts from '../../components/dashboard/MissionAlerts.vue';
import MissionMetric from '../../components/dashboard/MissionMetric.vue';
import MissionPanel from '../../components/dashboard/MissionPanel.vue';
const props = defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
const { locale, t } = useI18n();
const date = computed(() => new Intl.DateTimeFormat(locale.value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()));
const progress = computed(() => props.data.summary.tasksToday ? Math.round((props.data.summary.completedToday / props.data.summary.tasksToday) * 100) : 0);
const reward = computed(() => props.data.reward ?? {});
const levelProgress = computed(() => {
  if (reward.value.nextLevelPoints == null) return 100;
  const range = reward.value.nextLevelPoints - (reward.value.levelMinimumPoints ?? 0);
  const earned = (reward.value.points ?? 0) - (reward.value.levelMinimumPoints ?? 0);
  return range > 0 ? Math.min(100, Math.max(0, Math.round((earned / range) * 100))) : 0;
});
const badgeIcons = { sparkles: Sparkles, flame: Flame, award: Award, trophy: Trophy, star: Star };
function taskName(task) { return task.equipment?.equipmentType?.name || task.equipment?.assetCode || t('facilityDashboard.maintenanceTask'); }
function taskTime(value) { return new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
function badgeDate(value) { return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)); }
</script>
<template>
  <div class="role-dashboard mission-facility">
    <section class="facility-hero"><div><span class="mission-kicker">{{ t('facilityDashboard.workday') }}</span><h1>{{ t('facilityDashboard.goodDay') }}, {{ user.firstName }} <span aria-hidden="true">👋</span></h1><p>{{ data.scope?.name || user.facility?.name || t('facilityDashboard.yourFacility') }}</p><time>{{ date }}</time></div><div class="daily-progress"><div class="daily-progress__ring" :style="{ '--progress': `${progress * 3.6}deg` }"><span><strong>{{ progress }}%</strong>{{ t('facilityDashboard.complete') }}</span></div><div><strong>{{ t('facilityDashboard.todaysProgress') }}</strong><span>{{ t('facilityDashboard.tasksCompleted', { completed: data.summary.completedToday, total: data.summary.tasksToday }) }}</span><small>{{ t('facilityDashboard.progressBreakdown', { inProgress: data.summary.inProgressToday, pending: data.summary.pendingToday }) }}</small></div></div></section>
    <div class="facility-action-grid"><RouterLink class="scan-action" to="/modules/equipment"><QrCode :size="42" /><span><strong>{{ t('facilityDashboard.scanEquipment') }}</strong><small>{{ t('facilityDashboard.scanHint') }}</small></span><b>{{ t('facilityDashboard.scanNow') }} →</b></RouterLink><div class="mission-metrics mission-metrics--facility"><MissionMetric :label="t('facilityDashboard.todaysTasks')" :value="data.summary.tasksToday" :icon="CalendarCheck" /><MissionMetric :label="t('facilityDashboard.pendingFaults')" :value="data.summary.openWorkOrders" :icon="Wrench" tone="red" /><MissionMetric :label="t('facilityDashboard.temperatureAlerts')" :value="data.summary.criticalAlerts" :icon="BellRing" tone="orange" /></div></div>
    <ImpactCarousel />
    <div class="facility-work-grid"><MissionPanel :title="t('facilityDashboard.myTasks')" :eyebrow="t('facilityDashboard.todaysPriorities')" :link-label="t('facilityDashboard.viewAllTasks')" link-to="/modules/todays-tasks"><div v-if="data.myTasks.length" class="task-cards"><article v-for="task in data.myTasks" :key="task.id"><span class="task-time"><Clock3 :size="17" />{{ taskTime(task.scheduledAt) }}</span><div><strong>{{ taskName(task) }}</strong><small>{{ task.facility.name }}</small></div><button type="button"><Play :size="15" />{{ task.status === 'IN_PROGRESS' ? t('facilityDashboard.continue') : t('facilityDashboard.start') }}</button></article></div><div v-else class="mission-empty mission-empty--center"><CircleCheckBig :size="30" /><span>{{ t('facilityDashboard.noTasks') }}</span></div></MissionPanel><MissionPanel :title="t('facilityDashboard.equipmentHealth')" :eyebrow="t('facilityDashboard.yourFacility')"><DashboardVisuals :equipment="data.equipmentStatus" /></MissionPanel><MissionPanel :title="t('facilityDashboard.currentAlerts')" :eyebrow="t('facilityDashboard.actNow')"><MissionAlerts :alerts="data.recentAlerts" /></MissionPanel><MissionPanel :title="t('facilityDashboard.weatherRisk')" :eyebrow="t('facilityDashboard.fieldConditions')"><div class="weather-placeholder"><CloudSun :size="38" /><div><strong>{{ t('facilityDashboard.weatherPending') }}</strong><span>{{ t('facilityDashboard.weatherHint') }}</span></div></div></MissionPanel></div>
    <section class="reward-center">
      <div class="reward-center__summary">
        <div class="reward-level-mark"><Trophy :size="28" /></div>
        <div class="reward-level-copy">
          <span>{{ t('facilityDashboard.yourLevel') }}</span>
          <strong>{{ reward.level }}</strong>
          <small v-if="reward.nextLevelPoints">{{ t('facilityDashboard.pointsToNext', { points: reward.pointsToNextLevel }) }}</small>
          <small v-else>{{ t('facilityDashboard.highestLevel') }}</small>
        </div>
        <div class="reward-level-progress">
          <span><b>{{ t('facilityDashboard.points', { points: reward.points }) }}</b><em>{{ levelProgress }}%</em></span>
          <i><b :style="{ width: `${levelProgress}%` }" /></i>
        </div>
      </div>
      <div class="badge-showcase">
        <div class="badge-showcase__heading">
          <div><span>{{ t('facilityDashboard.achievements') }}</span><h2>{{ t('facilityDashboard.yourBadges') }}</h2></div>
          <b>{{ t('facilityDashboard.earned', { count: reward.badges.length }) }}</b>
        </div>
        <div v-if="reward.badges.length" class="badge-grid">
          <article v-for="badge in reward.badges" :key="badge.id">
            <span><component :is="badgeIcons[badge.icon] || Award" :size="25" /></span>
            <div><strong>{{ badge.name }}</strong><small>{{ badge.description }}</small><time>{{ t('facilityDashboard.earnedOn', { date: badgeDate(badge.earnedAt) }) }}</time></div>
          </article>
        </div>
        <div v-else class="badge-empty">
          <span><Sparkles :size="26" /></span>
          <div><strong>{{ t('facilityDashboard.firstBadgeTitle') }}</strong><small>{{ t('facilityDashboard.firstBadgeHint') }}</small></div>
        </div>
      </div>
    </section>
    <section class="achievement-strip"><div><Flame :size="25" /><span><strong>{{ t('facilityDashboard.dayStreak', { count: reward.streakDays }) }}</strong><small>{{ t('facilityDashboard.longestStreak', { count: reward.longestStreakDays }) }}</small></span></div><div><Trophy :size="25" /><span><strong>{{ reward.level }}</strong><small>{{ t('facilityDashboard.currentLevel') }}</small></span></div><div><Box :size="25" /><span><strong>{{ t('facilityDashboard.points', { points: reward.points }) }}</strong><small>{{ t('facilityDashboard.pointsPerTask') }}</small></span></div></section>
  </div>
</template>
