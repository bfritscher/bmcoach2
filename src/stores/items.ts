import { defineStore } from 'pinia'
import { ref } from 'vue'
import { client, databases } from '@/api/appwrite'
import { v4 as uuid } from 'uuid'
import { Permission, Query, Role, Models } from 'appwrite'
import { useTeamsStore } from './teams'

export interface Item {
  $id: string
  type: string
  project_id: string
  data: object
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
  [key: string]: any
  $id?: string
}

export const useItemsStore = defineStore('items', () => {
  const itemsIndex = ref<ItemsIndex>({})
  const typeIndex = ref<TypeIndex>({})
  const teamsStore = useTeamsStore()

  function addToTypeIndex(payload: Item) {
    if (!typeIndex.value.hasOwnProperty(payload.type)) {
      typeIndex.value[payload.type] = {}
    }
    typeIndex.value[payload.type][payload.$id] = {
      ...payload.data,
      $id: payload.$id,
    }
  }

  function localAdd(payload: Item) {
    itemsIndex.value[payload.$id] = payload
    addToTypeIndex(payload)
  }

  let unsubscribe: any
  // TODO for projectID
  function subscribeProject(project_id: string) {
    if (unsubscribe) {
      unsubscribe()
    }
    unsubscribe = client.subscribe<AppwriteItem>(
      ['databases.bmcoach.collections.items.documents'],
      (response) => {
        // Callback will be executed on changes for all files.
        if (
          response.channels.includes('databases.bmcoach.collections.items.documents') &&
          response.payload.project_id === project_id
        ) {
          if (response.events.includes('databases.bmcoach.collections.items.documents.*.create')) {
            localAdd({ ...response.payload, data: JSON.parse(response.payload.data) })
          }
          // handle delete
          if (response.events.includes('databases.bmcoach.collections.items.documents.*.delete')) {
            delete itemsIndex.value[response.payload.$id]
            delete typeIndex.value[response.payload.type][response.payload.$id]
          }
          // handle update
          if (response.events.includes('databases.bmcoach.collections.items.documents.*.update')) {
            localAdd({ ...response.payload, data: JSON.parse(response.payload.data) })
          }
        }
      },
    )
  }

  //TODO offline handle?
  // TODO handle error and revert local update
  const addItem = (type: string, data: object): string => {
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
    delete typeIndex.value[item.type][id]
    delete itemsIndex.value[id]
    return databases.deleteDocument('production', 'items', id)
  }

  // TODO offline handle?
  // TODO handle error and revert local update
  const updateItemData = (id: string, update: object) => {
    // local update
    const item = itemsIndex.value[id]
    if (!item) return
    Object.assign(item.data, update)
    localAdd(item)

    databases.updateDocument('production', 'items', id, {
      data: JSON.stringify(item.data),
    })
  }

  const getItems = async (projectId: string) => {
    const localItemsIndex = {}
    const localTypeIndex = {}
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
        payload.data = JSON.parse(payload.data)
        const item =  payload as unknown as Item
        localItemsIndex[item.$id] = item
        if (!localTypeIndex.hasOwnProperty(item.type)) {
          localTypeIndex[item.type] = {}
        }
        localTypeIndex[item.type][item.$id] = {
          ...item.data,
          $id: item.$id,
        }
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
    typeIndex.value = localTypeIndex
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
  }
})
