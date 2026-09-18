<script setup>
import { computed, onMounted, watch } from 'vue';
import { ChevronLeft, ChevronRight } from '@lucide/vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  frequency: { type: String, required: true },
  tasks: { type: Array, default: () => [] },
  selectedDate: { type: String, default: '' },
});
const emit = defineEmits(['update:selectedDate']);
const { locale, t } = useI18n();

const weekdays = computed(() => Array.from({ length: 7 }, (_, index) => (
  new Intl.DateTimeFormat(locale.value, { weekday: 'short' }).format(new Date(2024, 0, 7 + index))
)));
const viewDate = new Date();
viewDate.setDate(1);
const viewMonth = defineModel('viewMonth', { type: String, default: '' });

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function lastFriday(year, month) {
  const date = new Date(year, month + 1, 0);
  date.setDate(date.getDate() - ((date.getDay() + 2) % 7));
  return date;
}

function firstSelectableDate() {
  const today = new Date();
  if (props.frequency === 'DAILY') return dateKey(today);
  if (props.frequency === 'WEEKLY') {
    const friday = new Date(today);
    friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
    return dateKey(friday);
  }
  return dateKey(lastFriday(today.getFullYear(), today.getMonth()));
}

function taskDate(task) {
  if (!task.scheduledAt) return '';
  const date = new Date(task.scheduledAt);
  if (props.frequency === 'WEEKLY') {
    date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7));
  } else if (props.frequency === 'MONTHLY') {
    return dateKey(lastFriday(date.getFullYear(), date.getMonth()));
  }
  return dateKey(date);
}

function isSelectable(date) {
  if (props.frequency === 'DAILY') return true;
  if (props.frequency === 'WEEKLY') return date.getDay() === 5;
  return dateKey(date) === dateKey(lastFriday(date.getFullYear(), date.getMonth()));
}

function shiftMonth(amount) {
  const next = parseDateKey(viewMonth.value || dateKey(viewDate));
  next.setMonth(next.getMonth() + amount);
  viewMonth.value = dateKey(next).slice(0, 7);
}

function chooseDate(date) {
  if (!isSelectable(date)) return;
  emit('update:selectedDate', dateKey(date));
}

function statusForDate(date) {
  const matching = props.tasks.filter((task) => taskDate(task) === dateKey(date));
  if (matching.some((task) => task.status.startsWith('COMPLETED'))) return 'completed';
  if (matching.some((task) => task.status === 'IN_PROGRESS')) return 'in-progress';
  if (matching.length) return 'pending';
  return '';
}

const monthTitle = computed(() => {
  const date = parseDateKey(`${viewMonth.value || dateKey(viewDate)}-01`);
  return new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }).format(date);
});
const days = computed(() => {
  const first = parseDateKey(`${viewMonth.value || dateKey(viewDate)}-01`);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
});

watch(() => props.frequency, () => {
  if (!props.selectedDate) emit('update:selectedDate', firstSelectableDate());
});
onMounted(() => {
  viewMonth.value = viewMonth.value || dateKey(viewDate).slice(0, 7);
  if (!props.selectedDate) emit('update:selectedDate', firstSelectableDate());
});
</script>

<template>
  <section class="checklist-calendar" :aria-label="t('checklistCalendar.calendarLabel')">
    <header class="checklist-calendar__header">
      <div>
        <span>{{ t(`checklistCalendar.${frequency.toLowerCase()}`) }}</span>
        <h2>{{ monthTitle }}</h2>
      </div>
      <div class="checklist-calendar__navigation">
        <button type="button" :aria-label="t('checklistCalendar.previousMonth')" @click="shiftMonth(-1)"><ChevronLeft :size="18" /></button>
        <button type="button" :aria-label="t('checklistCalendar.nextMonth')" @click="shiftMonth(1)"><ChevronRight :size="18" /></button>
      </div>
    </header>
    <div class="checklist-calendar__weekdays"><span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span></div>
    <div class="checklist-calendar__grid">
      <button
        v-for="date in days"
        :key="dateKey(date)"
        type="button"
        class="checklist-calendar__day"
        :class="{
          'is-other-month': date.getMonth() !== parseDateKey(`${viewMonth || dateKey(viewDate)}-01`).getMonth(),
          'is-disabled': !isSelectable(date),
          'is-selected': selectedDate === dateKey(date),
          'is-today': dateKey(date) === dateKey(new Date()),
        }"
        :disabled="!isSelectable(date)"
        @click="chooseDate(date)"
      >
        <span>{{ date.getDate() }}</span>
        <i v-if="statusForDate(date)" :class="`status-${statusForDate(date)}`" :title="t(`checklistCalendar.${statusForDate(date)}`)" />
      </button>
    </div>
    <footer class="checklist-calendar__legend">
      <span><i class="status-completed" />{{ t('checklistCalendar.completed') }}</span>
      <span><i class="status-in-progress" />{{ t('checklistCalendar.inProgress') }}</span>
      <span><i class="status-pending" />{{ t('checklistCalendar.pending') }}</span>
    </footer>
  </section>
</template>

<style scoped>
.checklist-calendar { padding: 20px; border: 1px solid var(--border); border-radius: 16px; background: #fff; box-shadow: 0 8px 24px rgba(16,24,40,.05); }
.checklist-calendar__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 17px; }
.checklist-calendar__header span { color: var(--green); font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
.checklist-calendar__header h2 { margin: 3px 0 0; color: var(--ink); font-size: 20px; line-height: 1.3; text-transform: capitalize; }
.checklist-calendar__navigation { display: flex; gap: 6px; }
.checklist-calendar__navigation button { width: 34px; height: 34px; display: grid; place-items: center; border: 1px solid var(--border); border-radius: 8px; color: var(--ink); background: #fff; cursor: pointer; }
.checklist-calendar__navigation button:hover { color: var(--blue); border-color: #a9c9f2; background: var(--blue-soft); }
.checklist-calendar__weekdays, .checklist-calendar__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; }
.checklist-calendar__weekdays { margin-bottom: 5px; color: var(--muted); font-size: 10px; font-weight: 700; text-align: center; text-transform: uppercase; }
.checklist-calendar__day { position: relative; min-height: 47px; padding: 7px 5px; display: flex; align-items: flex-start; justify-content: center; border: 1px solid transparent; border-radius: 9px; color: var(--ink); background: #f8fafc; font-size: 13px; cursor: pointer; }
.checklist-calendar__day:hover:not(:disabled), .checklist-calendar__day.is-selected { border-color: var(--blue); background: var(--blue-soft); }
.checklist-calendar__day.is-today span { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: var(--blue); }
.checklist-calendar__day.is-selected.is-today span { background: var(--green); }
.checklist-calendar__day.is-other-month { opacity: .35; }
.checklist-calendar__day.is-disabled { color: #98a2b3; background: #f2f4f7; cursor: not-allowed; }
.checklist-calendar__day i, .checklist-calendar__legend i { width: 6px; height: 6px; display: block; border-radius: 50%; }
.checklist-calendar__day i { position: absolute; right: 7px; bottom: 7px; }
.status-completed { background: var(--green); }.status-in-progress { background: var(--orange); }.status-pending { background: var(--blue); }
.checklist-calendar__legend { margin-top: 15px; display: flex; flex-wrap: wrap; gap: 12px; color: var(--muted); font-size: 10px; }
.checklist-calendar__legend span { display: inline-flex; align-items: center; gap: 5px; }
@media (max-width: 520px) { .checklist-calendar { padding: 14px; }.checklist-calendar__day { min-height: 39px; font-size: 12px; }.checklist-calendar__legend { gap: 8px; } }
</style>
