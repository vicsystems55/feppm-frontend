<script setup>
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Compass,
  Folder,
  Globe2,
  Hospital,
  Map,
  MapPin,
} from '@lucide/vue';
import { computed } from 'vue';

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  expandedKeys: { type: Object, required: true },
});

const emit = defineEmits(['toggle', 'select']);

const icons = {
  NATIONAL: Globe2,
  ZONE: Compass,
  REGION: Compass,
  STATE: Map,
  LGA: MapPin,
  DISTRICT: MapPin,
  WARD: Folder,
  OTHER: Building2,
  FACILITY: Hospital,
};

const hasChildren = computed(() => Boolean(props.node.children?.length));
const expanded = computed(() => hasChildren.value && props.expandedKeys.has(props.node.key));
const nodeIcon = computed(() => icons[props.node.type] ?? Folder);

function activateNode() {
  if (hasChildren.value) {
    emit('toggle', props.node);
    return;
  }
  if (props.node.facility) emit('select', props.node.facility);
}
</script>

<template>
  <li
    class="facility-tree-node"
    :class="[`facility-tree-node--${node.type.toLowerCase()}`, { 'is-expanded': expanded }]"
    role="treeitem"
    :aria-expanded="hasChildren ? expanded : undefined"
    :aria-level="depth + 1"
  >
    <button class="facility-tree-row" type="button" @click="activateNode">
      <span class="facility-tree-toggle" aria-hidden="true">
        <ChevronDown v-if="expanded" :size="17" />
        <ChevronRight v-else-if="hasChildren" :size="17" />
        <span v-else class="facility-tree-toggle__spacer" />
      </span>

      <span class="facility-tree-icon" aria-hidden="true">
        <component :is="nodeIcon" :size="18" />
      </span>

      <span class="facility-tree-copy">
        <strong>{{ node.label }}</strong>
        <small v-if="node.type === 'FACILITY'">
          {{ node.facility.facilityCode || 'No facility code' }}
        </small>
        <small v-else>{{ node.type.replaceAll('_', ' ').toLowerCase() }}</small>
      </span>

      <span v-if="node.type !== 'FACILITY'" class="facility-tree-count">
        {{ node.facilityCount.toLocaleString() }}
        <small>{{ node.facilityCount === 1 ? 'facility' : 'facilities' }}</small>
      </span>

      <template v-else>
        <span class="facility-tree-equipment">
          {{ node.facility.equipmentCount.toLocaleString() }}
          <small>equipment</small>
        </span>
        <span
          class="facility-tree-status"
          :class="node.facility.status.toLowerCase()"
        >
          {{ node.facility.status }}
        </span>
        <span class="facility-tree-view">View</span>
      </template>
    </button>

    <Transition name="facility-tree-children">
      <ul v-if="expanded" class="facility-tree-children" role="group">
        <FacilityTreeNode
          v-for="child in node.children"
          :key="child.key"
          :node="child"
          :depth="depth + 1"
          :expanded-keys="expandedKeys"
          @toggle="emit('toggle', $event)"
          @select="emit('select', $event)"
        />
      </ul>
    </Transition>
  </li>
</template>

<style scoped>
.facility-tree-node { position: relative; list-style: none; }
.facility-tree-row {
  width: 100%;
  min-height: 52px;
  padding: 7px 12px 7px 7px;
  display: grid;
  grid-template-columns: 22px 34px minmax(180px,1fr) auto auto auto;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 9px;
  color: #344054;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .16s ease, color .16s ease;
}
.facility-tree-row:hover { background: #f4f8ff; }
.facility-tree-row:focus-visible { outline: 2px solid #1570ef; outline-offset: -2px; }
.facility-tree-toggle { width: 22px; height: 22px; display: grid; place-items: center; color: #667085; }
.facility-tree-toggle__spacer { width: 17px; height: 17px; display: block; }
.facility-tree-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #1570ef;
  background: #eaf2ff;
}
.facility-tree-copy { min-width: 0; display: flex; flex-direction: column; }
.facility-tree-copy strong { overflow: hidden; color: #1d2939; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.facility-tree-copy small { margin-top: 2px; color: #98a2b3; font-size: 9px; text-transform: capitalize; }
.facility-tree-count,.facility-tree-equipment {
  min-width: 78px;
  display: flex;
  flex-direction: column;
  color: #344054;
  font-size: 11px;
  font-weight: 700;
  text-align: right;
}
.facility-tree-count small,.facility-tree-equipment small { margin-top: 1px; color: #98a2b3; font-size: 8px; font-weight: 500; }
.facility-tree-status { min-width: 70px; padding: 5px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; text-align: center; }
.facility-tree-status.active { color: #067647; background: #e7f8ef; }
.facility-tree-status.inactive { color: #b42318; background: #feeceb; }
.facility-tree-view { padding: 6px 9px; border: 1px solid #cfe0f8; border-radius: 7px; color: #1570ef; background: #fff; font-size: 9px; font-weight: 700; }
.facility-tree-node--national > .facility-tree-row .facility-tree-icon { color: #6941c6; background: #f0ebff; }
.facility-tree-node--zone > .facility-tree-row .facility-tree-icon,
.facility-tree-node--region > .facility-tree-row .facility-tree-icon { color: #175cd3; background: #eaf2ff; }
.facility-tree-node--state > .facility-tree-row .facility-tree-icon { color: #b54708; background: #fff3df; }
.facility-tree-node--lga > .facility-tree-row .facility-tree-icon,
.facility-tree-node--district > .facility-tree-row .facility-tree-icon { color: #027a48; background: #e8f8ef; }
.facility-tree-node--ward > .facility-tree-row .facility-tree-icon { color: #ca8504; background: #fff8e5; }
.facility-tree-node--facility > .facility-tree-row .facility-tree-icon { color: #079455; background: #e7f8ef; }
.facility-tree-node--facility > .facility-tree-row { border: 1px solid transparent; }
.facility-tree-node--facility > .facility-tree-row:hover { border-color: #d7e6fb; background: #f8fbff; }
.facility-tree-children {
  margin: 0 0 0 18px;
  padding: 2px 0 2px 20px;
  border-left: 1px solid #dce5f0;
}
.facility-tree-children > .facility-tree-node::before {
  position: absolute;
  top: 25px;
  left: -20px;
  width: 17px;
  height: 1px;
  background: #dce5f0;
  content: '';
}
.facility-tree-children-enter-active,.facility-tree-children-leave-active { transition: opacity .16s ease, transform .16s ease; }
.facility-tree-children-enter-from,.facility-tree-children-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 760px) {
  .facility-tree-row { grid-template-columns: 20px 32px minmax(120px,1fr) auto; padding-right: 7px; }
  .facility-tree-equipment,.facility-tree-status { display: none; }
  .facility-tree-view { grid-column: 4; grid-row: 1; }
  .facility-tree-count { min-width: 58px; }
  .facility-tree-count small { display: none; }
  .facility-tree-children { margin-left: 14px; padding-left: 12px; }
  .facility-tree-children > .facility-tree-node::before { left: -12px; width: 10px; }
}
</style>
