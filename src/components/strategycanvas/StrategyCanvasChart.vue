<script setup lang="ts">
import * as d3 from 'd3'
import type { D3DragEvent, SubjectPosition } from 'd3'
import { watchEffect, useTemplateRef } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { useChartStore } from '@/stores/chart-store'
import { useUIStore } from '@/stores/ui-store'
import type { Serie, Factor, Chart, Offering } from '@/components/models'
import { SymbolsLookup } from '@/utils/d3-helpers'
import AddDialog from '@/components/strategycanvas/AddDialog.vue'
import RemoveDialog from '@/components/strategycanvas/RemoveDialog.vue'

const $q = useQuasar()
const chartStore = useChartStore()
const uiStore = useUIStore()

const {
  chart: chartRef,
  factors: factorsRef,
  series: seriesRef,
  offerings: offeringsRef,
  seriesIndex: seriesIndexRef,
} = storeToRefs(chartStore)

const elm = useTemplateRef('elm')

type Point = [number, number]
type SerieWithOfferings = Serie & { offerings?: Record<string, number> }

type OfferingPoint = {
  factor: Factor
  serie: Serie
  offering: Offering
}

/* todo fix state?
    let oldFactors: string[] = [];
    let seriesOrder = '';
    let lastClickTimeStamp = 0;
*/
/*
    TODO FIX
  $(elm).mousewheel(function(event, delta) {
    elm.value.scrollLeft -= (delta * 30);
        event.preventDefault();
    });
  */
const localChartState: {
  chart: Chart
  factors: Factor[]
  series: Serie[]
  offerings: Record<string, Offering[]>
  x: d3.ScaleBand<string>
  y: {
    [s: string]: d3.ScaleLinear<number, number>
  }
  w: number
} = {
  chart: chartRef.value,
  factors: [],
  series: [],
  offerings: {},
  x: d3.scaleBand<string>().domain([]).range([0, 0]),
  y: {},
  w: 0,
}

watchEffect(() => {
  //root svg
  let svg: d3.Selection<SVGGElement, unknown, d3.BaseType, unknown>

  //d3js ordinal scale only localChartState.works on simple array
  // TODO check if unref can be used?
  localChartState.chart = JSON.parse(JSON.stringify(chartRef.value)) as Chart
  localChartState.factors = JSON.parse(JSON.stringify(factorsRef.value)) as Factor[]
  localChartState.series = JSON.parse(JSON.stringify(seriesRef.value)) as Serie[]
  localChartState.offerings = JSON.parse(JSON.stringify(offeringsRef.value)) as Record<
    string,
    Offering[]
  >

  // TODO: let delay = oldFactors.length > localChartState.factors.length ? 500 : 0;
  // delay standard transitions if delete factor

  //62 = 10 20 1 svg 1 20 10
  //container_height - 42 = svg
  //margins top, right, bottom left
  const m: [number, number, number, number] = [2, chartRef.value.editCode ? 100 : 2, 100, 42]
  localChartState.w = Math.max(100 * localChartState.factors.length + 1, 1000) - m[1] - m[3]
  //let h = Math.max(430, Math.min(600, $('#mychart').height()-85)) - m[0] - m[2];
  let h = Math.max(430, Math.min(600, 0)) - m[0] - m[2]
  if (elm.value && elm.value.children.length === 0) {
    h = 430 - m[0] - m[2]
  }

  localChartState.x = d3
    .scaleBand()
    .domain(localChartState.factors.map((f) => f?.name))
    .range([0, localChartState.w])

  const line = d3.line()

  /* TODO
    let currentSeriesOrder = chart.series.map(serie => serie.business).join('');
    let doTransition =
      oldFactors.length > 0 &&
      seriesOrder === currentSeriesOrder &&
      (oldFactors.length !== localChartState.factors.length ||
        oldFactors.join('') === localChartState.factors.join(''));
    */
  /*
    TODO FIX
  if(scope.remoteUpdate){
    scope.remoteUpdate = false;
    doTransition = true;
  }
  */

  function updateBandingBackground(factor: Factor, i: number): string {
    return i % 2 === 0 ? '#e5f3ff' : '#fff'
  }
  function updateBandingBackgroundAdd(reverse?: boolean): string {
    let i = localChartState.factors.length
    if (reverse) {
      i++
    }
    return i % 2 === 0 ? '#f2f9ff' : '#f9f9f9'
  }

  // Returns the path for a given data point.
  function path(serie: Serie) {
    const points: Point[] = []
    localChartState.factors.forEach(function (factor) {
      //TODO handle animation of drag?
      const offeringArr = localChartState.offerings[`${serie.$id}-${factor.$id}`]
      if (offeringArr) {
        const offering = offeringArr[0]
        const yScale = localChartState.y[factor.name]
        if (offering && yScale) {
          points.push([
            (localChartState.x(factor.name) || 0) + localChartState.x.bandwidth() / 2,
            yScale(offering.value),
          ])
        }
      }
    })
    return line(points)
  }

  function maybeTransiton<T extends d3.BaseType, Datum, P extends d3.BaseType, ParentDatum>(
    selection: d3.Selection<T, Datum, P, ParentDatum>,
    // additionalCondition?: boolean,
  ) {
    return selection
    /* TODO
      if (
        doTransition &&
        (additionalCondition === undefined || additionalCondition)
      ) {
        return selection
          .transition()
          .delay(delay)
          .duration(500);
      }
      return selection;
      */
  }

  // Create a scale for each trait.
  localChartState.factors.forEach(function (factor) {
    localChartState.y[factor.name] = d3.scaleLinear().domain([-0.1, 1.1]).range([h, 0])
  })
  // elm.dragscrollable();
  if (elm.value && elm.value.children.length === 0) {
    svg = d3
      .select(elm.value)
      .append('svg:svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .append('svg:g')
      .attr('transform', 'translate(' + m[3] + ',' + m[0] + ')') as unknown as d3.Selection<
      SVGGElement,
      unknown,
      d3.BaseType,
      unknown
    >
  } else {
    svg = d3.select(elm.value).select('svg').select('g') as unknown as d3.Selection<
      SVGGElement,
      unknown,
      d3.BaseType,
      unknown
    >
  }
  d3.select(elm.value)
    .select('svg')
    .attr('width', localChartState.w + m[1] + m[3])
    .attr('height', h + m[0] + m[2])

  if (chartRef.value.editCode) {
    let addFactorGroup = svg.select('g.addfactor')
    if (addFactorGroup.node() === null) {
      addFactorGroup = svg
        .append('svg:g')
        .attr('class', 'addfactor no-select')
        .on('click', function () {
          $q.dialog({
            component: AddDialog,
            componentProps: {
              type: 'factor',
            },
          }).onOk((names) => {
            chartStore.addFactor(names)
          })
        })

      addFactorGroup.append('svg:rect').attr('class', 'backgroundFactor').attr('x', 0).attr('y', 0)

      addFactorGroup
        .append('svg:text')
        .attr('class', 'material-icons')
        .attr('style', 'font-size:140px; fill: #adc8e3')
        .text('\ue145')
    }

    addFactorGroup
      .select('rect')
      .attr('width', 100)
      .attr('height', h)
      .style('fill', updateBandingBackgroundAdd())

    addFactorGroup
      .select('text')
      .attr('transform', 'translate(0, 0)')
      .attr('x', -20)
      .attr('y', h / 2 + 50)

    addFactorGroup.attr('transform', 'translate(' + (localChartState.w + 2) + ')')
  }

  //legend background
  let legendBackground = svg.select('rect.legendbackground')
  if (legendBackground.node() === null) {
    legendBackground = svg
      .append('svg:rect')
      .attr('class', 'legendbackground')
      .attr('x', 0)
      .attr('height', m[2])
  }
  legendBackground.attr('width', localChartState.w).attr('y', h)

  //border
  let backBorder = svg.select('rect.border')
  if (backBorder.node() === null) {
    backBorder = svg.append('svg:rect').attr('class', 'border').attr('x', -1).attr('y', -1)

    if (chartRef.value.editCode) {
      svg
        .append('svg:text')
        .attr('class', 'addfactorhelp no-select')
        .attr('x', 100)
        .attr('style', 'font-size:100px;fill:#fbfbfb')
        .text('Add a factor')

      svg
        .append('svg:text')
        .attr('class', 'addfactorhelparrow material-icons no-select')
        .attr('x', 680)
        .attr('style', 'font-size:90px;fill:#fbfbfb;font-weight:bold')
        .text('\ue5c8')
    }
  }

  svg
    .select('.addfactorhelp')
    .attr('y', h / 2 + 30)
    .style('fill', localChartState.factors.length > 0 ? '#fbfbfb' : '#adc8e3')

  svg
    .select('.addfactorhelparrow')
    .attr('y', h / 2 + 30)
    .style('fill', localChartState.factors.length > 0 ? '#fbfbfb' : '#adc8e3')

  //animate only on delete delete
  maybeTransiton(backBorder) //TODO: , oldFactors.length > localChartState.factors.length)
    .attr('width', localChartState.w + 2)
    .attr('height', h + 2)

  let mainAxis = svg.select('g.mainaxis')
  if (mainAxis.node() === null) {
    mainAxis = svg
      .append('svg:g')
      .attr('class', 'mainaxis no-select')
      .attr('transform', 'translate(-40)')

    mainAxis.append('svg:text').attr('x', 0).attr('y', 14).text('High')

    mainAxis.append('svg:text').attr('class', 'l-offering').text('Offerings')

    mainAxis.append('svg:text').attr('class', 'l-factor').text('Factors of Competition')

    mainAxis.append('svg:text').attr('class', 'l-low').attr('x', 0).text('Low')
  }
  mainAxis
    .select('.l-offering')
    .attr('transform', 'rotate(-90, 14, ' + (h / 2 + 29) + ')')
    .attr('x', 14)
    .attr('y', h / 2 + 29)

  mainAxis
    .select('.l-factor')
    .attr('x', localChartState.w / 2 - 30)
    .attr('y', h + m[2] - 10)

  mainAxis.select('.l-low').attr('y', h - 2)

  //background
  let backgroundGroup = svg.select('.background')
  if (backgroundGroup.node() === null) {
    backgroundGroup = svg.append('svg:g').attr('class', 'background')
  }

  //add background by name
  let backgroundFactor = backgroundGroup
    .selectAll<SVGRectElement, Factor>('.backgroundFactor')
    .data(localChartState.factors, (factor) => factor.$id)

  const backgroundFactorEnter = backgroundFactor
    .enter()
    .append<SVGRectElement>('svg:rect')
    .attr('class', 'backgroundFactor')
    .attr('x', localChartState.w)
    .attr('y', 0)
    .attr('width', 0)
    .attr('height', h)

  backgroundFactor
    .exit()
    .transition()
    .duration(500)
    .attr('width', 0)
    .attr('x', function (this) {
      return parseFloat(d3.select(this).attr('x')) + localChartState.x.bandwidth() / 2
    })
    .remove()

  backgroundFactor = backgroundFactorEnter
    .merge(backgroundFactor) //update
    .style('fill', updateBandingBackground)

  maybeTransiton(backgroundFactor)
    .attr('x', (factor) => localChartState.x(factor.name) || 0)
    .attr('width', localChartState.x.bandwidth())
    .attr('height', h)

  // Add foreground lines.
  let foreground = svg.select<SVGGElement>('g.foreground')
  if (foreground.empty()) {
    foreground = svg.append<SVGGElement>('svg:g').attr('class', 'foreground')
  }
  let svgPath = foreground
    .selectAll<SVGPathElement, Serie>('.line')
    .data(localChartState.series, (serie) => serie.$id)

  const svgPathEnter = svgPath
    .enter()
    .append<SVGPathElement>('svg:path')
    .attr('class', 'line')
    .attr('stroke-dasharray', (serie: Serie) => serie.dash)
    .style('stroke', (serie: Serie) => serie.color)

  svgPath.exit().transition().duration(500).style('opacity', 0).remove()
  svgPath = svgPathEnter.merge(svgPath)

  //update
  maybeTransiton(svgPath)
    .attr('d', (serie) => path(serie))
    .attr('stroke-dasharray', (serie) => serie.dash)
    .style('stroke', (serie) => serie.color)

  //factors groupHolder
  let factorGroup = svg.select<SVGGElement>('.factorGroup')
  //other more d3js localChartState.ways possible?
  if (factorGroup.node() === null) {
    factorGroup = svg.append<SVGGElement>('svg:g').attr('class', 'factorGroup')
  }

  // Add a group element for each trait.
  let factorContainer = factorGroup
    .selectAll<SVGGElement, Factor>('.factor')
    .data(localChartState.factors, (factor) => factor.$id)
  const factorContainerEnter = factorContainer
    .enter()
    .append<SVGGElement>('svg:g')
    .attr('class', 'factor no-select')
    //appear from the right
    .attr('transform', function () {
      return 'translate(' + localChartState.w + ')'
    })

  //invisible rect to force size of group and be draggable?
  factorContainerEnter
    .append('svg:rect')
    .attr('class', 'factorSize')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', h)

  const factorDomain = factorContainerEnter
    .append('svg:g')
    .attr('class', 'axis')
    .append('svg:rect')
    .attr('class', 'domain')
    .attr('y', function (factor) {
      const yScale = localChartState.y[factor.name]
      return yScale ? yScale(1) - 25 : 0
    })
    .attr('width', 50)
    .attr('height', function (factor) {
      const yScale = localChartState.y[factor.name]
      return yScale ? 50 + yScale(0) - yScale(1) : 50
    })
    .on('mousedown', function (event) {
      event.stopPropagation()
    })

  //Add an axis and title.
  if (chartRef.value.editCode) {
    const addOfferingHandler = (event: Event, factor: Factor) => {
      if (event.type === 'touchstart') {
        event.stopPropagation()
      }
      /*TODO
        if (d3.event.timeStamp - lastClickTimeStamp < 300) {
          return false;
        }
        lastClickTimeStamp = d3.event.timeStamp;
        */

      /*
        TODO: FIX?
          if ($(this).data('already')) {
                $(this).data('already', false);
                return false;
            } else if (d3.event.type === 'touchstart') {
                $(this).data('already', true);
            }
            */
      const pos = d3.pointer(event)
      const yScale = localChartState.y[factor.name]
      if (!yScale) return
      const v = Math.max(0, Math.min(1, yScale.invert(pos[1])))
      // add to first empty or create new serie
      let start = seriesRef.value.findIndex((s) => s.business === uiStore.selectedSerieName)
      if (start === -1) {
        start = 0
      }
      for (let index = 0; index < chartRef.value.series.length; index++) {
        const offsetIndex = (start + index) % chartRef.value.series.length
        const serie = seriesRef.value[offsetIndex]
        if (serie && !localChartState.offerings.hasOwnProperty(`${serie.$id}-${factor.$id}`)) {
          chartStore.addOffering(serie, factor, v)
          return
        }
      }
      // all series have offering create new serie
      const newSerieId = chartStore.addSeries(chartStore.getUniqueBusinessName())[0]
      if (!newSerieId) return
      const newSerie = seriesIndexRef.value[newSerieId]
      if (!newSerie) return
      chartStore.addOffering(newSerie, factor, v)
      uiStore.selectedSerieName = newSerie.business
    }

    factorDomain.on('touchstart', addOfferingHandler).on('click', addOfferingHandler)
  }

  factorContainerEnter
    .select('.axis')
    .append('svg:foreignObject')
    .attr('class', 'xlegend-wrapper')
    .attr('y', h + 20)
    .attr('width', 0)
    .attr('height', 50) //TODO: custom height?
    .append('xhtml:body')
    .attr('xmlns', 'http://www.w3.org/1999/xhtml')
    .append('xhtml:div')
    .attr('class', 'xlegend')
    .on('mousedown', function (event) {
      event.stopPropagation()
    })
    .on('touchstart', function (event) {
      event.stopPropagation()
    })
    .on('mouseup', function (event, factor: Factor) {
      if (chartRef.value.editCode) {
        $q.dialog({
          component: RemoveDialog,
          componentProps: {
            type: 'factor',
            name: factor.name,
          },
        }).onOk(({ action, name }) => {
          if (action === 'remove') {
            chartStore.removeFactor(factor)
          }
          if (action === 'rename') {
            chartStore.renameFactor(factor, name)
          }
        })
      }
    })

  factorContainer.exit().transition().duration(500).style('opacity', 0).remove()

  factorContainer = factorContainerEnter.merge(factorContainer)

  factorContainer
    .select('.xlegend-wrapper')
    .attr('width', function () {
      return localChartState.x.bandwidth()
    })
    .attr('y', h + 20)

  factorContainer.select('.xlegend').text((factor) => factor.name)

  factorContainer
    .select('.factorSize')
    .attr('width', localChartState.x.bandwidth())
    .attr('height', h)

  const domainWidth = Math.max(50, localChartState.x.bandwidth() / 3)

  factorContainer
    .select('.domain')
    .attr('y', function (factor) {
      const yScale = localChartState.y[factor.name]
      return yScale ? yScale(1) - 25 : 0
    })
    .attr('x', (localChartState.x.bandwidth() - domainWidth) / 2)
    .attr('width', domainWidth)
    .attr('height', function (factor) {
      const yScale = localChartState.y[factor.name]
      return yScale ? 50 + yScale(0) - yScale(1) : 50
    })

  //handle factor dragging right-left
  if (chartRef.value.editCode) {
    let isDragging = false
    const factorDrag = d3
      .drag<SVGGElement, Factor, SubjectPosition>()
      .subject(
        (_event, factor) =>
          ({ x: localChartState.x(factor.name) ?? 0, y: 0 }) satisfies SubjectPosition,
      )
      .on(
        'start',
        function (
          this: SVGGElement,
          _event: D3DragEvent<SVGGElement, Factor, SubjectPosition>,
          factor,
        ) {
          isDragging = false

          const index = localChartState.factors.indexOf(factor)
          const node = d3.select<SVGGElement, Factor>(this).node()
          if (node?.parentNode) {
            node.parentNode.appendChild(node)
          }
          const backgroundNode = backgroundGroup.node()
          if (backgroundNode instanceof Element) {
            const nodes = backgroundFactor.nodes()
            const factorRect = nodes[index]
            if (factorRect instanceof SVGRectElement) {
              backgroundNode.appendChild(factorRect)
            }
          }
        },
      )
      .on('drag', function (event: D3DragEvent<SVGGElement, Factor, SubjectPosition>, factor) {
        if (!isDragging && Math.abs((localChartState.x(factor.name) ?? 0) - event.x) < 30) {
          return
        }
        isDragging = true
        const currentX = localChartState.factors.reduce<Record<string, number>>(
          (acc, currentFactor) => {
            acc[currentFactor.name] = localChartState.x(currentFactor.name) ?? 0
            return acc
          },
          {},
        )
        currentX[factor.name] = event.x
        localChartState.factors.sort((a, b) => (currentX[a.name] ?? 0) - (currentX[b.name] ?? 0))
        localChartState.x
          .domain(localChartState.factors.map((f) => f.name))
          .range([0, localChartState.w])
        const dragX = event.x

        foreground.selectAll<SVGPathElement, Serie>('.line').attr('d', (serie) => path(serie))

        factorContainer.filter(':last-child').attr('transform', `translate(${dragX})`)
        factorContainer
          .filter(':not(:last-child)')
          .transition()
          .duration(200)
          .ease(d3.easeLinear)
          .attr('transform', (datum) => `translate(${localChartState.x(datum.name)})`)

        backgroundFactor.style('fill', updateBandingBackground)
        backgroundFactor.filter(':last-child').attr('x', dragX).style('fill', '#90caf9')
        backgroundFactor
          .filter(':not(:last-child)')
          .transition()
          .duration(200)
          .ease(d3.easeLinear)
          .attr('x', (datum) => localChartState.x(datum.name) || 0)
      })
      .on('end', () => {
        isDragging = false
        localChartState.x
          .domain(localChartState.factors.map((f) => f.name))
          .range([0, localChartState.w])
        backgroundFactor.style('fill', updateBandingBackground)
        const transition = d3.transition().duration(500)
        transition
          .selectAll<SVGGElement, Factor>('.factor')
          .attr('transform', (datum) => `translate(${localChartState.x(datum.name) || 0})`)

        backgroundGroup
          .selectAll<SVGRectElement, Factor>('.backgroundFactor')
          .attr('x', (datum) => localChartState.x(datum.name) || 0)

        transition
          .selectAll<SVGPathElement, Serie>('.line')
          .attr('d', (serie) => path(serie))
          .transition()
          .on('end', () => {
            const newFactorsOrder = localChartState.factors.map((f) => f.$id)
            if (newFactorsOrder.join('') !== chartRef.value.factors.join('')) {
              chartStore.updateChart('factors', newFactorsOrder)
            }
          })
      })

    factorContainerEnter.call(factorDrag)
  } //end edit

  maybeTransiton(factorContainer).attr('transform', function (factor) {
    return 'translate(' + localChartState.x(factor.name) + ')'
  })

  //add offering onto domain axis

  let marker = factorContainer.selectAll<SVGGElement, OfferingPoint>('.dot').data((factor) => {
    const points: OfferingPoint[] = []
    localChartState.offerings[factor.$id]?.forEach((offering: Offering) => {
      const serie = seriesIndexRef.value[offering.serieId]
      if (!serie) {
        return
      }
      points.push({
        factor,
        serie,
        offering,
      })
    })
    return points
  })
  const markerEnter = marker
    .enter()
    .append<SVGGElement>('svg:g')
    .attr('class', 'dot')
    .attr('transform', (point) => {
      const yScale = localChartState.y[point.factor.name]
      return (
        'matrix(0, 0, 0, 0, ' +
        localChartState.x.bandwidth() / 2 +
        ', ' +
        (yScale ? yScale(point.offering.value) : 0) +
        ')'
      )
    })
  markerEnter
    .transition()
    .duration(500)
    .ease(d3.easeElastic)
    .attr('transform', (point) => {
      const yScale = localChartState.y[point.factor.name]
      return (
        'matrix(1, 0, 0, 1, ' +
        localChartState.x.bandwidth() / 2 +
        ', ' +
        (yScale ? yScale(point.offering.value) : 0) +
        ')'
      )
    })

  markerEnter.append<SVGPathElement>('svg:path')

  markerEnter
    .append<SVGRectElement>('svg:rect')
    .attr('x', -25)
    .attr('width', 50)
    .attr('y', -25)
    .attr('height', 50)

  marker.exit().remove()

  marker = markerEnter.merge(marker)

  maybeTransiton(marker.select<SVGPathElement>('path'))
    .attr('d', (point) => {
      if (point.serie.symbol === 'none') {
        return ''
      }
      const symbolType = SymbolsLookup[point.serie.symbol]
      if (!symbolType) {
        return ''
      }
      return (
        d3
          .symbol()
          .type(symbolType)
          .size(() => uiStore.markerSize * 10)() ?? ''
      )
    })
    .style('fill', (point) => point.serie.color)

  if (chartRef.value.editCode) {
    markerEnter
      .select('rect')
      .attr('x', -domainWidth / 2)
      .attr('width', domainWidth)
    const markerDrag = d3
      .drag<SVGGElement, OfferingPoint, SubjectPosition>()
      .subject((_event, point) => {
        const yScale = localChartState.y[point.factor.name]
        return {
          x: localChartState.x.bandwidth() / 2,
          y: yScale ? yScale(point.offering.value) : 0,
        } satisfies SubjectPosition
      })
      .on(
        'start',
        function (event: D3DragEvent<SVGGElement, OfferingPoint, SubjectPosition>, point) {
          const lineSelection = foreground
            .selectAll<SVGPathElement, Serie>('.line')
            .filter((serie) => serie.business === point.serie.business)
          const lineNode = lineSelection.node()
          if (lineNode?.parentNode) {
            lineNode.parentNode.appendChild(lineNode)
          }

          d3.selectAll<SVGGElement, OfferingPoint>('.dot')
            .filter((datum) => datum.serie.business === point.serie.business)
            .each(function () {
              const node = this as SVGGElement
              if (node.parentNode) {
                node.parentNode.appendChild(node)
              }
            })

          event.sourceEvent.stopPropagation()
        },
      )
      .on(
        'drag',
        function (event: D3DragEvent<SVGGElement, OfferingPoint, SubjectPosition>, point) {
          const yScale = localChartState.y[point.factor.name]
          if (!yScale) return
          const value = yScale.invert(event.y)
          const dotSelection = d3.select<SVGGElement, OfferingPoint>(this)

          if (value < -0.05 && value >= -0.1) {
            const serieWithOfferings = point.serie as SerieWithOfferings
            if (!serieWithOfferings.offerings) {
              serieWithOfferings.offerings = {}
            }
            serieWithOfferings.offerings[point.factor.name] = value

            dotSelection
              .attr('transform', (datum) => {
                const dyScale = localChartState.y[datum.factor.name]
                const y = dyScale ? dyScale(datum.offering.value) : 0
                return `matrix(1, 0, 0, 1, ${localChartState.x.bandwidth() / 2}, ${y})`
              })
              .select<SVGPathElement>('path')
              .attr('d', (datum) => {
                if (datum.serie.symbol === 'none') {
                  return ''
                }
                const symbolType = SymbolsLookup[datum.serie.symbol]
                if (!symbolType) {
                  return ''
                }
                return (
                  d3
                    .symbol()
                    .type(symbolType)
                    .size(() => (uiStore.markerSize * 10 * (0.15 + value)) / 0.1)() ?? ''
                )
              })
            return
          }

          if (value < -0.1) {
            point.offering.value = -1
            dotSelection
              .attr('transform', () => `matrix(1, 0, 0, 1, ${localChartState.x.bandwidth() / 2},0)`)
              .select<SVGPathElement>('path')
              .attr('d', (datum) => {
                if (datum.serie.symbol === 'none') {
                  return ''
                }
                const symbolType = SymbolsLookup[datum.serie.symbol]
                if (!symbolType) {
                  return ''
                }
                return (
                  d3
                    .symbol()
                    .type(symbolType)
                    .size(() => 0)() ?? ''
                )
              })
            return
          }

          point.offering.value = Math.max(0, Math.min(1, value))
          dotSelection.attr('transform', (datum) => {
            const pyScale = localChartState.y[datum.factor.name]
            const y = pyScale ? pyScale(datum.offering.value) : 0
            return `matrix(1, 0, 0, 1, ${localChartState.x.bandwidth() / 2}, ${y})`
          })
          foreground.selectAll<SVGPathElement, Serie>('.line').attr('d', (serie) => path(serie))
        },
      )
      .on('end', (_event, point) => {
        if (point.offering.value === -1) {
          chartStore.removeOffering(point.offering)
        } else {
          point.offering.value = Math.max(0, Math.min(1, point.offering.value))
          chartStore.changeOffering(point.offering, point.offering.value)
        }
      })

    marker.call(markerDrag)
  }

  maybeTransiton(marker).attr('transform', (point) => {
    const yScale = localChartState.y[point.factor.name]
    return (
      'matrix(1, 0, 0, 1, ' +
      localChartState.x.bandwidth() / 2 +
      ', ' +
      (yScale ? yScale(point.offering.value) : 0) +
      ')'
    )
  })

  //save length to determine if localChartState.we localChartState.want transitions or not next time
  /*
    oldFactors = localChartState.factors.slice(0);
    seriesOrder = chart.series
      .map(function(serie) {
        return serie.business;
      })
      .join('');
      */
})
</script>
<template>
  <div id="mychart" ref="elm"></div>
</template>
<style>
svg {
  font-size: 14px;
}

svg .legendbackground {
  fill: #fff;
}

svg body {
  background-color: #fff;
  position: initial;
}

svg .dot rect {
  opacity: 0;
}

svg rect.backgroundFactor {
  opacity: 1;
}

svg rect.border {
  stroke-width: 2px;
  stroke: #adc8e3;
  fill: #fbfbfb;
}

svg .factor {
  -ms-touch-action: none;
  touch-action: none;
}

svg .factorSize {
  cursor: col-resize;
}

svg rect.factorSize {
  fill: none;
  stroke: none;
  pointer-events: all;
}

svg g.addfactor {
  cursor: pointer;
}

svg g.addfactor:hover text {
  fill: #e3e3e3 !important;
}

#mychart {
  display: block;
  text-align: center;
  overflow: auto;
  position: relative;
}

#mychart div.iexlegend {
  position: absolute;
}

#mychart svg {
  border: 1px #dadada solid;
  background-color: #fff;
  padding: 20px 20px 20px 20px;
  margin: 10px 10px 10px 10px;
  cursor: default;
  box-sizing: content-box;
}

#mychart.chat-visible {
  margin-right: 250px;
}

#mychart.no-edit .axis .domain {
  cursor: default;
}
#mychart.no-edit .axis text,
#mychart.no-edit .dot {
  cursor: default;
}
#mychart.no-edit .xlegend,
#mychart.no-edit .iexlegend {
  cursor: default;
}
#mychart.no-edit svg .factorSize {
  cursor: default;
}
#mychart.no-edit svg g.addfactor {
  cursor: default;
}

.foreground path {
  fill: none;
  stroke-opacity: 0.5;
  stroke-width: 3px;
}

.foreground path.fade {
  stroke: #000;
  stroke-opacity: 0.05;
}

.dash {
  stroke-width: 6;
}

.axis .domain {
  opacity: 0;
  cursor: pointer;
}

.axis line,
.axis path {
  fill: none;
  stroke: #000;
  pointer-events: none;
}

.axis text,
.dot {
  text-shadow: 0 1px 0 #fff;
  cursor: move;
}

.xlegend,
.iexlegend {
  font-weight: 600;
  text-align: center;
  word-wrap: break-word;
  cursor: pointer;
}

.no-select {
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -o-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  cursor: default;
}
</style>
