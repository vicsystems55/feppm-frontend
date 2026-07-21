<script setup>
import { MoreHorizontal, TrendingDown, TrendingUp } from '@lucide/vue';

defineProps({
  item: { type: Object, required: true },
});
</script>

<template>
  <article class="stat-card">
    <div class="stat-icon" :class="`tone-${item.tone}`">
      <component :is="item.icon" :size="22" stroke-width="2" />
    </div>
    <div class="stat-content">
      <div class="stat-heading">
        <p>{{ item.label }}</p>
        <MoreHorizontal :size="17" />
      </div>
      <strong>{{ item.value }}</strong>
      <div class="stat-trend" :class="item.direction === 'down' ? 'trend-down' : `trend-${item.tone}`">
        <component :is="item.direction === 'down' ? TrendingDown : TrendingUp" :size="15" />
        <b>{{ item.change }}</b>
        <span>from last month</span>
      </div>
    </div>
  </article>
</template>
