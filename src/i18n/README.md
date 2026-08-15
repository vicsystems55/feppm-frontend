# FEPPM internationalization

The application uses Vue I18n in Composition API mode. English is the fallback locale, and the selected locale is persisted under `feppm.locale` in `localStorage`.

## Structure

- `index.js` registers supported locales and owns locale persistence plus `<html lang>` / `<html dir>` updates.
- `locales/en.js` is the source locale and fallback message catalogue.
- `locales/fr.js`, `locales/es.js`, and `locales/ar.js` mirror the English keys.
- `components/i18n/LanguageSwitcher.vue` is the shared locale control used on public and authenticated screens.

## Translating a component

```vue
<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <h1>{{ t('reports.title') }}</h1>
</template>
```

Add the same key to all four locale modules. Put reusable text under `common`; keep feature text grouped by feature. Use `Intl.DateTimeFormat`, `Intl.NumberFormat`, or Vue I18n formatters with the active locale instead of hard-coding an English locale.

Navigation entries receive translation keys automatically from their labels in `config/roleNavigation.js`. When adding a new group or item, add its generated snake-case key under `navigation.groups` or `navigation.items` in every locale.

Arabic sets the document to right-to-left mode. Prefer CSS logical properties such as `margin-inline-start`, `padding-inline-end`, and `inset-inline-end` in new components so layouts work in both directions.

Text returned by the API, such as notification bodies or user-entered content, remains unchanged unless the API returns a translation key or localized value.
