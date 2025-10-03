<template>
  <div class="blob" :style="{ display: display }">
    <svg width="100%" height="100%" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1728 647q0 22-26 48l-363 354 86 500q1 7 1 20 0 21-10.5 35.5t-30.5 14.5q-19 0-40-12l-449-236-449 236q-22 12-40 12-21 0-31.5-14.5t-10.5-35.5q0-6 2-20l86-500-364-354q-25-27-25-48 0-37 56-46l502-73 225-455q19-41 49-41t49 41l225 455 502 73q56 9 56 46z"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, getCurrentInstance } from 'vue'
import { gsap, Power1 } from 'gsap'
import { random } from '@/utils/random'

interface TriggerValue {
  xSeed: number
  ySeed: number
}

const props = defineProps<{
  trigger?: TriggerValue | false
}>()

const display = ref('none')
const instance = getCurrentInstance()

function reset() {
  if (instance?.proxy?.$el) {
    gsap.set(instance.proxy.$el, { x: 0, y: 0, opacity: 1 })
  }
}

function animate(xSeed: number, ySeed: number) {
  reset()
  if (instance?.proxy?.$el) {
    gsap.to(instance.proxy.$el, random(1, 5), {
      x: random(-xSeed, xSeed),
      y: random(-ySeed, ySeed),
      ease: Power1.easeOut,
      opacity: 0,
      rotation: random(5, 100),
      scale: random(0.8, 1.5),
      onStart: () => {
        display.value = 'block'
      },
      onComplete: () => {
        display.value = 'none'
      },
    })
  }
}

watch(
  () => props.trigger,
  (value) => {
    if (value) {
      animate(value.xSeed, value.ySeed)
    }
  }
)
</script>

<style scoped>
.blob {
  height: 40px;
  width: 40px;
  text-align: center;
  position: absolute;
  left: calc(50% - 20px);
  display: none;
}

.blob svg path {
  fill: #ffcc00;
}
</style>
