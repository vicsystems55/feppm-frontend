<script setup>
import { Camera, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, CloudUpload, LoaderCircle, Play, Send, Thermometer, X } from '@lucide/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import ChecklistCalendar from '../components/checklists/ChecklistCalendar.vue';
import { uploadChecklistPhoto } from '../services/photoUploadService.js';
import { useAuthStore } from '../stores/auth.js';

const route = useRoute();
const auth = useAuthStore();
const { t } = useI18n();
const sidebarOpen = ref(false);
const loading = ref(true);
const submitting = ref(false);
const uploadIndex = ref('');
const uploadStatus = ref('');
const error = ref('');
const message = ref('');
const tasks = ref([]);
const selected = ref(null);
const selectedDate = ref('');
const answers = ref({});
const frequency = computed(() => ({ 'daily-checklist': 'DAILY', 'weekly-checklist': 'WEEKLY', 'monthly-checklist': 'MONTHLY', 'todays-tasks': 'DAILY' }[route.params.slug] || 'DAILY'));
const title = computed(() => t(`checklistCalendar.${frequency.value.toLowerCase()}Title`));
const template = computed(() => selected.value?.maintenanceSchedule?.checklistTemplate);
const visibleTasks = computed(() => selectedDate.value
  ? tasks.value.filter((task) => taskDate(task) === selectedDate.value)
  : tasks.value);
const completed = computed(() => visibleTasks.value.filter((task) => task.status.startsWith('COMPLETED')).length);

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function lastFriday(year, month) {
  const date = new Date(year, month + 1, 0);
  date.setDate(date.getDate() - ((date.getDay() + 2) % 7));
  return date;
}

function taskDate(task) {
  if (!task.scheduledAt) return '';
  const date = new Date(task.scheduledAt);
  if (frequency.value === 'WEEKLY') {
    date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7));
  } else if (frequency.value === 'MONTHLY') {
    return dateKey(lastFriday(date.getFullYear(), date.getMonth()));
  }
  return dateKey(date);
}

async function api(path, options = {}) { const response = await auth.authorizedFetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || 'Unable to complete this request.'); return payload; }
async function load() { loading.value = true; error.value = ''; selected.value = null; try { const payload = await api(`/checklists/my-tasks?frequency=${frequency.value}`); tasks.value = payload.data.tasks; } catch (loadError) { error.value = loadError.message; } finally { loading.value = false; } }
function answerFor(item) { if (!answers.value[item.id]) answers.value[item.id] = { checklistItemId: item.id, boolean: null, number: null, text: '', photos: [] }; return answers.value[item.id]; }
function openTask(task) { selected.value = task; answers.value = {}; for (const item of task.maintenanceSchedule.checklistTemplate.items) answerFor(item); }
async function startTask(task) { try { await api(`/checklists/tasks/${task.id}/start`, { method: 'POST' }); task.status = 'IN_PROGRESS'; openTask(task); } catch (startError) { error.value = startError.message; } }
async function uploadPhoto(event, item) {
  const input = event.currentTarget;
  const selectedFiles = Array.from(input.files || []);
  if (!selectedFiles.length) return;
  const files = item.inputType === 'MULTIPLE_PHOTOS' ? selectedFiles : selectedFiles.slice(0, 1);

  uploadIndex.value = item.id; error.value = '';
  try {
    for (const [index, file] of files.entries()) {
      uploadStatus.value = files.length > 1 ? `Uploading ${index + 1} of ${files.length}…` : 'Uploading photo…';
      const photo = await uploadChecklistPhoto(file);
      if (item.inputType === 'MULTIPLE_PHOTOS') answerFor(item).photos.push(photo);
      else answerFor(item).photos = [photo];
    }
  } catch (uploadError) {
    error.value = uploadError.message;
  } finally {
    uploadIndex.value = '';
    uploadStatus.value = '';
    input.value = '';
  }
}
async function submit() { submitting.value = true; error.value = ''; message.value = ''; try { const payload = await api(`/checklists/tasks/${selected.value.id}/submit`, { method: 'POST', body: JSON.stringify({ responses: Object.values(answers.value), submittedOffline: false }) }); message.value = payload.message; selected.value = null; await load(); } catch (submitError) { error.value = submitError.message; } finally { submitting.value = false; } }
watch(frequency, () => {
  selectedDate.value = '';
  load();
});
onMounted(load);
</script>

<template>
  <div class="dashboard-shell"><AppSidebar :open="sidebarOpen" @close="sidebarOpen=false" /><div class="dashboard-main"><AppHeader @toggle-menu="sidebarOpen=!sidebarOpen" />
    <main class="checklist-page manager-checklist"><header class="checklist-page__hero manager"><div><span>{{ t('checklistCalendar.managerEyebrow') }}</span><h1>{{ title }}</h1><p>{{ auth.user?.facility?.name || t('checklistCalendar.assignedFacility') }}</p></div><div class="checklist-progress"><strong>{{ completed }}/{{ visibleTasks.length }}</strong><span>{{ t('checklistCalendar.completedInPeriod') }}</span></div></header>
      <p v-if="message" class="checklist-notice success"><CheckCircle2 :size="18" />{{ message }}</p><p v-if="error" class="checklist-notice error"><X :size="18" />{{ error }}</p>
      <div v-if="loading" class="checklist-loading"><LoaderCircle class="spin" :size="28" />Preparing your tasks…</div>
      <section v-else-if="!selected" class="manager-task-list"><ChecklistCalendar :selected-date="selectedDate" :frequency="frequency" :tasks="tasks" @update:selected-date="selectedDate = $event" /><div class="task-list-heading"><div><span>{{ t('checklistCalendar.selectedPeriod') }}</span><h2>{{ t('checklistCalendar.assignedChecks') }}</h2></div><b>{{ t('checklistCalendar.taskCount', { count: visibleTasks.length }) }}</b></div>
        <article v-for="task in visibleTasks" :key="task.id"><span class="equipment-icon"><ClipboardCheck :size="23" /></span><div><strong>{{ task.equipment.equipmentType.name }}</strong><span>{{ task.equipment.assetCode }} · {{ t('checklistCalendar.checkCount', { count: task.maintenanceSchedule.checklistTemplate.items.length }) }}</span></div><span class="task-status" :class="`task-status--${task.status.toLowerCase()}`">{{ task.status.replaceAll('_',' ') }}</span><button v-if="!task.status.startsWith('COMPLETED')" type="button" @click="startTask(task)"><Play :size="16" />{{ task.status === 'IN_PROGRESS' ? t('checklistCalendar.continue') : t('checklistCalendar.start') }}<ChevronRight :size="16" /></button><CheckCircle2 v-else class="completed-icon" :size="23" /></article>
        <div v-if="!visibleTasks.length" class="checklist-empty"><ClipboardCheck :size="36" /><strong>{{ t('checklistCalendar.noTaskForDate') }}</strong><span>{{ t('checklistCalendar.noTaskHint') }}</span></div>
      </section>
      <section v-else class="checklist-runner"><header><button type="button" @click="selected=null">← Back to tasks</button><div><span>{{ selected.equipment.assetCode }}</span><h2>{{ template.name }}</h2><p>{{ template.items.length }} required checks · approximately {{ template.estimatedDurationMinutes || 10 }} minutes</p></div></header>
        <form @submit.prevent="submit"><article v-for="(item,index) in template.items" :key="item.id" class="answer-card"><div class="answer-number">{{ index+1 }}</div><div class="answer-content"><span class="answer-type"><Camera v-if="item.inputType.includes('PHOTO')" :size="15" /><Thermometer v-else-if="item.inputType==='TEMPERATURE'" :size="15" /><ClipboardCheck v-else :size="15" />{{ item.inputType.replaceAll('_',' ') }}<b v-if="item.isRequired">Required</b></span><h3>{{ item.title }}</h3><p v-if="item.instruction">{{ item.instruction }}</p>
          <div v-if="['YES_NO','PASS_FAIL','CHECKBOX'].includes(item.inputType)" class="choice-buttons"><button type="button" :class="{ selected: answerFor(item).boolean === true }" @click="answerFor(item).boolean=true">{{ item.inputType==='PASS_FAIL' ? 'Pass' : 'Yes' }}</button><button type="button" :class="{ selected: answerFor(item).boolean === false }" @click="answerFor(item).boolean=false">{{ item.inputType==='PASS_FAIL' ? 'Fail' : 'No' }}</button></div>
          <label v-else-if="['NUMBER','TEMPERATURE','HUMIDITY'].includes(item.inputType)" class="reading-input"><input v-model.number="answerFor(item).number" type="number" step="0.1" :required="item.isRequired" /><span>{{ item.inputType==='TEMPERATURE' ? '°C' : item.inputType==='HUMIDITY' ? '%' : '' }}</span></label>
          <textarea v-else-if="!item.inputType.includes('PHOTO')" v-model="answerFor(item).text" rows="3" :required="item.isRequired" placeholder="Enter your response" />
          <div v-if="item.inputType.includes('PHOTO') || item.evidenceRequirement==='REQUIRED'" class="photo-answer"><div class="photo-grid"><figure v-for="(photo,photoIndex) in answerFor(item).photos" :key="photo.fileUrl"><img :src="photo.thumbnailUrl || photo.fileUrl" alt="Checklist evidence" /><button type="button" aria-label="Remove photo" @click="answerFor(item).photos.splice(photoIndex,1)"><X :size="14" /></button></figure></div><label class="photo-upload" :class="{ uploading: uploadIndex===item.id }"><CloudUpload v-if="uploadIndex===item.id" class="spin" :size="21" /><Camera v-else :size="21" /><span>{{ uploadIndex===item.id ? uploadStatus : item.inputType==='MULTIPLE_PHOTOS' ? 'Take or upload photos' : answerFor(item).photos.length ? 'Replace photo' : 'Take or upload photo' }}</span><small v-if="uploadIndex!==item.id">JPG, PNG, WebP or HEIC · maximum 10 MB</small><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" :multiple="item.inputType==='MULTIPLE_PHOTOS'" :disabled="Boolean(uploadIndex)" @change="uploadPhoto($event,item)" /></label></div>
        </div></article><footer><div><Clock3 :size="18" /><span>Submit only after completing every required check.</span></div><button type="submit" :disabled="submitting || Boolean(uploadIndex)"><LoaderCircle v-if="submitting" class="spin" :size="18" /><Send v-else :size="18" />{{ submitting ? 'Submitting…' : uploadIndex ? 'Photo upload in progress' : 'Submit checklist' }}</button></footer></form>
      </section>
    </main></div>
  </div>
</template>
