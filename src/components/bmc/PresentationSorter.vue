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
<script>
import draggable from 'vuedraggable'
import { COLORS_MATERIAL_HEX, ICONS, TYPE_NAMES } from '/src/utils/constants'
import { useBMCStore } from '@/stores/bmc-store'
import { useUIStore } from '@/stores/ui-store'
import { mapState, mapActions } from 'pinia'

export default {
  components: {
    draggable,
  },
  data() {
    return {
      ICONS,
      TYPE_NAMES,
    }
  },
  computed: {
    ...mapState(useUIStore, ['rightDrawerOpen']),
    ...mapState(useBMCStore, ['canvas', 'notesPresentationOrder']),
    notes: {
      get() {
        return this.notesPresentationOrder
      },
      set(notes) {
        this.updateItemData(this.canvas.$id, {
          notesPresentationOrder: notes.map((n) => n['$id']),
        })
      },
    },
  },
  methods: {
    ...mapActions(useBMCStore, ['updateItemData']),
    boxShadow(note) {
      if (!note || !note.colors) {
        return ''
      }
      return note.colors
        .reduce((shadows, colorCode, i) => {
          const size = (i + 1) * 5 + i * 2
          shadows.push(`-${size}px 0px ${COLORS_MATERIAL_HEX[colorCode]}`)
          return shadows
        }, [])
        .join(',')
    },
  },
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
