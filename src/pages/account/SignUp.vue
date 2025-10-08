<template>
  <q-page class="column col-12">
    <div class="col q-ma-xl">
      <q-card flat bordered>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Sign Up For Local Account</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="name" type="text" label="Name" />
          <q-input v-model="email" type="email" label="Email" />
          <q-input v-model="password" type="password" label="Password" />
        </q-card-section>

        <q-card-section v-if="error">
          <p class="text-red">{{ error }}</p>
        </q-card-section>

        <q-card-actions class="q-px-md">
          <q-btn to="/login" flat label="Or Login here" />
          <q-space />
          <q-btn
            padding="xs lg"
            type="submit"
            color="primary"
            label="Sign Up"
            unelevated
          
            @click="signup()"
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

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')

async function signup() {
  error.value = ''
  try {
    await accountStore.signup(email.value, password.value, name.value)
  } catch (e) {
    error.value = (e as AppwriteException).message
    // TODO 409 already exists
  }
}

watchEffect(() => {
  if (accountStore.account) {
    router.push('/')
  }
})
</script>
