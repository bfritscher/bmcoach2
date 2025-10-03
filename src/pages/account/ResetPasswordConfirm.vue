<template>
  <q-page class="row items-center justify-evenly">
    <div class="col col-md-4">
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Set new Password</div>
        </q-card-section>
        <q-card-section>
          <div class="text-subtitle2">Enter your new password twice.</div>
          <q-input v-model="password" type="password" label="password" />
          <q-input v-model="password2" type="password" label="password (again)" />
        </q-card-section>

        <q-card-section v-if="error">
          <p class="text-red">{{ error }}</p>
        </q-card-section>

        <q-card-actions class="q-px-md">
          <q-space />
          <q-btn
            unelevated
            padding="xs lg"
            type="submit"
            color="primary"
            label="Save new password"
            @click="confirmPassword()"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { watchEffect, ref, onMounted } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useRouter } from 'vue-router'
import { AppwriteException } from 'appwrite'
const accountStore = useAccountStore()
const router = useRouter()

const userId = ref('')
const secret = ref('')
const password = ref('')
const password2 = ref('')
const error = ref('')
// TODO validate password === password2

onMounted(async () => {
  // TODO fix in html5 mode?
  const parsed = new URLSearchParams(window.location.search)
  userId.value = parsed.get('userId') || ''
  secret.value = parsed.get('secret') || ''
  if (!userId.value || !secret.value) {
    router.push('/')
  }
})

async function confirmPassword() {
  error.value = ''
  try {
    await accountStore.confirmPassword(userId.value, secret.value, password.value, password2.value)
    router.push('/login')
  } catch (e) {
    error.value = (e as AppwriteException).message
  }
}

watchEffect(() => {
  if (accountStore.account) {
    router.push('/')
  }
})
</script>
