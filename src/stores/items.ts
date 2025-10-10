import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { client, databases } from '@/api/appwrite'
import { v4 as uuid } from 'uuid'
import { Permission, Query, Role, Models } from 'appwrite'
import { useTeamsStore } from './teams'

type ItemData = Record<string, unknown>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypeBucket = Record<string, any>

const APPWRITE_DATABASE_ID = 'production'

export interface Item {
  $id: string
  type: string
  project_id: string
  data: ItemData
}

export interface AppwriteItem extends Models.Document {
  $id: string
  type: string
  project_id: string
  data: string // stored as JSON string in appwrite
}

export interface ItemsIndex {
  [key: string]: Item
}

export interface TypeIndex {
  [key: string]: TypeBucket | undefined
}

export const useItemsStore = defineStore('items', () => {
  const itemsIndex = ref<ItemsIndex>({})
  const typeIndex = ref<TypeIndex>({})
  const currentProjectId = ref<string | null>(null)
  const pendingUpdateIds = new Set<string>()
  let flushTimer: ReturnType<typeof setTimeout> | null = null
  const FLUSH_DELAY = 200
  const teamsStore = useTeamsStore()

  function ensureBucket(type: string): TypeBucket {
    if (!Object.prototype.hasOwnProperty.call(typeIndex.value, type)) {
      typeIndex.value[type] = reactive<TypeBucket>({})
    }
    return typeIndex.value[type] as TypeBucket
  }

  function normalizeColors(colors: unknown): unknown {
    if (Array.isArray(colors)) {
      return colors.map((value) => Number(value)).filter((value) => !Number.isNaN(value))
    }
    if (colors && typeof colors === 'object') {
      return Object.keys(colors)
        .map((key) => Number(key))
        .filter((value) => !Number.isNaN(value))
        .sort((a, b) => a - b)
    }
    return colors
  }

  function normalizeData(data: ItemData | undefined, isPartial = false): ItemData {
    const normalized: ItemData = { ...(data || {}) }
    if (Object.prototype.hasOwnProperty.call(normalized, 'colors')) {
      normalized.colors = normalizeColors(normalized.colors)
    } else if (!isPartial && normalized.colors === undefined) {
      normalized.colors = []
    }
    return normalized
  }

  function mergeInto(target: ItemData, source: ItemData) {
    for (const [key, value] of Object.entries(source)) {
      if (!Object.is(target[key], value)) {
        target[key] = value
      }
    }
  }

  function removeFromCurrentBucket(item: Item, previousType?: string) {
    const typeKey = previousType || item.type
    const bucket = typeIndex.value[typeKey] as TypeBucket | undefined
    if (bucket && bucket[item.$id]) {
      delete bucket[item.$id]
      if (Object.keys(bucket).length === 0) {
        delete typeIndex.value[typeKey]
      }
    }
  }

  function localAdd(payload: Item) {
    const normalizedData = normalizeData(payload.data)
    let existing = itemsIndex.value[payload.$id]

    if (existing) {
      const previousType = existing.type
      existing.type = payload.type
      existing.project_id = payload.project_id
      mergeInto(existing.data, normalizedData)
      if (previousType !== payload.type) {
        removeFromCurrentBucket(existing, previousType)
      }
    } else {
      const reactiveData = reactive({ ...normalizedData, $id: payload.$id })
      existing = reactive({
        $id: payload.$id,
        type: payload.type,
        project_id: payload.project_id,
        data: reactiveData,
      }) as Item
      itemsIndex.value[payload.$id] = existing
    }

    existing.data.$id = payload.$id

    const bucket = ensureBucket(existing.type)
    if (!bucket[existing.$id]) {
      bucket[existing.$id] = existing.data
    }
  }

  function queuePendingUpdate(id: string) {
    pendingUpdateIds.add(id)
    if (flushTimer) return
    flushTimer = setTimeout(() => {
      flushPendingUpdates()
    }, FLUSH_DELAY)
  }

  async function flushPendingUpdates(ids?: string[]) {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }

    const targetIds = ids && ids.length > 0 ? ids : Array.from(pendingUpdateIds)
    if (targetIds.length === 0) {
      return
    }

    targetIds.forEach((id) => pendingUpdateIds.delete(id))

    await Promise.all(
      targetIds.map((id) => {
        const item = itemsIndex.value[id]
        if (!item) {
          return
        }
        return databases.updateDocument('production', 'items', id, {
          data: JSON.stringify(item.data),
        })
      }),
    )
  }

  let unsubscribe: (() => void) | undefined
  // TODO for projectID
  function subscribeProject(project_id: string) {
    if (currentProjectId.value === project_id && unsubscribe) {
      return
    }
    if (unsubscribe) {
      unsubscribe()
    }
    currentProjectId.value = project_id
    unsubscribe = client.subscribe<AppwriteItem>(
      [`databases.${APPWRITE_DATABASE_ID}.collections.items.documents`],
      (response) => {
        // Callback will be executed on changes for all files.
        if (
          response.channels.includes(
            `databases.${APPWRITE_DATABASE_ID}.collections.items.documents`,
          ) &&
          response.payload.project_id === project_id
        ) {
          if (
            response.events.includes(
              `databases.${APPWRITE_DATABASE_ID}.collections.items.documents.*.create`,
            )
          ) {
            const data = JSON.parse(response.payload.data)
            localAdd({ ...response.payload, data })
          }
          if (
            response.events.includes(
              `databases.${APPWRITE_DATABASE_ID}.collections.items.documents.*.delete`,
            )
          ) {
            const item = itemsIndex.value[response.payload.$id]
            if (item) {
              removeFromCurrentBucket(item)
              delete itemsIndex.value[item.$id]
            }
            pendingUpdateIds.delete(response.payload.$id)
          }
          if (
            response.events.includes(
              `databases.${APPWRITE_DATABASE_ID}.collections.items.documents.*.update`,
            )
          ) {
            const data = JSON.parse(response.payload.data)
            localAdd({ ...response.payload, data })
            pendingUpdateIds.delete(response.payload.$id)
          }
        }
      },
    )
  }

  //TODO offline handle?
  // TODO handle error and revert local update
  const addItem = (type: string, data: ItemData): string => {
    const teamId = teamsStore.currentTeam?.$id
    if (!teamId) return ''
    const $id = uuid()
    const localPayload = {
      type: type,
      project_id: teamId,
      data: data,
    }
    localAdd({ $id, ...localPayload })

    const permissions = [
      Permission.read(Role.team(teamId)),
      Permission.update(Role.team(teamId, 'owner')),
      Permission.delete(Role.team(teamId, 'owner')),
    ]
    databases.createDocument({
      databaseId: 'production',
      collectionId: 'items',
      documentId: $id,
      data: { ...localPayload, data: JSON.stringify(data) },
      permissions,
    })
    return $id
  }

  // TODO offline handle?
  // TODO handle error and revert local update
  const removeItem = (id: string) => {
    const item = itemsIndex.value[id]
    if (!item) return
    removeFromCurrentBucket(item)
    delete itemsIndex.value[id]
    pendingUpdateIds.delete(id)
    return databases.deleteDocument('production', 'items', id)
  }

  // TODO offline handle?
  // TODO handle error and revert local update
  const updateItemData = (id: string, update: ItemData, options: { persist?: boolean } = {}) => {
    // local update
    const item = itemsIndex.value[id]
    if (!item) return
    const normalizedUpdate = normalizeData(update, true)
    mergeInto(item.data, normalizedUpdate)

    if (options.persist === false) {
      queuePendingUpdate(id)
      return
    }

    databases.updateDocument('production', 'items', id, {
      data: JSON.stringify(item.data),
    })
  }

  const getItems = async (projectId: string, options: { force?: boolean } = {}) => {
    if (
      !options.force &&
      currentProjectId.value === projectId &&
      Object.keys(itemsIndex.value).length > 0
    ) {
      return
    }
    const localItemsIndex: ItemsIndex = {}
    const localTypeIndex: Record<string, TypeBucket> = {}
    let lastId: string | undefined = undefined
    do {
      const query = [Query.equal('project_id', projectId), Query.limit(500)]
      if (lastId) {
        query.push(Query.cursorAfter(lastId))
      }
      console.log('Fetching items for project', projectId, lastId)
      // instrument timming
      let start = performance.now()
      const response = await databases.listDocuments<AppwriteItem>('production', 'items', query)
      let end = performance.now()
      console.log(`Fetched ${response.documents.length} items in ${end - start} ms`)
      console.log(response.total)
      start = performance.now()
      response.documents.forEach((payload) => {
        const parsedData = JSON.parse(payload.data)
        const normalized = normalizeData(parsedData)
        let item = itemsIndex.value[payload.$id]
        if (item) {
          const previousType = item.type
          item.type = payload.type
          item.project_id = payload.project_id
          mergeInto(item.data, normalized)
          if (previousType !== payload.type) {
            removeFromCurrentBucket(item, previousType)
          }
        } else {
          const reactiveData = reactive({ ...normalized, $id: payload.$id })
          item = reactive({
            $id: payload.$id,
            type: payload.type,
            project_id: payload.project_id,
            data: reactiveData,
          }) as Item
        }

        item.data.$id = payload.$id

        localItemsIndex[item.$id] = item
        if (!Object.prototype.hasOwnProperty.call(localTypeIndex, item.type)) {
          localTypeIndex[item.type] = reactive<TypeBucket>({})
        }
        ;(localTypeIndex[item.type] as TypeBucket)[item.$id] = item.data
      })
      end = performance.now()
      console.log(`Processed ${response.documents.length} items in ${end - start} ms`)
      if (response.documents.length > 0) {
        lastId = response.documents[response.documents.length - 1]?.$id
      } else {
        lastId = undefined
      }
    } while (lastId)

    itemsIndex.value = localItemsIndex
    typeIndex.value = localTypeIndex as TypeIndex
    subscribeProject(projectId)
  }

  return {
    localAdd, // Temporary export for realtime bug
    itemsIndex,
    typeIndex,
    addItem,
    removeItem,
    updateItemData,
    getItems,
    flushPendingUpdates,
  }
})
