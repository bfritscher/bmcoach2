<template>
  <q-page class="q-pa-md q-gutter-y-lg">
    <!-- Header / Title -->
    <q-card flat bordered class="bg-primary text-white">
      <q-card-section class="row items-center q-col-gutter-md">
        <div class="col">
          <div class="text-h5 text-weight-bold">Project settings</div>
          <div class="text-subtitle2 ellipsis">{{ teamsStore.currentTeam?.name }}</div>
        </div>
        <div class="col-auto row items-center q-gutter-sm">
          <q-btn
            outline
            color="white"
            text-color="white"
            icon="arrow_back"
            label="Back"
            :to="{ name: 'team', params: { teamId: teamsStore.currentTeam?.$id } }"
          />
          <q-btn
            v-if="teamsStore.isCurrentTeamOwner"
            color="white"
            text-color="primary"
            icon="edit"
            label="Rename"
            unelevated
            @click="showEditNameDialog()"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Members -->
    <q-card flat bordered>
      <q-card-section class="row items-center justify-between q-col-gutter-md">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">Project members</div>
          <div class="text-caption text-grey-7">Manage who has access to this project</div>
        </div>
        <div class="col-auto row items-center q-gutter-sm">
          <q-input
            dense
            outlined
            v-model="membersFilter"
            placeholder="Search members"
            clearable
            class="q-mr-sm"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-btn color="primary" icon="person_add" label="Invite" unelevated @click="showInviteMemberDialog()" />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <q-table
          flat
          :bordered="false"
          :rows="teamsStore.currentTeamMemberships"
          :columns="columns"
          row-key="$id"
          :filter="membersFilter"
          :grid="$q.screen.lt.md"
          :pagination="{ rowsPerPage: 10 }"
          no-data-label="No members"
          :rows-per-page-options="[5,10,20,50]"
        >
          <!-- Name -->
          <template #body-cell-name="{ row }">
            <q-td>
              <div class="text-body1">{{ row.userName }}</div>
              <div class="text-caption text-grey-7">{{ row.userEmail }}</div>
            </q-td>
          </template>

          <!-- Email for table mode (kept for completeness) -->
          <template #body-cell-email="{ row }">
            <q-td>{{ row.userEmail }}</q-td>
          </template>

          <!-- Roles -->
          <template #body-cell-roles="{ row }">
            <q-td>
              <q-chip
                v-for="role in row.roles"
                :key="role"
                square
                dense
                color="grey-3"
                text-color="grey-9"
                class="q-mr-xs q-mb-xs"
              >
                {{ role }}
              </q-chip>
            </q-td>
          </template>

          <!-- Status -->
          <template #body-cell-status="{ row }">
            <q-td>
              <q-badge v-if="row.confirm" color="positive" label="confirmed" />
              <q-badge v-else color="warning" label="invited" />
            </q-td>
          </template>

          <!-- Actions -->
          <template #body-cell-actions="{ row }">
            <q-td>
              <q-btn
                dense
                flat
                color="negative"
                icon="person_remove"
                label="Remove"
                :disable="!teamsStore.isCurrentTeamOwner || row.userId === accountStore.account?.$id"
                @click="showRemoveMembershipDialog(row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Danger Zone -->
    <q-card flat bordered class="q-mt-lg">
      <q-card-section class="row items-center justify-between">
        <div>
          <div class="text-subtitle1 text-weight-medium text-negative">Danger zone</div>
          <div class="text-caption text-grey-7">Delete this project and all related data</div>
        </div>
        <q-btn
          v-if="teamsStore.isCurrentTeamOwner"
          color="negative"
          outline
          icon="delete"
          label="Delete project"
          @click="confirmDeleteProject"
        />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="text-caption text-grey-7">
          This action cannot be undone. It will permanently delete the project and all its data.
        </div>
      </q-card-section>
    </q-card>
  </q-page>

</template>

<script setup lang="ts">
import { useQuasar, Notify } from 'quasar'
import type { QTableColumn } from 'quasar'
import { useTeamsStore } from '@/stores/teams'
import { Models } from 'appwrite'
import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useItemsStore } from '@/stores/items'
import { useStorageStore } from '@/stores/storage'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const teamsStore = useTeamsStore()
const accountStore = useAccountStore()
const itemsStore = useItemsStore()
const storageStore = useStorageStore()
const router = useRouter()

// Table config and UI state
const membersFilter = ref('')
const columns: QTableColumn<Models.Membership>[] = [
  { name: 'name', label: 'Name', field: 'userName', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'userEmail', align: 'left', sortable: true },
  { name: 'roles', label: 'Roles', field: 'roles', align: 'left' },
  { name: 'status', label: 'Status', field: 'confirm', align: 'left', sortable: true },
  { name: 'actions', label: 'Actions', field: '$id', align: 'left' },
]

function showInviteMemberDialog() {
  $q.dialog({
    title: 'Invite Member',
    message: 'Enter an email address for the new member.',
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
    title: 'Rename project',
    message: 'Enter a new name for the project.',
    prompt: {
      model: teamsStore.currentTeam?.name || '',
      type: 'text',
      isValid: (v) => !!(v && v.length > 0),
    },
    ok: 'Rename',
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

function confirmDeleteProject() {
  const teamId = teamsStore.currentTeam?.$id
  if (!teamId) return

  $q.dialog({
    title: 'Delete project',
    message:
      'This will permanently delete the project and all its items. This action cannot be undone. Type DELETE to confirm.',
    prompt: {
      model: '',
      type: 'text',
      isValid: (v) => v === 'DELETE',
    },
    ok: 'Delete',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(async () => {
    try {
      // Load all items for this project and delete them one by one
      await itemsStore.getItems(teamId)
      const items = Object.values(itemsStore.itemsIndex) as (any)[]
      for (const item of items) {
        if (item.hasOwnProperty('image')) {
          storageStore.removeFile(item.image)
        }
        if (item.hasOwnProperty('logoImage')) {
          storageStore.removeFile(item.logoImage)
        }
        await itemsStore.removeItem(item.$id)
      }
      // Delete the team; Appwrite deletes memberships with the team
      await teamsStore.deleteTeam(teamId)
      Notify.create({ type: 'positive', message: 'Project deleted' })
      router.push({ name: 'home' })
    } catch {
      Notify.create({ type: 'negative', message: 'Failed to delete project' })
    }
  })
}
</script>
