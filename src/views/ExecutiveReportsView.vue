<script setup>
import { Building2, CheckCircle2, ClipboardCheck, Download, FileSpreadsheet, LoaderCircle, ShieldCheck, TriangleAlert } from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { executiveReportApi } from '../services/executiveReportService.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const exporting = ref(false);
const error = ref('');
const report = ref({ stateName: 'State', rows: [], summary: {} });
const now = new Date();
const filters = reactive({
  from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
  to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
});

const cards = computed(() => [
  { label: 'LGAs covered', value: report.value.summary.totalLgas ?? 0, icon: Building2, tone: 'blue' },
  { label: 'Facilities equipped', value: report.value.summary.totalFacilitiesEquipped ?? 0, icon: ShieldCheck, tone: 'green' },
  { label: 'Tasks conducted', value: report.value.summary.totalConductedTasks ?? 0, icon: ClipboardCheck, tone: 'purple' },
  { label: 'Not conducted', value: report.value.summary.totalNotConducted ?? 0, icon: TriangleAlert, tone: 'orange' },
]);

function number(value) { return new Intl.NumberFormat('en-NG').format(Number(value || 0)); }
function percent(value) { return `${Number(value || 0).toFixed(1)}%`; }

async function loadReport() {
  loading.value = true;
  error.value = '';
  try { report.value = await executiveReportApi.preview(auth, filters); }
  catch (loadError) { error.value = loadError.message; }
  finally { loading.value = false; }
}

async function exportReport() {
  exporting.value = true;
  error.value = '';
  try {
    const { blob, filename } = await executiveReportApi.exportExcel(auth, filters);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (exportError) { error.value = exportError.message; }
  finally { exporting.value = false; }
}

onMounted(loadReport);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="executive-page">
        <section class="executive-hero">
          <div><span>STATE PERFORMANCE REPORTING</span><h1>{{ report.stateName }} Executive Report</h1><p>LGA-level maintenance, facility, issue-resolution and compliance overview.</p></div>
          <FileSpreadsheet :size="52" />
        </section>

        <section class="executive-toolbar">
          <label>From<input v-model="filters.from" type="date" /></label>
          <label>To<input v-model="filters.to" type="date" /></label>
          <button type="button" :disabled="loading" @click="loadReport">Apply period</button>
          <button class="export" type="button" :disabled="exporting || loading" @click="exportReport"><LoaderCircle v-if="exporting" class="spin" :size="18" /><Download v-else :size="18" />{{ exporting ? 'Preparing Excel…' : 'Export state report' }}</button>
        </section>

        <p v-if="error" class="executive-error">{{ error }}</p>
        <section class="executive-stats"><article v-for="card in cards" :key="card.label" :class="card.tone"><span><component :is="card.icon" :size="22" /></span><div><small>{{ card.label }}</small><strong>{{ number(card.value) }}</strong></div></article></section>

        <section class="executive-table-panel">
          <header><div><span>EXECUTIVE SUMMARY</span><h2>Performance by local government area</h2></div><div><CheckCircle2 :size="19" /><span>State compliance</span><strong>{{ percent(report.summary.compliancePercent) }}</strong></div></header>
          <div v-if="loading" class="executive-loading"><LoaderCircle class="spin" :size="28" />Building state report…</div>
          <div v-else class="executive-table-wrap"><table><thead><tr><th>LGA names</th><th>Major health facility manager</th><th>Total facilities equipped</th><th>Total conducted tasks</th><th>Total not conducted</th><th>Total issues raised</th><th>Total addressed</th><th>Compliance percent</th></tr></thead><tbody>
            <tr v-for="row in report.rows" :key="row.lgaName"><td><strong>{{ row.lgaName }}</strong></td><td>{{ row.majorHealthFacilityManager }}</td><td>{{ number(row.totalFacilitiesEquipped) }}</td><td>{{ number(row.totalConductedTasks) }}</td><td><span :class="{ warning: row.totalNotConducted }">{{ number(row.totalNotConducted) }}</span></td><td>{{ number(row.totalIssuesRaised) }}</td><td>{{ number(row.totalAddressed) }}</td><td><b class="compliance" :class="{ low: row.compliancePercent < 70 }">{{ percent(row.compliancePercent) }}</b></td></tr>
            <tr v-if="!report.rows.length"><td colspan="8" class="empty">No LGA data is available for the selected period and state scope.</td></tr>
          </tbody></table></div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.executive-page{min-height:calc(100vh - 72px);padding:26px;background:#f5f8fc;color:#14213d}.executive-hero{padding:25px 28px;display:flex;align-items:center;justify-content:space-between;border:1px solid #d7e5f5;border-radius:18px;background:linear-gradient(125deg,#edf6ff,#f0fff8)}.executive-hero>div>span,.executive-table-panel>header>div>span{color:#0967d2;font-size:11px;font-weight:800;letter-spacing:.08em}.executive-hero h1{margin:5px 0;font-size:30px}.executive-hero p{margin:0;color:#66758a}.executive-hero>svg{color:#087a46}.executive-toolbar{margin:16px 0;display:flex;align-items:end;gap:10px}.executive-toolbar label{display:grid;gap:5px;color:#52627a;font-size:12px;font-weight:700}.executive-toolbar input{padding:10px;border:1px solid #d5dee8;border-radius:9px;font:inherit}.executive-toolbar button{height:43px;padding:0 15px;border:1px solid #bcd2ec;border-radius:9px;color:#0967d2;background:#fff;font:inherit;font-weight:700;cursor:pointer}.executive-toolbar .export{margin-left:auto;display:flex;align-items:center;gap:7px;color:#fff;border-color:#087a46;background:#087a46}.executive-toolbar button:disabled{opacity:.6;cursor:wait}.executive-error{padding:11px 14px;border-radius:9px;color:#b42318;background:#fff0ee}.executive-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.executive-stats article{padding:16px;display:flex;align-items:center;gap:12px;border:1px solid #dfe7ef;border-radius:14px;background:#fff}.executive-stats article>span{width:42px;height:42px;display:grid;place-items:center;border-radius:11px}.executive-stats small,.executive-stats strong{display:block}.executive-stats small{color:#68778c}.executive-stats strong{margin-top:2px;font-size:24px}.executive-stats .blue>span{color:#175cd3;background:#eaf2ff}.executive-stats .green>span{color:#067647;background:#e7f8ef}.executive-stats .purple>span{color:#6941c6;background:#f2edff}.executive-stats .orange>span{color:#b54708;background:#fff3df}.executive-table-panel{border:1px solid #dfe7ef;border-radius:16px;overflow:hidden;background:#fff}.executive-table-panel>header{padding:18px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e7edf4}.executive-table-panel h2{margin:4px 0 0}.executive-table-panel>header>div:last-child{display:grid;grid-template-columns:auto auto;align-items:center;gap:2px 7px;color:#087a46}.executive-table-panel>header>div:last-child strong{grid-column:2;font-size:22px}.executive-table-wrap{overflow:auto}.executive-table-wrap table{width:100%;min-width:1100px;border-collapse:collapse}.executive-table-wrap th,.executive-table-wrap td{padding:13px 14px;border-bottom:1px solid #edf1f5;text-align:left}.executive-table-wrap th{color:#58677b;background:#f8fafc;font-size:11px;line-height:1.4}.executive-table-wrap td{font-size:12px}.warning{padding:4px 7px;border-radius:20px;color:#b42318;background:#feeceb}.compliance{padding:5px 8px;border-radius:20px;color:#067647;background:#e7f8ef}.compliance.low{color:#b42318;background:#feeceb}.executive-loading,.empty{padding:55px;text-align:center;color:#66758a}.executive-loading{display:flex;align-items:center;justify-content:center;gap:9px}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:900px){.executive-stats{grid-template-columns:1fr 1fr}.executive-toolbar{align-items:stretch;flex-wrap:wrap}.executive-toolbar .export{margin-left:0}.executive-table-panel>header{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.executive-page{padding:12px}.executive-hero{align-items:flex-start}.executive-hero>svg{display:none}.executive-stats{grid-template-columns:1fr}.executive-toolbar label,.executive-toolbar button{width:100%;box-sizing:border-box}}
</style>
