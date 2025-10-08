<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-y-lg">
      <!-- Hero / Header -->
      <q-card flat bordered class="bg-primary text-white">
        <q-card-section class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm">
            <div class="text-h5 text-weight-bold">Your Projects</div>
          </div>
          <div class="col-auto row items-center q-gutter-sm">
            <q-btn
              color="white"
              text-color="primary"
              icon="add"
              label="New Project"
              unelevated
              @click="showCreateProjectDialog()"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Content: loading state -->
      <div v-if="loading" class="row q-col-gutter-lg">
        <div v-for="n in 8" :key="n" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <q-card flat bordered>
            <q-skeleton height="140px" square />
            <q-card-section>
              <q-skeleton type="text" class="text-h6" />
              <q-skeleton type="text" width="60%" />
            </q-card-section>
            <q-card-section class="row items-center justify-between">
              <q-skeleton type="QBadge" width="90px" />
              <q-skeleton type="QBtn" />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Content: empty state -->
      <div v-else-if="filteredTeams.length === 0" class="column items-center q-gutter-sm q-mt-xl">
        <q-icon name="inbox" size="64px" color="grey-6" />
        <div class="text-subtitle1 text-grey-7">No projects found</div>
        <div class="text-caption text-grey-6">Create your first project to get started</div>
        <q-btn
          color="primary"
          icon="add"
          label="Create Project"
          @click="showCreateProjectDialog()"
        />
      </div>

      <!-- Content: projects grid -->
      <div v-else class="row q-col-gutter-lg q-mt-sm">
        <div
          v-for="team in filteredTeams"
          :key="team.$id"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <q-card
            class="cursor-pointer"
            flat
            bordered
            clickable
            v-ripple
            @click="goToTeam(team.$id)"
          >
            <q-card-section class="row no-wrap items-center justify-between q-col-gutter-md">
              <div class="col">
                <div class="text-subtitle1 text-weight-medium ellipsis" :title="team.name">
                  {{ team.name }}
                </div>
                <q-badge color="grey-7" :label="memberLabel(team.total)" />
              </div>
              <q-btn flat round dense icon="chevron_right" @click.stop="goToTeam(team.$id)" />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useTeamsStore } from '@/stores/teams'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const teamsStore = useTeamsStore()
const $q = useQuasar()
const router = useRouter()

const filteredTeams = computed(() =>
  teamsStore.teams
    .slice()
    .sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase())),
)

// UI state
const loading = ref(false)

function memberLabel(total?: number) {
  const n = typeof total === 'number' ? total : 0
  return n === 1 ? '1 member' : `${n} members`
}

function goToTeam(teamId: string) {
  router.push({ name: 'team', params: { teamId } })
}

function showCreateProjectDialog() {
  $q.dialog({
    title: 'New Project',
    message: 'Enter a name for the new project.',
    prompt: {
      model: '',
      type: 'text',
      isValid: (v) => !!(v && v.length > 0),
    },
    ok: 'Create',
    cancel: 'Cancel',
    persistent: true,
  }).onOk(async (name) => {
    loading.value = true
    try {
      await teamsStore.createTeam(name)
    } finally {
      loading.value = false
    }
  })
}

onMounted(async () => {
  teamsStore.getTeams()
})
</script>
