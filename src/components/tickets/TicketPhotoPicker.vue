<script setup>
import { ImagePlus, Trash2 } from '@lucide/vue';
import { onBeforeUnmount, ref, watch } from 'vue';

import { MAX_TICKET_PHOTOS, validatePhotoFile } from '../../services/photoUploadService.js';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  uploadingLabel: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

const input = ref(null);
const errorMessage = ref('');
const previews = ref([]);

function clearPreviews() {
  previews.value.forEach((item) => URL.revokeObjectURL(item.url));
  previews.value = [];
}

watch(
  () => props.modelValue,
  (files) => {
    clearPreviews();
    previews.value = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
  },
  { immediate: true },
);

function chooseFiles(event) {
  errorMessage.value = '';
  const selected = [...(event.target.files ?? [])];
  const next = [...props.modelValue];

  try {
    selected.forEach((file) => {
      validatePhotoFile(file);
      const duplicate = next.some((existing) =>
        existing.name === file.name
        && existing.size === file.size
        && existing.lastModified === file.lastModified);
      if (!duplicate) next.push(file);
    });
    if (next.length > MAX_TICKET_PHOTOS) {
      throw new Error(`You can attach up to ${MAX_TICKET_PHOTOS} photos.`);
    }
    emit('update:modelValue', next);
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    if (input.value) input.value.value = '';
  }
}

function removeFile(index) {
  errorMessage.value = '';
  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
}

onBeforeUnmount(clearPreviews);
</script>

<template>
  <div class="ticket-photo-picker">
    <div class="ticket-photo-heading">
      <div>
        <strong>Photos</strong>
        <span>Add up to {{ MAX_TICKET_PHOTOS }} clear images, 10 MB each.</span>
      </div>
      <label :class="{ disabled }">
        <ImagePlus :size="17" />
        Add photos
        <input
          ref="input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
          multiple
          :disabled="disabled"
          @change="chooseFiles"
        />
      </label>
    </div>

    <p v-if="errorMessage" class="ticket-photo-error">{{ errorMessage }}</p>
    <p v-if="uploadingLabel" class="ticket-photo-uploading">{{ uploadingLabel }}</p>

    <div v-if="previews.length" class="ticket-photo-previews">
      <figure v-for="(item, index) in previews" :key="`${item.file.name}-${item.file.lastModified}`">
        <img :src="item.url" :alt="`Selected image ${index + 1}: ${item.file.name}`" />
        <figcaption>
          <span>{{ item.file.name }}</span>
          <small>{{ (item.file.size / (1024 * 1024)).toFixed(1) }} MB</small>
        </figcaption>
        <button
          type="button"
          :disabled="disabled"
          :aria-label="`Remove ${item.file.name}`"
          @click="removeFile(index)"
        >
          <Trash2 :size="14" />
        </button>
      </figure>
    </div>
  </div>
</template>

<style scoped>
.ticket-photo-picker{display:grid;gap:10px}.ticket-photo-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}.ticket-photo-heading>div{display:flex;flex-direction:column;gap:2px}.ticket-photo-heading strong{color:#344054;font-size:11px}.ticket-photo-heading span{color:#667085;font-size:9px;font-weight:400}.ticket-photo-heading label{min-height:36px;padding:0 11px;display:flex;align-items:center;gap:6px;border:1px solid #b8c9e2;border-radius:8px;color:var(--blue);background:#f7faff;font-size:10px;font-weight:650;cursor:pointer}.ticket-photo-heading label.disabled{opacity:.55;cursor:wait}.ticket-photo-heading input{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}.ticket-photo-error,.ticket-photo-uploading{margin:0;padding:8px 10px;border-radius:7px;font-size:9px}.ticket-photo-error{color:#b42318;background:#fef3f2}.ticket-photo-uploading{color:#175cd3;background:#eff6ff}.ticket-photo-previews{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.ticket-photo-previews figure{position:relative;min-width:0;margin:0;overflow:hidden;border:1px solid #dce3ec;border-radius:9px;background:#fff}.ticket-photo-previews img{width:100%;aspect-ratio:1.25;display:block;object-fit:cover}.ticket-photo-previews figcaption{padding:6px;display:flex;flex-direction:column}.ticket-photo-previews figcaption span{overflow:hidden;color:#344054;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.ticket-photo-previews figcaption small{color:#98a2b3;font-size:7px}.ticket-photo-previews button{position:absolute;top:5px;right:5px;width:26px;height:26px;display:grid;place-items:center;border:0;border-radius:50%;color:#b42318;background:rgba(255,255,255,.92);box-shadow:0 2px 7px rgba(16,24,40,.18);cursor:pointer}.ticket-photo-previews button:disabled{cursor:wait}
@media(max-width:620px){.ticket-photo-heading{align-items:flex-start;flex-direction:column}.ticket-photo-heading label{width:100%;justify-content:center}.ticket-photo-previews{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
