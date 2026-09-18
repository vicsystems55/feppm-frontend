import { createRouter, createWebHistory } from 'vue-router';

import DashboardView from '../views/DashboardView.vue';
import { navigationForRoles } from '../config/roleNavigation.js';
import { useAuthStore } from '../stores/auth.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/modules/maintenance-operations',
      name: 'maintenance-operations',
      component: () => import('../views/MaintenanceOperationsView.vue'),
      meta: { requiresAuth: true, permission: 'maintenance_operations.view' },
    },
    {
      path: '/modules/users',
      name: 'admin-accounts',
      component: () => import('../views/AccountsView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/users' },
    },
    {
      path: '/modules/roles-permissions',
      name: 'roles-permissions',
      component: () => import('../views/AccountsView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/roles-permissions' },
    },
    {
      path: '/modules/facilities',
      name: 'facilities',
      component: () => import('../views/FacilitiesView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/facilities' },
    },
    {
      path: '/modules/equipment-registry',
      name: 'equipment-registry',
      component: () => import('../views/LgaEquipmentView.vue'),
      meta: { requiresAuth: true, permission: 'equipment.view', menuPath: '/modules/equipment-registry' },
    },
    {
      path: '/modules/workshops',
      name: 'maintenance-workshops',
      component: () => import('../views/WorkshopResourcesView.vue'),
      meta: { requiresAuth: true, permission: 'workshops.view', menuPath: '/modules/workshops', resourceTab: 'workshops' },
    },
    {
      path: '/modules/spare-parts',
      name: 'workshop-inventory',
      component: () => import('../views/WorkshopResourcesView.vue'),
      meta: { requiresAuth: true, permission: 'inventory.view', menuPath: '/modules/spare-parts', resourceTab: 'inventory' },
    },
    {
      path: '/modules/tool-register',
      name: 'tool-register',
      component: () => import('../views/WorkshopResourcesView.vue'),
      meta: { requiresAuth: true, permission: 'tools.view', menuPath: '/modules/tool-register', resourceTab: 'tools' },
    },
    {
      path: '/modules/resource-requests',
      name: 'resource-requests',
      component: () => import('../views/ResourceRequestsView.vue'),
      meta: { requiresAuth: true, permission: 'resource_requests.view', menuPath: '/modules/resource-requests' },
    },
    {
      path: '/modules/checklist-templates',
      name: 'checklist-templates',
      component: () => import('../views/ChecklistManagerView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/checklist-templates' },
    },
    {
      path: '/modules/notifications',
      name: 'notifications',
      component: () => import('../views/NotificationsView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/notifications' },
    },
    {
      path: '/modules/issues',
      name: 'tickets',
      component: () => import('../views/TicketsView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/issues' },
    },
    {
      path: '/modules/issues/:id',
      name: 'ticket-detail',
      component: () => import('../views/TicketDetailView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/issues' },
    },
    {
      path: '/modules/lga-reports',
      name: 'lga-reports',
      component: () => import('../views/LgaReportsView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/lga-reports' },
    },
    {
      path: '/modules/lga-media',
      name: 'lga-media',
      component: () => import('../views/LgaReportsView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/lga-media' },
    },
    {
      path: '/modules/lga-equipment',
      redirect: { name: 'equipment-registry' },
    },
    {
      path: '/modules/equipment',
      redirect: { name: 'equipment-registry' },
    },
    {
      path: '/modules/equipment-list',
      redirect: { name: 'equipment-registry' },
    },
    {
      path: '/modules/lga-daily-tasks',
      name: 'lga-daily-tasks',
      component: () => import('../views/LgaTasksView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/lga-daily-tasks' },
    },
    {
      path: '/modules/lga-weekly-tasks',
      name: 'lga-weekly-tasks',
      component: () => import('../views/LgaTasksView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/lga-weekly-tasks' },
    },
    {
      path: '/modules/lga-monthly-tasks',
      name: 'lga-monthly-tasks',
      component: () => import('../views/LgaTasksView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/lga-monthly-tasks' },
    },
    {
      path: '/modules/:slug(daily-checklist|weekly-checklist|monthly-checklist|todays-tasks)',
      name: 'checklist-tasks',
      component: () => import('../views/ChecklistTasksView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/modules/:slug',
      name: 'module',
      component: () => import('../views/ModuleView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.initialize();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.permission && !auth.user?.permissions?.includes(to.meta.permission)) {
    return { name: 'dashboard' };
  }

  if (to.name === 'module' || to.name === 'checklist-tasks' || to.meta.menuPath) {
    const menuPath = to.meta.menuPath ?? to.path;
    const allowed = navigationForRoles(auth.user?.roles)
      .flatMap((group) => group.items)
      .some((item) => item.to === menuPath);
    if (!allowed) return { name: 'dashboard' };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'dashboard' };
  return true;
});

export default router;
