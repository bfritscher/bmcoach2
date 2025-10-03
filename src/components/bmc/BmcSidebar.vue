<template>
  <div>
    <q-list>
      <q-item v-ripple exact clickable :to="{ name: 'team' }">
        <q-item-section avatar>
          <q-icon name="home" />
        </q-item-section>
        <q-item-section> Team Home </q-item-section>
      </q-item>

      <q-item v-ripple clickable>
        <q-item-section avatar title="Learn">
          <q-icon name="school" />
        </q-item-section>
        <q-item-section> Learn </q-item-section>
      </q-item>
      <q-item v-ripple clickable>
        <q-item-section avatar title="Play">
          <q-icon name="games" />
        </q-item-section>
        <q-item-section> Play </q-item-section>
      </q-item>
      <q-item v-ripple clickable>
        <q-item-section avatar title="Feedback">
          <q-icon name="feedback" />
        </q-item-section>
        <q-item-section> Ideas &amp; Feedback </q-item-section>
      </q-item>
      <q-separator spaced />
      <q-item-label header>DISPLAY OPTIONS</q-item-label>
      <q-item v-ripple clickable @click="presentationStart">
        <q-item-section avatar title="Start presentation">
          <q-icon name="slideshow" />
        </q-item-section>
        <q-item-section> Start presentation </q-item-section>
      </q-item>

      <q-item v-ripple clickable @click="changeColorMode">
        <q-item-section avatar :title="colorModeSwitch.text">
          <q-icon :name="colorModeSwitch.icon" />
        </q-item-section>
        <q-item-section>
          {{ colorModeSwitch.text }}
        </q-item-section>
      </q-item>

      <q-expansion-item
        :model-value="!canvasSettings.hideColors && canvasSettings.isColorsOpen"
        class="menu-color-group"
        icon="color_lens"
        label="Colors visibility"
        :disable="canvasSettings.hideColors"
        @update:model-value="canvasSettings.isColorsOpen = $event"
      >
        <q-item v-if="layout.currentCanvasUsedColors.size === 0">
          <q-item-section>No used colors</q-item-section>
        </q-item>

        <q-item
          v-for="(colorCode, colorId) in COLORS_MATERIAL"
          v-show="layout.currentCanvasUsedColors.has(colorId)"
          :key="colorId"
        >
          <q-btn-toggle
            unelevated
            :style="{ 'background-color': colorCode }"
            :toggle-color="COLORS_MATERIAL_DARK[colorId]"
            :options="[
              { label: 'off', value: 0 },
              { label: '1/4', value: 0.25 },
              { label: '1/2', value: 0.5 },
              { label: '3/4', value: 0.75 },
              { label: 'on', value: 1 },
            ]"
            :model-value="canvasSettings.colorsVisibility[colorId]"
            @update:model-value="toggleColorVisibility($event, colorId)"
          />
        </q-item>
      </q-expansion-item>

      <q-item v-ripple clickable @click="changeLabelMode">
        <q-item-section avatar :title="labelModeSwitch.text">
          <q-icon :name="labelModeSwitch.icon" />
        </q-item-section>
        <q-item-section>
          {{ labelModeSwitch.text }}
        </q-item-section>
      </q-item>

      <q-item v-ripple clickable @click="changeListMode">
        <q-item-section avatar :title="listModeSwitch.text">
          <q-icon :name="listModeSwitch.icon" />
        </q-item-section>
        <q-item-section>
          {{ listModeSwitch.text }}
        </q-item-section>
      </q-item>

      <q-separator spaced />
      <q-item-label header>PROJECT OPTIONS</q-item-label>

      <q-item v-ripple clickable @click="printCanvas()">
        <q-item-section avatar title="Print canvas">
          <q-icon name="print" />
        </q-item-section>
        <q-item-section> Print canvas </q-item-section>
      </q-item>

      <q-item v-ripple clickable @click="duplicateCanvas()">
        <q-item-section avatar title="Duplicate canvas">
          <q-icon name="content_copy" />
        </q-item-section>
        <q-item-section> Duplicate canvas </q-item-section>
      </q-item>
      <template v-if="layout.isEditable">
        <q-item v-ripple clickable @click.stop="rightDrawerOpen = true">
          <q-item-section avatar title="Presentation order">
            <q-icon name="format_list_numbered" />
          </q-item-section>
          <q-item-section> Presentation order </q-item-section>
        </q-item>
      </template>
    </q-list>
  </div>
</template>
<script>
import { COLORS_MATERIAL, COLORS_MATERIAL_DARK } from '/src/utils/constants'
import { mapState, mapWritableState, mapActions } from 'pinia'
import { useBmcUIStore } from '@/stores/bmc-ui-store'
import { useBMCStore } from '@/stores/bmc-store'
import { useUIStore } from '@/stores/ui-store'

export default {
  name: 'BmcSidebar',
  components: {},
  data() {
    return {
      COLORS_MATERIAL,
      COLORS_MATERIAL_DARK,
      showDialogSettings: false,
      showConfirmRemoveUser: false,
      showConfirmDeleteInvitation: false,
      showDialogInvite: false,
      inviteEmail: '',
    }
  },
  computed: {
    ...mapWritableState(useUIStore, ['rightDrawerOpen']),
    ...mapState(useBmcUIStore, ['layout']),
    ...mapState(useBMCStore, ['canvasSettings', 'canvas']),
    colorModeSwitch() {
      return this.canvasSettings.hideColors
        ? { text: 'Show colors', icon: 'invert_colors' }
        : { text: 'Hide colors', icon: 'invert_colors_off' }
    },
    listModeSwitch() {
      return this.canvasSettings.listMode
        ? { text: 'Display as sticky notes', icon: 'widgets' }
        : { text: 'Display as lists', icon: 'list' }
    },
    labelModeSwitch() {
      return this.canvasSettings.hideAllLabels
        ? { text: 'Show labels', icon: 'label' }
        : { text: 'Hide all labels', icon: 'label_outline' }
    },
  },
  methods: {
    ...mapActions(useBMCStore, ['presentationStart']),
    changeListMode() {
      this.canvasSettings.listMode = !this.canvasSettings.listMode
    },
    changeColorMode() {
      this.canvasSettings.hideColors = !this.canvasSettings.hideColors
    },
    changeLabelMode() {
      this.canvasSettings.hideAllLabels = !this.canvasSettings.hideAllLabels
    },
    showColors() {
      if (this.layout.mini) {
        this.layout.mini = false
        this.canvasSettings.isColorsOpen = true
      }
    },
    toggleColorVisibility(value, colorId) {
      const newArray = this.canvasSettings.colorsVisibility.slice(0)
      newArray[colorId] = value
      this.canvasSettings.colorsVisibility = newArray
    },
    deleteCanvas() {
      // TODO?
    },
  },
}
</script>
