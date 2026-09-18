<script setup>
import { BellOff, TriangleAlert } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

defineProps({ alerts: { type: Array, default: () => [] } });
const { t } = useI18n();

function relativeTime(value) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return t('facilityDashboard.minutesAgo', { count: minutes });
  if (minutes < 1440) return t('facilityDashboard.hoursAgo', { count: Math.floor(minutes / 60) });
  return t('facilityDashboard.daysAgo', { count: Math.floor(minutes / 1440) });
}
</script>

<template>
  <div v-if="alerts.length" class="mission-alerts">
    <article v-for="alert in alerts" :key="alert.id">
      <TriangleAlert :size="19" :class="`severity-${alert.severity.toLowerCase()}`" />
      <div><strong>{{ alert.title }}</strong><span>{{ alert.facility?.name || alert.message }}</span></div>
      <time>{{ relativeTime(alert.triggeredAt) }}</time>
    </article>
  </div>
  <div v-else class="mission-empty mission-empty--center"><BellOff :size="28" /><span>{{ t('facilityDashboard.noAlerts') }}</span></div>
</template>
