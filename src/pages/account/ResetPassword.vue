<template>
  <q-page class="row items-center justify-evenly">
    <div class="col col-md-4">
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Reset Password</div>
        </q-card-section>
        <q-card-section>
          <div class="text-subtitle2">Enter your e-mail to receive a reset link.</div>
          <q-input v-model="email" type="email" label="Email" />
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
            label="Send reset link"
            @click="resetPassword()"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { watchEffect, ref } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useRouter } from 'vue-router'
import { AppwriteException } from 'appwrite'
const accountStore = useAccountStore()
const router = useRouter()

const email = ref('')
const error = ref('')

async function resetPassword() {
  error.value = ''
  try {
    await accountStore.resetPassword(email.value)
    error.value = 'Check your email for a password reset link'
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
