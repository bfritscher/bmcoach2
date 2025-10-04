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

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { COLORS_GESTURE } from '@/utils/constants'
import SignaturePad, { PointGroup } from 'signature_pad'
import { storeToRefs } from 'pinia'
import { useBmcUIStore } from '@/stores/bmc-ui-store'

const bmcUiStore = useBmcUIStore()
const { layout } = storeToRefs(bmcUiStore)

const signaturePad = ref<SignaturePad | null>(null)
const data = ref<PointGroup[]>([])
const width = ref(0)
const height = ref(0)
const penColor = ref('#F00')
const canvas = ref<HTMLCanvasElement>()

function color(newColor: string) {
  if (!signaturePad.value) return
  penColor.value = newColor
  signaturePad.value.penColor = newColor
}

function resizeCanvas() {
  if (data.value && canvas.value) {
    const ratio = 1 // Math.max(window.devicePixelRatio || 1, 1);
    canvas.value.width = canvas.value.offsetWidth * ratio
    canvas.value.height = canvas.value.offsetHeight * ratio
    /*
    canvas.getContext('2d').scale(ratio, ratio);
    */
    signaturePad.value?.fromData(
      data.value.map((s) => {
        return {
          ...s,
          points: s.points.map((p) => {
            p.x = (p.x / width.value) * (canvas.value?.width || 0)
            p.y = (p.y / height.value) * (canvas.value?.height || 0)
            return p
          }),
        }
      }),
    )
    width.value = canvas.value.width
    height.value = canvas.value.height
  } else {
    signaturePad.value?.clear() // otherwise isEmpty() might return incorrect value
  }
}

watch(
  () => layout.value.showDrawSurface,
  (val) => {
    if (val) {
      resizeCanvas()
    }
  }
)

onMounted(() => {
  if (!canvas.value) return
  signaturePad.value = new SignaturePad(canvas.value, {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    penColor: penColor.value,
    maxWidth: 3,
    minWidth: 1,
  })
  signaturePad.value.addEventListener('endStroke', () => {
    if (!signaturePad.value || !canvas.value) return
    data.value = signaturePad.value.toData()
    width.value = canvas.value.width
    height.value = canvas.value.height
  })
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCanvas)
})
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
