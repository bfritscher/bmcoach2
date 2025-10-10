<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-lg">
      <!-- Header / Hero -->
      <q-card flat bordered class="bg-primary text-white">
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm">
            <div class="text-h5" @click="showEditNameDialog">
              Project: {{ teamsStore.currentTeam?.name }}
            </div>
          </div>
          <div class="col-auto row items-center q-gutter-sm">
            <q-btn
              :to="{ name: 'home' }"
              color="white"
              text-color="primary"
              icon="dashboard"
              label="All Projects"
              unelevated
            />
            <q-btn
              :to="{ name: 'teamedit', params: { teamId: teamsStore.currentTeam?.$id } }"
              color="white"
              text-color="primary"
              icon="settings"
              label="Project Settings"
              unelevated
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Tabbed canvases section -->
      <q-card flat bordered>
        <q-card-section class="q-pa-none">
          <q-tabs v-model="tab" class="text-primary" align="left" dense inline-label>
            <q-tab name="bmc" icon="dashboard" :label="`Business Model Canvas (${bmcs.length})`" />
            <q-tab name="sc" icon="show_chart" :label="`Strategy Canvas (${scCharts.length})`" />
          </q-tabs>
        </q-card-section>
        <q-separator />

        <q-tab-panels v-model="tab" animated>
          <!-- Strategy Canvas panel -->
          <q-tab-panel name="sc">
            <div class="row items-center justify-between q-col-gutter-md q-mb-md">
              <div class="col-auto row items-center q-gutter-sm">
                <q-icon name="show_chart" color="primary" />
                <div class="text-subtitle1">Strategy Canvas</div>
              </div>
              <div>
                <q-btn
                  :to="{
                    name: 'StrategyCanvas',
                    params: { teamId: route.params.teamId, id: 'new' },
                  }"
                  color="primary"
                  icon="add"
                  label="New Canvas"
                  unelevated
                />
              </div>
            </div>
            <div v-if="scCharts.length === 0" class="column items-center q-gutter-sm q-my-md">
              <q-icon name="insert_drive_file" size="48px" color="grey-6" />
              <div class="text-caption text-grey-7">No Strategy Canvas yet</div>
            </div>
            <div v-else class="row q-col-gutter-md">
              <div
                v-for="item in scCharts"
                :key="item.$id"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
              >
                <router-link
                  v-slot="{ navigate }"
                  :to="{
                    name: 'StrategyCanvas',
                    params: { teamId: route.params.teamId, id: item.$id },
                  }"
                  class="text-decoration-none"
                >
                  <q-card flat bordered clickable v-ripple @click="navigate">
                    <q-img
                      :style="{
                        'background-color': colorHash.hex(item.title),
                      }"
                      class="item-image default-background"
                      src="/icons/strategy_canvas_logo.svg"
                      :ratio="16 / 9"
                      fit="cover"
                    >
                      <div class="absolute-bottom text-subtitle1 ellipsis row q-pa-sm items-center">
                        {{ item.title }}
                        <q-space />
                        <q-btn label="Open" color="secondary" outline />
                      </div>
                      <div
                        class="absolute-top-right"
                        style="padding: 0; background-color: transparent"
                      >
                        <q-btn
                          flat
                          color="grey-6"
                          icon="delete"
                          round
                          @click.stop.prevent="confirmDeleteChart(item)"
                          aria-label="Delete canvas"
                        />
                      </div>
                    </q-img>
                  </q-card>
                </router-link>
              </div>
            </div>
          </q-tab-panel>

          <!-- Business Model Canvas panel -->
          <q-tab-panel name="bmc">
            <div class="row items-center justify-between q-col-gutter-md q-mb-md">
              <div class="col-auto row items-center q-gutter-sm">
                <q-icon name="dashboard" color="primary" />
                <div class="text-subtitle1">Business Model Canvas</div>
              </div>
              <div>
                <q-btn
                  :to="{
                    name: 'BusinessModelCanvas',
                    params: { teamId: route.params.teamId, id: 'new' },
                  }"
                  color="primary"
                  icon="add"
                  label="New Canvas"
                  unelevated
                />
              </div>
            </div>
            <div v-if="bmcs.length === 0" class="column items-center q-gutter-sm q-my-md">
              <q-icon name="insert_drive_file" size="48px" color="grey-6" />
              <div class="text-caption text-grey-7">No Business Model Canvas yet</div>
            </div>
            <div v-else class="row q-col-gutter-md">
              <div v-for="item in bmcs" :key="item.$id" class="col-12 col-sm-6 col-md-4 col-lg-3">
                <router-link
                  v-slot="{ navigate }"
                  :to="{
                    name: 'BusinessModelCanvas',
                    params: { teamId: route.params.teamId, id: item.$id },
                  }"
                  class="text-decoration-none"
                >
                  <q-card flat bordered clickable v-ripple @click="navigate">
                    <q-img
                      :style="{
                        'background-color': item.logoColor
                          ? item.logoColor
                          : colorHash.hex(item.title),
                      }"
                      class="item-image"
                      :class="{
                        'default-background': !item.logoImage,
                      }"
                      :src="
                        item.logoImage ? storageStore.getFileUrl(item.logoImage) : defaultBackground
                      "
                      :ratio="16 / 9"
                      :fit="item.logoImage ? 'contain' : 'cover'"
                    >
                      <div class="absolute-bottom text-subtitle1 ellipsis row q-pa-sm items-center">
                        {{ item.title }}
                        <q-space />
                        <q-btn label="Open" color="secondary" outline />
                      </div>
                      <div
                        class="absolute-top-right"
                        style="padding: 0; background-color: transparent"
                      >
                        <q-btn
                          flat
                          color="grey-6"
                          icon="delete"
                          round
                          @click.stop.prevent="confirmDeleteBmc(item)"
                          aria-label="Delete canvas"
                        />
                      </div>
                    </q-img>
                  </q-card>
                </router-link>
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useMeta } from 'quasar'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useItemsStore } from '@/stores/items'
import { useStorageStore } from '@/stores/storage'
import { TYPE_SC_CHART } from '@/stores/chart-store'
import { TYPE_BMC } from '@/stores/bmc-store'
import { useChartStore } from '@/stores/chart-store'
import { useBMCStore } from '@/stores/bmc-store'
import { Dialog } from 'quasar'
import ColorHash from 'color-hash'
const colorHash = new ColorHash()
import defaultBackground from '@/assets/bmc/default_bmc_logo_background.jpg'
import { APP_NAME } from '@/utils/constants'

const $q = useQuasar()
const route = useRoute()
const teamsStore = useTeamsStore()
const itemsStore = useItemsStore()
const storageStore = useStorageStore()
const chartStore = useChartStore()
const bmcStore = useBMCStore()

type ScChartItem = { $id: string; title: string }
type BmcItem = { $id: string; title: string; logoColor?: string; logoImage?: string }

// active tab: 'sc' (strategy canvas) or 'bmc' (business model canvas)
const tab = ref<'sc' | 'bmc'>('bmc')

const scCharts = computed<ScChartItem[]>(() => {
  const dict = itemsStore.typeIndex[TYPE_SC_CHART] as Record<string, ScChartItem> | undefined
  return dict ? Object.values(dict) : []
})

const bmcs = computed<BmcItem[]>(() => {
  const dict = itemsStore.typeIndex[TYPE_BMC] as Record<string, BmcItem> | undefined
  return dict ? Object.values(dict) : []
})

useMeta(() => {
  return {
    title: teamsStore.currentTeam?.name,
    titleTemplate: (title) => `Project: ${title} - ${APP_NAME}`,
  }
})

function confirmDeleteChart(item: ScChartItem) {
  Dialog.create({
    title: 'Delete Strategy Canvas',
    message: `Delete "${item.title}"? This cannot be undone.`,
    cancel: true,
    persistent: true,
  })
    .onOk(() => {
      // load then delete to ensure currentChartId is set
      chartStore.loadChart(item.$id)
      chartStore.deleteChart()
    })
    .onCancel(() => {})
}

function confirmDeleteBmc(item: BmcItem) {
  Dialog.create({
    title: 'Delete Business Model Canvas',
    message: `Delete "${item.title}"? This will remove all notes and images.`,
    cancel: true,
    persistent: true,
  })
    .onOk(() => {
      bmcStore.loadCanvas(item.$id)
      bmcStore.canvasDelete()
    })
    .onCancel(() => {})
}

function showEditNameDialog() {
  $q.dialog({
    title: 'Rename project',
    message: 'Enter a new name for the project.',
    prompt: {
      model: teamsStore.currentTeam?.name || '',
      type: 'text',
      isValid: (v) => !!(v && v.length > 0),
    },
    ok: 'Rename',
    cancel: 'Cancel',
    persistent: true,
  }).onOk((name) => {
    teamsStore.updateTeamName(name)
  })
}
</script>
<style>
.item-image img {
  opacity: 0.8;
}
.item-image.default-background img {
  opacity: 0.5;
}
</style>
