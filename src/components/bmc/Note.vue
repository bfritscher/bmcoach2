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

<script>
import debounce from 'lodash.debounce'
import isEqual from 'lodash.isequal'
import interact from 'interactjs'
import Note from '@/models/Note'
import ColorSelector from '@/components/bmc/ColorSelector.vue'
import { mapState, mapActions } from 'pinia'
import { VPC_VP_TYPES, VPC_CS_TYPES, VPC_TYPES } from '@/stores/bmc-store'
import { useBmcUIStore } from '@/stores/bmc-ui-store'
import { useBMCStore } from '@/stores/bmc-store'
import { useStorageStore } from '@/stores/storage'
import { COLORS_MATERIAL_DARK, COLORS_MATERIAL_HEX } from '@/utils/constants'
import { humanformat } from '@/utils/filters'

const MIN_FONT_SIZE = 10
let MAX_FONT_SIZE = 24
const MIN_HEIGHT = 5
const MAX_HEIGHT = 20

export default {
  name: 'CanvasNote',
  components: {
    ColorSelector,
  },
  props: ['value', 'parent', 'focus'],
  data() {
    return {
      x: 0,
      y: 0,
      dx: 0,
      height: MIN_HEIGHT,
      dragging: false,
      dragStartType: '',
      fontSize: MAX_FONT_SIZE,
      colorList: COLORS_MATERIAL_DARK,
      colorsBG: COLORS_MATERIAL_HEX,
      opacity: 1,
      boxShadow: '',
      focused: false,
    }
  },
  computed: {
    ...mapState(useBmcUIStore, ['layout']),
    ...mapState(useBMCStore, ['canvasSettings', 'calcResults']),
    nbChilds() {
      return (this.value.children && this.value.children.length) || ''
    },
    colorsVisibility() {
      return this.canvasSettings.colorsVisibility
    },
    listMode() {
      return this.canvasSettings.listMode
    },
    hideColors() {
      return this.canvasSettings.hideColors
    },
    colors() {
      return this.value.colors
    },
    color() {
      return this.value.colors[0]
    },
    direction() {
      return this.value.top > 70 ? 'up' : 'down'
    },
    isEdit() {
      if (this.layout.focusedNoteId && this.value && this.layout.focusedNoteId === this.value.$id) {
        if (!this.focused) {
          //eslint-disable-next-line
          this.$nextTick(() => {
            this.$refs.textarea.focus()
            //eslint-disable-next-line
            this.focused = true
          })
        }
        return true
      }
      //eslint-disable-next-line
      this.focused = false
      return false
    },
    left() {
      return this.listMode ? this.value.listLeft : this.value.left
    },
    top() {
      return this.listMode ? this.value.listTop : this.value.top
    },
    angle() {
      return this.listMode ? 0 : this.value.angle
    },
    highlight() {
      return [this.$route.query.zoom1, this.$route.query.zoom2].indexOf(this.value.$id) > -1
    },
    transform() {
      if (this.dragging) {
        return `rotateZ(${
          this.angle - (this.dx > 0 ? Math.min(this.dx, 8) : Math.max(this.dx, -8))
        }deg)`
      }
      return `rotateZ(${this.angle}deg)`
    },
    showAsSticky() {
      return this.value.showAsSticky
    },
  },
  watch: {
    isEdit(val) {
      if (!val) {
        this.removeIfEmpty()
        this.sortSortable(this.value.type)
      }
    },
    colors(after, before) {
      // TODO: deprecated require('node:util').isDeepStrictEqual
      if (!isEqual(after, before)) {
        this.setOpacity()
        this.setBoxShadow()
      }
    },
    colorsVisibility(after, before) {
      if (!isEqual(after, before)) {
        this.setOpacity()
      }
    },
    showAsSticky(after, before) {
      if (after !== before) {
        this.setBoxShadow()
      }
    },
    listMode(after, before) {
      if (after !== before) {
        this.setBoxShadow()
      }
    },
    hideColors(after, before) {
      if (after !== before) {
        this.setBoxShadow()
      }
    },
    'value.hidden': function valueHidden(after, before) {
      if (after !== before) {
        this.setOpacity()
      }
    },
    'layout.presentation': function layoutPresentation(after, before) {
      if (after !== before) {
        this.setOpacity()
      }
    },
  },
  mounted() {
    this.debouncedCalculateFontSizeAndHeight = this.createDebouncedCalculateFontSizeAndHeight()
    window.addEventListener('resize', this.debouncedCalculateFontSizeAndHeight)
    interact(this.$el)
      .draggable({
        inertia: true,
        restrict: {
          restriction: '.canvas',
          endOnly: true,
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
        },
        autoScroll: true,
        onstart: () => {
          this.dragStartType = this.value.type
          this.dragging = true
          this.x = this.$el.offsetLeft
          this.y = this.$el.offsetTop
          this.moveToTop()
        },
        onmove: (event) => {
          this.x += event.dx
          this.y += event.dy
          this.dx = event.dx
          const left = (parseFloat(this.x) / this.parent.offsetWidth) * 100
          const top = (parseFloat(this.y) / this.parent.offsetHeight) * 100

          let type = ''
          if (event.dropzone && event.dropzone.target) {
            type = event.dropzone.target.getAttribute('id')
          } else {
            type = this.parent.getAttribute('data-none')
          }
          if (this.listMode) {
            this.noteMoveLocal({
              note: this.value,
              listLeft: left,
              listTop: top,
              type,
            })
          } else {
            this.noteMoveLocal({
              note: this.value,
              left,
              top,
              type,
            })
          }

          this.sortSortable(type, {
            exclude: this.value,
          })
        },
        onend: (event) => {
          this.dragging = false
          let newtype = ''
          if (event.relatedTarget) {
            newtype = event.relatedTarget.getAttribute('id')
          } else {
            newtype = this.parent.getAttribute('data-none')
          }

          const payload = {
            note: this.value,
            changes: {
              type: newtype,
              left: this.left,
              top: this.top,
            },
          }
          // TODO: refactor make note note dependent almost same as in VPC
          // ignore tmp which is at position 0
          if (this.layout.selectedVP && VPC_VP_TYPES.indexOf(newtype) > 0) {
            payload.changes.parent = this.layout.selectedVP.$id
          }
          if (this.layout.selectedCS && VPC_CS_TYPES.indexOf(newtype) > 0) {
            payload.changes.parent = this.layout.selectedCS.$id
          }
          if (this.layout.isEditable) {
            this.noteUpdate(payload)
          }

          // update list modes
          this.sortSortable(newtype, { save: true })

          if (this.dragStartType !== newtype) {
            this.sortSortable(this.dragStartType, { save: true })
          }

          // update free mode
          if (this.listMode) {
            if (this.value.left === 0 && this.value.top === 0) {
              // never been positionned in free mode take list position
              this.noteUpdate({
                note: this.value,
                changes: {
                  left: this.value.listLeft,
                  top: this.value.listTop,
                },
              })
            } else if (this.dragStartType !== newtype) {
              // ratio if zone changed
              const start = document.getElementById(this.dragStartType)
              const end = document.getElementById(newtype)
              if (start && end) {
                const left =
                  ((this.value.left - parseFloat(start.style.left)) /
                    parseFloat(start.style.width)) *
                    parseFloat(end.style.width) +
                  parseFloat(end.style.left)

                const top =
                  ((this.value.top - parseFloat(start.style.top)) /
                    parseFloat(start.style.height)) *
                    parseFloat(end.style.height) +
                  parseFloat(end.style.top)
                this.noteUpdate({
                  note: this.value,
                  changes: {
                    left,
                    top,
                  },
                })
              }
            }
          }
        },
      })
      .gesturable({
        onmove: (event) => {
          const angle = this.value.angle || 0
          this.noteUpdate({
            note: this.value,
            changes: {
              angle: angle + event.da,
            },
          })
        },
      })

    this.setBoxShadow()
    this.setOpacity()
    this.$nextTick(() => {
      setTimeout(this.calculateFontSizeAndHeight, 500)
    })
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.debouncedCalculateFontSizeAndHeight)
  },

  methods: {
    ...mapActions(useBMCStore, [
      'getNotesByTypes',
      'noteMoveToTop',
      'noteUpdate',
      'noteMoveLocal',
      'noteDelete',
      'noteCreate',
      'canvasUserSettingsUpdate',
    ]),
    ...mapActions(useStorageStore, ['getFileUrl']),
    setOpacity() {
      if (this.layout.presentation && this.value.hidden) {
        this.opacity = 0
      } else {
        // calculate visibility based on colors
        this.opacity = this.colorsVisibility.reduce((totalOpacity, opacity, colorId) => {
          if (this.value.colors.includes(colorId)) {
            totalOpacity += opacity
          }
          return Math.min(totalOpacity, 1)
        }, 0)
      }
    },
    setBoxShadow() {
      this.boxShadow = this.value.colors
        .reduce((shadows, colorCode, i) => {
          if (this.hideColors) {
            return shadows
          } else if (this.listMode || !this.value.showAsSticky) {
            const size = (i + 1) * 5 + i * 2
            shadows.push(`-${size}px 0px ${COLORS_MATERIAL_HEX[colorCode]}`)
            shadows.push(`-${size + 2}px 0px ${this.dragging ? 'transparent' : '#fff'}`)
          } else if (i === 0) {
            shadows.push('0px 1px 2px rgba(0, 0, 0, 0.3)')
          } else {
            const size = i * 5 + 1
            shadows.push(`-${size}px -${size}px ${COLORS_MATERIAL_HEX[colorCode]}`)
          }
          return shadows
        }, [])
        .join(',')
    },
    showNoteOptions(showNoteOptionsCalc) {
      this.layout.showNoteOptions = true
      this.layout.focusedNoteId = this.value.$id
      this.layout.showNoteOptionsCalc = Boolean(showNoteOptionsCalc)
    },
    handleKeyDown(e) {
      const allowEdit = this.layout.isEditable && !this.value.isGame
      if (!allowEdit) {
        e.preventDefault()
      }
      return allowEdit
    },
    handleKeyUp(e) {
      if ([35, 36, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        return
      }
      if (e.keyCode === 13 && e.ctrlKey) {
        const left = (this.$el.offsetLeft / this.$el.parentElement.offsetWidth) * 100
        const top =
          ((this.$el.offsetTop + this.$el.offsetHeight + 20) / this.parent.offsetHeight) * 100
        this.noteCreate({
          type: this.value.type,
          left,
          top,
          listLeft: left,
          listTop: top,
        })
        return
      }
      if (e.keyCode === 27) {
        if (this.value.text === '') {
          this.removeIfEmpty()
          return
        }
      }
      this.debouncedCalculateFontSizeAndHeight()
    },
    moveToTop() {
      this.noteMoveToTop(this.value.$id)
    },
    handleFocus() {
      this.layout.focusedNoteId = this.value.$id
      this.moveToTop()
    },
    handleWheel(e) {
      if (!this.listMode) {
        const delta = (e.deltaY - (e.deltaY % 100)) / 50
        this.noteUpdate({
          note: this.value,
          changes: {
            angle: this.value.angle + delta,
          },
        })
      }
    },
    removeIfEmpty() {
      if (this.value.text === '' && this.value.image === '') {
        this.noteDelete(this.value)
      }
    }, // TODO move?
    sortSortable(type, options) {
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
      let ordered = this.getNotesByTypes(type)
      if (VPC_TYPES.includes(type)) {
        ordered = ordered.filter((note) => {
          let matched = false
          if (this.layout.selectedVP) {
            matched = note.parent === this.layout.selectedVP.$id
          }
          if (!matched && this.layout.selectedCS) {
            matched = note.parent === this.layout.selectedCS.$id
          }
          return matched
        })
      }

      ordered.sort((a, b) => {
        if (a.listLeft - b.listLeft > 10) {
          return 1
        }
        if (b.listLeft - a.listLeft > 10) {
          return -1
        }
        return a.listTop - b.listTop
      })

      let top = zoneTop + offsetTop
      let left = zoneLeft + offsetLeft
      ordered.forEach((note) => {
        if (top + note.height > zoneTop + zoneHeight) {
          top = zoneTop + offsetTop
          left += zoneWidth / 2.0 + marginLeft
        }

        // only dispatch for notes not in the exclude list
        if (!(options && options.exclude && options.exclude.$id === note.$id)) {
          if (options && options.save) {
            this.noteUpdate({
              note,
              changes: {
                listTop: top,
                listLeft: left,
              },
            })
          } else {
            this.noteMoveLocal({
              note,
              listTop: top,
              listLeft: left,
            })
          }
        }
        top += note.height + marginTop
      })
    },
    createDebouncedCalculateFontSizeAndHeight() {
      return debounce(this.calculateFontSizeAndHeight, 300, {
        leading: true,
      })
    },
    calculateFontSizeAndHeight(previous) {
      if (!this.$refs.textarea) {
        return
      }
      // TODO: cache it
      MAX_FONT_SIZE = this.$el.parentNode.parentNode.offsetHeight * 0.03
      if (!Array.isArray(previous)) {
        previous = []
        this.fontSize = Math.min(this.fontSize, MAX_FONT_SIZE)
      }
      previous.unshift({
        height: this.height,
        fontSize: this.fontSize,
      })

      let minedOutFont = false
      let maxedOutFont = false
      let minedOutHeight = false
      let maxedOutHeight = false
      let fontChanged = false

      if (this.$refs.textarea.scrollWidth > this.$refs.textarea.offsetWidth) {
        if (this.fontSize > MIN_FONT_SIZE) {
          this.fontSize -= 1
          fontChanged = true
        } else {
          minedOutFont = true
        }
      }

      if (this.$refs.textarea.scrollHeight > this.$refs.textarea.offsetHeight) {
        if (this.height < MAX_HEIGHT) {
          this.height += 0.5
        } else {
          maxedOutHeight = true
          if (!fontChanged) {
            if (this.fontSize > MIN_FONT_SIZE) {
              this.fontSize -= 1
              fontChanged = true
            } else {
              minedOutFont = true
            }
          }
        }
      }

      if (this.$refs.textarea.scrollWidth <= this.$refs.textarea.offsetWidth && !fontChanged) {
        if (this.fontSize < MAX_FONT_SIZE) {
          this.fontSize += 1
          fontChanged = true
        } else {
          maxedOutFont = true
        }
      }

      if (
        this.$refs.textarea.scrollHeight <= this.$refs.textarea.offsetHeight &&
        (!fontChanged || minedOutFont)
      ) {
        if (this.fontSize < MAX_FONT_SIZE && !minedOutFont) {
          this.fontSize += 1
        } else {
          maxedOutFont = true
          if (this.height > MIN_HEIGHT) {
            this.height -= 0.5
          } else {
            minedOutHeight = true
          }
        }
      }
      // store height to compute list mode positions
      this.noteMoveLocal({ note: this.value, height: this.height })

      // loop if not min/maxed or in stable state.
      let twoAgo
      if (previous.length > 1) {
        twoAgo = previous.pop()
      }
      if (
        !((maxedOutHeight && minedOutFont) || (minedOutHeight && maxedOutFont)) &&
        (!twoAgo || !(twoAgo.height === this.height && twoAgo.fontSize === this.fontSize))
      ) {
        this.$nextTick(() => {
          this.calculateFontSizeAndHeight(previous)
        })
      } else {
        // done
        this.noteUpdate({
          changes: { height: this.height },
          note: this.value,
        })

        if (this.listMode) {
          this.sortSortable(this.value.type, { save: true })
        }
      }
    },
    setColor(position, colorId) {
      const colors = Note.changeColor(this.value.colors, position, colorId)
      this.noteUpdate({
        changes: { colors },
        note: this.value,
      })
      this.canvasUserSettingsUpdate({
        lastUsedColors: colors,
      })
    },
    zoom() {
      this.layout[`selected${this.value.type.toUpperCase()}`] = this.value
    },
    updateText(e) {
      this.noteUpdate({
        changes: { text: e.target.value },
        note: this.value,
      })
    },
    humanformat,
  },
}
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
