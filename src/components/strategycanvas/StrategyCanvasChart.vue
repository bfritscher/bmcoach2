<script setup lang="ts">
import * as d3 from 'd3'
import { ref, watchEffect } from 'vue'
import { useQuasar } from 'quasar'
import { useChartStore } from '@/stores/chart-store'
import { useUIStore } from '@/stores/ui-store'
import { Serie, Factor, Chart, Offering } from '@/components/models'
import { SymbolsLookup } from '@/utils/d3-helpers'
import AddDialog from '@/components/strategycanvas/AddDialog.vue'
import RemoveDialog from '@/components/strategycanvas/RemoveDialog.vue'

const $q = useQuasar()
const chartStore = useChartStore()
const uiStore = useUIStore()

const elm = ref<HTMLElement | null>(null)

type Point = [number, number]

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
  offerings: { [key: string]: Offering[] }
  x: d3.ScaleBand<string>
  y: {
    [s: string]: d3.ScaleLinear<number, number>
  }
  w: number
} = {
  chart: chartStore.chart,
  factors: [],
  series: [],
  offerings: {},
  x: d3.scaleBand<string>().domain([]).range([0, 0]),
  y: {},
  w: 0,
}

watchEffect(() => {
  //root svg
  let svg

  //d3js ordinal scale only localChartState.works on simple array
  // TODO check if unref can be used?
  localChartState.chart = JSON.parse(JSON.stringify(chartStore.chart))
  localChartState.factors = JSON.parse(JSON.stringify(chartStore.factors))
  localChartState.series = JSON.parse(JSON.stringify(chartStore.series))
  localChartState.offerings = JSON.parse(JSON.stringify(chartStore.offerings))

  // TODO: let delay = oldFactors.length > localChartState.factors.length ? 500 : 0;
  // delay standard transitions if delete factor

  //62 = 10 20 1 svg 1 20 10
  //container_height - 42 = svg
  //margins top, right, bottom left
  const m:[number, number, number, number] = [2, chartStore.chart.editCode ? 100 : 2, 100, 42]
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
    return i % 2 === 0 ? '#e5f3ff' : '#fff';
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
      if (localChartState.offerings[`${serie.$id}-${factor.$id}`]) {
        const offering = localChartState.offerings[`${serie.$id}-${factor.$id}`][0]
        points.push([
          (localChartState.x(factor.name) || 0) + localChartState.x.bandwidth() / 2,
          localChartState.y[factor.name](offering.value),
        ])
      }
    })
    return line(points)
  }

  function maybeTransiton(
    selection: d3.Selection<any, any, any, any>,
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
      .attr('transform', 'translate(' + m[3] + ',' + m[0] + ')')
  } else {
    svg = d3.select(elm.value).select('svg').select('g')
  }
  d3.select(elm.value)
    .select('svg')
    .attr('width', localChartState.w + m[1] + m[3])
    .attr('height', h + m[0] + m[2])

  if (chartStore.chart.editCode) {
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

    if (chartStore.chart.editCode) {
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
    .selectAll('.backgroundFactor')
    .data(localChartState.factors)

  const backgroundFactorEnter = backgroundFactor
    .enter()
    .append('svg:rect')
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
  let foreground: any = svg.select('g.foreground')
  if (foreground.empty()) {
    foreground = svg.append('svg:g').attr('class', 'foreground')
  }
  let svgPath = foreground.selectAll('.line').data(localChartState.series)

  const svgPathEnter = svgPath
    .enter()
    .append('svg:path')
    .attr('class', 'line')
    .attr('stroke-dasharray', (serie: Serie) => serie.dash)
    .style('stroke', (serie: Serie) => serie.color)

  svgPath.exit().transition().duration(500).style('opacity', 0).remove()
  svgPath = svgPathEnter.merge(svgPath)

  //update
  maybeTransiton(svgPath)
    .attr('d', path)
    .attr('stroke-dasharray', (serie) => serie.dash)
    .style('stroke', (serie) => serie.color)

  //factors groupHolder
  let factorGroup = svg.select('.factorGroup')
  //other more d3js localChartState.ways possible?
  if (factorGroup.node() === null) {
    factorGroup = svg.append('svg:g').attr('class', 'factorGroup')
  }

  // Add a group element for each trait.
  let factorContainer = factorGroup.selectAll('.factor').data(localChartState.factors)
  const factorContainerEnter = factorContainer
    .enter()
    .append('svg:g')
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
      return localChartState.y[factor.name](1) - 25
    })
    .attr('width', 50)
    .attr('height', function (factor) {
      return 50 + localChartState.y[factor.name](0) - localChartState.y[factor.name](1)
    })
    .on('mousedown', function (event) {
      event.stopPropagation()
    })

  //Add an axis and title.
  if (chartStore.chart.editCode) {
    const addOfferingHandler = function (event: any, factor: Factor) {
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
      const v = Math.max(0, Math.min(1, localChartState.y[factor.name].invert(pos[1])))
      // add to first empty or create new serie
      let start = chartStore.series.findIndex((s) => s.business === uiStore.selectedSerieName)
      if (start === -1) {
        start = 0
      }
      for (let index = 0; index < chartStore.chart.series.length; index++) {
        const offsetIndex = (start + index) % chartStore.chart.series.length
        const serie = chartStore.series[offsetIndex]
        if (!localChartState.offerings.hasOwnProperty(`${serie.$id}-${factor.$id}`)) {
          chartStore.addOffering(serie, factor, v)
          return
        }
      }
      // all series have offering create new serie
      const newSerieId = chartStore.addSeries(chartStore.getUniqueBusinessName())[0]
      const newSerie = chartStore.seriesIndex[newSerieId]
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
      if (chartStore.chart.editCode) {
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
      return localChartState.y[factor.name](1) - 25
    })
    .attr('x', (localChartState.x.bandwidth() - domainWidth) / 2)
    .attr('width', domainWidth)
    .attr('height', function (factor) {
      return 50 + localChartState.y[factor.name](0) - localChartState.y[factor.name](1)
    })

  //handle factor dragging right-left
  if (chartStore.chart.editCode) {
    let isDraging = false
    factorContainerEnter.call(
      d3
        .drag<any, any>()
        .subject((factor) => {
          return {
            x: localChartState.x(factor.name),
            y: null,
          }
        })
        .on('start', function (this: any, factor: Factor) {
          isDraging = false

          let i = localChartState.factors.indexOf(factor)
          //move to top visible
          let node = d3.select(this).node()
          if (node && node.parentNode) {
            node.parentNode.appendChild(node)
          }
          const node2 = backgroundGroup.node() as Element
          if (node2) {
            const factorRect: any = backgroundFactor.nodes()[i]
            if (factorRect) {
              node2.appendChild(factorRect)
            }
          }
        })
        .on('drag', function (event, factor: Factor) {
          if (!isDraging && Math.abs((localChartState.x(factor.name) || 0) - event.x) < 30) {
            return
          }
          isDraging = true
          const currentX: { [s: string]: number } = localChartState.factors.reduce(
            (currentX: { [s: string]: number }, factor) => {
              currentX[factor.name] = localChartState.x(factor.name) || 0
              return currentX
            },
            {},
          )
          currentX[factor.name] = event.x
          localChartState.factors.sort((a, b) => currentX[a.name] - currentX[b.name])
          localChartState.x
            .domain(localChartState.factors.map((f) => f.name))
            .range([0, localChartState.w])
          const dragX = event.x

          foreground.selectAll('.foreground .line').attr('d', path)

          factorContainer.filter(':last-child').attr('transform', 'translate(' + dragX + ')')
          factorContainer
            .filter(':not(:last-child)')
            .transition()
            .duration(200)
            .ease(d3.easeLinear)
            .attr('transform', function (factor) {
              return 'translate(' + localChartState.x(factor.name) + ')'
            })

          backgroundFactor.style('fill', updateBandingBackground)
          backgroundFactor.filter(':last-child').attr('x', dragX).style('fill', '#90caf9')
          backgroundFactor
            .filter(':not(:last-child)')
            .transition()
            .duration(200)
            .ease(d3.easeLinear)
            .attr('x', (factor: any) => localChartState.x(factor.name) || 0)
        })
        .on('end', function () {
          isDraging = false
          localChartState.x
            .domain(localChartState.factors.map((f) => f.name))
            .range([0, localChartState.w])
          backgroundFactor.style('fill', updateBandingBackground)
          let t = d3.transition().duration(500)
          t.selectAll('.factor').attr('transform', function (factor: any) {
            return 'translate(' + (localChartState.x(factor.name) || 0) + ')'
          })

          backgroundGroup.selectAll('.backgroundFactor').attr('x', function (factor: any) {
            return localChartState.x(factor.name) || 0
          })
          t.selectAll('.foreground .line').attr('d', path)
          t.transition().on('end', () => {
            const newFactorsOrder = localChartState.factors.map((f) => f.$id)
            if (newFactorsOrder.join('') !== chartStore.chart.factors.join('')) {
              chartStore.updateChart('factors', newFactorsOrder)
            }
          })
        }),
    )
  } //end edit

  maybeTransiton(factorContainer).attr('transform', function (factor) {
    return 'translate(' + localChartState.x(factor.name) + ')'
  })

  //add offering onto domain axis

  let marker = factorContainer.selectAll('.dot').data(function (factor) {
    const points: any[] = []
    localChartState.offerings[factor.$id]?.forEach(function (offering: Offering) {
      const serie = chartStore.seriesIndex[offering.serieId]
      points.push({
        factor: factor,
        serie: serie,
        offering,
      })
    })
    return points
  })
  const markerEnter = marker
    .enter()
    .append('svg:g')
    .attr('class', 'dot')
    .attr('transform', function (point) {
      return (
        'matrix(0, 0, 0, 0, ' +
        localChartState.x.bandwidth() / 2 +
        ', ' +
        localChartState.y[point.factor.name](point.offering.value) +
        ')'
      )
    })
  markerEnter
    .transition()
    .duration(500)
    .ease(d3.easeElastic)
    .attr('transform', function (point) {
      return (
        'matrix(1, 0, 0, 1, ' +
        localChartState.x.bandwidth() / 2 +
        ', ' +
        localChartState.y[point.factor.name](point.offering.value) +
        ')'
      )
    })

  markerEnter.append('svg:path')

  markerEnter.append('svg:rect').attr('x', -25).attr('width', 50).attr('y', -25).attr('height', 50)

  marker.exit().remove()

  marker = markerEnter.merge(marker)

  maybeTransiton(marker.select('path'))
    .attr('d', function (point) {
      return point.serie.symbol === 'none'
        ? ''
        : d3
            .symbol()
            .type(() => SymbolsLookup[point.serie.symbol])
            .size(() => uiStore.markerSize * 10)()
    })
    .style('fill', function (point) {
      return point.serie.color
    })

  if (chartStore.chart.editCode) {
    markerEnter
      .select('rect')
      .attr('x', -domainWidth / 2)
      .attr('width', domainWidth)
    marker.call(
      d3
        .drag<any, any>()
        .subject(function (event, point: any) {
          return {
            y: localChartState.y[point.factor.name](point.offering.value),
          }
        })
        .on('start', function (event, point: any) {
          //make dragged serie top one
          let index =
            foreground
              .selectAll('.line')
              .data()
              .findIndex((s: Serie) => s.business === point.serie.business) + 1
          foreground.node().appendChild(foreground.select('.line:nth-child(' + index + ')').node())
          d3.selectAll('.dot').each(function (this: any, p: any) {
            if (p.serie.business === point.serie.business) {
              this.parentNode.appendChild(this)
            }
          })

          event.sourceEvent.stopPropagation() //we do not localChartState.want to start drag on factor
        })
        .on('drag', function (event, point: any) {
          let v = localChartState.y[point.factor.name].invert(event.y)
          if (v < -0.05 && v >= -0.1) {
            point.serie.offerings[point.factor.name] = v
            d3.select(this)
              .attr('transform', function (d: any) {
                return (
                  'matrix(1, 0, 0, 1,' +
                  localChartState.x.bandwidth() / 2 +
                  ',' +
                  localChartState.y[d.factor.name](d.offering.value) +
                  ')'
                )
              })
              .select('path')
              .attr('d', function (d: any) {
                return d.serie.symbol === 'none'
                  ? ''
                  : d3
                      .symbol()
                      .type(SymbolsLookup[d.serie.symbol])
                      .size(function () {
                        return (uiStore.markerSize * 10 * (0.15 + v)) / 0.1
                      })()
              })
          } else if (v < -0.1) {
            point.offering.value = -1
            d3.select(this)
              .attr('transform', function () {
                return 'matrix(1, 0, 0, 1,' + localChartState.x.bandwidth() / 2 + ',0)'
              })
              .select('path')
              .attr('d', function (d: any) {
                return d.serie.symbol === 'none'
                  ? ''
                  : d3
                      .symbol()
                      .type(SymbolsLookup[d.serie.symbol])
                      .size(function () {
                        return 0
                      })()
              })
          } else {
            point.offering.value = Math.max(0, Math.min(1, v))
            d3.select(this).attr('transform', function (point: any) {
              return (
                'matrix(1, 0, 0, 1,' +
                localChartState.x.bandwidth() / 2 +
                ',' +
                localChartState.y[point.factor.name](point.offering.value) +
                ')'
              )
            })
            foreground.selectAll('.foreground .line').attr('d', path)
          }
        })
        .on('end', function (event, point: any) {
          //normalize value if set
          if (point.offering.value === -1) {
            chartStore.removeOffering(point.offering)
          } else {
            point.offering.value = Math.max(0, Math.min(1, point.offering.value))
            chartStore.changeOffering(point.offering, point.offering.value)
          }
        }),
    )
  }

  maybeTransiton(marker).attr('transform', function (point) {
    return (
      'matrix(1, 0, 0, 1, ' +
      localChartState.x.bandwidth() / 2 +
      ', ' +
      localChartState.y[point.factor.name](point.offering.value) +
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
