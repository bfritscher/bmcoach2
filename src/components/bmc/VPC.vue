<template>
  <transition name="vpc-overlay-transition">
    <image-zone
      v-show="showVPC"
      ref="vpc"
      key="vpc"
      :allow-click="false"
      class="canvas overlay-vpc"
      @image-drop="addNote"
      @click.prevent.stop="addNote($event)"
    >
      <div ref="paper" class="paper" data-none="vpc_tmp">
        <transition name="vpc-vp-transition" appear>
          <div v-if="vp" class="vpc-vp elevation-10" :class="{ 'vpc-both': cs && vp }">
            <q-toolbar
              width="100%"
              :class="`bg-${COLORS_MATERIAL_DARK[vp.colors[0]]}`"
              @click.prevent.stop
            >
              <q-btn-dropdown :label="vp.text" flat auto-close>
                <q-list style="min-width: 150px">
                  <q-item
                    v-for="note in notesVP"
                    :key="note.$id"
                    :class="`bg-${COLORS_MATERIAL_DARK[note.colors[0]]}`"
                    clickable
                    @click="LAYOUT_UPDATE({ selectedVP: note })"
                  >
                    <q-item-section>
                      <q-item-label>{{ note.text }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <q-space />
              <q-btn
                icon="close"
                round
                flat
                @click.prevent.stop="LAYOUT_UPDATE({ selectedVP: null })"
              />
            </q-toolbar>
            <zone
              id="features"
              dropzone-accept=".note-vpc"
              label="Products & Services"
              style="left: 0; top: 0; width: 50%; height: 100%; background-color: white"
            >
              <template #icon>
                <q-icon :name="ICONS['features']" />
              </template>
            </zone>
            <zone
              id="solution"
              dropzone-accept=".note-vpc"
              label="Solutions"
              style="left: 50%; top: 0; width: 50%; height: 100%; background-color: white"
            >
              <template #icon>
                <q-icon :name="ICONS['solution']" />
              </template>
            </zone>
          </div>
        </transition>

        <transition name="vpc-cs-transition" appear>
          <div v-if="cs" class="vpc-cs elevation-10" :class="{ 'vpc-both': cs && vp }">
            <q-toolbar
              width="100%"
              :class="`bg-${COLORS_MATERIAL_DARK[cs.colors[0]]}`"
              @click.prevent.stop
            >
              <q-btn-dropdown :label="cs.text" flat auto-close>
                <q-list style="min-width: 150px">
                  <q-item
                    v-for="note in notesCS"
                    :key="note.$id"
                    :class="`bg-${COLORS_MATERIAL_DARK[note.colors[0]]}`"
                    clickable
                    @click="LAYOUT_UPDATE({ selectedCS: note })"
                  >
                    <q-item-section>
                      <q-item-label>{{ note.text }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
              <q-space />
              <q-btn
                icon="close"
                round
                flat
                @click.stop.prevent="LAYOUT_UPDATE({ selectedCS: null })"
              />
            </q-toolbar>
            <zone
              id="pain_gain"
              dropzone-accept=".note-vpc"
              label="Gains & Pains"
              style="left: 0; top: 0; width: 50%; height: 100%; background-color: white"
            >
              <template #icon>
                <q-icon :name="ICONS['pain_gain']" />
              </template>
            </zone>
            <zone
              id="job"
              dropzone-accept=".note-vpc"
              label="Job to be done"
              style="left: 50%; top: 0; width: 50%; height: 100%; background-color: white"
            >
              <template #icon>
                <q-icon :name="ICONS['job']" />
              </template>
            </zone>
          </div>
        </transition>
        <div>
          <note
            v-for="n in notesVPCfiltered"
            :key="n.$id"
            :value="n"
            class="note-vpc"
            :class="{ 'vpc-both': cs && vp }"
            :parent="$refs.paper"
          ></note>
        </div>
      </div>
    </image-zone>
  </transition>
</template>

<script>
import Note from '@/components/bmc/Note.vue'
import Zone from '@/components/bmc/Zone.vue'
import ImageZone from '@/components/bmc/ImageZone.vue'
import { totalOffset } from '@/utils/dom'
import { COLORS_MATERIAL_DARK, ICONS } from '@/utils/constants'
import { VPC_VP_TYPES, VPC_CS_TYPES } from '@/stores/bmc-store'
import { useBmcUIStore } from '@/stores/bmc-ui-store'
import { useBMCStore } from '@/stores/bmc-store'
import { mapState, mapActions } from 'pinia'

export default {
  name: 'VpcCanvas',
  components: {
    Note,
    Zone,
    ImageZone,
  },
  data() {
    return {
      COLORS_MATERIAL_DARK,
      ICONS,
    }
  },
  computed: {
    ...mapState(useBmcUIStore, ['layout']),
    ...mapState(useBMCStore, [
      'notesVPC',
      'notesVPCvp',
      'notesVPCcs',
      'getNotesByTypes',
      'canvasSettings',
    ]),
    vp() {
      return this.layout.selectedVP
    },
    cs() {
      return this.layout.selectedCS
    },
    showVPC() {
      return this.layout.showVPC
    },
    notesVPCfiltered() {
      let notes = []
      if (this.vp && this.cs) {
        notes = this.notesVPC.filter(
          (note) => note.parent === this.vp.$id || note.parent === this.cs.$id || !note.parent,
        )
      } else if (this.cs) {
        notes = this.notesVPCcs.filter((note) => note.parent === this.cs.$id || !note.parent)
      } else if (this.vp) {
        notes = this.notesVPCvp.filter((note) => note.parent === this.vp.$id || !note.parent)
      }
      return notes
    },
    notesCS() {
      const list = this.getNotesByTypes('cs')
      return list.filter((note) => note.$id !== this.cs?.$id)
    },
    notesVP() {
      const list = this.getNotesByTypes('vp')
      return list.filter((note) => note.$id !== this.vp?.$id)
    },
  },
  watch: {
    // TODO: refactor?
    vp(val, oldVal) {
      if (val) {
        this.$refs.vpc.$el.style.setProperty('--vpc-source-x', `${val.left}%`)
        this.$refs.vpc.$el.style.setProperty('--vpc-source-y', `${val.top}%`)
        this.LAYOUT_UPDATE({ showVPC: true })
      } else {
        this.$refs.vpc.$el.style.setProperty('--vpc-source-x', `${oldVal.left}%`)
        this.$refs.vpc.$el.style.setProperty('--vpc-source-y', `${oldVal.top}%`)
        if (!this.cs && this.showVPC) {
          this.$nextTick(() => {
            this.LAYOUT_UPDATE({ showVPC: false })
          })
        }
      }
    },
    cs(val, oldVal) {
      if (val) {
        this.$refs.vpc.$el.style.setProperty('--vpc-source-x', `${val.left}%`)
        this.$refs.vpc.$el.style.setProperty('--vpc-source-y', `${val.top}%`)
        this.LAYOUT_UPDATE({ showVPC: true })
      } else {
        this.$refs.vpc.$el.style.setProperty('--vpc-source-x', `${oldVal.left}%`)
        this.$refs.vpc.$el.style.setProperty('--vpc-source-y', `${oldVal.top}%`)
        if (!this.vp && this.showVPC) {
          this.$nextTick(() => {
            this.LAYOUT_UPDATE({ showVPC: false })
          })
        }
      }
    },
  },
  methods: {
    ...mapActions(useBMCStore, ['noteCreate']),
    addNote(e) {
      const offset = totalOffset(this.$refs.paper)
      const noteCenter = {
        x: this.$refs.paper.offsetWidth / 15,
        y: 20,
      }
      const x = e.x - noteCenter.x - offset.left
      const y = e.y - noteCenter.y - offset.top

      const note = {
        left: x / (this.$refs.paper.offsetWidth / 100),
        top: y / (this.$refs.paper.offsetHeight / 100),
        listLeft: x / (this.$refs.paper.offsetWidth / 100),
        listTop: y / (this.$refs.paper.offsetHeight / 100),
        type: 'vpc_tmp',
        colors: this.canvasSettings.lastUsedColors,
        image: e.image,
      }

      if (e.target.classList.contains('zone')) {
        note.type = e.target.getAttribute('id')
        // ignore tmp which is at position 0
        if (VPC_VP_TYPES.indexOf(note.type) > 0) {
          note.parent = this.vp.$id
        }
        if (VPC_CS_TYPES.indexOf(note.type) > 0) {
          note.parent = this.cs.$id
        }
      }
      this.noteCreate(note)
    },
    LAYOUT_UPDATE(payload) {
      Object.assign(this.layout, payload)
    },
  },
}
</script>

<style scoped>
.canvas {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  display: flex;
  align-content: center;
  justify-content: center;
  flex-direction: column;
}

.list {
  padding: 0;
}

.paper {
  width: 82vw;
  height: calc(54.88vw - 96px);
  min-width: 1024px;
  min-height: 560px;
  max-width: calc(145.7vh);
  max-height: calc(100vh - 196px);
  margin: 48px auto 0 auto;
  position: relative;
}

.overlay-vpc:before {
  background-color: #212121;
  content: '';
  -webkit-filter: blur(10%);
  filter: blur(10%);
  transition: 0.5s ease;
  opacity: 0.46;
  left: 0;
  bottom: 0;
  right: 0;
  top: 0;
  position: absolute;
  transition: all 1s ease;
}

.vpc-vp {
  position: absolute;
  left: 0;
  top: 0;
  width: 40%;
  min-width: 408px;
  bottom: 0;
  background-color: white;
}

.vpc-cs {
  position: absolute;
  left: 60%;
  top: 0;
  width: 40%;
  min-width: 408px;
  bottom: 0;
  background-color: white;
}

.vpc-vp .q-toolbar,
.vpc-cs .q-toolbar {
  left: 0;
  top: -48px;
  position: absolute;
}

.vpc-cs-transition-enter-active,
.vpc-cs-transition-leave-active,
.vpc-vp-transition-enter-active,
.vpc-vp-transition-leave-active,
.vpc-overlay-transition-enter-active,
.vpc-overlay-transition-leave-active {
  transition: all 0.5s ease;
  z-index: 2;
}

.vpc-overlay-transition-enter:before,
.vpc-overlay-transition-leave-to:before {
  opacity: 0;
}

.vpc-vp-transition-enter-from,
.vpc-vp-transition-leave-to,
.vpc-cs-transition-enter-from,
.vpc-cs-transition-leave-to {
  left: var(--vpc-source-x);
  top: var(--vpc-source-y);
  width: 15%;
  min-width: 0;
  bottom: calc(95% - var(--vpc-source-y));
}

.fit {
  position: absolute;
  left: calc(50% - 80px);
  top: calc(50% - 120px);
}

@media (max-width: 1024px) {
  .vpc-cs {
    left: 0;
    margin: auto;
  }
}
</style>
<style>
.vpc-cs-transition-enter-active .zone-label,
.vpc-cs-transition-leave-active .zone-label,
.vpc-vp-transition-enter-active .zone-label,
.vpc-vp-transition-leave-active .zone-label {
  opacity: 0 !important;
}
</style>
