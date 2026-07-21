import { createRouter, createWebHistory } from 'vue-router';

import DashboardView from '../views/DashboardView.vue';
import { useAuthStore } from '../stores/auth.js';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, role: 'SUPER_ADMIN' },
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

  if (to.meta.role && !auth.user?.roles?.some((role) => role.key === to.meta.role)) {
    auth.clearSession();
    return { name: 'login' };
  }

  if (to.meta.guestOnly && auth.isSuperAdmin) return { name: 'dashboard' };
  return true;
});

export default router;
