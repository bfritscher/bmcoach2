import { createRouter, createWebHistory } from 'vue-router'
import { useAccountStore } from '@/stores/account';
import { useItemsStore } from '@/stores/items';
import { useTeamsStore } from '@/stores/teams';
import type { RouteLocationNormalized } from 'vue-router';
import routes from './routes';

const router = createRouter({
  scrollBehavior: () => ({ left: 0, top: 0 }),
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

function checkLoadTeam(to: RouteLocationNormalized) {
  if (to.params.teamId) {
    const teamsStore = useTeamsStore();
    const itemsStore = useItemsStore();
    teamsStore.setCurrentTeamById(to.params.teamId as string);
    itemsStore.getItems(to.params.teamId as string);
  }
}


router.beforeEach(async (to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      const store = useAccountStore();
      if (store.account || (await store.fetchAccount())) {
        await checkLoadTeam(to);
        next();
        return;
      } else {
        next('/login');
      }
    } else {
      next();
    }
  });

export default router
