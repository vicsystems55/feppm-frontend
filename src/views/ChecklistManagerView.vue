<script setup>
import { Archive, Check, ChevronDown, ChevronUp, ClipboardCheck, LoaderCircle, Plus, Save, Send, Trash2, X } from '@lucide/vue';
import { onMounted, ref } from 'vue';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const message = ref('');
const templates = ref([]);
const equipmentTypes = ref([]);
const editingId = ref(null);
const formOpen = ref(false);
const inputTypes = [['YES_NO','Yes / No'],['PASS_FAIL','Pass / Fail'],['TEMPERATURE','Temperature'],['NUMBER','Number'],['SHORT_TEXT','Short text'],['LONG_TEXT','Long text'],['PHOTO','Photo'],['MULTIPLE_PHOTOS','Multiple photos']];

const blankQuestion = () => ({ title: '', instruction: '', inputType: 'YES_NO', isRequired: true, evidenceRequirement: 'NONE' });
const blankForm = () => ({ name: '', version: '1.0', frequencyType: 'DAILY', equipmentTypeId: '', estimatedDurationMinutes: 10, items: [blankQuestion()] });
const form = ref(blankForm());

async function api(path, options = {}) {
  const response = await auth.authorizedFetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Unable to complete this request.');
  return payload;
}

async function load() {
  loading.value = true; error.value = '';
  try {
    const [templatePayload, typePayload] = await Promise.all([api('/checklists/templates'), api('/checklists/equipment-types')]);
    templates.value = templatePayload.data.templates;
    equipmentTypes.value = typePayload.data.equipmentTypes;
  } catch (loadError) { error.value = loadError.message; }
  finally { loading.value = false; }
}

function openNew() { editingId.value = null; form.value = blankForm(); form.value.equipmentTypeId = equipmentTypes.value[0]?.id || ''; formOpen.value = true; message.value = ''; }
function edit(template) {
  editingId.value = template.id;
  form.value = { name: template.name, version: template.version, frequencyType: template.frequencyType, equipmentTypeId: template.equipmentTypeId, estimatedDurationMinutes: template.estimatedDurationMinutes || 10, items: template.items.map((item) => ({ title: item.title, instruction: item.instruction || '', inputType: item.inputType, isRequired: item.isRequired, evidenceRequirement: item.evidenceRequirement })) };
  formOpen.value = true; message.value = '';
}
function addQuestion() { form.value.items.push(blankQuestion()); }
function removeQuestion(index) { if (form.value.items.length > 1) form.value.items.splice(index, 1); }
function move(index, direction) { const target = index + direction; if (target < 0 || target >= form.value.items.length) return; const [item] = form.value.items.splice(index, 1); form.value.items.splice(target, 0, item); }
function typeChanged(item) { if (['PHOTO','MULTIPLE_PHOTOS'].includes(item.inputType)) item.evidenceRequirement = 'REQUIRED'; }

async function save() {
  saving.value = true; error.value = ''; message.value = '';
  try {
    const path = editingId.value ? `/checklists/templates/${editingId.value}` : '/checklists/templates';
    const payload = await api(path, { method: editingId.value ? 'PUT' : 'POST', body: JSON.stringify(form.value) });
    message.value = payload.message; formOpen.value = false; await load();
  } catch (saveError) { error.value = saveError.message; }
  finally { saving.value = false; }
}
async function action(template, actionName) {
  error.value = ''; message.value = '';
  try { const payload = await api(`/checklists/templates/${template.id}/${actionName}`, { method: 'POST' }); message.value = payload.message; await load(); }
  catch (actionError) { error.value = actionError.message; }
}
onMounted(load);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main"><AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="checklist-page">
        <header class="checklist-page__hero"><div><span>Super Admin · Maintenance configuration</span><h1>Checklist templates</h1><p>Control the daily, weekly, and monthly questions delivered to Facility Managers.</p></div><button type="button" @click="openNew"><Plus :size="18" />New template</button></header>
        <p v-if="message" class="checklist-notice success"><Check :size="18" />{{ message }}</p>
        <p v-if="error" class="checklist-notice error"><X :size="18" />{{ error }}</p>
        <div v-if="loading" class="checklist-loading"><LoaderCircle class="spin" :size="28" />Loading templates…</div>
        <section v-else class="template-grid">
          <article v-for="template in templates" :key="template.id" class="template-card">
            <header><span :class="`status-${template.status.toLowerCase()}`">{{ template.status === 'INACTIVE' ? 'Draft' : template.status }}</span><b>{{ template.frequencyType }}</b></header>
            <ClipboardCheck :size="28" /><h2>{{ template.name }}</h2><p>{{ template.equipmentType.name }}</p>
            <div><span>Version {{ template.version }}</span><span>{{ template.items.length }} questions</span><span>{{ template._count.schedules }} schedules</span></div>
            <footer><button v-if="template.status === 'INACTIVE'" type="button" @click="edit(template)"><Save :size="15" />Edit</button><button v-if="template.status === 'INACTIVE'" class="primary" type="button" @click="action(template,'publish')"><Send :size="15" />Publish</button><button v-if="template.status === 'ACTIVE'" type="button" @click="action(template,'archive')"><Archive :size="15" />Archive</button></footer>
          </article>
          <div v-if="!templates.length" class="checklist-empty"><ClipboardCheck :size="34" /><strong>No checklist templates yet</strong><span>Create one here or run the cold-chain starter-template seed.</span></div>
        </section>
      </main>
    </div>
    <div v-if="formOpen" class="checklist-modal" @click.self="formOpen = false"><form @submit.prevent="save">
      <header><div><span>{{ editingId ? 'Edit draft' : 'New template' }}</span><h2>Checklist configuration</h2></div><button type="button" @click="formOpen = false"><X :size="20" /></button></header>
      <div class="template-fields"><label><span>Name</span><input v-model="form.name" required placeholder="Cold Chain Daily Care" /></label><label><span>Equipment type</span><select v-model="form.equipmentTypeId" required :disabled="editingId"><option value="" disabled>Select equipment type</option><option v-for="type in equipmentTypes" :key="type.id" :value="type.id">{{ type.category.name }} · {{ type.name }}</option></select></label><label><span>Frequency</span><select v-model="form.frequencyType"><option>DAILY</option><option>WEEKLY</option><option>MONTHLY</option></select></label><label><span>Version</span><input v-model="form.version" required /></label><label><span>Estimated minutes</span><input v-model.number="form.estimatedDurationMinutes" type="number" min="1" /></label></div>
      <section class="question-builder"><div class="question-builder__title"><div><span>Questions</span><strong>{{ form.items.length }} configured</strong></div><button type="button" @click="addQuestion"><Plus :size="16" />Add question</button></div>
        <article v-for="(item,index) in form.items" :key="index" class="question-editor"><b>{{ index + 1 }}</b><div><label><span>Question</span><input v-model="item.title" required /></label><label><span>Instruction</span><textarea v-model="item.instruction" rows="2" /></label><div class="question-options"><label><span>Answer type</span><select v-model="item.inputType" @change="typeChanged(item)"><option v-for="type in inputTypes" :key="type[0]" :value="type[0]">{{ type[1] }}</option></select></label><label class="check-option"><input v-model="item.isRequired" type="checkbox" />Required</label><label class="check-option"><input v-model="item.evidenceRequirement" type="checkbox" true-value="REQUIRED" false-value="NONE" />Photo required</label></div></div><aside><button type="button" :disabled="index===0" @click="move(index,-1)"><ChevronUp :size="16" /></button><button type="button" :disabled="index===form.items.length-1" @click="move(index,1)"><ChevronDown :size="16" /></button><button type="button" :disabled="form.items.length===1" @click="removeQuestion(index)"><Trash2 :size="16" /></button></aside></article>
      </section>
      <footer class="modal-actions"><button type="button" @click="formOpen=false">Cancel</button><button class="primary" type="submit" :disabled="saving"><LoaderCircle v-if="saving" class="spin" :size="17" /><Save v-else :size="17" />{{ saving ? 'Saving…' : 'Save draft' }}</button></footer>
    </form></div>
  </div>
</template>
