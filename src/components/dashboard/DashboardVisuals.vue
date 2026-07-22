<script setup>
import { computed } from 'vue';
import { CircleCheckBig, CircleDashed, TriangleAlert, Wrench } from '@lucide/vue';

const props = defineProps({
  equipment: { type: Object, default: null },
  breakdown: { type: Array, default: () => [] },
  emptyLabel: { type: String, default: 'No records are available in this scope yet.' },
});

const statuses = computed(() => [
  { key: 'operational', label: 'Operational', color: '#079455', icon: CircleCheckBig },
  { key: 'underMaintenance', label: 'Under maintenance', color: '#1570ef', icon: Wrench },
  { key: 'faulty', label: 'Faulty', color: '#f04438', icon: TriangleAlert },
  { key: 'decommissioned', label: 'Decommissioned', color: '#98a2b3', icon: CircleDashed },
  { key: 'offline', label: 'Unreported', color: '#344054', icon: CircleDashed },
].map((item) => ({ ...item, value: props.equipment?.[item.key] ?? 0 })));

const total = computed(() => statuses.value.reduce((sum, item) => sum + item.value, 0));
const health = computed(() => total.value ? Math.round(((props.equipment?.operational ?? 0) / total.value) * 100) : null);
const donut = computed(() => {
  if (!total.value) return '#eef2f6';
  let cursor = 0;
  return `conic-gradient(${statuses.value.map((item) => {
    const start = cursor;
    cursor += (item.value / total.value) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(', ')})`;
});
</script>

<template>
  <div v-if="equipment !== null" class="health-summary">
    <div class="mission-donut" :style="{ background: donut }">
      <div><strong>{{ health === null ? '—' : `${health}%` }}</strong><span>Health score</span></div>
    </div>
    <div class="health-summary__legend">
      <div v-for="item in statuses" :key="item.key">
        <i :style="{ background: item.color }" />
        <span>{{ item.label }}</span><strong>{{ item.value.toLocaleString() }}</strong>
      </div>
      <p v-if="!total" class="mission-empty">{{ emptyLabel }}</p>
    </div>
  </div>

  <div v-else-if="breakdown.length" class="ranking-list">
    <article v-for="item in breakdown.slice(0, 10)" :key="item.id">
      <div><strong>{{ item.name }}</strong><small>{{ item.facilities }} facilities · {{ item.equipment }} equipment</small></div>
      <span>{{ item.score === null ? '—' : `${item.score}%` }}</span>
      <div class="ranking-bar"><i :style="{ width: `${item.score ?? 0}%` }" /></div>
    </article>
  </div>
  <p v-else class="mission-empty">{{ emptyLabel }}</p>
</template>
