<script setup>
import { AlertTriangle, Building2, CircleAlert, MapPin, Phone, Wrench } from '@lucide/vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({ facilityMap: { type: Object, required: true } });
const mapElement = ref(null);
const selected = ref(null);
let map;
let layer;

const colors = { HEALTHY: '#079455', ATTENTION: '#f79009', CRITICAL: '#d92d20', NO_DATA: '#98a2b3' };
const labels = { HEALTHY: 'Healthy', ATTENTION: 'Needs attention', CRITICAL: 'Critical', NO_DATA: 'No equipment data' };

function markerStyle(condition) {
  return {
    radius: 7,
    color: '#ffffff',
    weight: 2,
    opacity: 1,
    fillColor: colors[condition] ?? colors.NO_DATA,
    fillOpacity: 0.95,
  };
}

function renderMap() {
  if (!mapElement.value || !props.facilityMap?.markers?.length) return;
  if (!map) {
    map = L.map(mapElement.value, { zoomControl: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    layer = L.featureGroup().addTo(map);
  }
  layer.clearLayers();
  props.facilityMap.markers.forEach((facility) => {
    const tooltip = document.createElement('div');
    const facilityName = document.createElement('strong');
    facilityName.textContent = facility.name;
    const details = document.createElement('span');
    details.textContent = `${labels[facility.condition]} · ${facility.activeIssueCount} issue(s)`;
    tooltip.append(facilityName, document.createElement('br'), details);
    L.circleMarker([facility.latitude, facility.longitude], markerStyle(facility.condition))
      .bindTooltip(tooltip, { direction: 'top' })
      .on('click', () => { selected.value = facility; })
      .addTo(layer);
  });
  map.fitBounds(layer.getBounds().pad(0.08), { maxZoom: 11 });
  setTimeout(() => map?.invalidateSize(), 50);
}

watch(() => props.facilityMap, () => nextTick(renderMap), { deep: true });
onMounted(() => nextTick(renderMap));
onBeforeUnmount(() => { map?.remove(); map = null; });

function label(value) { return String(value ?? '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
</script>

<template>
  <section class="state-map-card">
    <header><div><span>State maintenance observatory</span><h2>Facility condition map</h2><p>Select a marker to inspect equipment condition and unresolved issues.</p></div><div class="map-summary"><b class="healthy">{{ facilityMap.summary.HEALTHY }} healthy</b><b class="attention">{{ facilityMap.summary.ATTENTION }} attention</b><b class="critical">{{ facilityMap.summary.CRITICAL }} critical</b><b class="no-data">{{ facilityMap.summary.NO_DATA }} no data</b></div></header>
    <div class="state-map-layout">
      <div class="map-column"><div ref="mapElement" class="leaflet-map" /><div class="map-legend"><span v-for="(name, key) in labels" :key="key"><i :style="{ background: colors[key] }" />{{ name }}</span></div></div>
      <aside class="facility-inspector">
        <template v-if="selected">
          <div class="facility-heading"><span :style="{ background: colors[selected.condition] }"><MapPin :size="21" /></span><div><small>{{ labels[selected.condition] }}</small><h3>{{ selected.name }}</h3><p>{{ selected.lga ?? 'State scope' }} · {{ label(selected.facilityType) }}</p></div></div>
          <div class="facility-facts"><article><Building2 :size="18" /><span>Equipment<strong>{{ selected.equipmentTotal }}</strong></span></article><article><CircleAlert :size="18" /><span>Active issues<strong>{{ selected.activeIssueCount }}</strong></span></article><article><AlertTriangle :size="18" /><span>Open alerts<strong>{{ selected.openAlertCount }}</strong></span></article><article><Wrench :size="18" /><span>Non-functional<strong>{{ selected.equipment.NON_FUNCTIONAL ?? 0 }}</strong></span></article></div>
          <p v-if="selected.contactPhone" class="contact"><Phone :size="16" />{{ selected.contactPhone }}</p>
          <div v-if="selected.issues.length" class="issue-list"><h4>Unresolved issues</h4><RouterLink v-for="issue in selected.issues" :key="issue.id" :to="`/modules/issues/${issue.id}`"><span><b>{{ issue.ticketNumber }}</b>{{ issue.title }}</span><em :class="`p${issue.priority}`">P{{ issue.priority }}</em></RouterLink></div>
          <div v-if="selected.alerts.length" class="issue-list"><h4>Active alerts</h4><article v-for="alert in selected.alerts" :key="alert.id"><span><b>{{ label(alert.severity) }}</b>{{ alert.title }}</span></article></div>
          <p v-if="!selected.issues.length && !selected.alerts.length" class="healthy-message">No unresolved maintenance issues or active alerts at this facility.</p>
        </template>
        <div v-else class="select-prompt"><MapPin :size="35" /><h3>Select a facility</h3><p>Tap a coloured marker to view facility health, equipment totals and active concerns.</p></div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.state-map-card{margin-top:18px;border:1px solid #dce5ef;border-radius:18px;background:#fff;overflow:hidden}.state-map-card>header{display:flex;justify-content:space-between;gap:20px;padding:20px 22px;border-bottom:1px solid #e5eaf0}.state-map-card header span{color:#0967d2;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.state-map-card h2{margin:4px 0;font-size:21px}.state-map-card header p{margin:0;color:#68778b}.map-summary{display:flex;flex-wrap:wrap;justify-content:flex-end;align-content:flex-start;gap:7px}.map-summary b{padding:6px 9px;border-radius:999px;font-size:11px}.healthy{background:#e9f8f0;color:#087a46}.attention{background:#fff2df;color:#ad5c00}.critical{background:#feeceb;color:#b42318}.no-data{background:#f2f4f7;color:#667085}.state-map-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.65fr);min-height:520px}.map-column{position:relative;min-width:0}.leaflet-map{height:475px;width:100%;background:#eaf0f5}.map-legend{display:flex;gap:18px;flex-wrap:wrap;padding:13px 18px;color:#5c6a7d;font-size:12px}.map-legend span{display:flex;align-items:center;gap:6px}.map-legend i{width:9px;height:9px;border-radius:50%}.facility-inspector{padding:20px;border-left:1px solid #e5eaf0;overflow:auto}.facility-heading{display:flex;gap:12px}.facility-heading>span{display:grid;place-items:center;width:45px;height:45px;border-radius:12px;color:#fff}.facility-heading small{font-weight:750;color:#64748b}.facility-heading h3{margin:3px 0;font-size:18px}.facility-heading p{margin:0;color:#7b8798;font-size:12px}.facility-facts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:18px 0}.facility-facts article{display:flex;gap:8px;padding:10px;border-radius:10px;background:#f7f9fc;color:#667085}.facility-facts span,.facility-facts strong{display:block}.facility-facts span{font-size:11px}.facility-facts strong{margin-top:2px;color:#172b4d;font-size:17px}.contact{display:flex;align-items:center;gap:7px;color:#52647a}.issue-list{margin-top:18px}.issue-list h4{margin:0 0 8px}.issue-list a,.issue-list>article{display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid #edf0f3;color:#253858;text-decoration:none}.issue-list a span,.issue-list a b,.issue-list article span,.issue-list article b{display:block}.issue-list b{font-size:11px;color:#667085}.issue-list em{height:max-content;padding:3px 6px;border-radius:6px;background:#eef4ff;color:#175cd3;font-size:11px;font-style:normal}.issue-list em.p1{background:#fee4e2;color:#b42318}.issue-list em.p2{background:#fef0c7;color:#b54708}.healthy-message,.select-prompt{padding:17px;border-radius:12px;background:#ecfdf3;color:#067647}.select-prompt{margin-top:95px;text-align:center;background:#f4f8fc;color:#667085}.select-prompt h3{margin:8px 0 4px;color:#253858}.select-prompt p{margin:0}:global(.facility-map-marker-wrap){background:transparent!important;border:0!important}:global(.facility-map-marker){position:relative;display:block;width:27px;height:27px;border:3px solid #fff;border-radius:50% 50% 50% 0;background:var(--marker);transform:rotate(-45deg);box-shadow:0 3px 9px rgba(0,0,0,.28)}:global(.facility-map-marker i){position:absolute;inset:7px;border-radius:50%;background:#fff}:global(.leaflet-marker-pane){z-index:600}:global(.leaflet-tooltip){font-family:inherit}@media(max-width:920px){.state-map-layout{grid-template-columns:1fr}.facility-inspector{border-left:0;border-top:1px solid #e5eaf0}.state-map-card>header{flex-direction:column}.map-summary{justify-content:flex-start}}@media(max-width:560px){.leaflet-map{height:380px}.facility-facts{grid-template-columns:1fr 1fr}}
</style>
