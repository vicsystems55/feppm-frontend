<script setup>
defineProps({
  title: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  linkLabel: { type: String, default: '' },
  linkTo: { type: String, default: '' },
});
</script>

<template>
  <section class="mission-panel">
    <header class="mission-panel__header">
      <div>
        <span v-if="eyebrow">{{ eyebrow }}</span>
        <h2>{{ title }}</h2>
      </div>
      <RouterLink v-if="linkLabel && linkTo" :to="linkTo">{{ linkLabel }} →</RouterLink>
      <slot name="action" />
    </header>
    <div class="mission-panel__body"><slot /></div>
  </section>
</template>
