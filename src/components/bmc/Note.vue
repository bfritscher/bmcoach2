<template>
  <div
    class="draggable note"
    :class="{
      'list-mode': listMode,
      'hide-colors': hideColors,
      'highlight-note': highlight,
      dragging: dragging,
      'no-sticky': !value.showAsSticky,
    }"
    :style="{
      'background-color': colorsBG[color],
      height: `${height}%`,
      left: `${left}%`,
      top: `${top}%`,
      'box-shadow': boxShadow,
      opacity,
      transform,
    }"
    @click.prevent.stop
    @wheel="handleWheel"
  >
    <div v-if="isEdit && layout.isEditable && !hideColors" class="colors">
      <color-selector
        v-for="(colorIndex, i) in value.colors"
        :key="i"
        :style="{ transform: `rotateZ(${-angle}deg)` }"
        :value="colorIndex"
        :small="i > 0"
        :can-delete="i > 0"
        :direction="direction"
        @input="setColor(i, $event)"
      ></color-selector>
      <color-selector
        v-show="value.colors.length < 6"
        :style="{ transform: `rotateZ(${-angle}deg)` }"
        small
        :hide="value.colors"
        :direction="direction"
        @input="setColor(value.colors.length, $event)"
      ></color-selector>
    </div>
    <div class="icons">
      <q-space v-if="listMode" />
      <div>
        <!-- todo tooltip -->
        <q-btn
          v-if="value.description"
          flat
          color="primary"
          class="description"
          icon="description"
          @mouseover="moveToTop"
          @click.prevent.stop="showNoteOptions()"
        />
        <q-tooltip>{{ value.description }}</q-tooltip>
      </div>
      <q-space v-if="!listMode" />
      <q-btn
        v-if="isEdit"
        flat
        round
        size="md"
        icon="mode_edit"
        color="primary"
        class="show-detail"
        @click.prevent.stop="showNoteOptions()"
      />
      <q-btn
        v-if="value.type === 'vp' || value.type === 'cs'"
        flat
        icon="zoom_in"
        color="primary"
        size="sm"
        class="zoom"
        :label="nbChilds"
        @click="zoom()"
      />
    </div>
    <!-- needed for textarea sizing bug -->
    <div
      class="text-box"
      :style="{ 'background-image': `url(${getFileUrl(value.image)})` }"
      :class="{ image: value.image }"
      @click.prevent.stop
    >
      <textarea
        ref="textarea"
        placeholer="text"
        class="text"
        :class="{
          'hide-label': !value.showLabel || canvasSettings.hideAllLabels,
        }"
        :value="value.text"
        :style="{ 'font-size': `${fontSize}px` }"
        @click.prevent.stop
        @input="updateText"
        @focus="handleFocus"
        @keydown="handleKeyDown($event)"
        @keyup="handleKeyUp($event)"
      ></textarea>
    </div>
    <div class="calcvar-display q-gutter-sm items-center">
      <q-btn
        v-if="calcResults[value.calcId] && value.calcDisplayB"
        class="calcvar-display-b"
        dense
        padding="none xs"
        @click="showNoteOptions(true)"
      >
        {{ humanformat(calcResults[value.calcId][value.calcDisplayB]) }}
        <q-tooltip>{{ value.calcDisplayB }}</q-tooltip>
      </q-btn>
      <q-btn
        v-if="calcResults[value.calcId] && value.calcDisplayR"
        class="calcvar-display-r"
        dense
        padding="none xs"
        @click="showNoteOptions(true)"
      >
        {{ humanformat(calcResults[value.calcId][value.calcDisplayR]) }}
        <q-tooltip>{{ value.calcDisplayR }}</q-tooltip>
      </q-btn>
      <q-btn
        v-if="calcResults[value.calcId] && value.calcDisplayG"
        class="calcvar-display-g"
        dense
        @click.prevent.stop="showNoteOptions(true)"
      >
        {{ humanformat(calcResults[value.calcId][value.calcDisplayG]) }}
        <q-tooltip>{{ value.calcDisplayG }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import debounce from 'lodash.debounce'
import isEqual from 'lodash.isequal'
import interact from 'interactjs'
import Note from '@/models/Note'
import ColorSelector from '@/components/bmc/ColorSelector.vue'
import { storeToRefs } from 'pinia'
import { VPC_VP_TYPES, VPC_CS_TYPES, VPC_TYPES } from '@/stores/bmc-store'
import { useBmcUIStore } from '@/stores/bmc-ui-store'
import { useBMCStore } from '@/stores/bmc-store'
import { useStorageStore } from '@/stores/storage'
import { COLORS_MATERIAL_DARK, COLORS_MATERIAL_HEX } from '@/utils/constants'
import { humanformat } from '@/utils/filters'
import type { BMCNote } from '@/components/models'

const MIN_FONT_SIZE = 10
let MAX_FONT_SIZE = 24
const MIN_HEIGHT = 5
const MAX_HEIGHT = 20

const props = defineProps<{
  value: BMCNote
  parent: HTMLElement
  focus?: boolean
}>()

const instance = getCurrentInstance()

const bmcUiStore = useBmcUIStore()
const { layout } = storeToRefs(bmcUiStore)

const bmcStore = useBMCStore()
const { canvasSettings, calcResults } = storeToRefs(bmcStore)
const {
  getNotesByTypes,
  noteMoveToTop,
  noteUpdate,
  noteMoveLocal,
  noteDelete,
  noteCreate,
  canvasUserSettingsUpdate,
} = bmcStore

const storageStore = useStorageStore()
const { getFileUrl } = storageStore

const colorsBG = COLORS_MATERIAL_HEX
const colorList = COLORS_MATERIAL_DARK

const x = ref(0)
const y = ref(0)
const dx = ref(0)
const height = ref(MIN_HEIGHT)
const dragging = ref(false)
const dragStartType = ref('')
const fontSize = ref(MAX_FONT_SIZE)
const opacity = ref(1)
const boxShadow = ref('')
const focused = ref(false)
const textarea = ref<HTMLTextAreaElement>()

let debouncedCalculateFontSizeAndHeight: ReturnType<typeof debounce> | null = null

const nbChilds = computed(() => {
  return (props.value.children && props.value.children.length) || ''
})

const colorsVisibility = computed(() => canvasSettings.value.colorsVisibility)
const listMode = computed(() => canvasSettings.value.listMode)
const hideColors = computed(() => canvasSettings.value.hideColors)
const colors = computed(() => props.value.colors)
const color = computed(() => props.value.colors[0] || 0)
const direction = computed(() => (props.value.top > 70 ? 'up' : 'down'))

const isEdit = computed(() => {
  if (layout.value.focusedNoteId && props.value && layout.value.focusedNoteId === props.value.$id) {
    if (!focused.value) {
      nextTick(() => {
        textarea.value?.focus()
        focused.value = true
      })
    }
    return true
  }
  focused.value = false
  return false
})

const left = computed(() => (listMode.value ? props.value.listLeft : props.value.left))
const top = computed(() => (listMode.value ? props.value.listTop : props.value.top))
const angle = computed(() => (listMode.value ? 0 : props.value.angle))

const highlight = computed(() => {
  if (!instance?.proxy?.$route) return false
  return [instance.proxy.$route.query.zoom1, instance.proxy.$route.query.zoom2].indexOf(props.value.$id) > -1
})

const transform = computed(() => {
  if (dragging.value) {
    return `rotateZ(${
      angle.value - (dx.value > 0 ? Math.min(dx.value, 8) : Math.max(dx.value, -8))
    }deg)`
  }
  return `rotateZ(${angle.value}deg)`
})

const showAsSticky = computed(() => props.value.showAsSticky)

function setOpacity() {
  if (layout.value.presentation && props.value.hidden) {
    opacity.value = 0
  } else {
    // calculate visibility based on colors
    opacity.value = colorsVisibility.value.reduce((totalOpacity: number, opacityVal: number, colorId: number) => {
      if (props.value.colors.includes(colorId)) {
        totalOpacity += opacityVal
      }
      return Math.min(totalOpacity, 1)
    }, 0)
  }
}

function setBoxShadow() {
  boxShadow.value = props.value.colors
    .reduce((shadows: string[], colorCode: number, i: number) => {
      if (hideColors.value) {
        return shadows
      } else if (listMode.value || !props.value.showAsSticky) {
        const size = (i + 1) * 5 + i * 2
        shadows.push(`-${size}px 0px ${COLORS_MATERIAL_HEX[colorCode]}`)
        shadows.push(`-${size + 2}px 0px ${dragging.value ? 'transparent' : '#fff'}`)
      } else if (i === 0) {
        shadows.push('0px 1px 2px rgba(0, 0, 0, 0.3)')
      } else {
        const size = i * 5 + 1
        shadows.push(`-${size}px -${size}px ${COLORS_MATERIAL_HEX[colorCode]}`)
      }
      return shadows
    }, [])
    .join(',')
}

function showNoteOptions(showNoteOptionsCalc?: boolean) {
  layout.value.showNoteOptions = true
  layout.value.focusedNoteId = props.value.$id
  layout.value.showNoteOptionsCalc = Boolean(showNoteOptionsCalc)
}

function handleKeyDown(e: KeyboardEvent) {
  const allowEdit = layout.value.isEditable && !(props.value as any).isGame
  if (!allowEdit) {
    e.preventDefault()
  }
  return allowEdit
}

function handleKeyUp(e: KeyboardEvent) {
  if ([35, 36, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
    return
  }
  if (e.keyCode === 13 && e.ctrlKey) {
    if (!instance?.proxy?.$el || !props.parent) return
    const leftVal = (instance.proxy.$el.offsetLeft / instance.proxy.$el.parentElement.offsetWidth) * 100
    const topVal =
      ((instance.proxy.$el.offsetTop + instance.proxy.$el.offsetHeight + 20) / props.parent.offsetHeight) * 100
    noteCreate({
      type: props.value.type,
      left: leftVal,
      top: topVal,
      listLeft: leftVal,
      listTop: topVal,
    })
    return
  }
  if (e.keyCode === 27) {
    if (props.value.text === '') {
      removeIfEmpty()
      return
    }
  }
  debouncedCalculateFontSizeAndHeight?.()
}

function moveToTop() {
  noteMoveToTop(props.value.$id)
}

function handleFocus() {
  layout.value.focusedNoteId = props.value.$id
  moveToTop()
}

function handleWheel(e: WheelEvent) {
  if (!listMode.value) {
    const delta = (e.deltaY - (e.deltaY % 100)) / 50
    noteUpdate({
      note: props.value,
      changes: {
        angle: props.value.angle + delta,
      },
    })
  }
}

function removeIfEmpty() {
  if (props.value.text === '' && props.value.image === '') {
    noteDelete(props.value)
  }
}

function sortSortable(type: string, options?: any) {
  let zoneTop = 0
  let zoneLeft = -10 // for tmp outside of paper
  let zoneHeight = 100
  let zoneWidth = 100
  const offsetLeft = 1
  const offsetTop = 5
  const marginLeft = 1
  const marginTop = 1
  const zone = document.getElementById(type)

  if (zone) {
    zoneTop = parseFloat(zone.style.top)
    zoneLeft = parseFloat(zone.style.left)
    zoneHeight = parseFloat(zone.style.height)
    zoneWidth = parseFloat(zone.style.width)
    if (type === 'solution') {
      zoneWidth = 20
      zoneLeft = 20
    }
    if (type === 'pain_gain') {
      zoneWidth = 20
      zoneLeft = 60
    }
    if (type === 'job') {
      zoneWidth = 20
      zoneLeft = 80
    }
  }
  let ordered = getNotesByTypes(type)
  if (VPC_TYPES.includes(type)) {
    ordered = ordered.filter((note: any) => {
      let matched = false
      if (layout.value.selectedVP) {
        matched = note.parent === layout.value.selectedVP.$id
      }
      if (!matched && layout.value.selectedCS) {
        matched = note.parent === layout.value.selectedCS.$id
      }
      return matched
    })
  }

  ordered.sort((a: any, b: any) => {
    if (a.listLeft - b.listLeft > 10) {
      return 1
    }
    if (b.listLeft - a.listLeft > 10) {
      return -1
    }
    return a.listTop - b.listTop
  })

  let topPos = zoneTop + offsetTop
  let leftPos = zoneLeft + offsetLeft
  ordered.forEach((note: any) => {
    if (topPos + note.height > zoneTop + zoneHeight) {
      topPos = zoneTop + offsetTop
      leftPos += zoneWidth / 2.0 + marginLeft
    }

    // only dispatch for notes not in the exclude list
    if (!(options && options.exclude && options.exclude.$id === note.$id)) {
      if (options && options.save) {
        noteUpdate({
          note,
          changes: {
            listTop: topPos,
            listLeft: leftPos,
          },
        })
      } else {
        noteMoveLocal({
          note,
          listTop: topPos,
          listLeft: leftPos,
        })
      }
    }
    topPos += note.height + marginTop
  })
}

function createDebouncedCalculateFontSizeAndHeight() {
  return debounce(calculateFontSizeAndHeight, 300, {
    leading: true,
  })
}

function calculateFontSizeAndHeight(previous?: any[]) {
  if (!textarea.value || !instance?.proxy?.$el) {
    return
  }
  // TODO: cache it
  MAX_FONT_SIZE = instance.proxy.$el.parentNode.parentNode.offsetHeight * 0.03
  if (!Array.isArray(previous)) {
    previous = []
    fontSize.value = Math.min(fontSize.value, MAX_FONT_SIZE)
  }
  previous.unshift({
    height: height.value,
    fontSize: fontSize.value,
  })

  let minedOutFont = false
  let maxedOutFont = false
  let minedOutHeight = false
  let maxedOutHeight = false
  let fontChanged = false

  if (textarea.value.scrollWidth > textarea.value.offsetWidth) {
    if (fontSize.value > MIN_FONT_SIZE) {
      fontSize.value -= 1
      fontChanged = true
    } else {
      minedOutFont = true
    }
  }

  if (textarea.value.scrollHeight > textarea.value.offsetHeight) {
    if (height.value < MAX_HEIGHT) {
      height.value += 0.5
    } else {
      maxedOutHeight = true
      if (!fontChanged) {
        if (fontSize.value > MIN_FONT_SIZE) {
          fontSize.value -= 1
          fontChanged = true
        } else {
          minedOutFont = true
        }
      }
    }
  }

  if (textarea.value.scrollWidth <= textarea.value.offsetWidth && !fontChanged) {
    if (fontSize.value < MAX_FONT_SIZE) {
      fontSize.value += 1
      fontChanged = true
    } else {
      maxedOutFont = true
    }
  }

  if (
    textarea.value.scrollHeight <= textarea.value.offsetHeight &&
    (!fontChanged || minedOutFont)
  ) {
    if (fontSize.value < MAX_FONT_SIZE && !minedOutFont) {
      fontSize.value += 1
    } else {
      maxedOutFont = true
      if (height.value > MIN_HEIGHT) {
        height.value -= 0.5
      } else {
        minedOutHeight = true
      }
    }
  }
  // store height to compute list mode positions
  noteMoveLocal({ note: props.value, height: height.value })

  // loop if not min/maxed or in stable state.
  let twoAgo
  if (previous.length > 1) {
    twoAgo = previous.pop()
  }
  if (
    !((maxedOutHeight && minedOutFont) || (minedOutHeight && maxedOutFont)) &&
    (!twoAgo || !(twoAgo.height === height.value && twoAgo.fontSize === fontSize.value))
  ) {
    nextTick(() => {
      calculateFontSizeAndHeight(previous)
    })
  } else {
    // done
    noteUpdate({
      changes: { height: height.value },
      note: props.value,
    })

    if (listMode.value) {
      sortSortable(props.value.type, { save: true })
    }
  }
}

function setColor(position: number, colorId: number) {
  const newColors = Note.changeColor(props.value.colors, position, colorId)
  noteUpdate({
    changes: { colors: newColors },
    note: props.value,
  })
  canvasUserSettingsUpdate({
    lastUsedColors: newColors,
  })
}

function zoom() {
  layout.value[`selected${props.value.type.toUpperCase()}`] = props.value
}

function updateText(e: Event) {
  const target = e.target as HTMLTextAreaElement
  noteUpdate({
    changes: { text: target.value },
    note: props.value,
  })
}

// Watchers
watch(isEdit, (val) => {
  if (!val) {
    removeIfEmpty()
    sortSortable(props.value.type)
  }
})

watch(colors, (after, before) => {
  if (!isEqual(after, before)) {
    setOpacity()
    setBoxShadow()
  }
})

watch(colorsVisibility, (after, before) => {
  if (!isEqual(after, before)) {
    setOpacity()
  }
})

watch(showAsSticky, (after, before) => {
  if (after !== before) {
    setBoxShadow()
  }
})

watch(listMode, (after, before) => {
  if (after !== before) {
    setBoxShadow()
  }
})

watch(hideColors, (after, before) => {
  if (after !== before) {
    setBoxShadow()
  }
})

watch(
  () => props.value.hidden,
  (after, before) => {
    if (after !== before) {
      setOpacity()
    }
  }
)

watch(
  () => layout.value.presentation,
  (after, before) => {
    if (after !== before) {
      setOpacity()
    }
  }
)

onMounted(() => {
  debouncedCalculateFontSizeAndHeight = createDebouncedCalculateFontSizeAndHeight()
  window.addEventListener('resize', debouncedCalculateFontSizeAndHeight)

  if (instance?.proxy?.$el) {
    const el = instance.proxy.$el
    ;(interact(el as any) as any)
      .draggable({
        inertia: true,
        restrict: {
          restriction: '.canvas',
          endOnly: true,
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
        },
        autoScroll: true,
        onstart: () => {
          dragStartType.value = props.value.type
          dragging.value = true
          x.value = el.offsetLeft
          y.value = el.offsetTop
          moveToTop()
        },
        onmove: (event: any) => {
          x.value += event.dx
          y.value += event.dy
          dx.value = event.dx
          const leftVal = (parseFloat(String(x.value)) / props.parent.offsetWidth) * 100
          const topVal = (parseFloat(String(y.value)) / props.parent.offsetHeight) * 100

          let type = ''
          if (event.dropzone && event.dropzone.target) {
            type = event.dropzone.target.getAttribute('id')
          } else {
            type = props.parent.getAttribute('data-none') || ''
          }
          if (listMode.value) {
            noteMoveLocal({
              note: props.value,
              listLeft: leftVal,
              listTop: topVal,
              type,
            })
          } else {
            noteMoveLocal({
              note: props.value,
              left: leftVal,
              top: topVal,
              type,
            })
          }

          sortSortable(type, {
            exclude: props.value,
          })
        },
        onend: (event: any) => {
          dragging.value = false
          let newtype = ''
          if (event.relatedTarget) {
            newtype = event.relatedTarget.getAttribute('id')
          } else {
            newtype = props.parent.getAttribute('data-none') || ''
          }

          const payload: any = {
            note: props.value,
            changes: {
              type: newtype,
            },
          }
          if (listMode.value) {
            payload.changes.listLeft = props.value.listLeft
            payload.changes.listTop = props.value.listTop
          } else {
            payload.changes.left = props.value.left
            payload.changes.top = props.value.top
          }
          noteUpdate(payload)
          sortSortable(newtype, { save: true })
        },
      })
      .on('doubletap', () => {
        noteUpdate({
          note: props.value,
          changes: {
            showAsSticky: !props.value.showAsSticky,
          },
        })
      })
      .gesturable({
        onmove: (event: any) => {
          noteUpdate({
            note: props.value,
            changes: {
              angle: props.value.angle + event.da,
            },
          })
        },
      })
  }

  setBoxShadow()
  setOpacity()
  nextTick(() => {
    setTimeout(calculateFontSizeAndHeight, 500)
  })
})

onBeforeUnmount(() => {
  if (debouncedCalculateFontSizeAndHeight) {
    window.removeEventListener('resize', debouncedCalculateFontSizeAndHeight)
  }
})

defineExpose({
  humanformat,
})
</script>

<style>
.bmc.print .note .icons .q-btn {
  display: none;
}

.draggable {
  transform: translate(0px, 0px);
}

.note {
  border: 0px;
  margin: 0px;
  width: 15%;
  height: 40px;
  position: absolute;
  top: 0;
  left: 0;
  line-height: 1.1;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease,
    background-color 0.2s ease;
}

.note.highlight-note:before {
  box-shadow: 0 0 10px 3px #f44336;
  content: '';
  display: block;
  height: 100%;
  width: 100%;
}

.note.dragging {
  box-shadow: 0px 3px 4px rgba(0, 0, 0, 0.4) !important;
}

.note.dragging .colors {
  opacity: 0;
}

.note:not(.list-mode).no-sticky {
  background-color: transparent !important;
}

.note.list-mode.dragging,
.note:not(.list-mode).no-sticky.dragging {
  background-color: #fff !important;
}

.note.list-mode {
  background-color: transparent !important;
  width: 18%;
}

.note.hide-colors {
  background-color: transparent !important;
}

.note .text-box {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: 4px;
}

.note .text-box.image {
  background-position: 50% 50%;
  background-size: contain;
  background-repeat: no-repeat;
}

.note .text-box.image textarea {
  text-shadow: 1px 1px 1px #b5b5b5;
}

.note.list-mode .text-box.image {
  background-position: 100% 50%;
}

.note.list-mode .text-box {
  margin: 0 4px;
}

.note textarea {
  overflow-wrap: normal;
  overflow: hidden;
  text-align: center;
  resize: none;
  padding: 0;
  margin: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  border: none;
  outline: none;
  background-color: transparent;
  font-family: 'Itim', cursive, sans-serif;
  color: #333;
}

.note textarea.hide-label {
  opacity: 0;
}

.note.list-mode textarea {
  text-align: left;
}

.note .icons {
  position: absolute;
  bottom: -12px;
  right: -12px;
  left: -12px;
  z-index: 1;
  display: flex;
  pointer-events: none;
}

.note.list-mode .icons {
  position: absolute;
  bottom: 0;
}

.note .icons .q-btn {
  margin: 0;
  pointer-events: all;
}

.note .colors {
  position: absolute;
  top: -50px;
  left: -40px;
  display: flex;
  align-items: flex-start;
  opacity: 1;
  transition: opacity 0.1s ease;
}

.note .colors .q-btn {
  margin: 4px;
}

.note .calcvar-display {
  position: absolute;
  top: -20px;
  right: -20px;
  display: flex;
}

.note .calcvar-display-r {
  color: #d32f2f;
  background-color: rgba(229, 115, 115, 0.7);
}

.note .calcvar-display-g {
  color: #558b2f;
  background-color: rgba(139, 195, 74, 0.7);
}

.note .calcvar-display-b {
  color: #2196f3;
  background-color: rgba(144, 202, 249, 0.7);
}
</style>
