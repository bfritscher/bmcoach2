<template>
  <draggable
    v-if="rightDrawerOpen"
    v-model="notes"
    tag="ul"
    ghost-class="ghost"
    animation="200"
    draggable=".note-item"
    class="presentation-sorter-list"
    item-key="$id"
  >
    <template #item="{ element }">
      <li class="note-item" :style="{ 'box-shadow': boxShadow(element) }">
        {{ element.text }}
        <q-icon :title="TYPE_NAMES[element.type]" :name="ICONS[element.type]" />
      </li>
    </template>
  </draggable>
</template>
<script setup lang="ts">
import draggable from 'vuedraggable'
import { computed } from 'vue'
import { COLORS_MATERIAL_HEX, ICONS, TYPE_NAMES } from '@/utils/constants'
import { useBMCStore } from '@/stores/bmc-store'
import { useUIStore } from '@/stores/ui-store'
import { storeToRefs } from 'pinia'

const uiStore = useUIStore()
const { rightDrawerOpen } = storeToRefs(uiStore)

const bmcStore = useBMCStore()
const { canvas, notesPresentationOrder } = storeToRefs(bmcStore)
const { updateItemData } = bmcStore

const notes = computed({
  get() {
    return notesPresentationOrder.value
  },
  set(newNotes: any[]) {
    updateItemData(canvas.value.$id, {
      notesPresentationOrder: newNotes.map((n) => n['$id']),
    })
  },
})

function boxShadow(note: any) {
  if (!note || !note.colors) {
    return ''
  }
  return note.colors
    .reduce((shadows: string[], colorCode: number, i: number) => {
      const size = (i + 1) * 5 + i * 2
      shadows.push(`-${size}px 0px ${COLORS_MATERIAL_HEX[colorCode]}`)
      return shadows
    }, [])
    .join(',')
}
</script>

<style>
.presentation-sorter-list {
  list-style-type: none;
}

.note-item {
  padding: 2px 24px 2px 4px;
  margin: 4px 0;
  min-height: 20px;
  font-size: 18px;
  font-family: 'Itim', cursive, sans-serif;
  position: relative;
  background-color: #fff;
  cursor: move;
}

.ghost {
  padding: 0;
  color: transparent;
  box-shadow: none !important;
  margin-right: 4px;
  border: 2px dashed #455a64;
}

.note-item.ghost .q-icon {
  display: none;
}

.ghost::before {
  content: 'Drop here';
  color: #455a64;
  font-weight: bold;
  margin-bottom: -20px;
  margin-left: 4px;
}

.note-item .q-icon {
  position: absolute;
  top: 2px;
  right: 4px;
}
</style>
