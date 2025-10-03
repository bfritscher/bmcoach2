<script setup lang="ts">
import { Serie } from '@/components/models'
import { symbolsPaths } from '@/utils/d3-helpers'
interface MyMarkerProps {
  serie: Serie
}
const props = defineProps<MyMarkerProps>()
</script>

<template>
  <div class="marker">
    <svg width="100%" height="100%">
      <path
        d="m0,16h36"
        class="dash"
        :stroke-dasharray="props.serie.dash"
        :stroke="props.serie.color"
        :fill="props.serie.color"
      />
      <path
        transform="translate(18,15.5) scale(1.4)"
        :d="symbolsPaths[props.serie.symbol]"
        :stroke="props.serie.color"
        :fill="props.serie.color"
      />
    </svg>
  </div>
</template>
<style>
.marker {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
