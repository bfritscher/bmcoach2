<template>
  <q-page v-if="accountStore.account" class="account-page q-pa-md" style="max-width: 700px; margin: 0 auto">
    <div class="q-gutter-y-lg">
      <q-card flat bordered class="bg-primary text-white">
        <q-card-section class="row items-start q-col-gutter-md">
          <div class="col">
            <div class="text-h5">Account Settings</div>
            <div class="text-body2 text-white text-weight-light">
              Manage your profile details, security options, and verification status.
            </div>
            <div class="row items-center q-gutter-sm q-mt-md">
              <div>
                <div class="text-subtitle2">
                  Signed in as
                  <span>{{ accountStore.account?.name || '—' }}</span>
                  via
                  <q-chip dense color="white" text-color="primary" icon="vpn_lock">
                    {{ providerLabel }}
                  </q-chip>
                </div>
                <div>
                  Connected providers:
                  <q-btn
                    dense
                    color="white"
                    text-color="primary"
                    :label="provider.provider"
                    size="sm"
                    icon="vpn_lock"
                    unelevated
                    rounded
                    class="q-mr-sm q-pa-xs"
                    v-for="provider in identities"
                    :key="provider.$id"
                    @click="confirmDeleteIdentity(provider)"
                  >
                  </q-btn>
                  <q-btn
                    dense
                    color="white"
                    text-color="primary"
                    icon="add"
                    label="Add provider"
                    unelevated
                    rounded
                    size="sm"
                    class="q-mr-sm q-pa-xs"
                    to="/login"
                    title="Connect another provider"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="col-auto row items-center q-gutter-sm">
            <q-btn
              color="white"
              text-color="white"
              icon="arrow_back"
              label="Back"
              outline
              @click="back"
            />
          </div>
        </q-card-section>
      </q-card>

      <div class="row q-mt-md">
        <div class="col-12 column">
          <q-card bordered flat>
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium">Profile</div>
            </q-card-section>
            <q-separator />
            <q-card-section class="column q-gutter-md">
              <q-input v-model="accountStore.account.name" type="text" label="Name" outlined dense>
                <template #after>
                  <q-btn
                    color="primary"
                    label="Update"
                    unelevated
                    @click="accountStore.updateName()"
                  />
                </template>
              </q-input>
              <q-input
                v-model="accountStore.account.email"
                type="email"
                label="Email"
                outlined
                dense
                :disable="!canUpdateEmail"
              >
                <template #after>
                  <q-btn
                    color="primary"
                    label="Update"
                    outline
                    :disable="!canUpdateEmail"
                    @click="showUpdateEmailPrompt()"
                  />
                </template>
              </q-input>
              <q-banner
                v-if="accountStore.account.emailVerification"
                dense
                class="bg-positive text-white rounded-borders"
              >
                <template #avatar>
                  <q-icon name="check_circle" color="white" />
                </template>
                Email verified
              </q-banner>
              <q-banner v-else dense class="bg-negative text-white rounded-borders">
                <template #avatar>
                  <q-icon name="warning" color="white" />
                </template>
                Email verification required
                <template #action>
                  <q-btn
                    color="white"
                    flat
                    label="Send verification email"
                    size="sm"
                    @click="accountStore.sendVerificationEmail()"
                  />
                </template>
              </q-banner>
            </q-card-section>
          </q-card>

          <q-card bordered flat class="q-mt-md">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium">Security</div>
            </q-card-section>
            <q-separator />
            <q-card-section class="column q-gutter-sm">
              <q-btn
                color="secondary"
                class="full-width"
                icon="lock"
                :label="passwordButtonLabel"
                unelevated
                @click="showChangePasswordDialog()"
              />
            </q-card-section>
            <q-list separator>
              <q-item-label header>Active Sessions</q-item-label>
              <q-item v-for="session in sessions" :key="session.$id" clickable>
                <q-item-section>
                  <q-item-label
                    >{{ session.provider || 'Email/Password' }} {{ session.clientName }}
                    {{ session.clientType }} {{ session.clientCode }}</q-item-label
                  >
                  <q-item-label caption
                    >{{ new Date(session.$createdAt).toLocaleString() }} ->
                    {{ new Date(session.expire).toLocaleString() }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="sessions.length === 0">
                <q-item-section>
                  <q-item-label>No active sessions</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <q-card-section class="column">
              <q-btn
                color="warning"
                outline
                class="full-width"
                icon="logout"
                label="Log out from all sessions"
                @click="accountStore.logoutAllSessions()"
              />
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 column q-mt-md">
          <q-card bordered class="danger-card">
            <q-card-section>
              <div class="text-subtitle1 text-weight-medium">Danger Zone</div>
              <div class="text-caption">
                Deleting your account removes all projects, canvases, and team access permanently.
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <q-btn
                color="negative"
                class="full-width"
                icon="delete"
                label="Delete Account"
                unelevated
                @click="confirmDeleteAccount()"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAccountStore } from '@/stores/account'
import type { Models } from 'appwrite'
import ChangePasswordDialog from './ChangePasswordDialog.vue'
const $q = useQuasar()
const accountStore = useAccountStore()

const canUpdateEmail = computed(() => !!accountStore.account?.passwordUpdate)
const passwordButtonLabel = computed(() =>
  accountStore.account?.passwordUpdate ? 'Change Password' : 'Set Password',
)
const providerLabel = computed(() => accountStore.session?.provider || 'email/password')

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

const sessions = ref<Models.Session[]>([])
const identities = ref<Models.Identity[]>([])

onMounted(() => {
  accountStore.getSessions().then((value) => {
    sessions.value = value.sessions
  })
  accountStore.getIdentities().then((value) => {
    identities.value = value.identities
  })
})

function back() {
  history.back()
}

function confirmDeleteIdentity(provider: Models.Identity) {
  $q.dialog({
    title: 'Disconnect Provider',
    message: `Are you sure you want to disconnect the provider ${provider.provider}? You will no longer be able to log in with this provider.`,
    ok: 'Disconnect',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(() => {
    accountStore.deleteIdentity(provider.$id).then(() => {
      identities.value = identities.value.filter((p) => p.$id !== provider.$id)
      $q.notify({
        type: 'positive',
        message: `Disconnected provider ${provider.provider}`,
      })
    })
  })
}
</script>

<style scoped lang="scss">
.danger-card {
  border: 1px solid var(--q-negative);
  background-color: rgba(244, 67, 54, 0.04);
}

.danger-card .q-card-section:first-of-type {
  color: var(--q-negative);
}
</style>
