<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section>
        <div class="text-h6">
          {{ accountStore.account?.passwordUpdate ? 'Change Password' : 'Set Password' }}
        </div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-if="accountStore.account?.passwordUpdate"
          v-model="currentPassword"
          label="current Password"
          filled
          type="password"
          class="q-my-sm"
        />
        <q-input v-model="password1" label="new password" filled type="password" class="q-my-sm" />
        <q-input v-model="password2" label="new password (again)" filled type="password" />
      </q-card-section>
      <q-card-actions align="right">
        <q-space />
        <q-btn color="primary" label="Cancel" flat @click="onCancelClick" />
        <q-btn
          color="primary"
          label="Change Password"
          unelevated
          :disable="!password1 && password1 !== password2"
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { QInput, useDialogPluginComponent } from 'quasar'
import { useAccountStore } from '@/stores/account'
import { ref, defineComponent } from 'vue'

export default defineComponent({
  emits: [
    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
  ],

  setup() {
    const accountStore = useAccountStore()
    // REQUIRED; must be called inside of setup()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    // dialogRef      - Vue ref to be applied to QDialog
    // onDialogHide   - Function to be used as handler for @hide on QDialog
    // onDialogOK     - Function to call to settle dialog with "ok" outcome
    //                    example: onDialogOK() - no payload
    //                    example: onDialogOK({ /*.../* }) - with payload
    // onDialogCancel - Function to call to settle dialog with "cancel" outcome
    const inputRef = ref<QInput | undefined>()
    const currentPassword = ref('')
    const password1 = ref('')
    const password2 = ref('')

    return {
      currentPassword,
      password1,
      password2,
      accountStore,
      // This is REQUIRED;
      // Need to inject these (from useDialogPluginComponent() call)
      // into the vue scope for the vue html template
      dialogRef,
      inputRef,
      onDialogHide,
      onOKClick() {
        accountStore.updatePassword(
          password1.value,
          accountStore.account?.passwordUpdate ? currentPassword.value : undefined,
        )
        onDialogOK()
      },

      // we can passthrough onDialogCancel directly
      onCancelClick: onDialogCancel,
    }
  },
})
</script>
