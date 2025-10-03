<template>
  <q-page v-if="accountStore.account" class="column col-12 q-pa-md">
    <p class="q-my-md">
      <q-btn color="secondary" label="Back" @click="back()" />
    </p>

    <div class="text-h6 q-mb-md">Account Settings</div>
    <p>
      This session currently logged in via
      <q-badge color="secondary" class="q-pa-sm" :label="accountStore.session?.provider" />
    </p>
    <q-input v-model="accountStore.account.name" type="text" label="Name">
      <template #after>
        <q-btn color="secondary" label="update name" outline @click="accountStore.updateName()" />
      </template>
    </q-input>
    <q-input
      v-model="accountStore.account.email"
      type="text"
      label="Email"
      outline
      :disable="accountStore.account.passwordUpdate == ''"
    >
      <template #after>
        <q-btn
          color="secondary"
          label="update Email"
          outline
          :disable="accountStore.account.passwordUpdate == ''"
          @click="showUpdateEmailPrompt()"
        />
      </template>
    </q-input>
    <q-badge v-if="accountStore.account.emailVerification" color="positive" label="verified" />
    <div v-else class="q-my-md">
      E-mail verification <q-badge color="negative" label="required" />
      <q-btn color="positive" class="q-mx-md" @click="accountStore.sendVerificationEmail()"
        >send verification email</q-btn
      >
    </div>

    <div class="column q-my-md q-gutter-sm">
      <q-btn color="secondary" class="col-6" @click="showChangePasswordDialog()">{{
        accountStore.account.passwordUpdate ? 'Change Password' : 'Set Password'
      }}</q-btn>
      <q-btn color="warning" outline class="col-6" @click="accountStore.logoutAllSessions()"
        >Logout from all sessions</q-btn
      >
    </div>
    <q-space />

    <div class="text-h6 q-my-md">Danger Zone</div>
    <q-btn color="negative" @click="confirmDeleteAccount()">Delete Account</q-btn>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useAccountStore } from '@/stores/account'
import ChangePasswordDialog from './ChangePasswordDialog.vue'
const $q = useQuasar()
const accountStore = useAccountStore()

function showChangePasswordDialog() {
  $q.dialog({
    component: ChangePasswordDialog,
  })
}

function confirmDeleteAccount() {
  $q.dialog({
    title: 'Delete Account',
    message: 'Are you sure you want to delete your account?',
    ok: 'Delete',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(() => {
    accountStore.lockAccount()
  })
}

function showUpdateEmailPrompt() {
  $q.dialog({
    title: 'Update Email',
    message: 'Enter your password to update your email',
    prompt: {
      model: '',
      type: 'password',
    },
    ok: 'Update',
    cancel: 'Cancel',
    persistent: true,
  }).onOk((password) => {
    if (accountStore.account?.email && password) {
      accountStore.updateEmail(accountStore.account.email, password)
    }
  })
}

function back() {
  history.back()
}
</script>
