<template>
  <div v-if="error">
    {{ error }}
  </div>
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
const error = ref('')

onMounted(async () => {
  // TODO fix in html5 mode?
  const parsed = new URLSearchParams(window.location.search)
  userId.value = parsed.get('userId') || ''
  secret.value = parsed.get('secret') || ''
  if (userId.value && secret.value) {
    try {
      await accountStore.verifyEmail(userId.value, secret.value)
      router.push({ name: 'account' })
    } catch (e) {
      error.value = (e as AppwriteException).message
    }
  }
  router.push('/')
})

watchEffect(() => {
  if (accountStore.account) {
    router.push('/')
  }
})
</script>
