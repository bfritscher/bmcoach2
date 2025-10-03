import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Chart, Serie, Factor, Offering } from '@/components/models'
import { colors, symbols } from '@/utils/d3-helpers'
import { useItemsStore } from '@/stores/items'
import { v4 as uuid } from 'uuid'
import { downloadFile } from '@/utils/dom'

export const TYPE_SC_CHART = 'sc-chart'
export const TYPE_SC_SERIE = 'sc-serie'
export const TYPE_SC_FACTOR = 'sc-factor'
export const TYPE_SC_OFFERING = 'sc-offering'

export function isOfTypeSC(type: string) {
  return [TYPE_SC_CHART, TYPE_SC_SERIE, TYPE_SC_FACTOR, TYPE_SC_OFFERING].includes(type)
}

export const useChartStore = defineStore('chart', () => {
  const itemsStore = useItemsStore()

  const currentChartId = ref('')
  const chart = computed(() => {
    if (
      itemsStore.typeIndex[TYPE_SC_CHART] &&
      itemsStore.typeIndex[TYPE_SC_CHART][currentChartId.value]
    ) {
      return itemsStore.typeIndex[TYPE_SC_CHART][currentChartId.value]
    }
    return {
      $id: '',
      title: '',
      description: '',
      editCode: '',
      series: [],
      factors: [],
    } as Chart
  })

  const series = computed(() => {
    return chart.value.series.map(
      (serieId: string) => itemsStore.typeIndex[TYPE_SC_SERIE][serieId] as Serie,
    ) as Serie[]
  })

  const factors = computed(() => {
    return chart.value.factors
      .map((factorId: string) => itemsStore.typeIndex[TYPE_SC_FACTOR][factorId] as Factor)
      .filter((f: Factor) => f) as Factor[]
  })

  const offerings = computed(() => {
    return itemsStore.typeIndex[TYPE_SC_OFFERING]
      ? (Object.values(itemsStore.typeIndex[TYPE_SC_OFFERING]) as Offering[]).reduce(
          (agg: { [key: string]: Offering[] }, offering: Offering) => {
            if (!agg[offering.serieId]) {
              agg[offering.serieId] = []
            }
            if (!agg[offering.factorId]) {
              agg[offering.factorId] = []
            }
            agg[offering.serieId]!.push(offering)
            agg[offering.factorId]!.push(offering)
            agg[`${offering.serieId}-${offering.factorId}`] = [offering]
            return agg
          },
          {},
        )
      : {}
  })

  function newChart() {
    const $id = itemsStore.addItem(TYPE_SC_CHART, {
      title: 'Undefined title',
      description: '',
      factors: [],
      series: [],
      editCode: 'TODO ???',
    })
    currentChartId.value = $id
  }

  function copyChart() {
    // TODO
    /*
    chart.value = {
      ...chart.value,
      title: chart.value.title + ' (copy)',
      $id: nanoid(),
      editCode: nanoid(),
    };
    saveChart();
    */
  }

  function loadChart(chartId: string) {
    currentChartId.value = chartId
  }

  function getUniqueName(name: string, list: string[]) {
    let count = 1
    while (list.length > 0 && list.indexOf(name + ' ' + count) > -1) {
      count++
    }
    return name + ' ' + count
  }

  function businessNotInUse(value: string) {
    return series.value.every((serie) => serie.business !== value)
  }

  function factorNotInUse(value: string) {
    return factors.value.every((factor) => factor.name !== value)
  }

  function getUnusedColor(symbol?: string) {
    let localSeries = series.value
    if (symbol) {
      localSeries = localSeries.filter((serie) => serie.symbol === symbol)
    }
    const usedColors = localSeries.map((serie) => serie.color)
    for (const color of colors) {
      if (!usedColors.includes(color)) {
        return color
      }
    }
    return
  }

  function getUnusedMarker() {
    // first get color across any symbol
    let color = getUnusedColor()
    if (color) {
      return { color: color, symbol: symbols[0], dash: '0' }
    }
    // for symbol get free color
    for (const symbol of symbols) {
      color = getUnusedColor(symbol)
      if (color !== undefined) {
        return { color: color, symbol: symbol, dash: '0' }
      }
    }
    //default
    return { color: colors[0], symbol: symbols[0], dash: '0' }
  }

  function getUniqueBusinessName() {
    if (chart.value.series.length === 0) {
      return 'Business'
    }
    return getUniqueName(
      'Competitor',
      series.value.map((serie) => serie.business),
    )
  }

  function getUnusedSerie(business?: string): Serie {
    const marker = getUnusedMarker()
    return {
      $id: uuid(),
      business: business || getUniqueBusinessName(),
      color: marker.color ?? colors[0] ?? '#000000',
      symbol: marker.symbol ?? symbols[0] ?? 'circle',
      dash: marker.dash,
    }
  }

  function addSeries(names: string): string[] {
    const createdIds: string[] = []
    const lines = names.split(/\r\n|\r|\n/)
    lines.forEach((business) => {
      if (business !== '' && businessNotInUse(business)) {
        const serie = Object.assign(
          {
            business,
          },
          getUnusedMarker(),
        )
        const id = itemsStore.addItem(TYPE_SC_SERIE, serie)
        createdIds.push(id)
      }
    })
    updateChart('series', chart.value.series.concat(createdIds))
    return createdIds
  }

  function getSerieByBusiness(business: string) {
    return series.value.find((serie) => serie.business === business)
  }

  function removeSerie(serie: Serie) {
    // TODO what about offerings?
    const index = chart.value.series.indexOf(serie.$id)
    if (index >= 0) {
      itemsStore.removeItem(serie.$id)
      updateChart(
        'series',
        chart.value.serie.filter((id: string) => id !== serie.$id),
      )
    }
  }

  function addFactor(name: string) {
    const lines = name.split(/\r\n|\r|\n/)
    const createdIds: string[] = []
    lines.forEach((factorName) => {
      if (factorName !== '' && factorNotInUse(factorName)) {
        const factor = {
          name: factorName,
        }
        createdIds.push(itemsStore.addItem(TYPE_SC_FACTOR, factor))
      }
    })
    updateChart('factors', chart.value.factors.concat(createdIds))
  }

  function renameFactor(factor: Factor, newName: string) {
    if (factor.name === newName) return
    itemsStore.updateItemData(factor.$id, { name: newName })
    //TODO copy offerings or rename via itemupdate
  }

  function removeFactor(factor: Factor) {
    // TODO what about related offerings?
    const index = chart.value.factors.indexOf(factor.$id)
    if (index >= 0) {
      updateChart(
        'factors',
        chart.value.factors.filter((id: string) => id !== factor.$id),
      )
      itemsStore.removeItem(factor.$id)
    }
  }

  function addOffering(serie: Serie, factor: Factor, value: number) {
    const offering = {
      serieId: serie.$id,
      factorId: factor.$id,
      value,
    }
    const id = itemsStore.addItem(TYPE_SC_OFFERING, offering)
    return id
  }

  function changeOffering(offering: Offering, value: number) {
    itemsStore.updateItemData(offering.$id, { value })
  }

  function removeOffering(offering: Offering) {
    itemsStore.removeItem(offering.$id)
  }

  function updateChart(attribute: keyof Chart, value: any) {
    itemsStore.updateItemData(currentChartId.value, {
      [attribute]: value,
    })
  }

  // TODO mode where series are independent and linked to chart?
  function renameSerie(serie: Serie, newName: string) {
    if (serie.business === newName) return
    itemsStore.updateItemData(serie.$id, { business: newName })
  }

  function downloadJSON() {
    downloadFile(
      'data.json',
      'data:application/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(chart.value, null, 2)),
    )
  }

  function downloadCSV() {
    const table: (string | number)[][] = [['"factor\\models"']]
    factors.value.forEach((factor: Factor, j: number) => {
      table[j + 1] = [`"${factor.name}"`]
      series.value.forEach((serie: Serie) => {
        if (j === 0) {
          table[0]!.push(`"${serie.business}"`)
        }
        const offering = offerings.value[`${serie.$id}-${factor.$id}`]?.[0]
        table[j + 1]!.push(offering?.value ?? 0)
      })
    })
    const csv = table
      .map((row) => {
        return row.join(',')
      })
      .join('\n')
    downloadFile('data.csv', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
  }

  const seriesIndex = computed(() => {
    return itemsStore.typeIndex[TYPE_SC_SERIE]
  })

  const factorsIndex = computed(() => {
    return itemsStore.typeIndex[TYPE_SC_FACTOR]
  })

  return {
    chart,
    series,
    seriesIndex,
    factors,
    factorsIndex,
    offerings,
    getUnusedSerie,
    getUniqueBusinessName,
    getSerieByBusiness,
    businessNotInUse,
    factorNotInUse,
    addSeries,
    renameSerie,
    removeSerie,
    addFactor,
    renameFactor,
    removeFactor,
    addOffering,
    changeOffering,
    removeOffering,
    updateChart,
    downloadJSON,
    downloadCSV,
    loadChart,
    newChart,
    copyChart,
    updateItemData: itemsStore.updateItemData,
  }
})
