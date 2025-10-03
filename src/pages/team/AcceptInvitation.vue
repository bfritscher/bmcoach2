<template>
  <div v-if="error">
    {{ error }}
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useTeamsStore } from '@/stores/teams'
import { onMounted } from 'vue'

import { useRouter } from 'vue-router'
import { AppwriteException } from 'appwrite'
const router = useRouter()
const teamsStore = useTeamsStore()
const error = ref()

onMounted(async () => {
  // TODO fix in html5 mode?
  const parsed = new URLSearchParams(window.location.search)
  const userId = parsed.get('userId')
  const teamId = parsed.get('teamId')
  const membershipId = parsed.get('membershipId')
  const secret = parsed.get('secret')
  if (teamId && userId && membershipId && secret) {
    try {
      await teamsStore.acceptTeamInvitation(teamId, membershipId, userId, secret)
      router.push({ name: 'team', params: { teamId }, query: {} })
    } catch (e) {
      error.value = (e as AppwriteException).message
      // TODO switch to errorCode because of locale
      if (error.value === 'Membership already confirmed') {
        router.push({ name: 'team', params: { teamId }, query: {} })
      }
    }
  } else {
    // TODO redirect to index page with error message?
  }
})
</script>
