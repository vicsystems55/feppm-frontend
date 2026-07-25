<script setup>
import { ChevronsDownUp, ChevronsUpDown, Hospital } from '@lucide/vue';
import { computed, reactive, watch } from 'vue';

import FacilityTreeNode from './FacilityTreeNode.vue';

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  autoExpand: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);
const expandedKeys = reactive(new Set());

const facilityCount = computed(() => props.nodes.reduce(
  (total, node) => total + (node.facilityCount ?? 0),
  0,
));

function collectBranchKeys(nodes, keys) {
  nodes.forEach((node) => {
    if (!node.children?.length) return;
    keys.add(node.key);
    collectBranchKeys(node.children, keys);
  });
}

function initializeExpansion() {
  expandedKeys.clear();
  if (props.autoExpand) {
    collectBranchKeys(props.nodes, expandedKeys);
    return;
  }
  props.nodes.forEach((node) => expandedKeys.add(node.key));
}

function toggleNode(node) {
  if (expandedKeys.has(node.key)) expandedKeys.delete(node.key);
  else expandedKeys.add(node.key);
}

function expandAll() {
  expandedKeys.clear();
  collectBranchKeys(props.nodes, expandedKeys);
}

function collapseAll() {
  expandedKeys.clear();
}

watch([() => props.nodes, () => props.autoExpand], initializeExpansion, { immediate: true });
</script>

<template>
  <div class="facility-tree">
    <header class="facility-tree-header">
      <div>
        <span><Hospital :size="17" /></span>
        <p><strong>Facility directory</strong><small>{{ facilityCount.toLocaleString() }} facilities in this view</small></p>
      </div>
      <nav aria-label="Tree controls">
        <button type="button" @click="expandAll"><ChevronsUpDown :size="15" /> Expand all</button>
        <button type="button" @click="collapseAll"><ChevronsDownUp :size="15" /> Collapse all</button>
      </nav>
    </header>

    <ul class="facility-tree-roots" role="tree" aria-label="Facilities by administrative area">
      <FacilityTreeNode
        v-for="node in nodes"
        :key="node.key"
        :node="node"
        :expanded-keys="expandedKeys"
        @toggle="toggleNode"
        @select="emit('select', $event)"
      />
    </ul>
  </div>
</template>

<style scoped>
.facility-tree { min-width: 0; }
.facility-tree-header {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #edf1f6;
  background: #fbfcfe;
}
.facility-tree-header > div { display: flex; align-items: center; gap: 9px; }
.facility-tree-header > div > span { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 8px; color: #1570ef; background: #eaf2ff; }
.facility-tree-header p { margin: 0; display: flex; flex-direction: column; }
.facility-tree-header strong { color: #1d2939; font-size: 12px; }
.facility-tree-header small { margin-top: 2px; color: #98a2b3; font-size: 9px; }
.facility-tree-header nav { display: flex; gap: 7px; }
.facility-tree-header button {
  padding: 7px 9px;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #d7e1ee;
  border-radius: 7px;
  color: #475467;
  background: #fff;
  font: inherit;
  font-size: 9px;
  font-weight: 650;
  cursor: pointer;
}
.facility-tree-header button:hover { color: #1570ef; border-color: #b9d1f2; background: #f7faff; }
.facility-tree-roots { margin: 0; padding: 10px 12px 16px; }

@media (max-width: 580px) {
  .facility-tree-header { align-items: flex-start; flex-direction: column; }
  .facility-tree-header nav { width: 100%; }
  .facility-tree-header button { flex: 1; justify-content: center; }
  .facility-tree-roots { padding: 8px 5px 14px; }
}
</style>
