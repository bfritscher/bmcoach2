<template>
  <div>
    <q-input
      v-model="searchtext"
      placeholder="Global Search"
      clearable
      standout
      dense
      dark
      class="q-pa-sm"
      @click="isOpen = true"
      @focus="onFocus"
      @keyup="keyUp"
    >
      <q-menu ref="menu" v-model="isOpen" no-parent-event no-focus auto-close>
        <q-list v-model="isOpen" bordered separator style="min-width: 300px; max-height: 400px; overflow: auto">
          <template
            v-for="(project, teamId) in searchtext
              ? searchStore.results
              : searchStore.canvasesSorted"
            :key="teamId"
          >
            <q-item
              v-ripple
              clickable
              dense
              dark
              class="bg-primary text-white"
              :to="{ name: 'team', params: { teamId: teamId } }"
            >
              <q-item-section>{{ project?.team?.name }}</q-item-section>
            </q-item>
            <search-item v-for="item in project?.items" :key="item.$id" :item="item"></search-item>
          </template>
        </q-list>
      </q-menu>
    </q-input>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useSearchStore } from '@/stores/search'
import SearchItem from '@/components/SearchItem.vue'

const searchStore = useSearchStore()

const searchtext = ref('')
const isOpen = ref(false)
const menu = ref()

function keyUp(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isOpen.value = false
  } else if (e.key === 'ArrowDown') {
    menu.value?.focus()
  } else {
    isOpen.value = true
    searchStore.search(searchtext.value)
  }
}

function onFocus() {
  searchStore.loadCanvases()
  isOpen.value = true
}
</script>
