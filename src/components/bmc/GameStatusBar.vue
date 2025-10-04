<template>
  <div class="game-header elevation-1 white">
    <div>
      <span class="title" title="Move elements to right block.">Play!</span>
      <span
        ><b>Current score:</b> <span :class="cssUpDown">{{ fixed(gameStats.correct, 0) }}</span> /
        {{ gameStats.total }}
      </span>
      <span><b>Number of tries:</b> {{ fixed(gameStats.checks, 0) }}</span>
      <span><q-btn flat color="primary" label="check" @click="gameCheck" /></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { gsap } from 'gsap'
import { useBMCStore } from '@/stores/bmc-store'
import { storeToRefs } from 'pinia'

const emit = defineEmits<{
  won: []
}>()

const bmcStore = useBMCStore()
const { notesBMC, canvas } = storeToRefs(bmcStore)
const { canvasInfoUpdate } = bmcStore

const gameStats = reactive({
  total: 0,
  correct: 0,
  checks: 0,
})
const cssUpDown = ref('')

function fixed(value: number, n: number) {
  if (!isNaN(value)) {
    return Number(value).toFixed(n || 0)
  }
  return value
}

function gameCheck() {
  const stats = notesBMC.value
    .filter((n: any) => n.isGame)
    .reduce(
      (s: any, note: any) => {
        if (note.type === note.type_saved) {
          s.correct += 1
        }
        s.total += 1
        return s
      },
      {
        correct: 0,
        total: 0,
      },
    )
  if (stats.correct === stats.total) {
    emit('won')
    canvasInfoUpdate({ isGame: false, gameCompleted: new Date() })
    notesBMC.value.forEach((note: any) => {
      // TODO: fix this to use proper note update
      note.isGame = false
    })
  } else {
    gameStats.total = stats.total
    gsap.to(gameStats, {
      duration: 0.5,
      correct: stats.correct,
      checks: canvas.value.gameNbChecks || 0,
      onStart: () => {
        if (stats.correct > gameStats.correct) {
          cssUpDown.value = 'up'
        }
        if (stats.correct < gameStats.correct) {
          cssUpDown.value = 'down'
        }
      },
      onComplete: () => {
        cssUpDown.value = ''
      },
    })
    canvasInfoUpdate({
      gameNbChecks: (canvas.value.gameNbChecks || 0) + 1,
    })
  }
}
</script>

<style>
.game-header > .subheader > span {
  padding-right: 2em;
}
.game-header .down {
  color: red;
}
.game-header .up {
  color: green;
}
</style>
