<script setup>
import { computed } from 'vue';

const props = defineProps({
  breakdown: { type: Array, default: () => [] },
});

const colors = ['#1467d8', '#079455', '#f79009', '#7f56d9', '#06a6c7', '#e34850', '#2e90fa', '#84ad16'];

const slices = computed(() => {
  const sorted = [...props.breakdown]
    .filter((item) => Number(item.facilities) > 0)
    .sort((left, right) => Number(right.facilities) - Number(left.facilities));
  const visible = sorted.slice(0, 7).map((item) => ({ ...item, facilities: Number(item.facilities) }));
  const remaining = sorted.slice(7).reduce((sum, item) => sum + Number(item.facilities), 0);
  if (remaining) visible.push({ id: 'other', name: 'Other organizations', facilities: remaining });
  return visible.map((item, index) => ({ ...item, color: colors[index % colors.length] }));
});

const total = computed(() => slices.value.reduce((sum, item) => sum + item.facilities, 0));
const donut = computed(() => {
  if (!total.value) return '#eef2f6';
  let cursor = 0;
  return `conic-gradient(${slices.value.map((item) => {
    const start = cursor;
    cursor += (item.facilities / total.value) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  }).join(', ')})`;
});
</script>

<template>
  <div v-if="total" class="facility-distribution">
    <div class="facility-distribution__donut" :style="{ background: donut }" aria-label="Facility distribution chart">
      <div><strong>{{ total.toLocaleString() }}</strong><span>Total facilities</span></div>
    </div>
    <div class="facility-distribution__legend">
      <article v-for="item in slices" :key="item.id">
        <i :style="{ background: item.color }" />
        <span :title="item.name">{{ item.name }}</span>
        <strong>{{ item.facilities.toLocaleString() }}</strong>
        <small>{{ Math.round((item.facilities / total) * 100) }}%</small>
      </article>
    </div>
  </div>
  <p v-else class="mission-empty">Facility distribution will appear when organizations register facilities.</p>
</template>

<style scoped>
.facility-distribution{min-height:215px;display:grid;grid-template-columns:minmax(150px,.8fr) minmax(220px,1.2fr);align-items:center;gap:22px}.facility-distribution__donut{width:174px;max-width:100%;aspect-ratio:1;margin:auto;padding:22px;display:grid;place-items:center;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(16,24,40,.04)}.facility-distribution__donut>div{width:100%;height:100%;display:grid;place-items:center;align-content:center;border-radius:50%;background:#fff;text-align:center;box-shadow:0 2px 8px rgba(16,24,40,.08)}.facility-distribution__donut strong{font-size:27px;line-height:1.1}.facility-distribution__donut span{margin-top:4px;color:#667085;font-size:10px}.facility-distribution__legend{max-height:230px;overflow-y:auto}.facility-distribution__legend article{padding:7px 0;display:grid;grid-template-columns:9px minmax(0,1fr) auto 34px;align-items:center;gap:8px;border-bottom:1px solid #f0f2f5}.facility-distribution__legend article:last-child{border:0}.facility-distribution__legend i{width:8px;height:8px;border-radius:50%}.facility-distribution__legend span{overflow:hidden;color:#475467;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.facility-distribution__legend strong{font-size:12px}.facility-distribution__legend small{color:#98a2b3;font-size:9px;text-align:right}@media(max-width:580px){.facility-distribution{grid-template-columns:1fr}.facility-distribution__donut{width:160px}}
</style>
