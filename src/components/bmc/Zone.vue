<template>
  <div class="zone dropzone">
    <div class="zone-label row">
      <div>
        {{ label }}
      </div>
      <q-space />
      <slot name="icon"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue'
import interact from 'interactjs'

defineProps<{
  label: string
  dropzoneAccept: string
  hasError?: boolean
}>()

const dropzone = ref<ReturnType<typeof interact> | null>(null)
const instance = getCurrentInstance()

onMounted(() => {
  if (instance?.proxy?.$el) {
    dropzone.value = interact(instance.proxy.$el).dropzone({
      accept: instance.props.dropzoneAccept as string,
      // Require a 75% element overlap for a drop to be possible
      overlap: 0.75,
      ondropactivate: (event) => {
        // add active dropzone feedback
        event.target.classList.add('drop-active')
      },
      ondragenter: (event) => {
        const draggableElement = event.relatedTarget
        const dropzoneElement = event.target

        // feedback the possibility of a drop
        dropzoneElement.classList.add('drop-target')
        draggableElement.classList.add('can-drop')
      },
      ondragleave: (event) => {
        // remove the drop feedback style
        event.target.classList.remove('drop-target')
        event.relatedTarget.classList.remove('can-drop')
      },
      ondrop: (event) => {
        event.relatedTarget.classList.remove('can-drop')
      },
      ondropdeactivate: (event) => {
        // remove active dropzone feedback
        event.target.classList.remove('drop-active')
        event.target.classList.remove('drop-target')
      },
    })
  }
})
</script>

<style>
.zone {
  position: absolute;
  background-color: white;
  box-shadow: inset 0 0 0px 1px #818181;
  display: block;
  transition: background-color 0.3s;
}
.zone-label {
  margin: 5px;
  color: #333;
  font-weight: 400;
  font-size: var(--zoneLabelFontSize);
}

.zone-label .q-icon {
  font-size: var(--zoneLabelIconFontSize);
}

.drop-target {
  background-color: #dcedc8 !important;
}
</style>
