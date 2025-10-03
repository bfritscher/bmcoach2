<template>
  <q-page class="column col-12">
    <div class="col q-ma-xl">
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Login</div>
        </q-card-section>
        <q-card-section>
          <div class="text-subtitle2">External account</div>
          <div class="row q-gutter-sm">
            <q-btn color="blue" padding="xs" no-caps @click="accountStore.loginOAuth2('google')">
              <q-icon
                name="img:icons/GoogleLogo.svg"
                left
                class="bg-white"
                size="sm"
                style="border-bottom-left-radius: 3px; border-top-left-radius: 3px; padding: 3px"
              />
              <div class="q-pr-md">Sign in with Google</div>
            </q-btn>
            <q-btn color="black" padding="xs" no-caps @click="accountStore.loginOAuth2('github')">
              <q-icon name="img:icons/github-mark-white.svg" left size="sm" style="padding: 3px" />
              <div class="q-pr-md">Sign in with Github</div>
            </q-btn>
            <q-btn
              style="background-color: #273375"
              color=""
              padding="xs"
              no-caps
              @click="accountStore.loginOAuth2('eduid')"
            >
              <q-icon
                name="img:icons/eduid.svg"
                class="bg-white"
                left
                size="sm"
                style="padding: 3px"
              />
              <div class="q-pr-md">Sign in with SWITCH edu-ID</div>
            </q-btn>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-subtitle2">Local account</div>
          <q-input v-model="email" type="email" label="Email" />
          <q-input v-model="password" type="password" label="Password" />
        </q-card-section>

        <q-card-section v-if="error">
          <p class="text-red">{{ error }}</p>
        </q-card-section>

        <q-card-actions class="q-px-md">
          <q-btn to="/signup" flat label="Or Sign up here" />
          <q-space />
          <q-btn padding="xs lg" type="submit" color="secondary" label="login" @click="login()" />
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
const password = ref('')
const error = ref('')
async function login() {
  error.value = ''
  try {
    await accountStore.login(email.value, password.value)
  } catch (e) {
    error.value = (e as AppwriteException).message
  }
}

// TODO handle redirect?
watchEffect(() => {
  if (accountStore.account) {
    router.push('/')
  }
})
</script>
