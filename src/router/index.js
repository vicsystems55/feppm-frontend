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
      path: '/modules/checklist-templates',
      name: 'checklist-templates',
      component: () => import('../views/ChecklistManagerView.vue'),
      meta: { requiresAuth: true, menuPath: '/modules/checklist-templates' },
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
