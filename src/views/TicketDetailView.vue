<script setup>
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  CornerUpRight,
  History,
  Info,
  LoaderCircle,
  MapPin,
  MessageSquareText,
  Package,
  Send,
  ShieldAlert,
  Tag,
  UserRoundCheck,
  Wrench,
} from '@lucide/vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AppHeader from '../components/layout/AppHeader.vue';
import AppSidebar from '../components/layout/AppSidebar.vue';
import TicketPhotoPicker from '../components/tickets/TicketPhotoPicker.vue';
import {
  allowedStatusTransitions,
  escalationNext,
  formatTicketDate,
  labelFor,
  personName,
  ticketCategories,
  ticketStatusLabel,
  ticketStatuses,
  ticketTypes,
} from '../config/tickets.js';
import { ticketApi } from '../services/ticketService.js';
import { uploadTicketPhotos } from '../services/photoUploadService.js';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);
const loading = ref(true);
const actionLoading = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const ticket = ref(null);
const options = ref({ assignees: [] });
const statusForm = reactive({ status: '', comment: '', resolutionSummary: '' });
const assignmentForm = reactive({ assignedToId: '', reason: '' });
const escalationReason = ref('');
const commentForm = reactive({ body: '', isInternal: false });
const commentAttachmentFiles = ref([]);
const commentUploadLabel = ref('');

const permissions = computed(() => new Set(auth.user?.permissions ?? []));
const canUpdate = computed(() => permissions.value.has('tickets.update'));
const canAssign = computed(() => permissions.value.has('tickets.assign'));
const canResolve = computed(() => permissions.value.has('tickets.resolve'));
const canEscalate = computed(() => permissions.value.has('tickets.escalate'));
const isFacilityManager = computed(() => auth.user?.roles?.some((role) => role.key === 'FACILITY_MANAGER'));
const nextLevel = computed(() => escalationNext[ticket.value?.escalationLevel] ?? null);
const transitions = computed(() => (allowedStatusTransitions[ticket.value?.status] ?? [])
  .filter((status) => canResolve.value || !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(status)));
const activeAssignment = computed(() => ticket.value?.assignments?.find((assignment) => !assignment.endedAt));
const responseSlaState = computed(() => slaState(ticket.value?.firstResponseAt, ticket.value?.responseDueAt));
const resolutionSlaState = computed(() => slaState(ticket.value?.resolvedAt, ticket.value?.resolutionDueAt));

function slaState(completedAt, dueAt) {
  if (!dueAt) return { label: 'Not configured', tone: 'neutral' };
  if (completedAt) {
    return new Date(completedAt) <= new Date(dueAt)
      ? { label: 'Met', tone: 'green' }
      : { label: 'Breached', tone: 'red' };
  }
  const minutes = Math.round((new Date(dueAt).getTime() - Date.now()) / 60000);
  if (minutes < 0) return { label: `Overdue by ${durationLabel(Math.abs(minutes))}`, tone: 'red' };
  return { label: `${durationLabel(minutes)} remaining`, tone: minutes <= 60 ? 'orange' : 'blue' };
}

function durationLabel(minutes) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr`;
  return `${Math.round(minutes / 1440)} days`;
}

async function loadTicket() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const data = await ticketApi.get(auth, route.params.id);
    ticket.value = data.ticket;
    statusForm.status = transitions.value[0] ?? '';
    assignmentForm.assignedToId = ticket.value.assignedTo?.id ?? '';
    if (canAssign.value) {
      const optionData = await ticketApi.options(auth, ticket.value.organization.id);
      options.value = optionData;
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

async function perform(actionName, operation, message) {
  actionLoading.value = actionName;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    const data = await operation();
    if (data.ticket) ticket.value = data.ticket;
    successMessage.value = message;
    return data;
  } catch (error) {
    errorMessage.value = error.message;
    return null;
  } finally {
    actionLoading.value = '';
  }
}

async function changeStatus() {
  const nextStatus = statusForm.status;
  const data = await perform(
    'status',
    () => ticketApi.changeStatus(auth, ticket.value.id, statusForm),
    `Ticket moved to ${ticketStatusLabel(nextStatus)}.`,
  );
  if (data) {
    statusForm.comment = '';
    statusForm.resolutionSummary = '';
    statusForm.status = transitions.value[0] ?? '';
  }
}

async function assign() {
  const data = await perform(
    'assign',
    () => ticketApi.assign(auth, ticket.value.id, assignmentForm),
    'Ticket assignment updated.',
  );
  if (data) assignmentForm.reason = '';
}

async function escalate() {
  const target = nextLevel.value;
  const data = await perform(
    'escalate',
    () => ticketApi.escalate(auth, ticket.value.id, {
      toLevel: target,
      reason: escalationReason.value,
    }),
    `Ticket escalated to ${target}.`,
  );
  if (data) escalationReason.value = '';
}

async function addComment() {
  const data = await perform(
    'comment',
    async () => {
      const attachments = await uploadTicketPhotos(
        commentAttachmentFiles.value,
        (completed, total) => {
          commentUploadLabel.value = `Uploaded ${completed} of ${total} photos.`;
        },
      );
      return ticketApi.comment(auth, ticket.value.id, { ...commentForm, attachments });
    },
    commentForm.isInternal ? 'Internal note added.' : 'Comment added.',
  );
  if (data) {
    commentForm.body = '';
    commentForm.isInternal = false;
    commentAttachmentFiles.value = [];
    commentUploadLabel.value = '';
    await loadTicket();
  }
}

onMounted(loadTicket);
</script>

<template>
  <div class="dashboard-shell">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="dashboard-main">
      <AppHeader @toggle-menu="sidebarOpen = !sidebarOpen" />
      <main class="ticket-detail-page">
        <button class="ticket-back" type="button" @click="router.push('/modules/issues')"><ArrowLeft :size="17" />Back to ticket queue</button>

        <p v-if="errorMessage" class="detail-alert detail-alert--error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="detail-alert detail-alert--success">{{ successMessage }}</p>

        <div v-if="loading" class="detail-loading"><LoaderCircle class="spin" :size="25" />Loading ticket…</div>
        <template v-else-if="ticket">
          <section class="ticket-detail-hero">
            <div class="ticket-detail-title">
              <div class="ticket-number-line">
                <span>{{ ticket.ticketNumber }}</span>
                <b class="priority-pill" :class="`priority-pill--${ticket.priority}`">P{{ ticket.priority }}</b>
                <b class="status-pill" :class="`status-pill--${ticket.status.toLowerCase()}`">{{ ticketStatusLabel(ticket.status) }}</b>
              </div>
              <h1>{{ ticket.title }}</h1>
              <p>Reported by {{ personName(ticket.reportedBy) }} on {{ formatTicketDate(ticket.reportedAt) }}</p>
            </div>
            <div class="escalation-level">
              <span>Escalation level</span>
              <strong>{{ ticket.escalationLevel }}</strong>
            </div>
          </section>

          <section class="ticket-sla-grid">
            <article>
              <span><Clock3 :size="19" /></span>
              <div>
                <small class="deadline-label">
                  Response deadline
                  <button type="button" class="deadline-help" aria-label="What is the response deadline?">
                    <Info :size="13" />
                    <span role="tooltip">The target time for a support officer to acknowledge or take ownership of this ticket. If the deadline passes, the response target is marked as breached.</span>
                  </button>
                </small>
                <strong :class="`sla-${responseSlaState.tone}`">{{ responseSlaState.label }}</strong>
                <em>Target date: {{ formatTicketDate(ticket.responseDueAt) }}</em>
              </div>
            </article>
            <article>
              <span><ShieldAlert :size="19" /></span>
              <div>
                <small class="deadline-label">
                  Resolution deadline
                  <button type="button" class="deadline-help" aria-label="What is the resolution deadline?">
                    <Info :size="13" />
                    <span role="tooltip">The target time for resolving this ticket, calculated from its priority. If it remains unresolved after this date, the resolution target is breached and the issue may be escalated.</span>
                  </button>
                </small>
                <strong :class="`sla-${resolutionSlaState.tone}`">{{ resolutionSlaState.label }}</strong>
                <em>Target date: {{ formatTicketDate(ticket.resolutionDueAt) }}</em>
              </div>
            </article>
            <article><span><UserRoundCheck :size="19" /></span><div><small>Current owner</small><strong>{{ personName(ticket.assignedTo) }}</strong><em>{{ activeAssignment?.reason ?? 'No assignment note' }}</em></div></article>
          </section>

          <div class="ticket-detail-layout">
            <div class="ticket-detail-main">
              <section class="ticket-panel issue-overview">
                <header><div><span>Issue record</span><h2>Description and context</h2></div><MessageSquareText :size="21" /></header>
                <p class="issue-description">{{ ticket.faultDescription }}</p>
                <div class="issue-metadata">
                  <div><Tag :size="17" /><span>Type</span><strong>{{ labelFor(ticketTypes, ticket.type) }}</strong></div>
                  <div><AlertTriangle :size="17" /><span>Category</span><strong>{{ labelFor(ticketCategories, ticket.category) }}</strong></div>
                  <div><Building2 :size="17" /><span>Facility</span><strong>{{ ticket.facility?.name ?? 'Not facility-specific' }}</strong></div>
                  <div><Package :size="17" /><span>Equipment</span><strong>{{ ticket.equipment?.assetCode ?? 'No equipment linked' }}</strong></div>
                  <div><MapPin :size="17" /><span>Administrative scope</span><strong>{{ ticket.administrativeUnit?.name ?? ticket.organization.name }}</strong></div>
                  <div><Wrench :size="17" /><span>Maintenance task</span><strong>{{ ticket.maintenanceTask?.id ? `Linked · ${ticket.maintenanceTask.status}` : 'Not linked' }}</strong></div>
                </div>
                <div v-if="ticket.attachments?.length" class="attachment-section">
                  <span>Issue photos</span>
                  <div class="attachment-gallery">
                    <a
                      v-for="attachment in ticket.attachments"
                      :key="attachment.id"
                      :href="attachment.fileUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      :title="attachment.fileName"
                    >
                      <img :src="attachment.thumbnailUrl || attachment.fileUrl" :alt="attachment.fileName" />
                      <small>{{ attachment.fileName }}</small>
                    </a>
                  </div>
                </div>
                <div v-if="ticket.resolutionSummary" class="resolution-box"><CheckCircle2 :size="21" /><div><span>Resolution summary</span><p>{{ ticket.resolutionSummary }}</p></div></div>
              </section>

              <section class="ticket-panel conversation-panel">
                <header><div><span>Conversation</span><h2>Ticket comments</h2></div><b>{{ ticket.comments.length }}</b></header>
                <div v-if="!ticket.comments.length" class="conversation-empty">No comments have been added yet.</div>
                <div v-else class="comment-list">
                  <article v-for="comment in ticket.comments" :key="comment.id" :class="{ internal: comment.isInternal }">
                    <span><CircleUserRound :size="20" /></span>
                    <div>
                      <header><strong>{{ personName(comment.author) }}</strong><b v-if="comment.isInternal">Internal note</b><time>{{ formatTicketDate(comment.createdAt) }}</time></header>
                      <p>{{ comment.body }}</p>
                      <div v-if="comment.attachments?.length" class="comment-attachments">
                        <a
                          v-for="attachment in comment.attachments"
                          :key="attachment.id"
                          :href="attachment.fileUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          :title="attachment.fileName"
                        >
                          <img :src="attachment.thumbnailUrl || attachment.fileUrl" :alt="attachment.fileName" />
                        </a>
                      </div>
                    </div>
                  </article>
                </div>
                <form v-if="canUpdate" class="comment-composer" @submit.prevent="addComment">
                  <textarea v-model.trim="commentForm.body" required minlength="1" maxlength="10000" rows="3" placeholder="Add an update, question or response…" />
                  <TicketPhotoPicker
                    v-model="commentAttachmentFiles"
                    :disabled="actionLoading === 'comment'"
                    :uploading-label="commentUploadLabel"
                  />
                  <footer>
                    <label v-if="!isFacilityManager"><input v-model="commentForm.isInternal" type="checkbox" /> Internal support note</label>
                    <button type="submit" :disabled="actionLoading === 'comment'"><LoaderCircle v-if="actionLoading === 'comment'" class="spin" :size="16" /><Send v-else :size="16" />Send comment</button>
                  </footer>
                </form>
              </section>

              <section class="ticket-panel history-panel">
                <header><div><span>Audit trail</span><h2>Ticket history</h2></div><History :size="21" /></header>
                <div class="timeline">
                  <article v-for="activity in ticket.activities" :key="activity.id">
                    <i></i>
                    <div><strong>{{ activity.action.replaceAll('_', ' ') }}</strong><p>{{ activity.comment || `${personName(activity.user)} updated this ticket.` }}</p><time>{{ formatTicketDate(activity.createdAt) }}</time></div>
                  </article>
                </div>
              </section>
            </div>

            <aside class="ticket-actions">
              <section v-if="canUpdate && transitions.length" class="ticket-panel action-card">
                <header><span>Workflow</span><h2>Change status</h2></header>
                <form @submit.prevent="changeStatus">
                  <label>Next status<select v-model="statusForm.status" required><option v-for="status in transitions" :key="status" :value="status">{{ ticketStatusLabel(status) }}</option></select></label>
                  <label v-if="statusForm.status === 'RESOLVED'">Resolution summary<textarea v-model.trim="statusForm.resolutionSummary" required minlength="10" rows="4" placeholder="Explain what was done and the outcome." /></label>
                  <label>Activity note<textarea v-model.trim="statusForm.comment" rows="3" placeholder="Optional note for the audit trail." /></label>
                  <button type="submit" :disabled="actionLoading === 'status'"><LoaderCircle v-if="actionLoading === 'status'" class="spin" :size="16" /><ChevronRight v-else :size="16" />Update status</button>
                </form>
              </section>

              <section v-if="canAssign" class="ticket-panel action-card">
                <header><span>Ownership</span><h2>Assign ticket</h2></header>
                <form @submit.prevent="assign">
                  <label>Responsible officer<select v-model="assignmentForm.assignedToId" required><option disabled value="">Select an officer</option><option v-for="person in options.assignees" :key="person.id" :value="person.id">{{ personName(person) }} · {{ person.roles[0]?.role.name }}</option></select></label>
                  <label>Assignment reason<textarea v-model.trim="assignmentForm.reason" rows="3" placeholder="Why this person is responsible." /></label>
                  <button type="submit" :disabled="actionLoading === 'assign'"><LoaderCircle v-if="actionLoading === 'assign'" class="spin" :size="16" /><UserRoundCheck v-else :size="16" />Save assignment</button>
                </form>
              </section>

              <section v-if="canEscalate && nextLevel" class="ticket-panel action-card action-card--escalate">
                <header><span>Escalation</span><h2>Escalate to {{ nextLevel }}</h2></header>
                <form @submit.prevent="escalate">
                  <label>Reason<textarea v-model.trim="escalationReason" required minlength="10" rows="4" placeholder="Explain why this issue requires higher-level intervention." /></label>
                  <button type="submit" :disabled="actionLoading === 'escalate'"><LoaderCircle v-if="actionLoading === 'escalate'" class="spin" :size="16" /><CornerUpRight v-else :size="16" />Escalate ticket</button>
                </form>
              </section>
            </aside>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.ticket-detail-page{min-height:calc(100vh - 72px);padding:22px 24px 40px;background:#f5f7fa}.ticket-back{max-width:1450px;margin:0 auto 12px;padding:5px 0;display:flex;align-items:center;gap:7px;border:0;color:var(--blue);background:transparent;font-size:12px;font-weight:650;cursor:pointer}.detail-alert{max-width:1450px;margin:0 auto 12px;padding:11px 13px;border-radius:9px;font-size:12px}.detail-alert--error{border:1px solid #fecdca;color:#b42318;background:#fef3f2}.detail-alert--success{border:1px solid #a6f4c5;color:#067647;background:#ecfdf3}.detail-loading{min-height:500px;display:flex;align-items:center;justify-content:center;gap:9px;color:var(--muted)}.ticket-detail-hero{max-width:1450px;margin:0 auto 12px;padding:22px 24px;display:flex;align-items:center;justify-content:space-between;gap:22px;border:1px solid var(--border);border-radius:15px;background:#fff}.ticket-number-line{display:flex;align-items:center;gap:8px}.ticket-number-line>span{color:var(--blue);font-size:11px;font-weight:750;letter-spacing:.04em}.ticket-detail-title h1{margin:6px 0 3px;font-size:25px;line-height:1.3}.ticket-detail-title p{margin:0;color:var(--muted);font-size:11px}.escalation-level{min-width:145px;padding:11px 14px;display:flex;flex-direction:column;border-radius:10px;background:#f7faff}.escalation-level span{color:var(--muted);font-size:9px;text-transform:uppercase}.escalation-level strong{color:var(--blue);font-size:14px}.priority-pill,.status-pill{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:700}.priority-pill--1{color:#b42318;background:#fee4e2}.priority-pill--2{color:#b54708;background:#ffead5}.priority-pill--3{color:#175cd3;background:#dbeafe}.priority-pill--4{color:#475467;background:#f2f4f7}.status-pill{color:#344054;background:#f2f4f7}.status-pill--open,.status-pill--reopened{color:#175cd3;background:#eff6ff}.status-pill--in_progress,.status-pill--assigned,.status-pill--acknowledged{color:#026aa2;background:#e0f2fe}.status-pill--escalated{color:#b42318;background:#fee4e2}.status-pill--resolved,.status-pill--verified,.status-pill--closed{color:#067647;background:#dcfae6}.status-pill--waiting_on_reporter,.status-pill--awaiting_parts,.status-pill--waiting_on_vendor{color:#b54708;background:#fff4e5}.ticket-sla-grid{max-width:1450px;margin:0 auto 12px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.ticket-sla-grid article{padding:14px 16px;display:flex;align-items:center;gap:11px;border:1px solid var(--border);border-radius:12px;background:#fff}.ticket-sla-grid article>span{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;color:var(--blue);background:var(--blue-soft)}.ticket-sla-grid article>div{min-width:0;display:flex;flex-direction:column}.ticket-sla-grid small{color:var(--muted);font-size:9px;text-transform:uppercase}.ticket-sla-grid strong{font-size:12px}.ticket-sla-grid em{overflow:hidden;color:#98a2b3;font-size:9px;font-style:normal;text-overflow:ellipsis;white-space:nowrap}.deadline-label{display:flex;align-items:center;gap:4px}.deadline-help{position:relative;width:17px;height:17px;padding:0;display:grid;place-items:center;border:0;border-radius:50%;color:#667085;background:#eef2f6;cursor:help}.deadline-help>span{position:absolute;z-index:20;left:50%;bottom:calc(100% + 8px);width:260px;padding:10px 11px;visibility:hidden;border-radius:8px;color:#fff;background:#101828;box-shadow:0 8px 24px rgba(16,24,40,.2);font-size:10px;font-weight:400;line-height:1.5;text-align:left;text-transform:none;transform:translateX(-50%);opacity:0;transition:.15s}.deadline-help>span::after{content:"";position:absolute;top:100%;left:50%;border:5px solid transparent;border-top-color:#101828;transform:translateX(-50%)}.deadline-help:hover>span,.deadline-help:focus-visible>span{visibility:visible;opacity:1}.deadline-help:focus-visible{outline:2px solid var(--blue);outline-offset:2px}.sla-red{color:#b42318}.sla-orange{color:#b54708}.sla-green{color:#067647}.sla-blue{color:#175cd3}.ticket-detail-layout{max-width:1450px;margin:auto;display:grid;grid-template-columns:minmax(0,1fr) 340px;align-items:start;gap:12px}.ticket-detail-main,.ticket-actions{display:grid;gap:12px}.ticket-panel{overflow:hidden;border:1px solid var(--border);border-radius:14px;background:#fff}.ticket-panel>header{padding:15px 17px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border)}.ticket-panel>header span,.action-card>header span{color:var(--blue);font-size:9px;font-weight:700;letter-spacing:.07em;text-transform:uppercase}.ticket-panel>header h2,.action-card>header h2{margin:2px 0 0;font-size:15px}.issue-description{margin:0;padding:19px 20px;color:#344054;font-size:13px;line-height:1.75;white-space:pre-wrap}.issue-metadata{padding:0 20px 19px;display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.issue-metadata>div{padding:11px;display:grid;grid-template-columns:25px 1fr;align-items:center;border-radius:9px;background:#f8fafc}.issue-metadata svg{grid-row:span 2;color:var(--blue)}.issue-metadata span{color:var(--muted);font-size:9px}.issue-metadata strong{overflow:hidden;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.resolution-box{margin:0 20px 20px;padding:13px;display:flex;gap:10px;border:1px solid #a6f4c5;border-radius:10px;color:#067647;background:#ecfdf3}.resolution-box span{font-size:10px;font-weight:700;text-transform:uppercase}.resolution-box p{margin:2px 0 0;color:#344054;font-size:11px}.conversation-panel>header>b{padding:3px 8px;border-radius:999px;color:var(--blue);background:var(--blue-soft);font-size:9px}.conversation-empty{padding:40px;color:var(--muted);font-size:11px;text-align:center}.comment-list{max-height:520px;overflow-y:auto}.comment-list article{padding:14px 17px;display:grid;grid-template-columns:34px 1fr;gap:9px;border-bottom:1px solid #edf0f4}.comment-list article>span{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;color:var(--blue);background:var(--blue-soft)}.comment-list article.internal{background:#fffaf0}.comment-list article.internal>span{color:#b54708;background:#ffead5}.comment-list article header{display:flex;align-items:center;gap:7px}.comment-list article strong{font-size:11px}.comment-list article header b{padding:2px 5px;border-radius:999px;color:#b54708;background:#ffead5;font-size:8px}.comment-list time{margin-left:auto;color:#98a2b3;font-size:8px}.comment-list p{margin:4px 0 0;color:#475467;font-size:11px;line-height:1.6;white-space:pre-wrap}.comment-composer{padding:14px 17px;background:#fafbfc}.comment-composer textarea,.action-card textarea,.action-card select{width:100%;padding:9px 10px;border:1px solid #d5dce6;border-radius:8px;outline:0;background:#fff;font:inherit;font-size:11px;resize:vertical}.comment-composer footer{margin-top:8px;display:flex;align-items:center;justify-content:space-between}.comment-composer label{display:flex;align-items:center;gap:6px;color:#475467;font-size:9px}.comment-composer button,.action-card button{min-height:37px;padding:0 12px;display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:8px;color:#fff;background:var(--blue);font-size:10px;font-weight:650;cursor:pointer}.comment-composer button:disabled,.action-card button:disabled{opacity:.6;cursor:wait}.timeline{padding:17px}.timeline article{position:relative;padding:0 0 18px 24px;border-left:1px solid #dbe4ef}.timeline article:last-child{padding-bottom:0}.timeline i{position:absolute;top:2px;left:-5px;width:9px;height:9px;border:2px solid #fff;border-radius:50%;background:var(--blue);box-shadow:0 0 0 1px #bfd3ef}.timeline strong{font-size:10px;text-transform:capitalize}.timeline p{margin:2px 0;color:#475467;font-size:10px}.timeline time{color:#98a2b3;font-size:8px}.action-card{padding-bottom:14px}.action-card>header{padding:14px 15px}.action-card form{padding:0 15px;display:grid;gap:10px}.action-card label{display:flex;flex-direction:column;gap:5px;color:#344054;font-size:9px;font-weight:650}.action-card button{width:100%}.action-card--escalate{border-color:#fedf89}.action-card--escalate>header{background:#fffaeb}.action-card--escalate button{background:#d97706}
@media(max-width:1050px){.ticket-detail-layout{grid-template-columns:1fr}.ticket-actions{grid-template-columns:repeat(2,1fr)}.issue-metadata{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.ticket-detail-page{padding:14px 10px 30px}.ticket-detail-hero{align-items:flex-start;flex-direction:column}.escalation-level{width:100%}.ticket-sla-grid{grid-template-columns:1fr}.issue-metadata{grid-template-columns:1fr}.ticket-actions{grid-template-columns:1fr}.comment-list article header{align-items:flex-start;flex-wrap:wrap}.comment-list time{width:100%;margin:0}.comment-composer footer{align-items:flex-start;flex-direction:column;gap:9px}.comment-composer button{width:100%}}
.attachment-section{margin:0 20px 20px}.attachment-section>span{display:block;margin-bottom:8px;color:#344054;font-size:10px;font-weight:700;text-transform:uppercase}.attachment-gallery{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.attachment-gallery a{min-width:0;overflow:hidden;border:1px solid #dce3ec;border-radius:9px;color:#344054;background:#fff;text-decoration:none}.attachment-gallery img{width:100%;aspect-ratio:1.3;display:block;object-fit:cover}.attachment-gallery small{display:block;padding:6px 7px;overflow:hidden;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.comment-attachments{margin-top:8px;display:flex;flex-wrap:wrap;gap:7px}.comment-attachments a{width:82px;overflow:hidden;border:1px solid #dce3ec;border-radius:7px}.comment-attachments img{width:100%;aspect-ratio:1.15;display:block;object-fit:cover}.comment-composer>.ticket-photo-picker{margin-top:10px;padding:10px;border:1px solid #e4e9f0;border-radius:9px;background:#fff}
@media(max-width:700px){.attachment-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
