<template>
  <div>
    <p>{{ props.question }}</p>
    <q-input v-model="localAddValue" :label="props.fieldLabel" type="textarea" />
    <q-btn color="primary" label="Ajouter" flat @click="addEntry" />
    <div v-for="item in items" :key="item.$id">
      <q-input
        :label="props.fieldLabel"
        :model-value="getFieldValue(item)"
        @update:model-value="updateItemField(item, $event)"
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

function getFieldValue(item: ListedItem): string {
  const value = item[props.fieldName]
  if (typeof value === 'string') {
    return value
  }
  return value == null ? '' : String(value)
}

function updateItemField(item: ListedItem, value: string | number | null) {
  itemsStore.updateItemData(item.$id, {
    [props.fieldName]: value == null ? '' : String(value),
  })
}

type ListedItem = Record<string, unknown> & { $id: string }

const items = computed<ListedItem[]>(() => {
  const bucket = itemsStore.typeIndex[props.type]
  if (!bucket) {
    return []
  }
  return Object.values(bucket)
    .filter(
      (entry): entry is ListedItem => Boolean(entry) && typeof entry === 'object' && '$id' in entry,
    )
    .slice()
    .sort((a, b) => {
      const valueA = String(a[props.fieldName] ?? '')
      const valueB = String(b[props.fieldName] ?? '')
      return valueA.localeCompare(valueB)
    })
})
</script>
