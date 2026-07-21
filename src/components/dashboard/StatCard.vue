<script setup>
import { MoreHorizontal, TrendingDown, TrendingUp, Activity } from '@lucide/vue';

defineProps({
  item: { 
    type: Object, 
    required: true,
    validator: (value) => {
      return value.label && value.value && value.change && value.tone && value.direction;
    }
  },
});
</script>

<template>
  <article class="group relative bg-white rounded-2xl shadow-sm border border-slate-100/80 p-5 transition-all duration-300 hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5">
    <!-- Subtle gradient accent line -->
    <div 
      class="absolute top-0 left-4 right-4 h-0.5 rounded-full transition-all duration-300 group-hover:h-1" 
      :class="{
        'bg-gradient-to-r from-emerald-400 to-emerald-300': item.tone === 'emerald',
        'bg-gradient-to-r from-indigo-400 to-indigo-300': item.tone === 'indigo',
        'bg-gradient-to-r from-amber-400 to-amber-300': item.tone === 'amber',
        'bg-gradient-to-r from-rose-400 to-rose-300': item.tone === 'rose',
        'bg-gradient-to-r from-blue-400 to-blue-300': item.tone === 'blue',
      }"
    />

    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <!-- Icon with modern circular background -->
        <div 
          class="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
          :class="{
            'bg-emerald-50 text-emerald-600': item.tone === 'emerald',
            'bg-indigo-50 text-indigo-600': item.tone === 'indigo',
            'bg-amber-50 text-amber-600': item.tone === 'amber',
            'bg-rose-50 text-rose-600': item.tone === 'rose',
            'bg-blue-50 text-blue-600': item.tone === 'blue',
          }"
        >
          <component :is="item.icon || Activity" :size="22" stroke-width="2" />
        </div>

        <div>
          <p class="text-sm font-medium text-slate-500">{{ item.label }}</p>
          <strong class="text-2xl font-bold text-slate-800 tracking-tight">{{ item.value }}</strong>
        </div>
      </div>

      <!-- Actions button with hover effect -->
      <button 
        class="rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 active:scale-90"
        aria-label="More options"
      >
        <MoreHorizontal :size="17" />
      </button>
    </div>

    <!-- Trend indicator with refined styling -->
    <div class="mt-4 flex items-center gap-2 border-t border-slate-100/80 pt-4">
      <div 
        class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200"
        :class="{
          'bg-emerald-50 text-emerald-700': item.tone === 'emerald' && item.direction !== 'down',
          'bg-indigo-50 text-indigo-700': item.tone === 'indigo' && item.direction !== 'down',
          'bg-amber-50 text-amber-700': item.tone === 'amber' && item.direction !== 'down',
          'bg-rose-50 text-rose-700': item.tone === 'rose' && item.direction !== 'down',
          'bg-blue-50 text-blue-700': item.tone === 'blue' && item.direction !== 'down',
          'bg-rose-50 text-rose-700': item.direction === 'down',
        }"
      >
        <component 
          :is="item.direction === 'down' ? TrendingDown : TrendingUp" 
          :size="13" 
          :class="{
            'text-rose-500': item.direction === 'down',
          }"
        />
        <b>{{ item.change }}</b>
      </div>
      <span class="text-xs text-slate-400 font-medium">from last month</span>
    </div>
  </article>
</template>

<style scoped>
/* Smooth hover animations */
.group {
  will-change: transform, box-shadow;
}

/* Optional: Add a subtle pulse animation for critical stats */
@keyframes subtlePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.group:has(.bg-rose-50) .bg-rose-50 {
  animation: subtlePulse 2s ease-in-out infinite;
}
</style>