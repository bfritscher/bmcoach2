<template>
  <div class="presentation-controls">
    <div class="presentation-nav">
      <q-btn flat round icon="arrow_back" @click="presentationPrevious" />
      <q-btn flat round icon="arrow_forward" @click="presentationNext" />
      <q-btn
        flat
        round
        icon="gesture"
        :class="{ 'text-white': layout.showDrawSurface }"
        @click="layout.showDrawSurface = !layout.showDrawSurface"
      />
      <q-btn
        flat
        round
        :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
        @click="toggleFullscreen"
      />
    </div>
    <span v-if="canvas && canvas.notesPresentationOrder" class="presentation-index">
      {{ canvas.notesPresentationOrder.indexOf(canvas.currentPresentationKey) + 1 }}
      / {{ canvas.notesPresentationOrder.length }}
    </span>
    <q-btn flat round icon="close" class="presentation-exit" @click="presentationExit" />
  </div>
</template>

<script>
// import fscreen from 'fscreen'; // TODO #77: remove when vendor prefix no longer required
import { mapState, mapActions } from 'pinia'
import { useBmcUIStore } from '@/stores/bmc-ui-store'
import { useBMCStore } from '@/stores/bmc-store'

export default {
  name: 'PresentationControls',
  data() {
    return {
      isFullscreen: false,
    }
  },
  computed: {
    ...mapState(useBmcUIStore, ['layout']),
    ...mapState(useBMCStore, ['canvas']),
  },
  methods: {
    ...mapActions(useBMCStore, ['presentationNext', 'presentationPrevious', 'presentationExit']),
    toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen()
        this.isFullscreen = false
      } else {
        document.body.requestFullscreen().then(() => {
          this.isFullscreen = true
        })
      }
    },
  },
}
</script>

<style>
.presentation-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  top: 0;
  right: 0;
  pointer-events: none;
}

.presentation-controls .presentation-index {
  position: absolute;
  left: 0;
  bottom: 8px;
  right: 0;
  text-align: center;
}

.presentation-controls .presentation-exit {
  position: absolute;
  top: 4px;
  right: 0;
  z-index: 11;
}

.presentation-controls .presentation-nav {
  position: absolute;
  bottom: 0;
  left: 44px;
}

.presentation-controls .q-btn {
  pointer-events: auto;
}

.presentation-controls .q-btn:hover {
  color: white;
}
</style>
