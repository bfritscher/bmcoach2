<template>
  <q-page class="q-pa-md">
    <div class="text-h3 q-mb-md">Project: {{ teamsStore.currentTeam?.name }}</div>
    <q-btn
      v-if="teamsStore.isCurrentTeamOwner"
      color="primary"
      unelevated
      label="Rename Project"
      @click="showEditNameDialog()"
    />

    <div class="text-h5 q-my-md">Project members</div>
    <q-btn color="primary" unelevated @click="showInviteMemberDialog()">Invite new member</q-btn>
    <q-markup-table class="q-my-md" flat bordered>
      <thead>
        <tr class="bg-primary text-white">
          <th class="text-left">Name</th>
          <th class="text-left">Email</th>
          <th class="text-left">Roles</th>
          <th class="text-left">Status</th>
          <th class="text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in teamsStore.currentTeamMemberships" :key="m.$id">
          <td>{{ m.userName }}</td>
          <td>{{ m.userEmail }}</td>
          <td>
            <q-badge v-for="role in m.roles" :key="role" rounded :label="role" />
          </td>
          <td>
            <q-badge v-if="m.confirm" color="positive" label="confirmed" />
            <q-badge v-else color="warning" label="invited" />
          </td>
          <td>
            <q-btn
              v-if="teamsStore.isCurrentTeamOwner"
              color="negative"
              unelevated
              label="remove"
              @click="showRemoveMembershipDialog(m)"
            />
          </td>
        </tr>
      </tbody>
    </q-markup-table>

    <div class="text-h5 q-my-md">Danger Zone</div>
    <p>TODO delete project (team + projet data?) (if owner)</p>
    <q-btn
      color="primary"
      unelevated
      label="Back"
      :to="{ name: 'team', params: { teamId: teamsStore.currentTeam?.$id } }"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useTeamsStore } from '@/stores/teams'
import { Models } from 'appwrite'

const $q = useQuasar()
const teamsStore = useTeamsStore()

function showInviteMemberDialog() {
  $q.dialog({
    title: 'Invite Member',
    message: 'Enter a email address for the new member.',
    prompt: {
      model: '',
      type: 'email',
      isValid: (v) => !!(v && v.length > 0), // TODO valid email pattern
    },
    ok: 'Invite',
    cancel: 'Cancel',
    persistent: true,
  }).onOk((email) => {
    teamsStore.inviteTeamMember(email)
  })
}

function showEditNameDialog() {
  $q.dialog({
    title: 'Edit Name',
    message: 'Enter a new name for the project.',
    prompt: {
      model: teamsStore.currentTeam?.name || '',
      type: 'text',
      isValid: (v) => !!(v && v.length > 0),
    },
    ok: 'Update',
    cancel: 'Cancel',
    persistent: true,
  }).onOk((name) => {
    teamsStore.updateTeamName(name)
  })
}

function showRemoveMembershipDialog(membership: Models.Membership) {
  $q.dialog({
    title: 'Remove Member',
    message: `Are you sure you want to remove ${membership.userName}?`,
    ok: 'Remove',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(() => {
    teamsStore.removeMembership(membership)
  })
}
</script>
