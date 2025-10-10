<template>
  <div class="row justify-center items-center" style="flex: 1">
    <q-btn flat class="text-h6" :label="bmcStore.canvas.title" @click="showEditTitle()">
      <q-tooltip>Click to change title</q-tooltip>
    </q-btn>
  </div>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useBMCStore } from '@/stores/bmc-store'

const $q = useQuasar()
const bmcStore = useBMCStore()

function showEditTitle() {
  $q.dialog({
    title: 'Rename canvas',
    message: 'Enter a new name',
    prompt: {
      model: bmcStore.canvas.title,
      type: 'text',
      isValid: (v) => !!(v && v.length > 0),
    },
    ok: 'Save',
    cancel: 'Cancel',
    persistent: true,
  }).onOk((newTitle: string) => {
    bmcStore.updateItemData(bmcStore.canvas.$id, { title: newTitle })
  })
}
</script>
