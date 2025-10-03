import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AppwriteException, ID, Models, OAuthProvider } from 'appwrite'
import { accountClient } from '@/api/appwrite'
import { useTeamsStore } from '@/stores/teams'
import { Notify } from 'quasar'
import { useRouter } from 'vue-router'
const baseUrl = import.meta.env.VITE_APP_URL

export const useAccountStore = defineStore('account', () => {
  const teamsStore = useTeamsStore()

  const account = ref<Models.User<Models.Preferences>>()
  const session = ref<Models.Session>()

  async function fetchAccount() {
    try {
      session.value = await accountClient.getSession('current')
      account.value = await accountClient.get()
      teamsStore.getTeams()
      return account.value
    } catch (e) {
      console.error('Error getting Account', e)
    }
    return
  }
  fetchAccount()

  const login = async (email: string, password: string) => {
    await accountClient.createEmailPasswordSession({ email, password })
    fetchAccount()
  }

  const signup = async (email: string, password: string, name: string) => {
    await accountClient.create({ userId: ID.unique(), email, password, name })
    await login(email, password)
  }

  function loginOAuth2(provider: string) {
    return accountClient.createOAuth2Session({
      provider: provider as OAuthProvider,
      success: `${baseUrl}/#/`,
      failure: `${baseUrl}/#/login`,
    })
  }

  async function resetPassword(email: string) {
    const url = `${baseUrl}/#/resetpasswordconfirm`
    await accountClient.createRecovery(email, url)
  }

  async function confirmPassword(
    userId: string,
    secret: string,
    password: string,
    password2: string,
  ) {
    if (password !== password2) {
      throw new Error('Passwords do not match')
    }
    await accountClient.updateRecovery({ userId, secret, password })
  }

  async function logout() {
    try {
      await accountClient.deleteSession({ sessionId: 'current' })
      account.value = undefined
      session.value = undefined
      const router = useRouter()
      router.push('/login')
    } catch (e) {
      console.error('Error deleting Session', e)
    }
  }

  function sendVerificationEmail() {
    const url = `${baseUrl}/#/account/verifyemail`
    accountClient.createVerification({ url })
  }

  async function logoutAllSessions() {
    await accountClient.deleteSessions()
    account.value = undefined
    session.value = undefined
    const router = useRouter()
    router.push('/')
  }

  async function updateName() {
    const name = account.value?.name
    if (name) {
      try {
        account.value = await accountClient.updateName(name)
        Notify.create({
          type: 'positive',
          message: 'Name updated!',
        })
      } catch (e) {
        Notify.create({
          type: 'negative',
          message: (e as AppwriteException).message,
        })
      }
    }
  }

  async function updatePassword(newpassword: string, oldpassword?: string) {
    try {
      account.value = await accountClient.updatePassword({
        password: newpassword,
        oldPassword: oldpassword,
      })
      Notify.create({
        type: 'positive',
        message: 'Password updated!',
      })
    } catch (e) {
      Notify.create({
        type: 'negative',
        message: (e as AppwriteException).message,
      })
    }
  }

  async function updateEmail(email: string, password: string) {
    try {
      account.value = await accountClient.updateEmail({ email, password })
      sendVerificationEmail()
      Notify.create({
        type: 'positive',
        message: 'Email updated. Please verify your new email address.',
      })
    } catch (e) {
      Notify.create({
        type: 'negative',
        message: (e as AppwriteException).message,
      })
    }
  }

  async function lockAccount() {
    await accountClient.updateStatus()
    logoutAllSessions()
  }

  function verifyEmail(userId: string, secret: string) {
    return accountClient.updateVerification({ userId, secret })
  }

  return {
    account,
    session,
    fetchAccount,
    loginOAuth2,
    login,
    signup,
    resetPassword,
    confirmPassword,
    logout,
    sendVerificationEmail,
    logoutAllSessions,
    updateName,
    updatePassword,
    updateEmail,
    lockAccount,
    verifyEmail,
  }
})
