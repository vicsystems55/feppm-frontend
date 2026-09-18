<script setup>
import { Boxes, ClipboardList, HardHat, PackageSearch, RotateCcw, ScanLine } from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps({ data: { type: Object, required: true }, user: { type: Object, required: true } });
const workOrders = computed(() => props.data.workOrderStatus ?? {});
const stateName = computed(() => props.user.scopes?.find((scope) => scope.type === 'STATE')?.name ?? 'Assigned state');
</script>

<template>
  <section class="store-dashboard">
    <header class="role-hero">
      <div><span>Workshop stores</span><h1>Good day, {{ user.firstName }}</h1><p>Maintain accountable custody of spare parts and reusable tools for {{ stateName }} maintenance operations.</p></div>
    </header>

    <div class="store-status">
      <article><span><HardHat :size="22" /></span><div><small>Active work orders</small><strong>{{ data.summary.activeWorkOrders ?? 0 }}</strong></div></article>
      <article class="is-orange"><span><PackageSearch :size="22" /></span><div><small>Work awaiting parts</small><strong>{{ workOrders.AWAITING_PARTS ?? 0 }}</strong></div></article>
      <article class="is-indigo"><span><ClipboardList :size="22" /></span><div><small>Assigned work</small><strong>{{ workOrders.ASSIGNED ?? 0 }}</strong></div></article>
    </div>

    <section class="store-foundation">
      <div class="store-foundation__heading"><span><Boxes :size="29" /></span><div><small>Store control workspace</small><h2>Manage workshop resources</h2><p>Use the live registers below to review toolkit readiness, receive tagged tools, control custody and inspect verified spare-part balances.</p></div></div>
      <div class="control-list">
        <RouterLink to="/modules/tool-register"><ScanLine :size="20" /><span><strong>Controlled tool register</strong><small>Receive, issue, return and audit uniquely tagged tools.</small></span></RouterLink>
        <RouterLink to="/modules/spare-parts"><RotateCcw :size="20" /><span><strong>Store inventory</strong><small>Review verified balances and immutable movement history.</small></span></RouterLink>
        <RouterLink to="/modules/workshops"><ClipboardList :size="20" /><span><strong>Toolkit readiness</strong><small>Compare physical assets with the required workshop toolkit.</small></span></RouterLink>
        <RouterLink to="/modules/resource-requests"><PackageSearch :size="20" /><span><strong>Resource requests</strong><small>Confirm availability before authorizing controlled issue.</small></span></RouterLink>
      </div>
    </section>
  </section>
</template>

<style scoped>
.store-dashboard{padding:4px}.role-hero{padding:28px;border:1px solid #d9e5f2;border-radius:18px;background:linear-gradient(125deg,#f4f9ff,#eef8ff)}.role-hero span{color:#0967d2;font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.role-hero h1{margin:6px 0;font-size:30px}.role-hero p{max-width:720px;margin:0;color:#607087;line-height:1.6}.store-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-top:18px}.store-status article{--tone:#0967d2;display:flex;align-items:center;gap:13px;padding:19px;border:1px solid #e0e7ef;border-radius:14px;background:#fff}.store-status article>span{width:44px;height:44px;display:grid;place-items:center;border-radius:11px;background:color-mix(in srgb,var(--tone) 12%,#fff);color:var(--tone)}.store-status small{display:block;color:#66758a;font-size:11px}.store-status strong{display:block;margin-top:3px;color:#172b4d;font-size:25px}.store-status .is-orange{--tone:#e47b09}.store-status .is-indigo{--tone:#4f46e5}.store-foundation{margin-top:18px;padding:24px;border:1px solid #dce5ef;border-radius:17px;background:#fff}.store-foundation__heading{display:flex;gap:15px}.store-foundation__heading>span{width:54px;height:54px;display:grid;place-items:center;border-radius:14px;background:#eaf2ff;color:#0967d2}.store-foundation__heading small{color:#0967d2;font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.store-foundation__heading h2{margin:4px 0;font-size:21px}.store-foundation__heading p{max-width:780px;margin:0;color:#66758a;font-size:12px;line-height:1.6}.control-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:22px}.control-list>a{display:flex;gap:11px;padding:15px;border-radius:12px;background:#f7faff;color:#0967d2;text-decoration:none}.control-list>a:hover{background:#edf4ff}.control-list span{display:flex;flex-direction:column}.control-list strong{color:#172b4d;font-size:12px}.control-list small{margin-top:4px;color:#66758a;font-size:10px;line-height:1.45}@media(max-width:1000px){.control-list{grid-template-columns:1fr 1fr}}@media(max-width:760px){.store-status,.control-list{grid-template-columns:1fr}}
</style>
