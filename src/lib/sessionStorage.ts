import type { CSVData } from '../types'
import { defaultQRDesign } from './config'

export interface SessionState {
  currentTab: string
  designStep: string
  design: typeof defaultQRDesign
  csvData: CSVData | null
  csvDataHash?: string
  urlPattern: string
  labelPattern: string
  selectedVariables: string[]
  mode: 'single' | 'batch'
  labelEnabled: boolean
}

export interface Session {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  state: SessionState
}

export interface StorageData {
  sessions: Record<string, Session>
  currentSessionId: string | null
}

const STORAGE_KEY = 'sessions'

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getDefaultState(): SessionState {
  return {
    currentTab: 'input',
    designStep: 'basics',
    design: structuredClone(defaultQRDesign),
    csvData: null,
    urlPattern: 'https://example.com/',
    labelPattern: '',
    selectedVariables: [],
    mode: 'single',
    labelEnabled: false
  }
}

function getStorageData(): StorageData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return {
        sessions: {},
        currentSessionId: null
      }
    }
    return JSON.parse(saved)
  } catch (error) {
    console.error('Failed to load storage data:', error)
    return {
      sessions: {},
      currentSessionId: null
    }
  }
}

function saveStorageData(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

function getSessionSizeInMB(session: Session): number {
  const sizeInBytes = new Blob([JSON.stringify(session)]).size
  return sizeInBytes / (1024 * 1024)
}

export function createSession(name: string = 'Untitled Session'): string {
  const data = getStorageData()
  const sessionId = generateSessionId()

  const newSession: Session = {
    id: sessionId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    state: getDefaultState()
  }

  data.sessions[sessionId] = newSession
  data.currentSessionId = sessionId

  saveStorageData(data)
  return sessionId
}

function migrateSessionState(state: any): SessionState {
  // Migrate from old margin property to new padding property
  if (state.design && state.design.qr) {
    if ('margin' in state.design.qr && !('padding' in state.design.qr)) {
      state.design.qr.padding = state.design.qr.margin
      delete state.design.qr.margin
    }
    // Ensure padding exists even if not present at all
    if (!state.design.qr.padding) {
      state.design.qr.padding = {
        top: 16,
        right: 16,
        bottom: 16,
        left: 16
      }
    }
  }
  return state as SessionState
}

export function loadSession(sessionId: string): SessionState | null {
  const data = getStorageData()
  const session = data.sessions[sessionId]

  if (!session) {
    return null
  }

  if (data.currentSessionId !== sessionId) {
    data.currentSessionId = sessionId
    saveStorageData(data)
  }

  // Migrate old session data
  const migratedState = migrateSessionState(session.state)

  // Save migrated state back if it changed
  if (JSON.stringify(migratedState) !== JSON.stringify(session.state)) {
    session.state = migratedState
    saveStorageData(data)
  }

  return migratedState
}

export function saveSession(sessionId: string, state: SessionState): void {
  const data = getStorageData()
  const session = data.sessions[sessionId]

  if (!session) return

  const newHash = state.csvData ? hashString(JSON.stringify(state.csvData)) : undefined
  const oldHash = session.state.csvDataHash

  if (newHash !== oldHash) {
    session.state = state
    session.state.csvDataHash = newHash
  } else {
    const { csvData, ...stateWithoutCSV } = state
    session.state = { ...stateWithoutCSV, csvData: session.state.csvData, csvDataHash: oldHash }
  }

  session.updatedAt = Date.now()
  saveStorageData(data)
}

export function getCurrentSessionId(): string | null {
  const data = getStorageData()
  return data.currentSessionId
}

export function getAllSessions(): Session[] {
  const data = getStorageData()
  return Object.values(data.sessions).sort(
    (a, b) => b.updatedAt - a.updatedAt
  )
}

export function deleteSession(sessionId: string): void {
  const data = getStorageData()

  delete data.sessions[sessionId]

  if (data.currentSessionId === sessionId) {
    const remaining = Object.keys(data.sessions)
    data.currentSessionId = remaining.length > 0 ? remaining[0] : null
  }

  saveStorageData(data)
}

export function updateSessionName(
  sessionId: string,
  name: string
): void {
  const data = getStorageData()
  const session = data.sessions[sessionId]

  if (!session) {
    return
  }

  session.name = name
  session.updatedAt = Date.now()

  saveStorageData(data)
}

export function getSessionSize(sessionId: string): number {
  const data = getStorageData()
  const session = data.sessions[sessionId]

  if (!session) {
    return 0
  }

  return getSessionSizeInMB(session)
}

export function downloadSession(sessionId: string): void {
  const data = getStorageData()
  const session = data.sessions[sessionId]

  if (!session) {
    return
  }

  const fileName = `${session.name.replace(/[^a-zA-Z0-9-_]/g, '_')}_${new Date(session.createdAt).toISOString().split('T')[0]}.json`
  const jsonString = JSON.stringify(session, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function uploadSession(file: File): Promise<string | null> {
  try {
    const text = await file.text()
    const session = JSON.parse(text) as Session

    if (!session.id || !session.name || !session.state) {
      throw new Error('Invalid session file format')
    }

    const data = getStorageData()
    const newSessionId = generateSessionId()
    const importedSession: Session = {
      ...session,
      id: newSessionId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    data.sessions[newSessionId] = importedSession
    data.currentSessionId = newSessionId
    saveStorageData(data)

    return newSessionId
  } catch (error) {
    console.error('Failed to load session file:', error)
    return null
  }
}

export function initializeFirstSession(): string {
  const data = getStorageData()

  // Migrate old state if it exists
  const oldStorageKey = 'qr-generator-state'
  const oldState = localStorage.getItem(oldStorageKey)

  if (Object.keys(data.sessions).length === 0) {
    const sessionId = generateSessionId()
    const state = getDefaultState()

    if (oldState) {
      try {
        const parsed = JSON.parse(oldState)
        Object.assign(state, parsed)
        localStorage.removeItem(oldStorageKey)
      } catch (error) {
        console.error('Failed to migrate old state:', error)
      }
    }

    const newSession: Session = {
      id: sessionId,
      name: 'Default Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      state
    }

    data.sessions[sessionId] = newSession
    data.currentSessionId = sessionId

    saveStorageData(data)
    return sessionId
  }

  // Return current session or first available
  if (data.currentSessionId && data.sessions[data.currentSessionId]) {
    return data.currentSessionId
  }

  const firstSessionId = Object.keys(data.sessions)[0]
  if (firstSessionId) {
    data.currentSessionId = firstSessionId
    saveStorageData(data)
    return firstSessionId
  }

  // Fallback: create new session
  return createSession()
}
