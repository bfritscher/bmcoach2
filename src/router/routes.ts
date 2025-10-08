import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        name: 'home',
        path: '',
        component: () => import('@/pages/IndexPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        name: 'Login',
        path: 'login',
        component: () => import('@/pages/account/LoginPage.vue'),
      },
      {
        name: 'signup',
        path: 'signup',
        component: () => import('@/pages/account/SignUp.vue'),
      },
      {
        name: 'resetpassword',
        path: 'resetpassword',
        component: () => import('@/pages/account/ResetPassword.vue'),
      },
      {
        name: 'resetpasswordconfirm',
        path: 'resetpasswordconfirm',
        component: () => import('@/pages/account/ResetPasswordConfirm.vue'),
      },
      {
        name: 'account',
        path: 'account',
        component: () => import('@/pages/account/EditAccount.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        name: 'verifyemail',
        path: 'account/verifyemail',
        component: () => import('@/pages/account/EmailVerification.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        name: 'acceptinvitation',
        path: 'team/acceptinvitation',
        component: () => import('@/pages/team/AcceptInvitation.vue'),
      },
      {
        name: 'team',
        path: 'team/:teamId',
        component: () => import('@/pages/team/TeamPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        name: 'teamedit',
        path: 'team/:teamId/edit',
        component: () => import('@/pages/team/TeamEditPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        name: 'teamdebug',
        path: 'team/:teamId/debug',
        component: () => import('@/pages/team/TeamDebugPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        name: 'StrategyCanvas',
        path: 'team/:teamId/strategycanvas/:id',
        meta: {
          requiresAuth: true,
        },
        components: {
          default: () => import('@/pages/StrategyCanvas.vue'),
          toolbar: () => import('@/components/strategycanvas/TitleToolbar.vue'),
        },
      },
      {
        name: 'BusinessModelCanvas',
        path: 'team/:teamId/bmc/:id',
        meta: {
          requiresAuth: true,
          leftDrawer: true,
        },
        components: {
          default: () => import('@/pages/BusinessModelCanvas.vue'),
          toolbar: () => import('@/components/bmc/TitleToolbar.vue'),
          leftDrawer: () => import('@/components/bmc/BmcSidebar.vue'),
          rightDrawer: () => import('@/components/bmc/PresentationSorter.vue'),
          leftSidebar: () => import('@/components/bmc/BmcSidebar.vue'),
          rightSidebar: () => import('@/components/bmc/PresentationSorter.vue'),
        },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export default routes
