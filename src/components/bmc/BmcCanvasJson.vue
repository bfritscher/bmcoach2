<template>
  <div class="col-12">
    <q-linear-progress
      v-if="showAsPresentation && !showAsPrint"
      :value="presentationProgress"
      height="4"
      class="ma-0"
    />
    <image-zone v-if="model !== undefined" :allow-click="false" class="canvas">
      <div ref="paper" class="paper" data-none="bmc_tmp">
        <draw-surface v-if="layout.showDrawSurface && layout.showVPC"></draw-surface>
        <q-linear-progress
          v-if="isLoading"
          transition="slide-y-transition"
          class="ma-0"
          indeterminate
          style="z-index: 1"
        ></q-linear-progress>

        <zone
          id="c"
          dropzone-accept=".note-bmc"
          label="Cost Structure"
          :has-error="mustBeUpdatedForBlocks('cost_structures')"
          style="left: 0; top: 75%; width: 50%; height: 25%"
        >
          <template #icon>
            <q-icon :name="ICONS['c']" />
            <br />
            <q-btn
              v-for="(costStructure, index) in costStructures"
              :key="costStructure.id"
              outline
              style="margin-bottom: 2px"
              :color="!costStructure.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('cost_structure', index)"
            >
              {{ costStructure.properties.label }}
            </q-btn>
          </template>
        </zone>
        <zone
          id="pn"
          dropzone-accept=".note-bmc"
          label="Partner Network"
          :has-error="mustBeUpdatedForBlocks('key_partners')"
          style="left: 0; top: 0; width: 20%; height: 75%"
        >
          <template #icon>
            <q-icon :name="ICONS['pn']" />
            <q-btn
              v-for="(keyPartner, index) in keyPartners"
              :key="keyPartner.id"
              outline
              style="margin-bottom: 2px"
              :color="!keyPartner.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('key_partners', index)"
            >
              {{ keyPartner.properties.label }}
            </q-btn>
          </template>
        </zone>
        <zone
          id="ka"
          dropzone-accept=".note-bmc"
          label="Key Activities"
          :has-error="mustBeUpdatedForBlocks('key_activities')"
          style="left: 20%; top: 0; width: 20%; height: 37.5%"
        >
          <template #icon>
            <q-icon :name="ICONS['ka']" />
            <q-btn
              v-for="(keyActivity, index) in keyActivities"
              :key="keyActivity.id"
              outline
              style="margin-bottom: 2px"
              :color="!keyActivity.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('key_activities', index)"
            >
              {{ keyActivity.properties.label }}
            </q-btn>
          </template>
        </zone>
        <zone
          id="kr"
          dropzone-accept=".note-bmc"
          label="Key Resources"
          :has-error="mustBeUpdatedForBlocks('key_resources')"
          style="left: 20%; top: 37.5%; width: 20%; height: 37.5%"
        >
          <template #icon>
            <q-icon :name="ICONS['kr']" />
            <q-btn
              v-for="(keyResource, index) in keyResources"
              :key="keyResource.id"
              outline
              style="margin-bottom: 2px"
              :color="!keyResource.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('key_resources', index)"
            >
              {{ keyResource.properties.label }}
            </q-btn>
          </template>
        </zone>
        <zone
          id="vp"
          dropzone-accept=".note-bmc"
          class="zone-highlight"
          :class="{
            'highlight-on': layout.selectedCS && !layout.selectedVP,
            'elevation-10': layout.selectedCS && !layout.selectedVP,
          }"
          label="Value Proposition"
          :has-error="mustBeUpdatedForBlocks('value_propositions')"
          style="left: 40%; top: 0; width: 20%; height: 75%"
        >
          <template #icon>
            <q-icon :name="ICONS['vp']" />
            <q-btn
              v-for="(valueProposition, index) in valuePropositions"
              :key="valueProposition.id"
              outline
              style="margin-bottom: 2px"
              :color="!valueProposition.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('value_propositions', index)"
            >
              {{ valueProposition.properties.label }}
            </q-btn>
          </template>
        </zone>
        <zone
          id="cr"
          dropzone-accept=".note-bmc"
          label="Customer Relationships"
          :has-error="mustBeUpdatedForBlocks('customer_relationships')"
          style="left: 60%; top: 0; width: 20%; height: 37.5%"
        >
          <template #icon>
            <q-icon :name="ICONS['cr']" />
            <q-btn
              v-for="(customerRelationship, index) in customerRelationships"
              :key="customerRelationship.id"
              outline
              style="margin-bottom: 2px"
              :color="!customerRelationship.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('customer_relationships', index)"
            >
              {{ customerRelationship.properties.label }}
            </q-btn>
          </template>
        </zone>
        <zone
          id="dc"
          dropzone-accept=".note-bmc"
          label="Distribution Channels"
          :has-error="mustBeUpdatedForBlocks('channels')"
          style="left: 60%; top: 37.5%; width: 20%; height: 37.5%"
        >
          <template #icon>
            <q-icon :name="ICONS['dc']" />
            <q-btn
              v-for="(channel, index) in channels"
              :key="channel.id"
              outline
              style="margin-bottom: 2px"
              :color="!channel.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('channels', index)"
            >
              {{ channel.properties.label }}
            </q-btn>
          </template>
        </zone>
        <zone
          id="cs"
          dropzone-accept=".note-bmc"
          class="zone-highlight"
          :class="{
            'highlight-on': !layout.selectedCS && layout.selectedVP,
            'elevation-10': !layout.selectedCS && layout.selectedVP,
          }"
          label="Customer Segments"
          :has-error="customerSegments"
          style="left: 80%; top: 0; width: 20%; height: 75%"
        >
          <template #icon>
            <q-icon :name="ICONS['cs']" />
            <q-btn
              v-for="(customerSegment, index) in customerSegments"
              :key="customerSegment.id"
              outline
              style="margin-bottom: 2px"
              :color="!customerSegment.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('customer_segments', index)"
            >
              {{ customerSegment.properties.label }}
            </q-btn>
          </template>
          >
        </zone>
        <zone
          id="r"
          dropzone-accept=".note-bmc"
          label="Revenue Streams"
          :has-error="mustBeUpdatedForBlocks('revenue_streams')"
          style="left: 50%; top: 75%; width: 50%; height: 25%"
        >
          <template #icon>
            <q-icon :name="ICONS['r']" />
            <br />
            <q-btn
              v-for="(revenueStream, index) in revenueStreams"
              :key="revenueStream.id"
              outline
              style="margin-bottom: 2px"
              :color="!revenueStream.validate().isElementValid ? 'red-6' : 'positive'"
              @click="mustBeUpdatedWithInfos('revenue_streams', index)"
            >
              {{ revenueStream.properties.label }}
            </q-btn>
          </template>
        </zone>
      </div>
    </image-zone>
    <q-dialog v-model="show">
      <q-card>
        <q-card-section>
          <div class="text-h6">Voici comment vous pouvez améliorer votre modèle</div>
        </q-card-section>
        <q-card-section v-for="(error, id) in errors_infos_to_update" :key="id" class="q-pt-none">
          {{ error }}
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Annuler" color="primary" />
          <q-btn v-close-popup unelevated label="Corriger" color="positive" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import debounce from 'lodash.debounce'
import Zone from '@/components/bmc/Zone.vue'
import DrawSurface from '@/components/bmc/DrawSurface.vue'
import ImageZone from '@/components/bmc/ImageZone.vue'
import { mapState } from 'pinia'
import { totalOffset } from '@/utils/dom'
import { ICONS } from '@/utils/constants'
import { useBmcUIStore } from '@/stores/bmc-ui-store'

let resizeHandler

export default {
  name: 'BmcCanvasJson',
  components: {
    Zone,
    ImageZone,
    DrawSurface,
  },
  props: {
    model: {
      type: Object,
      required: false,
      default: undefined,
    },
    customerSegments: {
      type: Array,
      required: false,
      default: () => [],
    },
    valuePropositions: {
      type: Array,
      required: false,
      default: () => [],
    },
    channels: {
      type: Array,
      required: false,
      default: () => [],
    },
    customerRelationships: {
      type: Array,
      required: false,
      default: () => [],
    },
    revenueStreams: {
      type: Array,
      required: false,
      default: () => [],
    },
    keyResources: {
      type: Array,
      required: false,
      default: () => [],
    },
    keyActivities: {
      type: Array,
      required: false,
      default: () => [],
    },
    keyPartners: {
      type: Array,
      required: false,
      default: () => [],
    },
    costStructures: {
      type: Array,
      required: false,
      default: () => [],
    },
  },
  setup(props) {
    // get bmStore with errors to display
    const errorsToUpdate = computed(() => props.model.base_validations)
    // get element to correct or update to display on q-dialog
    const errors_infos_to_update = ref([])

    // element to show or hide overlay
    const show = ref(false)
    // return true or false if there are updates to make from topics_to_probe_list
    const mustBeUpdated = (blockName, itemName) => {
      try {
        return errorsToUpdate.value[blockName]?.some((item) =>
          typeof item === 'object' && Object.keys(item)[0] === itemName ? true : false,
        )
      } catch (e) {
        return false
      }
    }
    // check if BMC element has an update to make and put it in errors_infos_to_update
    const mustBeUpdatedWithInfos = (blockName, itemName) => {
      errorsToUpdate.value[blockName]?.forEach((item) => {
        if (typeof item === 'object' && Object.keys(item)[0] === itemName) {
          show.value = !show.value
          errors_infos_to_update.value = item[itemName]
        }
      })
    }
    // return true or false if block is empty
    const mustBeUpdatedForBlocks = (blockName) => {
      // check in base_validation which blocks are empty
      if (errorsToUpdate.value['EMPTY BLOCKS']) {
        return errorsToUpdate.value['EMPTY BLOCKS']?.some((item) =>
          typeof item === 'string' && item === blockName ? true : false,
        )
      }
      return false
    }

    return {
      errors_infos_to_update,
      mustBeUpdated,
      mustBeUpdatedForBlocks,
      mustBeUpdatedWithInfos,
      show,
    }
  },
  data() {
    return {
      isLoading: false,
      showAsPresentation: false,
      showAsPrint: false,
      ICONS,
      showCongrats: false,
    }
  },
  computed: {
    ...mapState(useBmcUIStore, ['layout']),
  },
  watch: {
    listMode() {
      // triggers height calculations
      window.dispatchEvent(new Event('resize'))
    },
    // call again the method if the route changes
    $route: 'fetchData',
    'layout.presentation': function animatePresentation(val) {
      const crowdShortcut = document.getElementById('crowd-shortcut')
      if (val) {
        const offset = totalOffset(this.$el)
        this.$el.style.top = `${offset.top}px`
        this.$el.style.left = `${offset.left}px`
        this.$el.style.position = 'absolute'
        if (crowdShortcut) {
          crowdShortcut.style.display = 'none'
        }
        setTimeout(() => {
          this.showAsPresentation = true
        }, 0)
      } else {
        this.showAsPresentation = false
        setTimeout(() => {
          this.$el.style.top = ''
          this.$el.style.left = ''
          this.$el.style.position = 'relative'
          if (crowdShortcut) {
            crowdShortcut.style.display = 'block'
          }
        }, 500)
      }
    },
  },
  mounted() {
    this.fetchData()
  },
  beforeUnmount() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
  },
  methods: {
    fetchData() {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }
      resizeHandler = debounce(this.handleWindowResize, 300)
      window.addEventListener('resize', resizeHandler)
      this.handleWindowResize()
    },
    handleWindowResize() {
      if (!this.$refs.paper) {
        return
      }
      this.$el.style.setProperty('--zoneLabelFontSize', `${this.$refs.paper.offsetHeight * 0.02}px`)
      this.$el.style.setProperty(
        '--zoneLabelIconFontSize',
        `${this.$refs.paper.offsetHeight * 0.03}px`,
      )
    },
  },
}
</script>

<style scoped>
.bmc.print .credits-own,
.bmc.print .credits {
  z-index: 99;
  display: block;
}

.bmc.print .paper {
  width: 100vw;
  max-width: 100vw;
  height: 56.25vw;
  max-height: 100vh;
}

.paper {
  min-width: 80vw;
  min-height: 54.88vw;
  /* height:width ratio = 9/16 = .5625  */
  max-height: calc(100vh - 100px);
  /*max-width: calc(145.7vh - 100px);*/
  /* 16/9 = 1.778 */
  /* min-width: 1024px;
  min-height: 560px; */
  margin: auto;
  position: relative;
}

.paper.game {
  transition: all 0.5s linear;
}

.zone-highlight {
  z-index: 0;
  transition: z-index 0.5s step-end !important;
}

.highlight-on {
  z-index: 1;
  transition: z-index 0.5s step-start !important;
}

.logo {
  position: absolute;
  top: 75%;
  left: 40%;
  width: 20%;
  height: 25%;
  /* box-shadow: inset 0 0 0px 1px #818181; */
  background-color: #fff;
  color: #333;
}

.logo > div {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
}

.credits {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.credits-own {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: none;
}

.credits-own a,
.credits a {
  text-decoration: none;
}

.bmc.presentation .credits-own a,
.bmc.presentation .credits a {
  color: #9e9e9e;
}

@media (max-width: 1024px) {
  .highlight-on {
    z-index: 0;
  }
}
</style>
