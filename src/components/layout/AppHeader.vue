<script setup>
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Mail,
  Menu,
  Search,
} from '@lucide/vue';

defineEmits(['toggle-menu']);
</script>

<template>
  <header class="app-header">
    <button class="menu-toggle" type="button" aria-label="Open navigation" @click="$emit('toggle-menu')">
      <Menu :size="22" />
    </button>

    <label class="global-search">
      <Search :size="19" />
      <input type="search" placeholder="Search equipment, work orders, facilities..." />
      <kbd>⌘ K</kbd>
    </label>

    <div class="header-actions">
      <button type="button" aria-label="Help"><CircleHelp :size="20" /></button>
      <button class="has-badge" type="button" aria-label="Messages">
        <Mail :size="20" />
        <span>3</span>
      </button>
      <button class="has-badge" type="button" aria-label="Notifications">
        <Bell :size="20" />
        <span>12</span>
      </button>
    </div>

    <button class="user-menu" type="button">
      <span class="avatar">VM</span>
      <span class="user-copy"><b>Victor M.</b><small>System Admin</small></span>
      <ChevronDown :size="16" />
    </button>
  </header>
</template>
