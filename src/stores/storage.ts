import { defineStore } from 'pinia'
import { storage } from '@/api/appwrite'
import { v4 as uuid } from 'uuid'
import { Permission, Role } from 'appwrite'
import { useTeamsStore } from './teams'

const APP_STORAGE_BUCKET = 'production'

export const useStorageStore = defineStore('storage', () => {
  const teamsStore = useTeamsStore()
  function uploadFile(fileIdOrFile: string | File, file: File | undefined): string | undefined {
    const teamId = teamsStore.currentTeam?.$id
    if (!teamId) return
    const permissions = [
      Permission.read(Role.team(teamId)),
      Permission.update(Role.team(teamId, 'owner')),
      Permission.delete(Role.team(teamId, 'owner')),
    ]
    let fileId
    if (!file) {
      file = fileIdOrFile as File
      fileId = uuid()
    } else {
      fileId = fileIdOrFile as string
    }
    storage.createFile({ bucketId: APP_STORAGE_BUCKET, fileId, file, permissions })
    return fileId
  }

  function removeFile(fileId: string) {
    storage.deleteFile({ bucketId: APP_STORAGE_BUCKET, fileId })
  }

  function getFileUrl(fileId: string) {
    if (!fileId) return
    return storage.getFilePreview(
      APP_STORAGE_BUCKET,
      fileId
    )
  }

  return {
    uploadFile,
    removeFile,
    getFileUrl,
  }
})
