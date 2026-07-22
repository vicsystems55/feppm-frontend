<script setup>
import { Settings, Wrench, X } from '@lucide/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { navigationForRoles, primaryRoleKey } from '../../config/roleNavigation.js';
import { useAuthStore } from '../../stores/auth.js';

defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);
const auth = useAuthStore();
const route = useRoute();
const navigation = computed(() => navigationForRoles(auth.user?.roles));
const roleKey = computed(() => primaryRoleKey(auth.user?.roles));
const roleName = computed(() => auth.user?.roles.find((role) => role.key === roleKey.value)?.name ?? 'User');
const scopeName = computed(() => auth.user?.facility?.name ?? auth.user?.organization?.name ?? 'FEPPM');
</script>

<template>
  <div class="sidebar-root">
    <div v-if="open" class="sidebar-backdrop" @click="emit('close')" />

    <aside class="app-sidebar" :class="{ 'is-open': open }">
    <div class="brand-row">
      <div class="brand-mark" aria-hidden="true">
        <Settings :size="30" stroke-width="2.4" />
        <Wrench :size="15" stroke-width="2.7" />
      </div>
      <div class="brand-copy">
        <div class="brand-name"><span>FE</span>PPM</div>
        <p>Facility Equipment</p>
        <small>Planned Preventive Maintenance</small>
      </div>
      <button class="sidebar-close" type="button" aria-label="Close navigation" @click="emit('close')">
        <X :size="20" />
      </button>
    </div>

    <nav class="sidebar-nav" aria-label="Primary navigation">
      <section v-for="group in navigation" :key="group.label" class="nav-group">
        <p class="nav-label">{{ group.label }}</p>
        <RouterLink v-for="item in group.items" :key="item.label" :to="item.to" class="nav-item"
          :class="{ active: route.path === item.to }" @click="emit('close')">
          <component :is="item.icon" :size="19" stroke-width="1.8" />
          <span>{{ item.label }}</span>
          <b v-if="item.badge" class="nav-badge">{{ item.badge }}</b>
        </RouterLink>
      </section>
    </nav>

    <div class="role-scope-card">
      <span>Signed in as</span>
      <strong>{{ roleName }}</strong>
      <small>{{ scopeName }}</small>
    </div>
    </aside>
  </div>
</template>
