<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">Rename / remove {{ name }}</div>
      </q-card-section>
      <q-card-section>
        <q-input
          ref="inputRef"
          v-model="newName"
          label="Enter a new name"
          filled
          :rules="rules"
          autofocus
        />
        <p style="font-size: 12px" class="text-info">
          <span>info</span> Removing does not delete the associated data.<br />
          You can add <i ng-bind="title"></i> again to the canvas and see it again.
        </p>
        <p style="font-size: 12px" class="text-warning">
          <span>warn</span> Updating will overwrite any existing value.
        </p>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn color="warning" label="Update" flat @click="onUpdateClick()" />
        <q-space />
        <q-btn color="primary" label="Cancel" flat @click="onCancelClick" />
        <q-btn
          color="primary"
          label="Remove"
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
    name: {
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
    const newName = ref(props.name)

    const rules = computed(() => {
      const rules = [(val: string) => (val && val.length > 0) || 'Name is required'] as ValidationRule[]
      if (props.type === 'serie') {
        rules.push(
          (val: string) =>
            chartStore.businessNotInUse(val) ||
            val === props.name ||
            'Name already in use on this canvas!',
        )
      }
      if (props.type === 'factor') {
        rules.push(
          (val: string) =>
            chartStore.factorNotInUse(val) ||
            val === props.name ||
            'Name already in use on this canvas!',
        )
      }
      return rules
    })

    return {
      newName,
      rules,
      // This is REQUIRED;
      // Need to inject these (from useDialogPluginComponent() call)
      // into the vue scope for the vue html template
      dialogRef,
      inputRef,
      onDialogHide,
      onOKClick() {
        onDialogOK({
          action: 'remove',
        })
      },
      onUpdateClick() {
        onDialogOK({
          action: 'rename',
          name: newName.value,
        })
      },
      // we can passthrough onDialogCancel directly
      onCancelClick: onDialogCancel,
    }
  },
})
</script>
