<template>
  <div>
    <p>{{ props.question }}</p>
    <q-input v-model="localAddValue" :label="props.fieldLabel" type="textarea" />
    <q-btn color="primary" label="Ajouter" flat @click="addEntry" />
    <div v-for="item in items" :key="item.$id">
      <q-input
        :label="props.fieldLabel"
        :model-value="item[props.fieldName]"
        @update:model-value="itemsStore.updateItemData(item.$id, { [props.fieldName]: $event })"
      />
      <q-btn label="delete" color="negative" @click="itemsStore.removeItem(item.$id)" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemsStore } from '@/stores/items'

const itemsStore = useItemsStore()

const props = defineProps<{
  question: string
  type: string
  fieldName: string
  fieldLabel: string
}>()

const localAddValue = ref('')

function addEntry() {
  const entries = localAddValue.value.split(/\r\n|\r|\n/)
  entries.forEach((entry: string) => {
    itemsStore.addItem(props.type, {
      [props.fieldName]: entry,
    })
  })
}

const items = computed(() => {
  if (itemsStore.typeIndex[props.type] === undefined) {
    return []
  }
  const items = Object.values(itemsStore.typeIndex[props.type])
  // TODO maybe filter?
  items.sort((a: any, b: any) => {
    return a[props.fieldName].localeCompare(b[props.fieldName])
  })
  return items as any[]
})
</script>
