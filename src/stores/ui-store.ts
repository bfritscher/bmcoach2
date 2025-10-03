import { defineStore } from 'pinia';
import { ref } from 'vue';

export const SORT_ORDER_ASC = 'asc';
export const SORT_ORDER_DESC = 'desc';

export const useUIStore = defineStore('ui', () => {
  // SC move to custom store?
  const editMode = ref(true);
  const selectedSerieName = ref<string | undefined>();
  const markerSize = ref(10);
  const sortOrder = ref(SORT_ORDER_ASC);

  // global
  const leftDrawerOpen = ref(false);
  const rightDrawerOpen = ref(false);

  return {
    selectedSerieName,
    editMode,
    markerSize,
    sortOrder,
    leftDrawerOpen,
    rightDrawerOpen,
  };
});
