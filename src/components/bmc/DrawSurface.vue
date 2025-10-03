<template>
  <div class="draw-surface">
    <canvas ref="canvas"></canvas>
    <div class="draw-surface-toolbar">
      <div>
        <q-btn
          v-for="c in COLORS_GESTURE"
          :key="c"
          flat
          class="color"
          :style="{ 'background-color': c }"
          :icon="penColor === c ? 'check' : ''"
          @click="color(c)"
        />
        <q-btn
          size="md"
          color="white"
          text-color="black"
          label="clear"
          @click="signaturePad?.clear()"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { COLORS_GESTURE } from '@/utils/constants'
import SignaturePad, { PointGroup } from 'signature_pad'
import { mapState } from 'pinia'
import { useBmcUIStore } from '@/stores/bmc-ui-store'

export default {
  data() {
    return {
      signaturePad: null as SignaturePad | null,
      data: [] as PointGroup[],
      width: 0,
      height: 0,
      COLORS_GESTURE,
      penColor: '#F00',
    }
  },
  computed: {
    ...mapState(useBmcUIStore, ['layout']),
  },
  watch: {
    'layout.showDrawSurface': function show(val) {
      if (val) {
        this.resizeCanvas()
      }
    },
  },
  mounted() {
    const canvas = this.$refs.canvas as HTMLCanvasElement
    if (!canvas) return;
    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: this.penColor,
      maxWidth: 3,
      minWidth: 1,
    })
    this.signaturePad.addEventListener('endStroke', () => {
      if (!this.signaturePad) return;
      this.data = this.signaturePad.toData()
      this.width = canvas.width
      this.height = canvas.height
    })
    window.addEventListener('resize', this.resizeCanvas)
    this.resizeCanvas()
  },
  methods: {
    color(color: string) {
      if (!this.signaturePad) return;
      this.penColor = color
      this.signaturePad.penColor = color
    },
    resizeCanvas() {
      const canvas = this.$refs.canvas as HTMLCanvasElement
      if (this.data && canvas) {
        const ratio = 1 // Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio
        canvas.height = canvas.offsetHeight * ratio
        /*
        canvas.getContext('2d').scale(ratio, ratio);
        */
        this.signaturePad?.fromData(
          this.data.map((s) => {
            return {
              ...s,
              points: s.points.map((p) => {
                p.x = (p.x / this.width) * canvas.width
                p.y = (p.y / this.height) * canvas.height
                return p
              }),
            }
          }),
        )
        this.width = canvas.width
        this.height = canvas.height
      } else {
        this.signaturePad?.clear() // otherwise isEmpty() might return incorrect value
      }
    },
  },
}
</script>

<style>
.draw-surface {
  top: 0;
  left: 0;
  right: 0;
  bottom: 36px;
  position: absolute;
  z-index: 10;
}

.draw-surface canvas {
  width: 100%;
  height: 100%;
  display: block;
}
.draw-surface-toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}
</style>
