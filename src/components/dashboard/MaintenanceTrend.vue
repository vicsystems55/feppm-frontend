<script setup>
defineProps({ months: { type: Array, default: () => [] } });
</script>

<template>
  <div v-if="months.some((month) => month.completed + month.overdue + month.missed)" class="trend-bars">
    <div v-for="month in months" :key="month.key" class="trend-bars__month">
      <div class="trend-bars__stack">
        <i class="completed" :style="{ height: `${Math.min(100, month.completed * 8)}%` }" />
        <i class="overdue" :style="{ height: `${Math.min(100, month.overdue * 8)}%` }" />
        <i class="missed" :style="{ height: `${Math.min(100, month.missed * 8)}%` }" />
      </div>
      <span>{{ month.label }}</span>
    </div>
  </div>
  <p v-else class="mission-empty">Maintenance trends will appear when scheduled tasks are recorded.</p>
  <div class="trend-key"><span><i class="completed" />Completed</span><span><i class="overdue" />Overdue</span><span><i class="missed" />Missed</span></div>
</template>
