import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const SORT_ORDER_ASC = 'asc';
export const SORT_ORDER_DESC = 'desc';

export const useBmcUIStore = defineStore('bmc-ui', () => {
  const layout = reactive<any>({
    // local state vars for ui not synced
    selectedVP: null,
    selectedCS: null,
    focusedNote: null,
    showVPC: false,
    showNoteOptions: false,
    showNoteOptionsCalc: false,
    showLoading: '',
    currentCanvasUsedColors: new Set(),
    isEditable: true, // FIXME default to false
    showDrawSurface: false,
    presentation: '',
    showPrint: false,
    searchEnabled: false,
    mini: false,
    drawer: true,
  });

  return {
    layout,
  };
});
