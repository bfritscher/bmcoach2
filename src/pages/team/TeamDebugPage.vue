<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-lg">
      <q-card flat bordered>
        <q-card-section class="row items-center justify-between q-col-gutter-md">
          <div class="text-subtitle1 text-weight-medium">Debug Tools</div>
          <div class="row q-gutter-sm">
            <q-btn color="negative" icon="delete_forever" label="Truncate all data" @click="truncate" />
            <q-btn color="primary" icon="add" label="Create test item" @click="testCreate" />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Test Widgets</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <list-widget
                type="sc-serie"
                question="Vos concurents?"
                field-label="Nom"
                field-name="business"
              />
            </div>
            <div class="col-12 col-md-6">
              <list-widget
                type="sc-factor"
                question="Facteurs produits?"
                field-label="Facteur"
                field-name="name"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered>
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium q-mb-md">Test item store</div>
          <div v-if="!itemsStore.typeIndex.test || itemsStore.typeIndex.test.length === 0" class="text-grey">No test items</div>
          <div v-else class="column q-gutter-sm">
            <q-card v-for="item in itemsStore.typeIndex.test" :key="item.$id" flat bordered>
              <q-card-section class="row items-center q-col-gutter-md">
                <div class="col">{{ item }}</div>
                <div class="col-auto row q-gutter-sm">
                  <q-btn dense flat icon="update" label="update"
                    @click="itemsStore.updateItemData(item.$id, { title: 'world', test: 'test' })" />
                  <q-btn dense flat color="negative" icon="delete" label="delete"
                    @click="itemsStore.removeItem(item.$id)" />
                </div>
              </q-card-section>
              <q-separator />
              <q-card-section class="row items-center q-col-gutter-md">
                <div class="col-auto">
                  <input type="file" @change="testFile($event, item.$id)" />
                </div>
                <div class="col-auto">
                  <q-btn dense flat color="negative" label="delete media" @click="testRemoveMedia(item.$id)" />
                </div>
                <div class="col">
                  <div class="row items-center q-col-gutter-sm">
                    <img :src="storageStore.getFileUrl(item.$id)" style="max-height: 64px" />
                    <div class="text-caption ellipsis" style="max-width: 400px">{{ storageStore.getFileUrl(item.$id) }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useItemsStore } from '@/stores/items'
import { useStorageStore } from '@/stores/storage'
import ListWidget from '@/components/widgets/ListWidget.vue'

const itemsStore = useItemsStore()
const storageStore = useStorageStore()

async function truncate() {
  if (!confirm('truncate all data?')) return
  const items = Object.values(itemsStore.itemsIndex)
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
</script>
