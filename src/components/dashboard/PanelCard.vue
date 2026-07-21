<script setup>
import { MoreHorizontal } from '@lucide/vue';

defineProps({
  title: { type: String, required: true },
  menu: { type: Boolean, default: false },
});
</script>

<template>
  <section class="panel-card">
    <header class="panel-header">
      <h2>{{ title }}</h2>
      <slot name="action">
        <button v-if="menu" class="icon-plain" type="button" aria-label="More options">
          <MoreHorizontal :size="18" />
        </button>
      </slot>
    </header>
    <slot />
  </section>
</template>
