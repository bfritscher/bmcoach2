import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Query } from 'appwrite'
import { databases } from '@/api/appwrite'
import { useTeamsStore } from './teams'
import { TYPE_SC_CHART } from '@/stores/chart-store'
import { TYPE_BMC } from '@/stores/bmc-store'
export const useSearchStore = defineStore('search', () => {
  const teamsStore = useTeamsStore()

  const canvases = ref<any>({})
  let canvasesItems = [] as any[]
  const results = ref<any>({})

  async function loadCanvases() {
    let lastId: string | undefined = undefined
    let results = [] as any[]
    canvasesItems = []
    do {
      const query = [Query.equal('type', [TYPE_BMC, TYPE_SC_CHART]), Query.limit(100)]
      if (lastId) {
        query.push(Query.cursorAfter(lastId))
      }
      const response = await databases.listDocuments({
        databaseId: 'production',
        collectionId: 'items',
        queries: query,
      })
      results = results.concat(response.documents)
      if (response.documents.length > 0) {
        lastId = response.documents[response.documents.length - 1]?.$id
      } else {
        lastId = undefined
      }
    } while (lastId)
    canvasesItems = parse(results, true)
    canvases.value = groupByTeam(canvasesItems)
  }

  const canvasesSorted = computed(() => {
    const keys = Object.keys(canvases.value)
    if (teamsStore.currentTeam) {
      const index = keys.indexOf(teamsStore.currentTeam.$id)
      if (index > -1) {
        keys.splice(index, 1)
      }
      keys.unshift(teamsStore.currentTeam.$id)
    }
    return keys.reduce((acc: any, key: any) => {
      acc[key] = canvases.value[key]
      return acc
    }, {})
  })

  async function search(text: string) {
    const query = [Query.search('data', text)]
    const response = await databases.listDocuments('production', 'items', query)
    results.value = groupByTeam(parse(response.documents))
  }

  function parse(items: any, keepRawData = false) {
    return items.map((item: any) => {
      const obj = {
        ...item,
        data: JSON.parse(item.data),
        team: teamsStore.teamsIndex[item.project_id],
      }
      if (keepRawData) {
        obj.rawData = item.data
      }
      return obj
    })
  }

  function groupByTeam(items: any) {
    return items.reduce((acc: any, item: any) => {
      if (!acc[item.project_id]) {
        acc[item.project_id] = {
          team: item.team,
          items: [],
        }
      }
      acc[item.project_id].items.push(item)
      return acc
    }, {})
  }

  function getParentCanvas(id: string) {
    return canvasesItems.filter((canvas: any) => {
      return canvas.rawData.includes(id)
    })
  }

  return {
    results,
    canvases,
    canvasesSorted,
    search,
    loadCanvases,
    getParentCanvas,
  }
})
