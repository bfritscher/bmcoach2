<template>
  <q-page class="row items-center justify-evenly">
    <div class="col col-md-4">
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">Projects</div>
        </q-card-section>
        <q-card-section>
          <q-list separator>
            <q-item>
              <q-item-section>
                <q-btn
                  label="Create new Project"
                  unelevated
                  color="deep-purple-7"
                  @click="showCreateProjectDialog()"
                />
              </q-item-section>
            </q-item>
            <q-item
              v-for="team in teamsStore.teams"
              :key="team.$id"
              :to="{
                name: 'team',
                params: { teamId: team.$id },
              }"
            >
              <q-item-section>
                {{ team.name }}
              </q-item-section>
              <q-item-section side top>
                <q-badge color="grey-7" :label="`${team.total} members`" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { useTeamsStore } from '@/stores/teams'
import { useRouter } from 'vue-router'

const teamsStore = useTeamsStore()
const $q = useQuasar()
const router = useRouter()

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
  }).onOk((name) => {
    teamsStore.createTeam(name)
    /*
    router.push({
      name: 'StrategyCanvas',
      params: { id: chartStore.chart.$id },
    });
    */
  })
}
</script>
