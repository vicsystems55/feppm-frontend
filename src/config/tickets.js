export const ticketTypes = [
  ['INCIDENT', 'Incident'],
  ['SERVICE_REQUEST', 'Service request'],
  ['COMPLAINT', 'Complaint'],
  ['SUGGESTION', 'Suggestion'],
  ['TECHNICAL_SUPPORT', 'Technical support'],
];

export const ticketCategories = [
  ['EQUIPMENT_FAULT', 'Equipment fault'],
  ['MAINTENANCE', 'Maintenance'],
  ['TEMPERATURE_SAFETY', 'Temperature or safety'],
  ['CHECKLIST', 'Checklist'],
  ['INVENTORY', 'Inventory or spare parts'],
  ['ACCESS_ACCOUNT', 'Account or access'],
  ['DATA_QUALITY', 'Data correction'],
  ['COMPLAINT', 'Complaint'],
  ['SUGGESTION', 'Suggestion'],
  ['TECHNICAL_SUPPORT', 'Technical support'],
  ['OTHER', 'Other'],
];

export const riskLevels = [
  ['LOW', 'Low'],
  ['MEDIUM', 'Medium'],
  ['HIGH', 'High'],
  ['CRITICAL', 'Critical'],
];

export const ticketStatuses = [
  ['OPEN', 'Open'],
  ['ACKNOWLEDGED', 'Acknowledged'],
  ['ASSIGNED', 'Assigned'],
  ['IN_PROGRESS', 'In progress'],
  ['WAITING_ON_REPORTER', 'Waiting on reporter'],
  ['AWAITING_PARTS', 'Awaiting parts'],
  ['WAITING_ON_VENDOR', 'Waiting on vendor'],
  ['ESCALATED', 'Escalated'],
  ['RESOLVED', 'Resolved'],
  ['VERIFIED', 'Verified'],
  ['CLOSED', 'Closed'],
  ['REOPENED', 'Reopened'],
  ['CANCELLED', 'Cancelled'],
  ['DUPLICATE', 'Duplicate'],
];

export const allowedStatusTransitions = {
  OPEN: ['ACKNOWLEDGED', 'CANCELLED', 'DUPLICATE'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'WAITING_ON_REPORTER', 'AWAITING_PARTS', 'WAITING_ON_VENDOR', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'WAITING_ON_REPORTER', 'AWAITING_PARTS', 'WAITING_ON_VENDOR', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_ON_REPORTER', 'AWAITING_PARTS', 'WAITING_ON_VENDOR', 'RESOLVED', 'CANCELLED'],
  WAITING_ON_REPORTER: ['IN_PROGRESS', 'CANCELLED'],
  AWAITING_PARTS: ['IN_PROGRESS', 'CANCELLED'],
  WAITING_ON_VENDOR: ['IN_PROGRESS', 'CANCELLED'],
  ESCALATED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'WAITING_ON_REPORTER', 'AWAITING_PARTS', 'WAITING_ON_VENDOR', 'RESOLVED', 'CANCELLED'],
  RESOLVED: ['VERIFIED', 'REOPENED'],
  VERIFIED: ['CLOSED', 'REOPENED'],
  REOPENED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'CANCELLED'],
};

export const escalationNext = {
  FACILITY: 'LGA',
  LGA: 'STATE',
  STATE: 'ZONE',
  ZONE: 'NATIONAL',
  NATIONAL: 'PLATFORM',
};

const priorityMatrix = {
  LOW: { LOW: 4, MEDIUM: 4, HIGH: 3, CRITICAL: 2 },
  MEDIUM: { LOW: 4, MEDIUM: 3, HIGH: 3, CRITICAL: 2 },
  HIGH: { LOW: 3, MEDIUM: 3, HIGH: 2, CRITICAL: 1 },
  CRITICAL: { LOW: 2, MEDIUM: 2, HIGH: 1, CRITICAL: 1 },
};

export function previewPriority(impact, urgency) {
  return priorityMatrix[impact]?.[urgency] ?? 3;
}

export function labelFor(options, value) {
  return options.find(([key]) => key === value)?.[1] ?? String(value ?? '').replaceAll('_', ' ');
}

export function ticketStatusLabel(value) {
  return labelFor(ticketStatuses, value);
}

export function formatTicketDate(value, withTime = true) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

export function personName(person) {
  return person ? `${person.firstName} ${person.lastName}`.trim() : 'Unassigned';
}
