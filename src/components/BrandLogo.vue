<script setup>
import { Settings, Wrench } from '@lucide/vue';

defineProps({
  inverse: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
});
</script>

<template>
  <div class="feppm-logo" :class="{ inverse, compact }">
    <span class="feppm-logo-mark" aria-hidden="true">
      <Settings :size="compact ? 42 : 52" stroke-width="2.5" />
      <Wrench :size="compact ? 20 : 24" stroke-width="2.8" />
    </span>
    <span class="feppm-logo-copy">
      <strong><i>FE</i>PPM</strong>
      <span>Facility Equipment</span>
      <small>Planned Preventive Maintenance</small>
    </span>
  </div>
</template>

<style scoped>
.feppm-logo { display: inline-flex; align-items: flex-start; gap: 12px; }
.feppm-logo-mark { position: relative; width: 54px; height: 54px; display: grid; flex: 0 0 54px; place-items: center; color: #1670dc; }
.feppm-logo-mark svg:last-child { position: absolute; color: #38b66b; transform: rotate(-35deg); }
.feppm-logo-copy { display: flex; flex-direction: column; }
.feppm-logo-copy strong { color: #10a45e; font-size: 34px; font-style: normal; font-weight: 800; letter-spacing: .02em; line-height: 1; }
.feppm-logo-copy strong i { color: #1670dc; font-style: normal; }
.feppm-logo-copy > span { margin-top: 6px; color: #1d2939; font-size: 14px; font-weight: 600; line-height: 1.4; }
.feppm-logo-copy small { margin-top: 2px; color: #475467; font-size: 12px; line-height: 1.45; }
.feppm-logo.inverse .feppm-logo-mark { color: #fff; }
.feppm-logo.inverse .feppm-logo-copy > span,
.feppm-logo.inverse .feppm-logo-copy small { color: #fff; }
.feppm-logo.compact { gap: 9px; }
.feppm-logo.compact .feppm-logo-mark { width: 44px; height: 44px; flex-basis: 44px; }
.feppm-logo.compact .feppm-logo-copy strong { font-size: 28px; }
.feppm-logo.compact .feppm-logo-copy > span { margin-top: 4px; font-size: 11px; }
.feppm-logo.compact .feppm-logo-copy small { font-size: 10px; }
</style>
