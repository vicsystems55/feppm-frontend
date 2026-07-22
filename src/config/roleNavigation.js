import {
  Activity,
  ArrowRightLeft,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  ClipboardList,
  FileDown,
  FileText,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Map,
  MapPinned,
  PackageSearch,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  TriangleAlert,
  Truck,
  UserRound,
  Users,
  Warehouse,
  Wrench,
} from '@lucide/vue';

export const ROLE_PRIORITY = [
  'SUPER_ADMIN',
  'NATIONAL_ADMIN',
  'ZONAL_ADMIN',
  'STATE_ADMIN',
  'LGA_ADMIN',
  'FACILITY_MANAGER',
];

const dashboard = { label: 'Dashboard', icon: LayoutDashboard, to: '/' };
const moduleItem = (label, slug, icon) => ({ label, icon, to: `/modules/${slug}` });
const group = (label, items) => ({ label, items });

export const roleNavigation = {
  SUPER_ADMIN: [
    group('Overview', [dashboard]),
    group('Administration', [
      moduleItem('Organizations', 'organizations', Building2),
      moduleItem('Users', 'users', Users),
      moduleItem('Roles & permissions', 'roles-permissions', ShieldCheck),
      moduleItem('Facilities', 'facilities', Warehouse),
      moduleItem('Equipment registry', 'equipment-registry', Boxes),
    ]),
    group('Maintenance', [
      moduleItem('Maintenance plans', 'maintenance-plans', ClipboardList),
      moduleItem('Daily tasks', 'daily-tasks', ListChecks),
      moduleItem('Work orders', 'work-orders', Wrench),
      moduleItem('Corrective maintenance', 'corrective-maintenance', TriangleAlert),
      moduleItem('Maintenance calendar', 'maintenance-calendar', CalendarDays),
    ]),
    group('Inventory', [
      moduleItem('Spare parts', 'spare-parts', PackageSearch),
      moduleItem('Vendors', 'vendors', Truck),
      moduleItem('Procurement', 'procurement', ShoppingCart),
    ]),
    group('Monitoring', [
      moduleItem('Alerts', 'alerts', Bell),
      moduleItem('Equipment health', 'equipment-health', HeartPulse),
      moduleItem('Compliance monitor', 'compliance-monitor', Gauge),
    ]),
    group('Reports', [
      moduleItem('National dashboard', 'national-dashboard', Map),
      moduleItem('Analytics', 'analytics', ChartNoAxesCombined),
      moduleItem('Exports', 'exports', FileDown),
    ]),
    group('System', [
      moduleItem('Notifications', 'notifications', Bell),
      moduleItem('Audit logs', 'audit-logs', ScrollText),
      moduleItem('Activity logs', 'activity-logs', Activity),
      moduleItem('Settings', 'settings', Settings),
    ]),
  ],

  NATIONAL_ADMIN: [
    group('Overview', [dashboard]),
    group('Organization', [
      moduleItem('Zones', 'zones', Map),
      moduleItem('States', 'states', MapPinned),
      moduleItem('Facilities', 'facilities', Warehouse),
    ]),
    group('Equipment', [
      moduleItem('Equipment registry', 'equipment-registry', Boxes),
      moduleItem('Equipment transfers', 'equipment-transfers', ArrowRightLeft),
    ]),
    group('Maintenance', [
      moduleItem('Maintenance plans', 'maintenance-plans', ClipboardList),
      moduleItem('Work orders', 'work-orders', Wrench),
      moduleItem('Maintenance calendar', 'maintenance-calendar', CalendarDays),
    ]),
    group('Monitoring', [
      moduleItem('National compliance', 'national-compliance', Gauge),
      moduleItem('Equipment health', 'equipment-health', HeartPulse),
      moduleItem('Alerts', 'alerts', Bell),
    ]),
    group('Inventory', [
      moduleItem('Spare parts', 'spare-parts', PackageSearch),
      moduleItem('Vendors', 'vendors', Truck),
    ]),
    group('Reports', [
      moduleItem('National reports', 'national-reports', FileText),
      moduleItem('Analytics', 'analytics', ChartNoAxesCombined),
    ]),
    group('Account', [
      moduleItem('Notifications', 'notifications', Bell),
      moduleItem('Settings', 'settings', Settings),
    ]),
  ],

  ZONAL_ADMIN: [
    group('Overview', [dashboard]),
    group('Organization', [
      moduleItem('States', 'states', MapPinned),
      moduleItem('Facilities', 'facilities', Warehouse),
    ]),
    group('Equipment', [moduleItem('Equipment list', 'equipment-list', Boxes)]),
    group('Maintenance', [
      moduleItem('Maintenance plans', 'maintenance-plans', ClipboardList),
      moduleItem('Work orders', 'work-orders', Wrench),
      moduleItem('Calendar', 'maintenance-calendar', CalendarDays),
    ]),
    group('Monitoring', [
      moduleItem('Zone compliance', 'zone-compliance', Gauge),
      moduleItem('Alerts', 'alerts', Bell),
    ]),
    group('Inventory', [moduleItem('Spare parts', 'spare-parts', PackageSearch)]),
    group('Reports', [moduleItem('Zone reports', 'zone-reports', FileText)]),
    group('Account', [moduleItem('Notifications', 'notifications', Bell)]),
  ],

  STATE_ADMIN: [
    group('Overview', [dashboard]),
    group('Organization', [
      moduleItem('LGAs', 'lgas', MapPinned),
      moduleItem('Facilities', 'facilities', Warehouse),
    ]),
    group('Equipment', [moduleItem('Equipment registry', 'equipment-registry', Boxes)]),
    group('Maintenance', [
      moduleItem('Daily tasks', 'daily-tasks', ListChecks),
      moduleItem('Maintenance plans', 'maintenance-plans', ClipboardList),
      moduleItem('Work orders', 'work-orders', Wrench),
    ]),
    group('Monitoring', [
      moduleItem('State compliance', 'state-compliance', Gauge),
      moduleItem('Alerts', 'alerts', Bell),
    ]),
    group('Inventory', [moduleItem('Spare parts', 'spare-parts', PackageSearch)]),
    group('Reports', [moduleItem('State reports', 'state-reports', FileText)]),
    group('Account', [moduleItem('Notifications', 'notifications', Bell)]),
  ],

  LGA_ADMIN: [
    group('Overview', [dashboard]),
    group('Organization', [moduleItem('Facilities', 'facilities', Warehouse)]),
    group('Equipment', [moduleItem('Equipment', 'equipment', Boxes)]),
    group('Maintenance', [
      moduleItem('Daily tasks', 'daily-tasks', ListChecks),
      moduleItem('Work orders', 'work-orders', Wrench),
      moduleItem('Calendar', 'maintenance-calendar', CalendarDays),
    ]),
    group('Monitoring', [
      moduleItem('Facility compliance', 'facility-compliance', Gauge),
      moduleItem('Alerts', 'alerts', Bell),
    ]),
    group('Inventory', [moduleItem('Spare parts', 'spare-parts', PackageSearch)]),
    group('Reports', [moduleItem('Reports', 'reports', FileText)]),
    group('Account', [moduleItem('Notifications', 'notifications', Bell)]),
  ],

  FACILITY_MANAGER: [
    group('Today', [
      dashboard,
      moduleItem("Today's tasks", 'todays-tasks', ListChecks),
    ]),
    group('Assets', [moduleItem('Equipment', 'equipment', Boxes)]),
    group('Maintenance', [
      moduleItem('Daily checklist', 'daily-checklist', ClipboardCheck),
      moduleItem('Weekly checklist', 'weekly-checklist', ClipboardCheck),
      moduleItem('Monthly checklist', 'monthly-checklist', ClipboardCheck),
      moduleItem('Work orders', 'work-orders', Wrench),
    ]),
    group('Operations', [
      moduleItem('Fault reporting', 'fault-reporting', TriangleAlert),
      moduleItem('Spare parts', 'spare-parts', PackageSearch),
      moduleItem('Documents', 'documents', FileText),
    ]),
    group('Account', [
      moduleItem('Notifications', 'notifications', Bell),
      moduleItem('Profile', 'profile', UserRound),
    ]),
  ],
};

export function primaryRoleKey(roles = []) {
  const roleKeys = new Set(roles.map((role) => role.key));
  return ROLE_PRIORITY.find((roleKey) => roleKeys.has(roleKey)) ?? null;
}

export function navigationForRoles(roles = []) {
  return roleNavigation[primaryRoleKey(roles)] ?? [];
}
