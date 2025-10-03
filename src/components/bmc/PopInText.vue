<template>
  <div class="congrats" @click="$emit('input', false)">
    <animated-star v-for="(i, index) in stars" :key="index" :trigger="trigger"></animated-star>
    <h1 ref="h1">Congratulations!</h1>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { gsap, Back } from 'gsap'
import { random } from '@/utils/random'
import AnimatedStar from '@/components/bmc/AnimatedStar.vue'

defineEmits<{
  input: [value: boolean]
}>()

const stars = ref(new Array(20))
const trigger = ref<{ xSeed: number; ySeed: number } | false>(false)
const h1 = ref<HTMLElement>()

function reset() {
  trigger.value = false
  if (h1.value) {
    h1.value.style.display = 'none'
    gsap.set(h1.value, { scale: 1, opacity: 1, rotation: 0 })
  }
}

function animateText() {
  if (h1.value) {
    gsap.from(h1.value, 1.2, {
      scale: 0,
      opacity: 0,
      rotation: 15,
      ease: Back.easeOut.config(4),
      onStart: () => {
        if (h1.value) {
          h1.value.style.display = 'block'
        }
      },
    })
  }
}

function animateBlobs() {
  trigger.value = {
    xSeed: random(350, 380),
    ySeed: random(120, 170),
  }
}

function animate() {
  reset()
  animateText()
  animateBlobs()
}

onMounted(() => {
  animate()
})
</script>

<style scoped>
@import url(https://fonts.googleapis.com/css?family=Sigmar+One);

.congrats {
  position: absolute;
  top: 0;
  bottom: 0;
  text-align: center;
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}

h1 {
  transform-origin: 50% 50%;
  font-size: 50px;
  font-family: 'Sigmar One', cursive;
  cursor: pointer;
  text-align: center;
  width: 100%;
  display: none;
}
</style>
