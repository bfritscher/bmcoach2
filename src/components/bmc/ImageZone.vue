<template>
  <div
    class="image-zone"
    :class="{ 'drop-target': dropTarget }"
    @dragleave.prevent.stop="dropTarget = false"
    @dragexit.prevent.stop="dropTarget = false"
    @dragover.prevent.stop="dropTarget = true"
    @dragenter.prevent.stop="dropTarget = true"
    @drop.prevent.stop="handleChange"
    @click="handleClick"
  >
    <q-banner v-if="hasError" class="text-white bg-red">
      {{ errorMsg }}
    </q-banner>
    <slot>
      <div
        class="image-display"
        :style="{
          'background-color': showCanvas ? previewColor : color,
          'background-image': showCanvas ? 'none' : `url(${getFileUrl(image)})`,
        }"
      >
        <div v-show="!image && allowClick"><q-icon name="file_upload" />{{ lang.hint }}</div>
      </div>
    </slot>
    <q-btn
      v-if="image && allowClick"
      flat
      round
      icon="colorize"
      color="white"
      class="color"
      @click.prevent.stop="displayColorPicker"
    />
    <q-btn
      v-if="image && allowClick"
      flat
      round
      icon="delete_forever"
      color="white"
      class="delete"
      @click.prevent.stop="reset"
    />
    <input ref="fileinput" style="display: none" type="file" @click.stop @change="handleChange" />
    <canvas
      v-show="showCanvas"
      ref="canvas"
      :style="{ top, left }"
      :width="width"
      :height="height"
      @mousemove.prevent.stop="pickColor($event, false)"
      @click.prevent.stop="pickColor($event, true)"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import ColorThief from 'colorthief'
import { totalOffset } from '@/utils/dom'
import { useStorageStore } from '@/stores/storage'

const props = withDefaults(
  defineProps<{
    maxWidth?: number
    maxHeight?: number
    image?: string
    color?: string
    allowClick?: boolean
  }>(),
  {
    maxWidth: 400,
    maxHeight: 300,
    image: '',
    color: 'transparent',
    allowClick: true,
  }
)

const emit = defineEmits<{
  'update:color': [color: string | null]
  'update:image': [image: string | null]
  'image-drop': [event: any]
}>()

const storageStore = useStorageStore()
const { uploadFile, removeFile, getFileUrl } = storageStore

const hasError = ref(false)
const dropTarget = ref(false)
const errorMsg = ref('')
const maxSize = 10240
const width = ref(0)
const height = ref(0)
const left = ref('')
const top = ref('')
const previewColor = ref('transparent')
const lastEvent = ref<any>(null)
const showCanvas = ref(false)
const fileinput = ref<HTMLInputElement>()
const canvas = ref<HTMLCanvasElement>()

const lang = {
  hint: 'Drop image here or click to upload.',
  error: {
    notSupported: 'Browser not supported, please use IE10+ or other browsers',
    onlyImg: 'Only images are supported',
    outOfSize: 'Image exceeds size limit: ',
  },
}

function handleClick(e: MouseEvent) {
  if (props.allowClick) {
    e.preventDefault()
    e.stopPropagation()
    fileinput.value?.click()
  }
  return true
}

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement
  const dataTransfer = (e as DragEvent).dataTransfer
  const files = target.files || dataTransfer?.files
  reset()
  dropTarget.value = false
  lastEvent.value = e
  if (files && files.length > 0 && files[0] && checkFile(files[0])) {
    setSourceImg(files[0])
  } else if (dataTransfer) {
    const imageUrl = dataTransfer.getData('text/html')
    const extracSrc = /src="?([^"\s]+)"?\s*/
    const url = extracSrc.exec(imageUrl)
    if (url && url[1]) {
      loadImage(url[1])
    }
  }
}

function checkFile(file: File) {
  if (file.type.indexOf('image') === -1) {
    hasError.value = true
    errorMsg.value = lang.error.onlyImg
    return false
  }

  if (file.size / 1024 > maxSize) {
    hasError.value = true
    errorMsg.value = `${lang.error.outOfSize} ${maxSize}kb`
    return false
  }
  return true
}

function setSourceImg(file: File) {
  const fr = new FileReader()
  fr.onload = (e) => {
    loadImage((e.target as FileReader).result as string)
  }
  fr.readAsDataURL(file)
}

function loadImage(src: string) {
  const img = new Image()
  img.crossOrigin = 'use-credentials'
  img.onload = () => {
    width.value = img.naturalWidth
    height.value = img.naturalHeight
    const colorThief = new ColorThief()
    const [r, g, b] = colorThief.getColor(img)
    emit('update:color', `rgb(${r}, ${g}, ${b})`)
    resize(img)
  }
  img.src = src
}

function displayColorPicker() {
  const img = new Image()
  img.crossOrigin = 'use-credentials'
  img.onload = () => {
    width.value = img.naturalWidth
    height.value = img.naturalHeight
    nextTick(() => {
      if (canvas.value) {
        const ctx = canvas.value.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, width.value, height.value)
          ctx.drawImage(img, 0, 0, width.value, height.value)
          showCanvas.value = true
          left.value = `calc(50% - ${width.value / 2}px)`
          top.value = `calc(50% - ${height.value / 2}px)`
        }
      }
    })
  }
  img.src = getFileUrl(props.image)
}

function pickColor(e: MouseEvent, save: boolean) {
  if (!canvas.value) return
  // getting user coordinates
  const offset = totalOffset(canvas.value)
  const x = e.pageX - offset.left
  const y = e.pageY - offset.top
  // getting image data and RGB values
  const ctx = canvas.value.getContext('2d')
  if (ctx) {
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data
    const rgb = `rgb(${r}, ${g}, ${b})`
    previewColor.value = rgb
    if (save) {
      emit('update:color', rgb)
      showCanvas.value = false
    }
  }
}

function resize(img: HTMLImageElement) {
  const maxRatio = props.maxWidth / props.maxHeight
  const ratio = width.value / height.value
  if (width.value <= props.maxWidth && height.value <= props.maxHeight) {
    width.value += 20
    height.value += 20
  }
  if (
    (ratio > 1 && maxRatio > 1) ||
    (ratio > 1 && maxRatio < 1) ||
    (ratio === 1 && maxRatio < 1) ||
    (ratio > 1 && maxRatio === 1)
  ) {
    width.value = props.maxWidth
    height.value = props.maxWidth / ratio
  } else if (
    (ratio < 1 && maxRatio < 1) ||
    (ratio < 1 && maxRatio > 1) ||
    (ratio === 1 && maxRatio > 1) ||
    (ratio < 1 && maxRatio === 1)
  ) {
    width.value = props.maxHeight * ratio
    height.value = props.maxHeight
  } else {
    width.value = props.maxWidth
    height.value = props.maxHeight
  }
  nextTick(() => {
    if (canvas.value) {
      const ctx = canvas.value.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, width.value, height.value)
        ctx.drawImage(img, 10, 10, width.value - 20, height.value - 20)
        canvas.value.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'image.png', { type: 'image/png' })
            setNewImage(file)
          }
        }, 'image/png')
      }
    }
  })
}

function setNewImage(file: File) {
  const id = uploadFile(file, undefined)
  if (id) {
    emit('update:image', id)
    if (lastEvent.value && lastEvent.value.type === 'drop') {
      lastEvent.value.image = id
      emit('image-drop', lastEvent.value)
    }
  }
}

function reset() {
  hasError.value = false
  errorMsg.value = ''
  lastEvent.value = null
  if (props.image) {
    removeFile(props.image)
  }
  emit('update:image', null)
  emit('update:color', null)
  if (typeof FormData !== 'function') {
    hasError.value = true
    errorMsg.value = lang.error.notSupported
  }
}
</script>

<style>
.image-display {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-position: 50% 50%;
  background-size: contain;
  background-repeat: no-repeat;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.image-zone {
  position: relative;
}

.image-zone > .delete {
  position: absolute;
  display: none;
  bottom: 0;
  right: 0;
  text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.86);
}

.image-zone > .color {
  position: absolute;
  display: none;
  bottom: 0;
  left: 0;
  text-shadow: 0px 0px 4px rgba(0, 0, 0, 0.86);
}

.image-zone:hover > .delete,
.image-zone:hover > .color {
  display: flex;
}

.image-zone > canvas {
  position: absolute;
  cursor: crosshair;
}

.drop-target {
  background-color: #dcedc8 !important;
  opacity: 0.6;
}
</style>
