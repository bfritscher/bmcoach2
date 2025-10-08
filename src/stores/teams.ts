import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Models, ID, AppwriteException } from 'appwrite'
import { teams as teamsClient } from '@/api/appwrite'
import { Notify } from 'quasar'
import { useAccountStore } from './account'

const baseUrl = import.meta.env.VITE_APP_URL

export const useTeamsStore = defineStore('teams', () => {
  const accountStore = useAccountStore()

  const teams = ref<Models.Team<Models.Preferences>[]>([])
  const currentTeam = ref<Models.Team<Models.Preferences>>()
  const currentTeamMemberships = ref<Models.Membership[]>([])

  const teamsIndex = computed(() => {
    return teams.value.reduce(
      (acc, team) => {
        acc[team.$id] = team
        return acc
      },
      {} as Record<string, Models.Team<Models.Preferences>>,
    )
  })

  const isCurrentTeamOwner = computed(() => {
    return (
      currentTeamMemberships.value
        .find((m) => m.userId === accountStore.account?.$id)
        ?.roles.includes('owner') || false
    )
  })

  const getTeams = async () => {
    const teamsResponse = await teamsClient.list()
    teams.value = teamsResponse.teams
  }

  const createTeam = async (name: string) => {
    await teamsClient.create({ teamId: ID.unique(), name })
    await getTeams()
  }

  const setCurrentTeamById = async (teamId: string) => {
    currentTeam.value = await teamsClient.get({ teamId })
    currentTeamMemberships.value = (await teamsClient.listMemberships({ teamId })).memberships
  }

  const inviteTeamMember = async (email: string) => {
    const teamId = currentTeam.value?.$id
    if (teamId) {
      const url = `${baseUrl}/#/team/acceptinvitation`
      // TODO other roles than owner?
      try {
        const response = await teamsClient.createMembership({ teamId, roles: ['owner'], url, email })
        currentTeamMemberships.value?.push(response)
      } catch (e) {
        Notify.create({
          type: 'negative',
          message: (e as AppwriteException).message,
        })
      }
    }
  }

  const acceptTeamInvitation = async (
    teamId: string,
    membershipId: string,
    userId: string,
    secret: string,
  ) => {
    return await teamsClient.updateMembershipStatus({ teamId, membershipId, userId, secret })
  }

  const updateTeamName = async (name: string) => {
    const teamId = currentTeam.value?.$id
    if (teamId) {
      try {
        const response = await teamsClient.updateName({ teamId, name })
        currentTeam.value = response
      } catch (e) {
        Notify.create({
          type: 'negative',
          message: (e as AppwriteException).message,
        })
      }
    }
  }

  const removeMembership = async (membership: Models.Membership) => {
    const teamId = currentTeam.value?.$id
    if (teamId) {
      try {
        await teamsClient.deleteMembership({ teamId, membershipId: membership.$id })
        currentTeamMemberships.value = currentTeamMemberships.value?.filter(
          (m) => m.$id !== membership.$id,
        )
      } catch (e) {
        Notify.create({
          type: 'negative',
          message: (e as AppwriteException).message,
        })
      }
    }
  }

  const deleteTeam = async (teamId: string) => {
    try {
      await teamsClient.delete({ teamId })
    } catch (e) {
      Notify.create({
        type: 'negative',
        message: (e as AppwriteException).message,
      })
      throw e
    }
  }

  return {
    teams,
    teamsIndex,
    currentTeam,
    currentTeamMemberships,
    isCurrentTeamOwner,
    getTeams,
    createTeam,
    inviteTeamMember,
    acceptTeamInvitation,
    setCurrentTeamById,
    updateTeamName,
    removeMembership,
    deleteTeam,
  }
})
