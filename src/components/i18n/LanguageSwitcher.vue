<script setup>
import { ChevronDown, Languages } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

import { setAppLocale, supportedLocales } from '../../i18n/index.js';

defineProps({
  compact: { type: Boolean, default: false },
});

const { locale, t } = useI18n();

function changeLocale(event) {
  setAppLocale(event.target.value);
}
</script>

<template>
  <label class="language-switcher" :class="{ 'language-switcher--compact': compact }">
    <Languages :size="18" aria-hidden="true" />
    <span class="language-switcher__label">{{ supportedLocales.find((item) => item.code === locale)?.label }}</span>
    <span v-if="compact" class="language-switcher__code">{{ locale.toUpperCase() }}</span>
    <select :value="locale" :aria-label="t('language.select')" @change="changeLocale">
      <option v-for="item in supportedLocales" :key="item.code" :value="item.code">
        {{ item.label }}
      </option>
    </select>
    <ChevronDown :size="15" aria-hidden="true" />
  </label>
</template>

<style scoped>
.language-switcher { position: relative; height: 42px; padding: 0 13px; display: inline-flex; align-items: center; gap: 8px; overflow: hidden; border: 1px solid #d8e0ea; border-radius: 9px; color: #344054; background: #fff; font-size: 13px; font-weight: 500; cursor: pointer; }
.language-switcher select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.language-switcher:focus-within { border-color: #1670dc; box-shadow: 0 0 0 3px rgba(22,112,220,.12); }
.language-switcher__code { display: none; }
.language-switcher--compact { width: 68px; height: 38px; padding: 0 9px; justify-content: center; gap: 5px; border-radius: 999px; }
.language-switcher--compact .language-switcher__label, .language-switcher--compact > svg:last-child { display: none; }
.language-switcher--compact .language-switcher__code { display: inline; font-size: 10px; font-weight: 700; }
@media (max-width: 560px) {
  .language-switcher:not(.language-switcher--compact) { width: 44px; padding: 0; justify-content: center; }
  .language-switcher:not(.language-switcher--compact) .language-switcher__label,
  .language-switcher:not(.language-switcher--compact) > svg:last-child { display: none; }
}
</style>
