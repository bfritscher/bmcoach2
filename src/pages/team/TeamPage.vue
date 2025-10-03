<template>
  <q-page class="q-pa-md">
    <div class="text-h3 row">
      Project: {{ teamsStore.currentTeam?.name }}
      <q-space />
      <q-btn
        :to="{
          name: 'teamedit',
          params: { teamId: teamsStore.currentTeam?.$id },
        }"
        color="primary"
        unelevated
        label="Project Settings"
      />
    </div>

    <div class="text-h5 q-my-md">Strategy Canvas</div>
    <q-btn
      :to="{
        name: 'StrategyCanvas',
        params: { teamId: route.params.teamId, id: 'new' },
      }"
      color="primary"
      unelevated
      label="Create Canvas"
    />
    <div class="row q-mt-md q-gutter-md">
      <div
        v-for="item in itemsStore.typeIndex[TYPE_SC_CHART]"
        :key="item.$id"
        class="col-12 col-md-4 col-lg-3"
      >
        <router-link
          v-slot="{ navigate }"
          :to="{
            name: 'StrategyCanvas',
            params: { teamId: route.params.teamId, id: item.$id },
          }"
          class="text-decoration-none"
        >
          <q-card @click="navigate">
            <q-card-section class="bg-primary text-white">
              {{ item.title }}
            </q-card-section>
            <q-card-actions>
              <q-space />
              <q-btn label="open" unelevated color="primary" />
            </q-card-actions>
          </q-card>
        </router-link>
      </div>
    </div>

    <div class="text-h5 q-my-md">Business Model Canvas</div>
    <q-btn
      :to="{
        name: 'BusinessModelCanvas',
        params: { teamId: route.params.teamId, id: 'new' },
      }"
      color="primary"
      unelevated
      label="Create Canvas"
    />
    <div class="row q-mt-md q-gutter-md">
      <div
        v-for="item in itemsStore.typeIndex[TYPE_BMC]"
        :key="item.$id"
        class="col-12 col-md-4 col-lg-3"
      >
        <router-link
          v-slot="{ navigate }"
          :to="{
            name: 'BusinessModelCanvas',
            params: { teamId: route.params.teamId, id: item.$id },
          }"
          class="text-decoration-none"
        >
          <q-card @click="navigate">
            <q-card-section class="bg-primary text-white">
              {{ item.title }}
            </q-card-section>
            <q-img
              :style="{
                'background-color': item.logoColor ? item.logoColor : colorHash.hex(item.title),
              }"
              class="item-image"
              :class="{
                'default-background': !item.logoImage,
                'fix-white': item.logoColor == 'rgb(255, 255, 255)',
              }"
              :src="item.logoImage ? storageStore.getFileUrl(item.logoImage) : defaultBackground"
            />
            <q-card-actions>
              <q-space />
              <q-btn label="open" unelevated color="primary" />
            </q-card-actions>
          </q-card>
        </router-link>
      </div>
    </div>

    <div class="debug-box">
      <q-btn label="truncate all data" color="negative" @click="truncate" />
      <h3>Test widget</h3>

      <list-widget
        type="sc-serie"
        question="Vos concurents?"
        field-label="Nom"
        field-name="business"
      ></list-widget>

      <list-widget
        type="sc-factor"
        question="Facteurs produits?"
        field-label="Facteur"
        field-name="name"
      ></list-widget>

      <h3>Test item store</h3>
      <div v-for="item in itemsStore.typeIndex.test" :key="item.$id">
        {{ item }}
        <q-btn
          label="update"
          @click="
            itemsStore.updateItemData(item.$id, {
              title: 'world',
              test: 'test',
            })
          "
        />
        <q-btn label="delete" @click="itemsStore.removeItem(item.$id)" />
        <input type="file" @change="testFile($event, item.$id)" />
        <q-btn label="delete media" @click="testRemoveMedia(item.$id)" />
        <img :src="storageStore.getFileUrl(item.$id)" />
        {{ storageStore.getFileUrl(item.$id) }}
      </div>
      <q-btn @click="testCreate()">create</q-btn>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar, useMeta } from 'quasar'
import { useRoute } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useItemsStore } from '@/stores/items'
import { useStorageStore } from '@/stores/storage'
import { TYPE_SC_CHART } from '@/stores/chart-store'
import { TYPE_BMC } from '@/stores/bmc-store'
import ColorHash from 'color-hash'
const colorHash = new ColorHash()
import ListWidget from '@/components/widgets/ListWidget.vue'
import defaultBackground from '@/assets/bmc/default_bmc_logo_background.jpg'

const route = useRoute()
const teamsStore = useTeamsStore()
const itemsStore = useItemsStore()
const storageStore = useStorageStore()

async function truncate() {
  if (!confirm('truncate all data?')) return
  const items: any[] = Object.values(itemsStore.itemsIndex)
  for (const item of items) {
    await itemsStore.removeItem(item.$id)
  }
}

function testCreate() {
  itemsStore.addItem('test', {
    title: 'hello',
    date: new Date(),
  })
}

function testFile(event: any, id: string) {
  const file = event.target.files[0]
  storageStore.uploadFile(id, file)
}

function testRemoveMedia(id: string) {
  storageStore.removeFile(id)
}

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
