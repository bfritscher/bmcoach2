<template>
  <q-toolbar-title shrink> Strategy Canvas </q-toolbar-title>
  <div class="row justify-center items-center" style="flex: 1">
    <q-btn
      flat
      class="text-h5"
      :label="chartStore.chart.title"
      :disable="!chartStore.chart.editCode"
      @click="showEditTitle()"
    >
      <q-tooltip>Click to change title</q-tooltip>
    </q-btn>
    <q-btn icon="help" flat round @click="showHandbookDialog()">
      <q-tooltip>Handbook</q-tooltip>
    </q-btn>
  </div>
  <q-btn icon="settings" flat>
    <q-menu style="min-width: 200px">
      <q-list>
        <q-item-label header>Marker Size</q-item-label>
        <q-item>
          <q-item-section side>
            <q-icon name="text_decrease" />
          </q-item-section>
          <q-item-section>
            <q-slider v-model="uiStore.markerSize" label :min="0" :max="50" style="min-width: 100px;" />
          </q-item-section>
          <q-item-section side>
            <q-icon name="text_increase" />
          </q-item-section>
        </q-item>
        <q-separator inset spaced />
        <q-item v-ripple clickable>
          <q-item-section @click="chartStore.downloadJSON()">Export JSON</q-item-section>
        </q-item>
        <q-item v-ripple clickable @click="chartStore.downloadCSV()">
          <q-item-section>Export CSV</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useChartStore } from '@/stores/chart-store'
import { useUIStore } from '@/stores/ui-store'
import HandbookDialog from '@/components/strategycanvas/HandbookDialog.vue'

const chartStore = useChartStore()
const uiStore = useUIStore()
const $q = useQuasar()
function showHandbookDialog() {
  $q.dialog({
    component: HandbookDialog,
  })
}

function showEditTitle() {
  $q.dialog({
    title: 'Rename canvas',
    message: 'Enter a new name',
    prompt: {
      model: chartStore.chart.title,
      type: 'text',
      isValid: (v) => !!(v && v.length > 0),
    },
    ok: 'Save',
    cancel: 'Cancel',
    persistent: true,
  }).onOk((newTitle) => {
    chartStore.updateChart('title', newTitle)
  })
}
</script>
