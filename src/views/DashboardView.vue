<script setup>
import { computed, ref } from 'vue';
import {
  ArrowRight,
  Boxes,
  BriefcaseMedical,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  CircleCheckBig,
  CircleX,
  ClipboardCheck,
  Download,
  MapPin,
  Package,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  TriangleAlert,
  UserCheck,
  Wrench,
} from '@lucide/vue';

import PanelCard from '../components/dashboard/PanelCard.vue';
import StatCard from '../components/dashboard/StatCard.vue';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';

const sidebarOpen = ref(false);

const currentDate = computed(() =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date()),
);

const stats = [
  { label: 'Total equipment', value: '1,248', change: '5.2%', tone: 'blue', icon: BriefcaseMedical },
  { label: 'Maintenance due', value: '87', change: '12.4%', tone: 'orange', icon: CalendarClock },
  { label: 'Overdue maintenance', value: '23', change: '35.3%', tone: 'red', icon: TriangleAlert },
  { label: 'Compliance rate', value: '76%', change: '6.8%', tone: 'green', icon: CircleCheckBig },
];

const healthLegend = [
  { label: 'Operational', value: '978 (58.6%)', color: '#0aa65b' },
  { label: 'Maintenance due', value: '87 (6.9%)', color: '#f79009' },
  { label: 'Under maintenance', value: '96 (7.7%)', color: '#1467d8' },
  { label: 'Faulty', value: '23 (1.8%)', color: '#ef3f2b' },
  { label: 'Decommissioned', value: '42 (3.4%)', color: '#98a2b3' },
  { label: 'Offline / unreported', value: '22 (1.6%)', color: '#344054' },
];

const facilities = [
  { name: 'Abuja Office', equipment: 124, overdue: 5, score: '82%', tone: 'green' },
  { name: 'Lagos Plant', equipment: 248, overdue: 9, score: '68%', tone: 'orange' },
  { name: 'Kano Facility', equipment: 89, overdue: 3, score: '75%', tone: 'green' },
  { name: 'Port Harcourt', equipment: 67, overdue: 6, score: '54%', tone: 'red' },
];

const workOrderSteps = [
  { label: 'New', value: 28, icon: ClipboardCheck, tone: 'blue' },
  { label: 'Assigned', value: 34, icon: UserCheck, tone: 'blue' },
  { label: 'In progress', value: 46, icon: Wrench, tone: 'blue' },
  { label: 'Awaiting parts', value: 18, icon: Package, tone: 'orange' },
  { label: 'Completed', value: 24, icon: CircleCheck, tone: 'green' },
  { label: 'Verified', value: 6, icon: ShieldCheck, tone: 'green' },
];

const complianceStats = [
  { label: 'Completed on time', value: '72%', tone: 'green' },
  { label: 'Inspection compliance', value: '78%', tone: 'blue' },
  { label: 'Checklist completion', value: '81%', tone: 'green' },
  { label: 'SLA compliance', value: '74%', tone: 'orange' },
];

const alerts = [
  { asset: 'HVAC Unit 04', message: 'Main Warehouse is overdue for maintenance', time: '15 min ago', tone: 'red' },
  { asset: 'Generator 02', message: 'High engine temperature detected', time: '1 hr ago', tone: 'red' },
  { asset: 'Elevator 01', message: 'Inspection overdue', time: '2 hrs ago', tone: 'orange' },
  { asset: 'Water Pump 02', message: 'Vibration level high', time: '3 hrs ago', tone: 'red' },
];

const inventory = [
  { label: 'Total items', value: '2,341', icon: Boxes, tone: 'blue' },
  { label: 'Available', value: '1,654', icon: CircleCheck, tone: 'green' },
  { label: 'Low stock', value: '236', icon: TriangleAlert, tone: 'orange' },
  { label: 'Out of stock', value: '78', icon: CircleX, tone: 'red' },
  { label: 'Pending requests', value: '34', icon: ShoppingCart, tone: 'blue' },
  { label: 'Allocated to WO', value: '62', icon: PackageCheck, tone: 'green' },
];
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />

      <main class="dashboard-content">
        <section class="welcome-row">
          <div>
            <h1>Welcome back, <span>Victor M.</span></h1>
            <p>Here’s what’s happening across your facilities today.</p>
          </div>
          <div class="welcome-actions">
            <button class="date-button" type="button">
              <CalendarDays :size="18" />
              {{ currentDate }}
              <ChevronDown :size="15" />
            </button>
            <button class="primary-button" type="button">
              <Download :size="18" />
              Export report
            </button>
          </div>
        </section>

        <section class="stats-grid" aria-label="Equipment summary ">
          
        </section>

        <section class="dashboard-grid dashboard-grid-top ">
          <PanelCard title="Equipment health overview" menu>
            <div class="health-layout">
              <div class="donut-wrap">
                <div class="health-donut">
                  <div class="donut-center">
                    <strong>82%</strong>
                    <span>Health score</span>
                    <b>↑ 6.4%</b>
                  </div>
                </div>
              </div>
              <div class="health-legend">
                <div v-for="item in healthLegend" :key="item.label" class="legend-row">
                  <i :style="{ backgroundColor: item.color }" />
                  <span>{{ item.label }}</span>
                  <b>{{ item.value }}</b>
                </div>
              </div>
            </div>
            <div class="panel-total"><span>Total equipment</span><strong>1,248</strong></div>
          </PanelCard>

          <PanelCard title="Facility performance map" class="facility-panel">
            <div class="facility-layout">
              <div class="map-wrap" aria-label="Facility map illustration">
                <svg class="nigeria-map" viewBox="0 0 360 245" role="img" aria-label="Nigeria facility locations">
                  <path d="M58 56 89 34l38 9 30-18 36 17 35-10 38 22 35 2 17 30-12 25 18 28-21 25-5 39-39 8-22 19-34-8-28 15-34-18-31 5-13-30-31-13 10-32-19-27 23-23z" />
                  <path class="map-line" d="M72 104c47 14 91-22 136-10s58 46 103 40M103 47c15 52 2 99 31 158M238 49c-20 44-8 101-37 165" />
                </svg>
                <MapPin class="map-pin pin-abuja" :size="27" fill="currentColor" />
                <MapPin class="map-pin pin-lagos" :size="27" fill="currentColor" />
                <MapPin class="map-pin pin-kano" :size="27" fill="currentColor" />
                <MapPin class="map-pin pin-ph" :size="27" fill="currentColor" />
              </div>
              <div class="facility-list">
                <article v-for="facility in facilities" :key="facility.name">
                  <i :class="facility.tone" />
                  <div><b>{{ facility.name }}</b><span>{{ facility.equipment }} equip. · {{ facility.overdue }} overdue</span></div>
                  <strong :class="facility.tone">{{ facility.score }}</strong>
                </article>
              </div>
            </div>
            <div class="map-legend">
              <span><i class="green" />Healthy (≥ 80%)</span><span><i class="orange" />Attention (60%–79%)</span><span><i class="red" />Critical (&lt; 60%)</span>
              <a href="#" @click.prevent>View all facilities <ArrowRight :size="15" /></a>
            </div>
          </PanelCard>
        </section>

        <section class="dashboard-grid dashboard-grid-bottom">
          <PanelCard title="Work order status" class="work-orders-panel">
            <div class="work-order-flow">
              <template v-for="(step, index) in workOrderSteps" :key="step.label">
                <div class="work-step">
                  <div class="work-icon" :class="`tone-${step.tone}`"><component :is="step.icon" :size="18" /></div>
                  <span>{{ step.label }}</span><strong>{{ step.value }}</strong>
                </div>
                <i v-if="index < workOrderSteps.length - 1" class="flow-line" :class="index > 2 ? 'green' : ''" />
              </template>
            </div>
            <div class="order-summary">
              <div><span>Open work orders</span><b>156</b></div><div><span>Avg. response time</span><b>2.6 hrs</b></div><div><span>Avg. resolution time</span><b>5.4 hrs</b></div><div><span>Awaiting approval</span><b>11</b></div>
            </div>
            <a class="panel-link" href="#" @click.prevent>View all work orders <ArrowRight :size="15" /></a>
          </PanelCard>

          <PanelCard title="Maintenance compliance (PM)" class="compliance-panel">
            <template #action><button class="compact-select" type="button">This year <ChevronDown :size="14" /></button></template>
            <div class="compliance-chart-row">
              <div class="compliance-score"><strong>76%</strong><span>Completion rate</span><b>↑ 6.8% <small>vs last month</small></b></div>
              <div class="line-chart">
                <div class="chart-lines"><i /><i /><i /><i /></div>
                <svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-label="Monthly maintenance compliance trend">
                  <polyline points="4,91 29,83 54,68 79,60 104,75 129,57 154,42 179,44 204,40 229,27 254,38 296,12" />
                  <g><circle v-for="(point, index) in [[4,91],[29,83],[54,68],[79,60],[104,75],[129,57],[154,42],[179,44],[204,40],[229,27],[254,38],[296,12]]" :key="index" :cx="point[0]" :cy="point[1]" r="3" /></g>
                </svg>
                <div class="chart-months"><span v-for="month in ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']" :key="month">{{ month }}</span></div>
              </div>
            </div>
            <div class="compliance-stats">
              <div v-for="item in complianceStats" :key="item.label"><span>{{ item.label }}</span><b :class="item.tone">{{ item.value }}</b></div>
            </div>
            <a class="panel-link" href="#" @click.prevent>View compliance report <ArrowRight :size="15" /></a>
          </PanelCard>

          <PanelCard title="Recent critical alerts" class="alerts-panel">
            <template #action><a href="#" @click.prevent>View all</a></template>
            <div class="alerts-list">
              <article v-for="alert in alerts" :key="alert.asset">
                <TriangleAlert :class="alert.tone" :size="18" fill="currentColor" />
                <p><b>{{ alert.asset }}</b><span>— {{ alert.message }}</span></p>
                <time>{{ alert.time }}</time>
              </article>
            </div>
          </PanelCard>
        </section>

        <PanelCard title="Spare parts inventory summary" class="inventory-panel">
          <div class="inventory-row">
            <article v-for="item in inventory" :key="item.label">
              <component :is="item.icon" :class="item.tone" :size="24" />
              <div><span>{{ item.label }}</span><b>{{ item.value }}</b></div>
            </article>
            <a href="#" @click.prevent>View inventory <ArrowRight :size="15" /></a>
          </div>
        </PanelCard>
      </main>
    </div>
  </div>
</template>
