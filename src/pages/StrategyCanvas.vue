<template>
  <q-page>
    <q-toolbar inset class="bg-white text-black">
      <div
        v-for="serie in chartStore.series"
        :key="serie.business"
        class="legend row no-wrap q-mr-md"
        :class="{ selected: uiStore.selectedSerieName === serie.business }"
      >
        <q-btn
          :class="uiStore.selectedSerieName === serie.business ? 'text-grey-8' : 'text-grey-4'"
          icon="edit"
          padding="xs"
          flat
          @click="uiStore.selectedSerieName = serie.business"
        ></q-btn>
        <q-btn padding="xs" flat>
          <my-marker :serie="serie" />
          <q-menu max-width="225px">
            <div>
              <div class="row">
                <div
                  v-for="color in colors"
                  :key="color"
                  aria-label="color"
                  class="color"
                  :class="{ selected: serie.color == color }"
                  :style="{ 'background-color': color }"
                  @click="chartStore.updateItemData(serie.$id, { color })"
                ></div>
              </div>
              <div class="row">
                <div
                  v-for="symbol in symbols"
                  :key="symbol"
                  aria-label="symbol"
                  class="color"
                  :class="{ selected: serie.symbol == symbol }"
                  @click="chartStore.updateItemData(serie.$id, { symbol })"
                >
                  <svg width="100%" height="100%" viewBox="-8 -8 16 16">
                    <path :d="symbolsPaths[symbol]" :stroke="serie.color" :fill="serie.color" />
                  </svg>
                </div>
                <div
                  v-for="dash in dashs"
                  :key="dash"
                  aria-label="dash"
                  class="color"
                  :class="{ selected: serie.dash == dash }"
                  @click="chartStore.updateItemData(serie.$id, { dash })"
                >
                  <svg width="100%" height="100%" viewBox="0 0 32 32">
                    <path
                      d="m0,16h64"
                      class="dash"
                      :stroke-dasharray="dash"
                      :stroke="serie.color"
                      :fill="serie.color"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </q-menu>
        </q-btn>
        <q-btn
          class="title"
          :label="serie.business"
          padding="xs"
          flat
          :disable="!chartStore.chart.editCode"
          @click="showRemoveSerieDialog(serie)"
        ></q-btn>
      </div>
      <q-btn
        v-if="uiStore.editMode"
        class="legend new-legend"
        padding="xs"
        flat
        @click="showAddDialog()"
      >
        <q-tooltip>Click to add a new value curve</q-tooltip>
        <my-marker :serie="chartStore.getUnusedSerie()" />
        <span class="title q-ml-xs text-italic">New</span>
      </q-btn>
      <q-space />
      <q-btn v-if="uiStore.editMode" icon="sort" flat round @click="sort()">
        <q-tooltip
          >Sort selected serie
          {{ uiStore.sortOrder == SORT_ORDER_ASC ? 'ascending' : 'descending' }}
        </q-tooltip>
      </q-btn>
    </q-toolbar>
    <StrategyCanvasChart />
  </q-page>
</template>

<script setup lang="ts">
import { watchEffect, watch } from 'vue'
import { useQuasar, useMeta } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useChartStore } from '@/stores/chart-store'
import { useUIStore, SORT_ORDER_ASC, SORT_ORDER_DESC } from '@/stores/ui-store'
import { Serie } from '@/components/models'
import MyMarker from '@/components/strategycanvas/MyMarker.vue'
import AddDialog from '@/components/strategycanvas/AddDialog.vue'
import RemoveDialog from '@/components/strategycanvas/RemoveDialog.vue'
import StrategyCanvasChart from '@/components/strategycanvas/StrategyCanvasChart.vue'
import { colors, symbols, symbolsPaths, dashs } from '@/utils/d3-helpers'
import { APP_NAME } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const chartStore = useChartStore()
const uiStore = useUIStore()
const $q = useQuasar()

watch(
  () => route.params,
  () => {
    if (chartStore.chart?.$id !== (route.params.id as string)) {
      if (route.params.id === 'new') {
        chartStore.newChart()
        router.replace({
          name: 'StrategyCanvas',
          params: { teamId: route.params.teamId, id: chartStore.chart.$id },
        })
        return
      }
      try {
        chartStore.loadChart(route.params.id as string)
      } catch (e) {
        $q.notify({
          type: 'negative',
          message: 'Chart not found',
        })
        router.push({
          name: 'StrategyCanvas',
          params: { id: 'new' },
        })
      }
    }
  },
  {
    immediate: true,
  },
)

watchEffect(() => {
  if (
    (!uiStore.selectedSerieName || chartStore.businessNotInUse(uiStore.selectedSerieName)) &&
    chartStore.chart.series.length > 0
  ) {
    const firstSerie = chartStore.series[0]
    if (firstSerie) {
      uiStore.selectedSerieName = firstSerie.business
    }
  }
})

useMeta(() => {
  return {
    title: chartStore.chart?.title,
    titleTemplate: (title) => `${title} - Strategy Canvas - ${APP_NAME}`,
  }
})

function showAddDialog() {
  $q.dialog({
    component: AddDialog,
    componentProps: {
      type: 'serie',
    },
  }).onOk((names) => {
    chartStore.addSeries(names)
  })
}

function showRemoveSerieDialog(serie: Serie) {
  $q.dialog({
    component: RemoveDialog,
    componentProps: {
      type: 'serie',
      name: serie.business,
    },
  }).onOk(({ action, name }) => {
    if (action === 'remove') {
      chartStore.removeSerie(serie)
    }
    if (action === 'rename') {
      chartStore.renameSerie(serie, name)
    }
  })
}

function sort() {
  const serie = chartStore.getSerieByBusiness(uiStore.selectedSerieName || '')
  if (serie) {
    const offerings = chartStore.offerings[serie.$id]
    if (!offerings) return
    let sortedFactors = offerings
      .sort((a, b) => {
        const av = a.value
        const bv = b.value
        if (uiStore.sortOrder === SORT_ORDER_ASC) {
          return av - bv
        } else {
          return bv - av
        }
      })
      .map((offering) => offering.factorId)
    sortedFactors = sortedFactors.concat(
      chartStore.chart.factors.filter((f: string) => !sortedFactors.includes(f)),
    )
    chartStore.updateChart('factors', sortedFactors)
    if (uiStore.sortOrder === SORT_ORDER_ASC) {
      uiStore.sortOrder = SORT_ORDER_DESC
    } else {
      uiStore.sortOrder = SORT_ORDER_ASC
    }
  }
}
</script>
<style scoped>
.color {
  width: 35px;
  height: 35px;
  border: 2px solid #fff;
  overflow: hidden;
  padding: 1px;
  margin: 5px 5px;
}

.color.selected {
  border-color: #adc8e3;
}
</style>
