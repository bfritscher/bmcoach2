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

<script>
import { gsap } from 'gsap'
import { mapActions } from 'pinia'
import { useBMCStore } from '@/stores/bmc-store'

export default {
  emits: ['won'],
  data() {
    return {
      gameStats: {
        total: 0,
        correct: 0,
        checks: 0,
      },
      cssUpDown: '',
    }
  },
  // TODO fix vuex
  computed: {
    /*
    ...mapGetters(['notesBMC']),
    ...mapState({
      canvas: (state) => state.canvas,
    }),
    */
  },
  methods: {
    ...mapActions(useBMCStore, ['canvasInfoUpdate']),
    fixed(value, n) {
      if (!isNaN(value)) {
        return Number(value).toFixed(n || 0)
      }
      return value
    },
    gameCheck() {
      const stats = this.notesBMC
        .filter((n) => n.isGame)
        .reduce(
          (s, note) => {
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
        this.$emit('won')
        this.canvasInfoUpdate({ isGame: false, gameCompleted: new Date() })
        this.notesBMC.forEach((note) => {
          this.$store.dispatch('NOTE_UPDATE', {
            note,
            changes: {
              isGame: false,
            },
          })
        })
      } else {
        this.gameStats.total = stats.total
        gsap.to(this.gameStats, {
          duration: 0.5,
          correct: stats.correct,
          checks: this.canvas.info.gameNbChecks,
          onStart: () => {
            if (stats.correct > this.gameStats.correct) {
              this.cssUpDown = 'up'
            }
            if (stats.correct < this.gameStats.correct) {
              this.cssUpDown = 'down'
            }
          },
          onComplete: () => {
            this.cssUpDown = ''
          },
        })
        this.canvasInfoUpdate({
          gameNbChecks: (this.canvas.info.gameNbChecks || 0) + 1,
        })
      }
    },
  },
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
