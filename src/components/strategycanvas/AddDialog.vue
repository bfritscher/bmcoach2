<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
      </q-card-section>
      <q-card-section>
        <q-input
          ref="inputRef"
          v-model="names"
          :label="label"
          filled
          :type="advancedEntry ? 'textarea' : 'text'"
          :rules="rules"
          autofocus
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="warning"
          :label="(advancedEntry && 'Switch to normal mode') || 'Switch to advanced mode'"
          flat
          @click="switchMode()"
        />
        <q-space />
        <q-btn color="primary" label="Cancel" flat @click="onCancelClick" />
        <q-btn
          color="primary"
          label="Add"
          flat
          :disable="inputRef && inputRef.hasError"
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { QInput, useDialogPluginComponent, ValidationRule } from 'quasar'
import { ref, computed, defineComponent } from 'vue'
import { useChartStore } from '@/stores/chart-store'

export default defineComponent({
  props: {
    type: {
      type: String,
      required: true,
    },
  },

  emits: [
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
  ],

  setup(props) {
    const chartStore = useChartStore()
    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome
    const inputRef = ref<QInput | undefined>()
    const names = ref('')
    const advancedEntry = ref(false)
    const title = computed(() => {
      if (props.type === 'serie') {
        return 'Add a new value curve'
      }
      if (props.type === 'factor') {
        return 'Add a new factor'
      }
      return ''
    })

    const label = computed(() => {
      if (advancedEntry.value) {
        if (props.type === 'serie') {
          return 'Enter one value curve name per line'
        }
        if (props.type === 'factor') {
          return 'Enter one factor name per line'
        }
      }
      return 'Enter a new name'
    })

    const rules = computed(() => {
      const rules = [
        (val: string) => (val && val.length > 0) || 'Name is required',
      ] as ValidationRule[]
      if (!advancedEntry.value) {
        if (props.type === 'serie') {
          rules.push(
            (val: string) =>
              chartStore.businessNotInUse(val) || 'Name already in use on this canvas!',
          )
        }
        if (props.type === 'factor') {
          rules.push(
            (val: string) =>
              chartStore.factorNotInUse(val) || 'Name already in use on this canvas!',
          )
        }
      }
      return rules
    })

    function switchMode() {
      advancedEntry.value = !advancedEntry.value
      setTimeout(() => {
        inputRef.value?.focus()
      })
    }

    return {
      advancedEntry,
      names,
      title,
      label,
      rules,
      switchMode,
      // This is REQUIRED;
      // Need to inject these (from useDialogPluginComponent() call)
      // into the vue scope for the vue html template
      dialogRef,
      inputRef,
      onDialogHide,
      onOKClick() {
        onDialogOK(names.value)
      },

      // we can passthrough onDialogCancel directly
      onCancelClick: onDialogCancel,
    }
  },
})
</script>
