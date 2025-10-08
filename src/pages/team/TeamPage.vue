<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-lg">
      <!-- Header / Hero -->
      <q-card flat bordered class="bg-primary text-white">
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm">
            <div class="text-h5 text-weight-bold">Project: {{ teamsStore.currentTeam?.name }}</div>
          </div>
          <div class="col-auto row items-center q-gutter-sm">
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

      <!-- Strategy Canvas section -->
      <q-card flat bordered>
        <q-card-section class="row items-center justify-between q-col-gutter-md">
          <div class="col-auto row items-center q-gutter-sm">
            <q-icon name="show_chart" color="primary" />
            <div class="text-subtitle1 text-weight-medium">Strategy Canvas</div>
          </div>
          <div>
            <q-btn
              :to="{ name: 'StrategyCanvas', params: { teamId: route.params.teamId, id: 'new' } }"
              color="primary"
              icon="add"
              label="New Canvas"
              unelevated
            />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div v-if="scCharts.length === 0" class="column items-center q-gutter-sm q-my-md">
            <q-icon name="insert_drive_file" size="48px" color="grey-6" />
            <div class="text-caption text-grey-7">No Strategy Canvas yet</div>
          </div>
          <div v-else class="row q-col-gutter-md">
            <div v-for="item in scCharts" :key="item.$id" class="col-12 col-sm-6 col-md-4 col-lg-3">
              <router-link
                v-slot="{ navigate }"
                :to="{
                  name: 'StrategyCanvas',
                  params: { teamId: route.params.teamId, id: item.$id },
                }"
                class="text-decoration-none"
              >
                <q-card flat bordered clickable v-ripple @click="navigate">
                  <q-card-section class="row items-center q-gutter-sm">
                    <q-avatar icon="show_chart" color="primary" text-color="white" />
                    <div class="ellipsis" :title="item.title">{{ item.title }}</div>
                  </q-card-section>
                  <q-card-actions>
                    <q-space />
                    <q-btn label="Open" color="primary" flat />
                  </q-card-actions>
                </q-card>
              </router-link>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Business Model Canvas section -->
      <q-card flat bordered>
        <q-card-section class="row items-center justify-between q-col-gutter-md">
          <div class="col-auto row items-center q-gutter-sm">
            <q-icon name="dashboard" color="primary" />
            <div class="text-subtitle1 text-weight-medium">Business Model Canvas</div>
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
        </q-card-section>
        <q-separator />
        <q-card-section>
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
                      'fix-white': item.logoColor == 'rgb(255, 255, 255)',
                    }"
                    :src="
                      item.logoImage ? storageStore.getFileUrl(item.logoImage) : defaultBackground
                    "
                    :ratio="16 / 9"
                  >
                    <div
                      class="absolute-bottom text-subtitle2 bg-transparent text-white q-pa-sm ellipsis"
                    >
                      {{ item.title }}
                    </div>
                  </q-img>
                  <q-card-actions>
                    <q-space />
                    <q-btn label="Open" color="primary" flat />
                  </q-card-actions>
                </q-card>
              </router-link>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useMeta } from 'quasar'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useItemsStore } from '@/stores/items'
import { useStorageStore } from '@/stores/storage'
import { TYPE_SC_CHART } from '@/stores/chart-store'
import { TYPE_BMC } from '@/stores/bmc-store'
import ColorHash from 'color-hash'
const colorHash = new ColorHash()
import defaultBackground from '@/assets/bmc/default_bmc_logo_background.jpg'

const route = useRoute()
const teamsStore = useTeamsStore()
const itemsStore = useItemsStore()
const storageStore = useStorageStore()

type ScChartItem = { $id: string; title: string }
type BmcItem = { $id: string; title: string; logoColor?: string; logoImage?: string }

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
    titleTemplate: (title) => `Project: ${title} - BMCoach`,
  }
})
</script>
<style>
.item-image img {
  opacity: 0.8;
}
.item-image.default-background img {
  opacity: 0.5;
}

.item-image.fix-white {
  background-color: rgba(69, 89, 100, 0.33) !important;
}
</style>
