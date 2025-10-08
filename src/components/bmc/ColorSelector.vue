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

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { COLORS_MATERIAL_DARK } from '@/utils/constants'

const props = withDefaults(
  defineProps<{
    canDelete?: boolean
    value?: number
    small?: boolean
    hide?: number[]
    direction?: 'up' | 'right' | 'down' | 'left'
  }>(),
  {
    canDelete: false,
    value: -1,
    small: false,
    hide: () => [],
    direction: 'down',
  }
)

const emit = defineEmits<{
  input: [value: number]
}>()

const isOpen = ref(false)

const icon = computed(() => {
  if (isOpen.value) {
    return 'close'
  }
  if (props.value > -1 && !props.small) {
    return 'color_lens'
  }
  if (props.value === -1) {
    return 'add'
  }
  return ''
})

watch(isOpen, (val) => {
  if (val && props.hide.length === 5) {
    let last = 0
    while (props.hide.indexOf(last) > -1) {
      last += 1
    }
    emit('input', last)
    nextTick(() => {
      isOpen.value = false
    })
  }
})

function setColor(colorId: number) {
  emit('input', colorId)
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
