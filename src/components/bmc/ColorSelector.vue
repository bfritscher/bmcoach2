<template>
  <q-fab
    v-model="isOpen"
    class="color-selector"
    :icon="icon"
    :class="{ 'top-index': isOpen }"
    :direction="direction"
    :color="COLORS_MATERIAL_DARK[value]"
    unelevated
    :outline="value === -1"
    :hide-icon="!isOpen && small && value > -1"
    :padding="small && icon ? 'sm' : 'md'"
  >
    <q-fab-action
      v-if="canDelete"
      class="color-selector-bg"
      :class="'direction-' + direction"
      icon="format_color_reset"
      outline
      @click="setColor(value)"
    />
    <q-fab-action
      v-for="(colorCode, colorId) in COLORS_MATERIAL_DARK"
      v-show="value !== colorId && hide.indexOf(colorId) === -1"
      :key="colorId"
      :color="colorCode"
      unelevated
      @click="setColor(colorId)"
    />
  </q-fab>
</template>

<script>
import { COLORS_MATERIAL_DARK } from '@/utils/constants'

export default {
  name: 'ColorSelector',
  props: {
    canDelete: {
      default: false,
      type: Boolean,
    },
    value: {
      default: -1,
      type: Number,
    },
    small: {
      default: false,
      type: Boolean,
    },
    hide: {
      default: () => [],
      type: Array,
    },
    direction: {
      default: 'bottom',
      type: String,
    },
  },
  emits: ['input'],
  data() {
    return {
      isOpen: false,
      COLORS_MATERIAL_DARK,
    }
  },
  computed: {
    icon() {
      if (this.isOpen) {
        return 'close'
      }
      if (this.value > -1 && !this.small) {
        return 'color_lens'
      }
      if (this.value == -1) {
        return 'add'
      }
      return ''
    },
  },
  watch: {
    isOpen(val) {
      if (val && this.hide.length === 5) {
        let last = 0
        while (this.hide.indexOf(last) > -1) {
          last += 1
        }
        this.$emit('input', last)
        this.$nextTick(() => {
          this.isOpen = false
        })
      }
    },
  },
  methods: {
    setColor(colorId) {
      this.$emit('input', colorId)
    },
  },
}
</script>

<style>
.color-selector.top-index {
  z-index: 99;
}

.color-selector-bg {
  background-color: rgba(255, 255, 255, 0.8) !important;
}

.color-selector .direction-up {
  margin-top: 80px !important;
  margin-bottom: -120px !important;
}

.color-selector .direction-down {
  margin-top: -120px !important;
  margin-bottom: 80px !important;
}
</style>
