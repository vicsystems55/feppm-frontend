<script setup>
import {
  Bell,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  ClipboardCheck,
  Crown,
  FileText,
  LayoutDashboard,
  PackageSearch,
  Settings,
  ShieldUser,
  Users,
  Wrench,
  X,
} from '@lucide/vue';

defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);

const navigation = [
  {
    label: 'Main menu',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, active: true },
      { label: 'Facilities', icon: Building2 },
      { label: 'Equipment registry', icon: Boxes },
      { label: 'Maintenance plans', icon: ClipboardCheck },
      { label: 'Work orders', icon: FileText },
      { label: 'Inspections', icon: ShieldUser },
      { label: 'Technicians', icon: Users },
      { label: 'Spare parts', icon: PackageSearch },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Reports & analytics', icon: ChartNoAxesCombined },
      { label: 'Documents', icon: FileText },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Users & roles', icon: Users },
      { label: 'Settings', icon: Settings },
      { label: 'Notifications', icon: Bell, badge: 12 },
    ],
  },
];
</script>

<template>
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
        <a
          v-for="item in group.items"
          :key="item.label"
          href="#"
          class="nav-item"
          :class="{ active: item.active }"
          @click.prevent="emit('close')"
        >
          <component :is="item.icon" :size="19" stroke-width="1.8" />
          <span>{{ item.label }}</span>
          <b v-if="item.badge" class="nav-badge">{{ item.badge }}</b>
        </a>
      </section>
    </nav>

    <div class="upgrade-card">
      <div class="upgrade-title">
        <span>Upgrade to Premium</span>
        <Crown :size="18" />
      </div>
      <p>Unlock advanced reports, analytics and more features.</p>
      <button type="button">Upgrade now <span>→</span></button>
    </div>
  </aside>
</template>
