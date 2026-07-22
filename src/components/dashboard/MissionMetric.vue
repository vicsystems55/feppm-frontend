<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: null },
  caption: { type: String, default: '' },
  icon: { type: [Object, Function], required: true },
  tone: { type: String, default: 'blue' },
});

function display(value) {
  if (value === null || value === undefined) return '—';
  return typeof value === 'number' ? value.toLocaleString() : value;
}
</script>

<template>
  <article class="mission-metric">
    <span class="mission-metric__icon" :class="`mission-tone-${tone}`">
      <component :is="icon" :size="22" stroke-width="1.9" />
    </span>
    <div>
      <p>{{ label }}</p>
      <strong>{{ display(value) }}</strong>
      <small v-if="caption">{{ caption }}</small>
    </div>
  </article>
</template>
