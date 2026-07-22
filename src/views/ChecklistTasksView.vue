<script setup>
import { Camera, CheckCircle2, ChevronRight, ClipboardCheck, Clock3, CloudUpload, LoaderCircle, Play, Send, Thermometer, X } from '@lucide/vue';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import { useAuthStore } from '../stores/auth.js';

const route = useRoute();
const auth = useAuthStore();
const sidebarOpen = ref(false);
const loading = ref(true);
const submitting = ref(false);
const uploadIndex = ref('');
const error = ref('');
const message = ref('');
const tasks = ref([]);
const selected = ref(null);
const answers = ref({});
const frequency = computed(() => ({ 'daily-checklist': 'DAILY', 'weekly-checklist': 'WEEKLY', 'monthly-checklist': 'MONTHLY', 'todays-tasks': 'DAILY' }[route.params.slug] || 'DAILY'));
const title = computed(() => `${frequency.value[0]}${frequency.value.slice(1).toLowerCase()} checklist`);
const template = computed(() => selected.value?.maintenanceSchedule?.checklistTemplate);
const completed = computed(() => tasks.value.filter((task) => task.status.startsWith('COMPLETED')).length);

async function api(path, options = {}) { const response = await auth.authorizedFetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || 'Unable to complete this request.'); return payload; }
async function load() { loading.value = true; error.value = ''; selected.value = null; try { const payload = await api(`/checklists/my-tasks?frequency=${frequency.value}`); tasks.value = payload.data.tasks; } catch (loadError) { error.value = loadError.message; } finally { loading.value = false; } }
function answerFor(item) { if (!answers.value[item.id]) answers.value[item.id] = { checklistItemId: item.id, boolean: null, number: null, text: '', photos: [] }; return answers.value[item.id]; }
function openTask(task) { selected.value = task; answers.value = {}; for (const item of task.maintenanceSchedule.checklistTemplate.items) answerFor(item); }
async function startTask(task) { try { await api(`/checklists/tasks/${task.id}/start`, { method: 'POST' }); task.status = 'IN_PROGRESS'; openTask(task); } catch (startError) { error.value = startError.message; } }
async function uploadPhoto(event, item) {
  const file = event.target.files?.[0]; if (!file) return;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) { error.value = 'Cloudinary upload is not configured for this app.'; return; }
  uploadIndex.value = item.id; error.value = '';
  try { const data = new FormData(); data.append('file', file); data.append('upload_preset', uploadPreset); data.append('folder', 'feppm/checklist-evidence'); const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error?.message || 'Photo upload failed.'); answerFor(item).photos.push({ fileUrl: payload.secure_url, thumbnailUrl: payload.eager?.[0]?.secure_url, capturedAt: new Date().toISOString() }); }
  catch (uploadError) { error.value = uploadError.message; } finally { uploadIndex.value = ''; event.target.value = ''; }
}
async function submit() { submitting.value = true; error.value = ''; message.value = ''; try { const payload = await api(`/checklists/tasks/${selected.value.id}/submit`, { method: 'POST', body: JSON.stringify({ responses: Object.values(answers.value), submittedOffline: false }) }); message.value = payload.message; selected.value = null; await load(); } catch (submitError) { error.value = submitError.message; } finally { submitting.value = false; } }
watch(frequency, load); onMounted(load);
</script>

<template>
  <div class="dashboard-shell"><AppSidebar :open="sidebarOpen" @close="sidebarOpen=false" /><div class="dashboard-main"><AppHeader @toggle-menu="sidebarOpen=!sidebarOpen" />
    <main class="checklist-page manager-checklist"><header class="checklist-page__hero manager"><div><span>Facility Manager · Preventive maintenance</span><h1>{{ title }}</h1><p>{{ auth.user?.facility?.name || 'Your assigned facility' }}</p></div><div class="checklist-progress"><strong>{{ completed }}/{{ tasks.length }}</strong><span>completed this {{ frequency.toLowerCase() === 'daily' ? 'day' : frequency.toLowerCase().replace('ly','') }}</span></div></header>
      <p v-if="message" class="checklist-notice success"><CheckCircle2 :size="18" />{{ message }}</p><p v-if="error" class="checklist-notice error"><X :size="18" />{{ error }}</p>
      <div v-if="loading" class="checklist-loading"><LoaderCircle class="spin" :size="28" />Preparing your tasks…</div>
      <section v-else-if="!selected" class="manager-task-list"><div class="task-list-heading"><div><span>Current period</span><h2>Your assigned equipment checks</h2></div><b>{{ tasks.length }} tasks</b></div>
        <article v-for="task in tasks" :key="task.id"><span class="equipment-icon"><ClipboardCheck :size="23" /></span><div><strong>{{ task.equipment.equipmentType.name }}</strong><span>{{ task.equipment.assetCode }} · {{ task.maintenanceSchedule.checklistTemplate.items.length }} checks</span></div><span class="task-status" :class="`task-status--${task.status.toLowerCase()}`">{{ task.status.replaceAll('_',' ') }}</span><button v-if="!task.status.startsWith('COMPLETED')" type="button" @click="startTask(task)"><Play :size="16" />{{ task.status === 'IN_PROGRESS' ? 'Continue' : 'Start' }}<ChevronRight :size="16" /></button><CheckCircle2 v-else class="completed-icon" :size="23" /></article>
        <div v-if="!tasks.length" class="checklist-empty"><ClipboardCheck :size="36" /><strong>No {{ frequency.toLowerCase() }} task is assigned</strong><span>A published template and matching registered equipment are required before tasks appear.</span></div>
      </section>
      <section v-else class="checklist-runner"><header><button type="button" @click="selected=null">← Back to tasks</button><div><span>{{ selected.equipment.assetCode }}</span><h2>{{ template.name }}</h2><p>{{ template.items.length }} required checks · approximately {{ template.estimatedDurationMinutes || 10 }} minutes</p></div></header>
        <form @submit.prevent="submit"><article v-for="(item,index) in template.items" :key="item.id" class="answer-card"><div class="answer-number">{{ index+1 }}</div><div class="answer-content"><span class="answer-type"><Camera v-if="item.inputType.includes('PHOTO')" :size="15" /><Thermometer v-else-if="item.inputType==='TEMPERATURE'" :size="15" /><ClipboardCheck v-else :size="15" />{{ item.inputType.replaceAll('_',' ') }}<b v-if="item.isRequired">Required</b></span><h3>{{ item.title }}</h3><p v-if="item.instruction">{{ item.instruction }}</p>
          <div v-if="['YES_NO','PASS_FAIL','CHECKBOX'].includes(item.inputType)" class="choice-buttons"><button type="button" :class="{ selected: answerFor(item).boolean === true }" @click="answerFor(item).boolean=true">{{ item.inputType==='PASS_FAIL' ? 'Pass' : 'Yes' }}</button><button type="button" :class="{ selected: answerFor(item).boolean === false }" @click="answerFor(item).boolean=false">{{ item.inputType==='PASS_FAIL' ? 'Fail' : 'No' }}</button></div>
          <label v-else-if="['NUMBER','TEMPERATURE','HUMIDITY'].includes(item.inputType)" class="reading-input"><input v-model.number="answerFor(item).number" type="number" step="0.1" :required="item.isRequired" /><span>{{ item.inputType==='TEMPERATURE' ? '°C' : item.inputType==='HUMIDITY' ? '%' : '' }}</span></label>
          <textarea v-else-if="!item.inputType.includes('PHOTO')" v-model="answerFor(item).text" rows="3" :required="item.isRequired" placeholder="Enter your response" />
          <div v-if="item.inputType.includes('PHOTO') || item.evidenceRequirement==='REQUIRED'" class="photo-answer"><div class="photo-grid"><figure v-for="(photo,photoIndex) in answerFor(item).photos" :key="photo.fileUrl"><img :src="photo.fileUrl" alt="Checklist evidence" /><button type="button" @click="answerFor(item).photos.splice(photoIndex,1)"><X :size="14" /></button></figure></div><label class="photo-upload"><CloudUpload v-if="uploadIndex===item.id" class="spin" :size="21" /><Camera v-else :size="21" /><span>{{ uploadIndex===item.id ? 'Uploading…' : 'Take or upload photo' }}</span><input type="file" accept="image/*" capture="environment" :disabled="uploadIndex===item.id" @change="uploadPhoto($event,item)" /></label></div>
        </div></article><footer><div><Clock3 :size="18" /><span>Submit only after completing every required check.</span></div><button type="submit" :disabled="submitting"><LoaderCircle v-if="submitting" class="spin" :size="18" /><Send v-else :size="18" />{{ submitting ? 'Submitting…' : 'Submit checklist' }}</button></footer></form>
      </section>
    </main></div>
  </div>
</template>
