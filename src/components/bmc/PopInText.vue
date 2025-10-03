<template>
  <div class="congrats" @click="$emit('input', false)">
    <animated-star v-for="(i, index) in stars" :key="index" :trigger="trigger"></animated-star>
    <h1 ref="h1">Congratulations!</h1>
  </div>
</template>

<script>
import { gsap, Back } from 'gsap'
import { random } from '@/utils/random'
import AnimatedStar from '@/components/bmc/AnimatedStar.vue'

export default {
  components: {
    AnimatedStar,
  },
  emits: ['input'],
  data() {
    return {
      stars: new Array(20),
      trigger: false,
    }
  },
  mounted() {
    this.animate()
  },
  methods: {
    animate() {
      this.reset()
      this.animateText()
      this.animateBlobs()
    },
    animateText() {
      gsap.from(this.$refs.h1, 1.2, {
        scale: 0,
        opacity: 0,
        rotation: 15,
        ease: Back.easeOut.config(4),
        onStart: () => {
          this.$refs.h1.style.display = 'block'
        },
      })
    },
    animateBlobs() {
      this.trigger = {
        xSeed: random(350, 380),
        ySeed: random(120, 170),
      }
    },
    reset() {
      this.trigger = false
      this.$refs.h1.style.display = 'none'
      gsap.set(this.$refs.h1, { scale: 1, opacity: 1, rotation: 0 })
    },
  },
}
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
