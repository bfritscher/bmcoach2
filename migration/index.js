import { createReadStream } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { mkdir, writeFile as writeFileFs, readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'

const require = createRequire(import.meta.url)
const { chain } = require('stream-chain')
const { parser } = require('stream-json')
const { pick } = require('stream-json/filters/Pick')
const { streamObject } = require('stream-json/streamers/StreamObject')
const {
  Client,
  Users,
  Teams,
  Databases,
  Storage,
  ID,
  Permission,
  Role,
} = require('node-appwrite')
const { InputFile } = require('node-appwrite/file')

const bucket = (map, key) => map.set(key, (map.get(key) ?? 0) + 1)

const getExtensionFromMime = (mime) => {
  const suffix = mime?.split('/')?.[1]
  return suffix ? suffix.split(';')[0] : 'bin'
}

const parseDataUrl = (dataUrl) => {
  const match = /^data:(.*?);base64,(.+)$/.exec(dataUrl ?? '')
  if (!match) return
  const [, mime, base64] = match
  return { mime, buffer: Buffer.from(base64, 'base64'), ext: getExtensionFromMime(mime) || 'bin' }
}

const queueDataUrlWrite = (writeOperations, dirPromise, filename, dataUrl) => {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) return false
  const { buffer, ext } = parsed
  writeOperations.push(
    dirPromise.then(() =>
      writeFileFs(join(filename.dir, `${filename.id}.${ext}`), buffer)
    )
  )
  return true
}

const deterministicId = (prefix, value) =>
  `${prefix}-${createHash('sha1').update(String(value)).digest('hex').slice(0, 20)}`

const STATE_FILE = resolve(process.cwd(), 'migration-state.json')
const databaseId = process.env.APPWRITE_DATABASE_ID
const itemsCollectionId = process.env.APPWRITE_ITEMS_COLLECTION_ID
const storageBucketId = process.env.APPWRITE_STORAGE_BUCKET

const loadState = async () => {
  try {
    return JSON.parse(await readFile(STATE_FILE, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return { users: {}, projects: {} }
    throw error
  }
}

const saveState = (state) => writeFileFs(STATE_FILE, JSON.stringify(state, null, 2))

const createAppwriteClients = () => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT)
    .setKey(process.env.APPWRITE_API_KEY)

  return {
    client,
    users: new Users(client),
    teams: new Teams(client),
    databases: new Databases(client),
    storage: new Storage(client),
  }
}

const ensureTeamMembership = async ({ clients, teamId, userId, email, roles }) => {
  try {
    const memberships = await clients.teams.listMemberships(teamId)
    if (memberships.memberships?.some((member) => member.userId === userId)) return
  } catch (error) {
    if (error.code !== 404) throw error
  }
  try {
    await clients.teams.createMembership(teamId, roles, email, userId)
  } catch (error) {
    if (error.code !== 409) throw error
  }
}

const ensureProjectState = (state, projectId) =>
  state.projects[projectId] ?? (state.projects[projectId] = { notes: {} })

const ensureUserProvisioned = async ({ userId, payload, state, clients, getEmailForLocalId }) => {
  if (state.users[userId]) return state.users[userId]

  const lookupEmail = await getEmailForLocalId?.(userId)
  const fallbackEmail = `${userId}@import.local`
  if (!lookupEmail && !payload?.email) {
    console.error(`No email found for user ${userId}, reverting to fallback ${fallbackEmail}`)
  }
  const email = lookupEmail ?? payload?.email ?? fallbackEmail
  const name = payload?.name ?? userId

  let existingUserId
  if (email) {
    const result = await clients.users.list([], email)
    existingUserId = result.users?.find((user) => user.email === email)?.$id
  }

  const appwriteUserId = existingUserId ?? ID.unique()
  if (!existingUserId) {
    await clients.users.create(appwriteUserId, email, undefined, ID.unique(), name)
  }

  const defaultTeamId = deterministicId('usrteam', userId)
  try {
    await clients.teams.create(defaultTeamId, `${name}'s Default`.slice(0, 128))
  } catch (error) {
    if (error.code !== 409) throw error
  }
  await ensureTeamMembership({
    clients,
    teamId: defaultTeamId,
    userId: appwriteUserId,
    email,
    roles: ['owner'],
  })

  state.users[userId] = { appwriteUserId, defaultTeamId, email, name }
  await saveState(state)
  return state.users[userId]
}

const ensureProjectDestinationTeam = async ({ projectId, projectName, userRecords, state, clients }) => {
  const projectState = ensureProjectState(state, projectId)

  if (projectState.destinationTeamId) {
    await Promise.all(
      userRecords.map((record) =>
        ensureTeamMembership({
          clients,
          teamId: projectState.destinationTeamId,
          userId: record.appwriteUserId,
          email: record.email,
          roles: ['owner'],
        })
      )
    )
    return projectState.destinationTeamId
  }

  if (userRecords.length === 1) {
    projectState.destinationTeamId = userRecords[0].defaultTeamId
    await saveState(state)
    return projectState.destinationTeamId
  }

  const teamId = deterministicId('team', projectId)
  try {
    await clients.teams.create(teamId, (projectName || `Project ${projectId}`).slice(0, 128))
  } catch (error) {
    if (error.code !== 409) throw error
  }
  await Promise.all(
    userRecords.map((record) =>
      ensureTeamMembership({
        clients,
        teamId,
        userId: record.appwriteUserId,
        roles: ['owner'],
      })
    )
  )

  projectState.destinationTeamId = teamId
  await saveState(state)
  return teamId
}

const teamPermissions = (teamId) => [
  Permission.read(Role.team(teamId)),
  Permission.update(Role.team(teamId, 'owner')),
  Permission.delete(Role.team(teamId, 'owner')),
]

const uploadDataUrlToStorage = async ({ clients, dataUrl, fileId, permissions }) => {
  const parsed = parseDataUrl(dataUrl)
  if (!parsed) return
  const fileName = `${fileId}.${parsed.ext}`
  const file = InputFile.fromBuffer(parsed.buffer, fileName)
  try {
    await clients.storage.createFile(storageBucketId, fileId, file, permissions)
  } catch (error) {
    if (error.code !== 409) throw error
  }
  return fileId
}

const upsertItemDocument = async ({ clients, documentId, type, teamId, data, permissions }) => {
  const payload = { type, project_id: teamId, data: JSON.stringify(data) }
  try {
    await clients.databases.createDocument(databaseId, itemsCollectionId, documentId, payload, permissions)
  } catch (error) {
    if (error.code === 409) {
      await clients.databases.updateDocument(databaseId, itemsCollectionId, documentId, payload)
    } else {
      throw error
    }
  }
}

const importProject = async ({ projectId, project, state, clients, getEmailForLocalId }) => {
  const projectState = ensureProjectState(state, projectId)
  if (projectState.completed) {
    console.error(`Project ${projectId} already imported.`)
    return
  }

  const info = project.info ?? {}
  const users = Object.entries(project.users ?? {})

  if (!users.length) {
    console.error(`Skipping ${projectId} because no users found.`)
    projectState.completed = true
    await saveState(state)
    return
  }

  const userRecords = []
  for (const [userId, payload] of users) {
    const record = await ensureUserProvisioned({ userId, payload, state, clients, getEmailForLocalId })
    userRecords.push(record)
  }

  const destinationTeamId = await ensureProjectDestinationTeam({
    projectId,
    projectName: info.name ?? projectId,
    userRecords,
    state,
    clients,
  })
  const permissions = teamPermissions(destinationTeamId)

  const notes = project.notes ?? {}
  for (const [noteId, notePayload] of Object.entries(notes)) {
    const noteItemId = projectState.notes[noteId] ?? deterministicId('note', `${projectId}-${noteId}`)
    const noteData = { ...notePayload }

    if (notePayload?.image) {
      const storageId = await uploadDataUrlToStorage({
        clients,
        dataUrl: notePayload.image,
        fileId: deterministicId('media', `${noteItemId}-image`),
        permissions,
      })
      if (storageId) noteData.image = storageId
    }

    await upsertItemDocument({
      clients,
      documentId: noteItemId,
      type: 'bmc-note',
      teamId: destinationTeamId,
      data: noteData,
      permissions,
    })

    projectState.notes[noteId] = noteItemId
    await saveState(state)
  }

  const canvasData = {
    title: info.name ?? '',
    logoColor: info.logoColor ?? null,
    notes: Object.values(projectState.notes),
  }

  if (info.logoImage) {
    const logoId = await uploadDataUrlToStorage({
      clients,
      dataUrl: info.logoImage,
      fileId: deterministicId('media', `${projectId}-logo`),
      permissions,
    })
    if (logoId) canvasData.logoImage = logoId
  }

  const canvasId = projectState.canvasId ?? deterministicId('canvas', projectId)
  await upsertItemDocument({
    clients,
    documentId: canvasId,
    type: 'bmc-canvas',
    teamId: destinationTeamId,
    data: canvasData,
    permissions,
  })
  projectState.canvasId = canvasId
  projectState.completed = true
  await saveState(state)

  console.error(`Imported project ${projectId} into team ${destinationTeamId}.`)
}

const createUserEmailLookup = async (usersFilePath) => {
  if (!usersFilePath) return () => undefined
  try {
    const raw = await readFile(usersFilePath, 'utf8')
    const data = JSON.parse(raw)
    const map = new Map()
    for (const entry of data.users ?? []) {
      if (entry.localId && entry.email) map.set(entry.localId, entry.email)
    }
    return (localId) => map.get(localId)
  } catch (error) {
    console.error(`Failed to load users file at ${usersFilePath}: ${error.message}`)
    return () => undefined
  }
}

export async function importProjects(jsonPath, usersFilePath) {
  const state = await loadState()
  const clients = createAppwriteClients()
  const getEmailForLocalId = await createUserEmailLookup(usersFilePath)

  const pipeline = chain([
    createReadStream(jsonPath, { encoding: 'utf8' }),
    parser(),
    pick({ filter: 'app.projects' }),
    streamObject(),
  ])

  try {
    for await (const { key: projectId, value } of pipeline) {
      await importProject({ projectId, project: value, state, clients, getEmailForLocalId })
    }
  } finally {
    pipeline.destroy()
  }
}

export async function analyseLargeJson(path) {
  return new Promise((resolveStats, reject) => {
    const projectNotesBuckets = new Map()
    const projectUsersBuckets = new Map()
    let notesWithImage = 0
    let projectsWithLogoImage = 0
    let processedProjects = 0
    const progressInterval = 1000

    const logosDir = resolve(process.cwd(), 'logos')
    const notesDir = resolve(process.cwd(), 'notes')
    const logosDirPromise = mkdir(logosDir, { recursive: true })
    const notesDirPromise = mkdir(notesDir, { recursive: true })
    const writeOperations = []

    const pipeline = chain([
      createReadStream(path, { encoding: 'utf8' }),
      parser(),
      pick({ filter: 'app.projects' }),
      streamObject()
    ])

    const onData = ({ key: projectId, value }) => {
      const notes = value.notes ?? {}
      const users = value.users ?? {}
      const info = value.info ?? {}

      const projectName = info.name ?? projectId
      if (projectName.includes('GAME') && value.source === 'bmdesigner') {
        console.error(`Skipping ${projectName} | source=${value.source}`)
        return
      }

      const noteCount = Object.keys(notes).length
      const userCount = Object.keys(users).length

      if (noteCount <= 3 || userCount === 0) {
        console.error(`Skipping ${projectName} | notes=${noteCount} users=${userCount}`)
        return
      }

      bucket(projectNotesBuckets, noteCount)
      bucket(projectUsersBuckets, userCount)

      if (info.logoImage) {
        queueDataUrlWrite(writeOperations, logosDirPromise, { dir: logosDir, id: projectId }, info.logoImage)
        projectsWithLogoImage += 1
      }

      for (const [noteId, note] of Object.entries(notes)) {
        if (note?.image) {
          queueDataUrlWrite(writeOperations, notesDirPromise, { dir: notesDir, id: noteId }, note.image)
          notesWithImage += 1
        }
      }

      const labelParts = [projectName]
      if (value.source) labelParts.push(`source=${value.source}`)
      console.error(labelParts.join(' | '))

      processedProjects += 1
      if (processedProjects % progressInterval === 0) {
        console.error(`Processed ${processedProjects} projects...`)
      }
    }

    const onEnd = () => {
      const finish = () => {
        if (processedProjects === 0) {
          console.error('No projects found.')
        } else {
          console.error(`Finished processing ${processedProjects} projects.`)
        }
        resolveStats({
          projectNotesBuckets,
          projectUsersBuckets,
          notesWithImage,
          projectsWithLogoImage
        })
      }

      Promise.all(writeOperations)
        .then(finish)
        .catch(reject)
    }
    const onError = (err) => reject(err)

    pipeline.on('data', onData)
    pipeline.once('end', onEnd)
    pipeline.once('error', onError)
  })
}

const thisFile = fileURLToPath(import.meta.url)
if (process.argv[1] === thisFile || process.argv[1] === thisFile.slice(1)) {
  const args = process.argv.slice(2)
  if (!args.length) {
    console.error('Usage: node index.js <analyse|import> <path-to-json>')
    process.exit(1)
  }

  let mode = 'analyse'
  let file
  let usersFile
  if (['analyse', 'import'].includes(args[0])) {
    mode = args[0]
    file = args[1]
    usersFile = args[2]
  } else {
    file = args[0]
    usersFile = args[1]
  }

  if (!file) {
    console.error('Usage: node index.js <analyse|import> <path-to-json>')
    process.exit(1)
  }

  if (mode === 'import') {
    importProjects(file, usersFile)
      .then(() => {
        console.error('Import complete.')
      })
      .catch((err) => {
        console.error('Failed to import JSON:', err)
        process.exit(1)
      })
  } else {

  analyseLargeJson(file)
    .then((stats) => {
      const toObject = (map) =>
        Object.fromEntries([...map.entries()].sort((a, b) => a[0] - b[0]))

      console.log(JSON.stringify({
        projectNotesBuckets: toObject(stats.projectNotesBuckets),
        projectUsersBuckets: toObject(stats.projectUsersBuckets),
        notesWithImage: stats.notesWithImage,
        projectsWithLogoImage: stats.projectsWithLogoImage
      }, null, 2))
    })
    .catch((err) => {
      console.error('Failed to analyse JSON:', err)
      process.exit(1)
    })
  }
}

