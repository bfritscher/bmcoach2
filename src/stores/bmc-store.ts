import { defineStore } from 'pinia'
import { ref, computed, reactive, watch } from 'vue'
import { BMCNote } from '@/components/models'
import { useItemsStore } from '@/stores/items'
import { useBmcUIStore } from '@/stores/bmc-ui-store'
import { useUIStore } from '@/stores/ui-store'
import Note from '@/models/Note'
import solve from '@/utils/calc'
import { useStorageStore } from './storage'

const bmcUiStore = useBmcUIStore()
const uiStore = useUIStore()

export const TYPE_BMC = 'bmc-canvas'
export const TYPE_BMC_NOTE = 'bmc-note'

export function isOfTypeBMC(type: string) {
  return [TYPE_BMC, TYPE_BMC_NOTE].includes(type)
}

// tmp has to be first for type filters using these lists to ignoring it
export const BMC_TYPES = ['bmc_tmp', 'vp', 'cs', 'r', 'c', 'dc', 'cr', 'kr', 'ka', 'pn']

export const VPC_TYPES = ['vpc_tmp', 'features', 'solution', 'pain_gain', 'job']

export const VPC_VP_TYPES = ['vpc_tmp', 'features', 'solution']

export const VPC_CS_TYPES = ['vpc_tmp', 'pain_gain', 'job']

export const useBMCStore = defineStore('canvas', () => {
  const itemsStore = useItemsStore()
  const storageStore = useStorageStore()

  const currentBMCId = ref('')
  const canvas = computed(() => {
    if (itemsStore.typeIndex[TYPE_BMC] && itemsStore.typeIndex[TYPE_BMC][currentBMCId.value]) {
      return itemsStore.typeIndex[TYPE_BMC][currentBMCId.value]
    }
    return {
      $id: '',
      title: '',
      description: '',
      notes: [],
      notesOrder: [],
      notesPresentationOrder: [],
      currentPresentationKey: '',
      logoColor: '',
      logoImage: '',
    }
  })

  const DEFAULT_USER_CANVAS_SETTINGS = {
    listMode: false,
    lastUsedColors: [0],
    colorsVisibility: [1, 1, 1, 1, 1, 1],
    isColorsOpen: false,
    fav: false,
    hideColors: false,
    hideAllLabels: false,
  }
  // TODO custom items settings for each user
  const settings = JSON.parse(JSON.stringify(DEFAULT_USER_CANVAS_SETTINGS))

  const canvasSettings = reactive(settings)

  const notes = computed(() => {
    return canvas.value.notes
      .map((noteId: string) => {
        const n = itemsStore.typeIndex[TYPE_BMC_NOTE][noteId] as BMCNote
        if(!Array.isArray(n.colors)) {
          n.colors = Object.keys(n.colors).map((k) => parseInt(k))
        }
        return n
      })
      .filter((note: any) => note) as BMCNote[]
  })

  const notesPresentationOrder = computed(() => {
    return canvas.value.notesPresentationOrder
      ? canvas.value.notesPresentationOrder
          .map((noteId: string) => itemsStore.typeIndex[TYPE_BMC_NOTE][noteId] as BMCNote)
          .filter((note: any) => note)
      : ([] as BMCNote[])
  })

  function newCanvas() {
    const $id = itemsStore.addItem(TYPE_BMC, {
      title: 'Undefined title',
      description: '',
      notes: [],
      notesOrder: [],
      notesPresentationOrder: [],
      currentPresentationKey: '',
      logoColor: '',
      logoImage: '',
    })
    currentBMCId.value = $id || ''
  }

  function canvasDelete() {
    // delete all notes before deleting canvas
    notes.value.forEach((note) => {
      if (note.image) {
        storageStore.removeFile(note.image)
      }
      itemsStore.removeItem(note.$id)
    })
    if (canvas.value.logoImage) {
      storageStore.removeFile(canvas.value.logoImage)
    }
    itemsStore.removeItem(currentBMCId.value)
    currentBMCId.value = ''
  }

  function loadCanvas(canvasId: string) {
    currentBMCId.value = canvasId
  }

  function computeCurrentCanvasUsedColors() {
    const usedColors = new Set()
    notes.value.reduce((colors, note) => {
      if (note.colors) {
        note.colors.forEach((c) => colors.add(c))
      }
      return colors
    }, usedColors)
    bmcUiStore.layout.currentCanvasUsedColors = usedColors
  }
  watch(notes, computeCurrentCanvasUsedColors)

  function getNotesByTypes(filteredTypes: string | string[]) {
    let list = filteredTypes
    if (!Array.isArray(list)) {
      list = [list]
    }
    // TODO fix order by notesOrder
    return notes.value.filter((note: BMCNote) => note && list.includes(note.type)) // TODO breaks? .sort((a, b) => canvas.value.notesOrder.indexOf(a.$id) - canvas.value.notesOrder.indexOf(b.$id));
  }

  function noteCreate(payload: any) {
    if (bmcUiStore.layout.isEditable) {
      const note = new Note(payload)
      const $id = itemsStore.addItem(TYPE_BMC_NOTE, note)
      let notesPresentationOrder
      if (!canvas.value.notesPresentationOrder) {
        notesPresentationOrder = canvas.value.notes.slice(0)
      } else {
        notesPresentationOrder = canvas.value.notesPresentationOrder.slice(0)
      }
      let notesOrder
      if (!canvas.value.notesOrder) {
        notesOrder = canvas.value.notes.slice(0)
      } else {
        notesOrder = canvas.value.notesOrder.slice(0)
      }
      notesOrder.push($id)
      notesPresentationOrder.push($id)
      // FIXME: this can create concurrency issues
      // use canvas id on note insted of list in canvas?
      itemsStore.updateItemData(currentBMCId.value, {
        ['notes']: canvas.value.notes.concat([$id]),
        ['notesOrder']: notesOrder,
        ['notesPresentationOrder']: notesPresentationOrder,
      })
      bmcUiStore.layout.focusedNoteId = $id

      /* TODO?
      if (note.parent) {
        store.dispatch('recomputeChildren', note.parent);
      }
      */
    }
  }

  function noteMoveToTop(noteId: string) {
    const index = canvas.value.notesOrder.indexOf(noteId)
    if (index > -1) {
      canvas.value.notesOrder.splice(index, 1)
    }
    canvas.value.notesOrder.push(noteId)
    if (bmcUiStore.layout.isEditable) {
      itemsStore.updateItemData(currentBMCId.value, {
        ['notesOrder']: canvas.value.notesOrder,
      })
    }
  }

  function noteUpdate(payload: any) {
    /*
    //FIXME PERMISSIONS
    if (
      payload.note['.key'] &&
      state.currentUser &&
      state.canvas.users &&
      state.currentUser.uid in state.canvas.users
    ) {
      refs.notes.child(payload.note['.key']).update(payload.changes);
    }
    */
    itemsStore.updateItemData(payload.note.$id, payload.changes)
    if (payload.changes.colors) {
      computeCurrentCanvasUsedColors()
    }
  }

  function noteDelete(note: any) {
    if (note.image) {
      storageStore.removeFile(note.image)
    }
    if (bmcUiStore.layout.focusedNoteId === note.$id) {
      bmcUiStore.layout.focusedNoteId = ''
    }
    itemsStore.removeItem(note.$id)
    itemsStore.updateItemData(currentBMCId.value, {
      ['notes']: canvas.value.notes.filter((id: string) => id !== note.$id),
      ['notesOrder']: canvas.value.notesOrder.filter((id: string) => id !== note.$id),
      ['notesPresentationOrder']: canvas.value.notesPresentationOrder.filter(
        (id: string) => id !== note.$id,
      ),
    })
  }

  function noteMoveLocal(payload: any) {
    ;['left', 'top', 'listLeft', 'listTop', 'type', 'angle', 'height'].forEach((key) => {
      if (key in payload) {
        payload.note[key] = payload[key]
      }
    })
  }

  function noteUpdateCalcVal(payload: any) {
    // FIXME currently replace full object instead of updating small value
    // concurency problems?
    const values = Object.assign({}, payload.note.values)
    values[payload.key] = payload.value
    noteUpdate({
      note: payload.note,
      changes: {
        values,
      },
    })
  }

  function canvasUserSettingsUpdate(payload: any) {
    // TODO fix and save
    Object.assign(DEFAULT_USER_CANVAS_SETTINGS, payload)
  }

  let savedDrawerState = false
  function presentationStart() {
    // hide all
    notes.value.forEach((note) => {
      noteUpdate({
        note,
        changes: { hidden: true },
      })
    })
    bmcUiStore.layout.presentation = 'single'
    bmcUiStore.layout.isEditable = false
    bmcUiStore.layout.showVPC = false
    savedDrawerState = uiStore.leftDrawerOpen
    uiStore.leftDrawerOpen = false
    uiStore.rightDrawerOpen = false
    itemsStore.updateItemData(currentBMCId.value, {
      currentPresentationKey: '',
    })
  }

  function presentationExit() {
    bmcUiStore.layout.presentation = ''
    bmcUiStore.layout.showDrawSurface = false
    uiStore.leftDrawerOpen = savedDrawerState
    // TODO based on permissions?
    bmcUiStore.layout.isEditable = true
  }

  function presentationNext() {
    const currentIndex = canvas.value.notesPresentationOrder.indexOf(
      canvas.value.currentPresentationKey,
    )
    if (currentIndex === canvas.value.notesPresentationOrder.length - 1) {
      presentationExit()
    } else {
      let key = canvas.value.notesPresentationOrder[currentIndex + 1]
      if (currentIndex === -1) {
        key = canvas.value.notesPresentationOrder[0]
      }
      noteUpdate({
        note: { $id: key },
        changes: { hidden: false },
      })
      itemsStore.updateItemData(currentBMCId.value, {
        currentPresentationKey: key,
      })
      zoomNoteKey(key)
    }
  }

  function presentationPrevious() {
    if (canvas.value.currentPresentationKey === '') {
      presentationExit()
    } else {
      const key = canvas.value.currentPresentationKey
      noteUpdate({
        note: { $id: key },
        changes: { hidden: true },
      })
      const currentIndex = canvas.value.notesPresentationOrder.indexOf(
        canvas.value.currentPresentationKey,
      )
      itemsStore.updateItemData(currentBMCId.value, {
        currentPresentationKey:
          currentIndex === 0 ? '' : canvas.value.notesPresentationOrder[currentIndex - 1],
      })
      zoomNoteKey(key)
    }
  }

  function zoomNoteKey(key: string) {
    if (!key) return false
    if (!(key in itemsStore.typeIndex[TYPE_BMC_NOTE])) return false
    const note = itemsStore.typeIndex[TYPE_BMC_NOTE][key]
    if (!note) {
      return false
    }
    const parentNote = itemsStore.typeIndex[TYPE_BMC_NOTE][note.parent]
    if (parentNote) {
      if (parentNote.type === 'vp') {
        bmcUiStore.layout.selectedVP = parentNote
        bmcUiStore.layout.showVPC = true
      }
      if (parentNote.type === 'cs') {
        bmcUiStore.layout.selectedCS = parentNote
        bmcUiStore.layout.showVPC = true
      }
      return true
    }
    if (bmcUiStore.layout.showVPC) {
      bmcUiStore.layout.showVPC = false
    }
    return false
  }

  const focusedNote = computed(() => {
    if (bmcUiStore.layout.focusedNoteId) {
      return itemsStore.typeIndex[TYPE_BMC_NOTE][bmcUiStore.layout.focusedNoteId] as BMCNote
    }
    return null
  })

  const calcIds = computed(() => {
    return notes.value.filter((n) => n.calcId).map((n) => n.calcId)
  })

  const calcResults = computed(() => solve(notes.value))

  function canvasInfoUpdate(payload: any) {
    itemsStore.updateItemData(currentBMCId.value, {
      ...payload,
    })
  }

  return {
    canvas,
    canvasSettings,
    notes,
    loadCanvas,
    newCanvas,
    canvasDelete,
    updateItemData: itemsStore.updateItemData,
    notesBMC: computed(() => getNotesByTypes(BMC_TYPES)),
    notesVPC: computed(() => getNotesByTypes(VPC_TYPES)),
    notesVPCvp: computed(() => getNotesByTypes(VPC_VP_TYPES)),
    notesVPCcs: computed(() => getNotesByTypes(VPC_CS_TYPES)),
    getNotesByTypes,
    noteCreate,
    noteMoveToTop,
    noteUpdate,
    noteMoveLocal,
    noteDelete,
    canvasUserSettingsUpdate,
    noteUpdateCalcVal,
    presentationStart,
    presentationNext,
    presentationPrevious,
    presentationExit,
    zoomNoteKey,
    notesPresentationOrder,
    focusedNote,
    calcIds,
    calcResults,
    canvasInfoUpdate,
  }
})
