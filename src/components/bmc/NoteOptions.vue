<template>
  <q-dialog
    :model-value="layout.showNoteOptions"
    class="note-option-dialog"
    @update:model-value="hideDialog"
  >
    <q-card class="note-options">
      <q-card-section :class="`bg-${COLORS_MATERIAL_DARK[note.colors?.[0] || 0]}`">
        <div class="text-h5">{{ note.text }}</div>
      </q-card-section>
      <q-separator />
      <q-card-section style="max-height: calc(80vh - 104px)" class="scroll">
        <div v-if="isEditable" class="row">
          <div class="col-12 col-md-6">
            <image-zone
              v-ripple
              class="image-zone"
              :max-width="200"
              :max-height="100"
              :image="note.image"
              @update:image="updateNote('image', $event)"
            ></image-zone>
          </div>
          <div class="col-12 col-md-6">
            <q-checkbox
              color="primary"
              label="Show as sticky note"
              :model-value="note.showAsSticky"
              @update:model-value="updateNote('showAsSticky', !note.showAsSticky)"
            />
            <q-checkbox
              color="primary"
              label="Show label"
              :disable="!note.image"
              :model-value="note.showLabel"
              @update:model-value="note.image ? updateNote('showLabel', !note.showLabel) : ''"
            />
          </div>
        </div>

        <q-separator v-if="isEditable" />
        <q-input
          type="textarea"
          :bg-color="COLORS_MATERIAL[note.colors?.[0] || 0]"
          filled
          outlined
          name="description"
          label="Description"
          :model-value="note.description"
          @update:model-value="updateNote('description', $event)"
        />
        <q-separator />
        <q-expansion-item
          v-model="layout.showNoteOptionsCalc"
          label="Calculations"
          expand-separator
        >
          <div>
            <q-banner v-if="Boolean(calcResults.err)" class="text-white bg-red">{{
              calcResults.err
            }}</q-banner>
            <div class="row items-center">
              <div class="col-1 text-center">
                <q-icon name="vpn_key" size="sm" />
              </div>
              <div class="col-11">
                <q-input
                  :disable="!isEditable"
                  label="id"
                  :model-value="note.calcId"
                  hint="Name used as reference in calculations for this item."
                  hide-hint
                  required
                  :rules="[rules.variable, rules.unique]"
                  @update:model-value="updateNote('calcId', $event)"
                />
              </div>
            </div>

            <div v-for="(val, calcVar) in note.values" :key="calcVar" class="row items-center">
              <div class="col-1 text-center">
                <q-btn round flat>
                  <q-icon
                    :class="`calcDisplayColor${whichCalcDisplay(calcVar)}`"
                    :name="whichCalcDisplay(calcVar) ? 'label' : 'label_outline'"
                  />
                  <q-menu cover anchor="top left">
                    <q-item clickable>
                      <q-item-section>
                        <q-icon
                          size="sm"
                          :class="`calcDisplayColor${whichCalcDisplay(calcVar)}`"
                          :name="whichCalcDisplay(calcVar) ? 'label' : 'label_outline'"
                        />
                      </q-item-section>
                    </q-item>
                    <q-item
                      v-for="c in ['B', 'R', 'G']"
                      v-show="note[`calcDisplay${c}`] !== calcVar"
                      :key="c"
                      v-close-popup
                      clickable
                      @click="updateCalcDisplay(calcVar, c)"
                    >
                      <q-item-section>
                        <q-icon :class="`calcDisplayColor${c}`" name="label" size="sm" />
                      </q-item-section>
                    </q-item>
                    <q-item
                      v-if="whichCalcDisplay(calcVar)"
                      v-close-popup
                      clickable
                      @click="updateCalcDisplay(calcVar, null)"
                    >
                      <q-item-section>
                        <q-icon name="label_outline" size="sm" />
                      </q-item-section>
                    </q-item>
                  </q-menu>
                </q-btn>
              </div>
              <div class="col-11">
                <q-input
                  :disable="!isEditable"
                  hint="Any calculation example cs1.size * tickets.price"
                  hide-hint
                  :label="calcVar"
                  :model-value="val"
                  :error="Boolean(getError(calcVar))"
                  :error-message="getError(calcVar)"
                  :suffix="`= ${getResult(note.calcId, calcVar)}`"
                  @update:model-value="updateCalcVal(calcVar, $event)"
                >
                  <template #append>
                    <q-icon
                      :name="isEditable ? 'delete_forever' : undefined"
                      class="cursor-pointer"
                      @click="removeCalcVar(calcVar)"
                    />
                  </template>
                </q-input>
              </div>
            </div>
            <div v-if="isEditable" class="row items-center">
              <div class="col-1 text-center">
                <q-icon name="bookmark" size="sm" />
              </div>
              <div class="col-8">
                <q-input
                  v-model="newVariable"
                  label="New variable"
                  value="hello"
                  hint="Add a new variable name only use a-z, a-Z, 0-9, _"
                  hide-hint
                  :rules="[rules.variable]"
                  @keypress.enter="addCalcVar"
                />
              </div>
              <div class="col-3">
                <q-btn color="primary" label="add" class="full-width" flat @click="addCalcVar" />
              </div>
            </div>
          </div>
        </q-expansion-item>
      </q-card-section>
      <q-separator />
      <q-card-actions>
        <q-btn v-if="isEditable" color="negative" flat label="Delete" @click="deleteNote" />
        <q-space />
        <q-btn flat color="primary" label="Close" @click="hideDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import humanFormat from 'human-format'
import ImageZone from '@/components/bmc/ImageZone.vue'
import Note from '@/models/Note'
import { COLORS_MATERIAL, COLORS_MATERIAL_DARK } from '@/utils/constants'
import { storeToRefs } from 'pinia'
import { useBmcUIStore } from '@/stores/bmc-ui-store'
import { useBMCStore } from '@/stores/bmc-store'

import type { BMCNote } from '@/components/models'

const patternVar = /^[a-zA-Z_][a-zA-Z\d_]*$/

const bmcUiStore = useBmcUIStore()
const { layout } = storeToRefs(bmcUiStore)

const bmcStore = useBMCStore()
const { focusedNote, calcIds, calcResults } = storeToRefs(bmcStore)
const { noteUpdate, noteDelete, noteUpdateCalcVal } = bmcStore

const newVariable = ref<string | null>(null)

const rules = {
  variable: (value: string) => patternVar.test(value) || 'Invalid name only use a-z, a-Z, 0-9, _',
  unique: (value: string) => {
    const calcIdsValue = calcIds.value
    const firstIndex = calcIdsValue.indexOf(value) + 1
    // check if there is a 2nd element in the array (1st time is self)
    return (
      calcIdsValue.indexOf(value, firstIndex) === -1 || 'Name already used, ID must be unique!'
    )
  },
}

const note = computed(() => {
  const noteValue = focusedNote.value
  // auto generate id if not defined at first use
  if (layout.value.showNoteOptionsCalc && noteValue && !noteValue.calcId) {
    const calcId = noteValue.text.replace(/[^a-zA-Z\d_]/g, '_')
    nextTick(() => {
      noteUpdate({
        note: noteValue,
        changes: {
          calcId,
        },
      })
    })
    return noteValue
  }
  // Return empty note if no focused note
  if (!noteValue) {
    return {
      $id: '',
      type: '',
      text: '',
      colors: [0],
      left: 0,
      top: 0,
      listLeft: 0,
      listTop: 0,
      angle: 0,
      height: 0,
      description: '',
      image: '',
      parent: '',
      calcId: '',
      values: {},
      showLabel: false,
      showAsSticky: false,
      hidden: false,
      children: [],
    } as BMCNote
  }
  return noteValue
})

const isEditable = computed(() => {
  return !(note.value as any).isGame && layout.value.isEditable
})

function whichCalcDisplay(calcVar: string | number) {
  const key = String(calcVar)
  return ['B', 'R', 'G'].find((c) => note.value[`calcDisplay${c}`] === key)
}

function hideDialog() {
  layout.value.showNoteOptions = false
}

function deleteNote() {
  hideDialog()
  noteDelete(note.value)
}

function updateNote(field: string, data: any) {
  noteUpdate({
    note: note.value,
    changes: {
      [field]: data,
    },
  })
}

function updateCalcDisplay(calVar: string | number, c: string | null) {
  const key = String(calVar)
  const current = whichCalcDisplay(key)
  const changes: Record<string, any> = {}
  if (c) {
    changes[`calcDisplay${c}`] = key
  }
  if (current) {
    changes[`calcDisplay${current}`] = null
  }
  noteUpdate({
    note: note.value,
    changes,
  })
}

function getResult(calcId: string, calcVar: string | number) {
  const key = String(calcVar)
  if (calcResults.value && calcResults.value[calcId] && calcResults.value[calcId][key]) {
    const res = calcResults.value[calcId][key]
    if (typeof res === 'object') {
      try {
        return JSON.stringify(res)
      } catch (e) {
        return res
      }
    }
    if (!isNaN(res)) {
      return humanFormat(res)
    }
    return res
  }
  return 'N/A'
}

function getError(calcVar: string | number) {
  const key = String(calcVar)
  return calcResults.value && calcResults.value[`err_${note.value.calcId}.${key}`]
    ? calcResults.value[`err_${note.value.calcId}.${key}`]
    : ''
}

function addCalcVar() {
  // TODO should only send new var...
  if (newVariable.value) {
    const copy = Object.assign({}, note.value.values)
    copy[newVariable.value] = ''
    updateNote('values', copy)
    newVariable.value = null
  }
}

function removeCalcVar(name: string | number) {
  const key = String(name)
  const copy = Object.assign({}, note.value.values)
  delete copy[key]
  updateNote('values', copy)
}

function updateCalcVal(key: string | number, value: any) {
  noteUpdateCalcVal({
    note: note.value,
    key: String(key),
    value,
  })
}
</script>

<style>
.note-options .image-zone {
  height: 100px;
  margin: 0 0 18px 0;
}

.note-options .headline {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.note-options .icon-toggle {
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.note-options .icon-toggle.rotate {
  transform: rotateZ(-180deg);
}

.input-group.checkbox {
  padding: 9px 0;
}

.q-icon.calcDisplayColorR {
  color: #d32f2f !important;
}

.q-icon.calcDisplayColorG {
  color: #558b2f !important;
}

.q-icon.calcDisplayColorB {
  color: #2196f3 !important;
}

@media (min-width: 600px) {
  .note-option-dialog {
    width: 60% !important;
  }
}

@media (min-width: 1024px) {
  .note-option-dialog {
    width: 40% !important;
  }
}
</style>
