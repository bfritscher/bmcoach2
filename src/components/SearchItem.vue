<template>
  <q-item v-ripple clickable :to="toRoute">
    <q-item-section side>
      <q-icon :name="icon" />
    </q-item-section>
    <q-item-section>
      <q-item-label>{{
        item.data?.name || item.data?.title || item.data?.text || item.data?.business
      }}</q-item-label>
      <q-item-label v-if="parentItem" caption>
        {{ parentItem.data?.title }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>
<script setup lang="ts">
import { useSearchStore } from '@/stores/search'
import { isOfTypeBMC } from '@/stores/bmc-store'
import { TYPE_SC_FACTOR, TYPE_SC_SERIE, isOfTypeSC } from '@/stores/chart-store'
import { computed } from 'vue'
import { ICONS as BMC_ICONS } from '@/utils/constants'
import type { RouteLocationNamedRaw } from 'vue-router'

const props = defineProps<{
  item: any
}>()
const searchStore = useSearchStore()

function routeLookup(type: string): string {
  if (isOfTypeBMC(type)) {
    return 'BusinessModelCanvas'
  }
  if (isOfTypeSC(type)) {
    return 'StrategyCanvas'
  }
  return ''
}

const parentItem = computed(() => {
  // TODO is there a story for multiple parents?
  const parents = searchStore.getParentCanvas(props.item.$id)
  if (parents.length > 0) {
    return parents[0]
  }
  return null
})

const toRoute = computed(() => {
  const route:RouteLocationNamedRaw = {
    name: routeLookup(props.item.type),
    params: {
      teamId: props.item.team.$id,
      id: props.item.$id,
    },
  }
  if (parentItem.value && route.params) {
    route.params.id = parentItem.value.$id
    if (isOfTypeBMC(props.item.type)) {
      route.query = {
        zoom1: props.item.$id,
      }
    }
  }
  return route
})

const icon = computed(() => {
  if (isOfTypeBMC(props.item.type)) {
    if (props.item.data.type in BMC_ICONS) {
      return BMC_ICONS[props.item.data.type as keyof typeof BMC_ICONS]
    }
    return 'img:/icons/bmc_logo.svg'
  }
  if (isOfTypeSC(props.item.type)) {
    if (props.item.type === TYPE_SC_SERIE) {
      return 'store'
    }
    if (props.item.type === TYPE_SC_FACTOR) {
      return 'bar_chart'
    }
    return 'img:/icons/strategy_canvas_logo.svg'
  }
  return 'help_outline'
})
</script>
