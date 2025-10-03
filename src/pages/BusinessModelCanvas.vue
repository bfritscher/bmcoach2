<template>
  <q-page>
    <bmc-canvas v-if="canvasStore.canvas" />
  </q-page>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { useQuasar, useMeta } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useBMCStore } from '@/stores/bmc-store'
import { useBmcUIStore } from '@/stores/bmc-ui-store'
import BmcCanvas from '@/components/bmc/BmcCanvas.vue'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const canvasStore = useBMCStore()
const bmcUiStore = useBmcUIStore()

let shortcutsListener: any

onMounted(() => {
  shortcutsListener = document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.code === 'F5') {
      e.preventDefault()
      canvasStore.presentationStart()
    }
    if (bmcUiStore.layout.presentation) {
      if (e.code === 'Escape') {
        e.preventDefault()
        canvasStore.presentationExit()
      }
      if (e.code === 'ArrowLeft' || e.code === 'PageUp') {
        canvasStore.presentationPrevious()
      }
      if (e.code === 'ArrowRight' || e.code === 'PageDown') {
        canvasStore.presentationNext()
      }
    }
  })
})
onUnmounted(() => {
  document.removeEventListener('keydown', shortcutsListener)
})

watch(
  () => route.params,
  () => {
    if (canvasStore.canvas?.$id !== (route.params.id as string)) {
      if (route.params.id === 'new') {
        canvasStore.newCanvas()
        router.push({
          name: 'BusinessModelCanvas',
          params: { teamId: route.params.teamId, id: canvasStore.canvas.$id },
        })
        return
      }
      try {
        canvasStore.loadCanvas(route.params.id as string)
      } catch (e) {
        $q.notify({
          type: 'negative',
          message: 'Canvas not found',
        })
        router.push({
          name: 'BusinessModelCanvas',
          params: { id: 'new' },
        })
      }
    }
  },
  {
    immediate: true,
  },
)

useMeta(() => {
  return {
    title: canvasStore.canvas?.title,
    titleTemplate: (title) => `${title} - Business Model Canvas - BMCoach`,
  }
})
</script>
