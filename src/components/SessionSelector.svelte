<script lang="ts">
  import { getAllSessions, updateSessionName, deleteSession, getSessionSize, downloadSession, uploadSession } from '../lib/sessionStorage'
  import type { Session } from '../lib/sessionStorage'
  import { _ } from '../lib/i18n'

  interface Props {
    currentSessionId: string | null
    onSessionChange: (sessionId: string) => void
    onSessionCreated: () => void
  }

  let { currentSessionId, onSessionChange, onSessionCreated }: Props = $props()
  let isOpen = $state(false)
  let sessions: Session[] = $state([])
  let editingSessionId: string | null = $state(null)
  let editingName: string = $state('')
  let fileInput: HTMLInputElement | undefined = $state()

  function loadSessions() {
    sessions = getAllSessions()
  }

  function getCurrentSessionName() {
    return sessions.find(s => s.id === currentSessionId)?.name || $_('sessionSelector.unknown')
  }

  function selectSession(sessionId: string) {
    if (sessionId !== currentSessionId) {
      onSessionChange(sessionId)
      loadSessions()
    }
    isOpen = false
  }

  function startEditing(session: Session) {
    editingSessionId = session.id
    editingName = session.name
  }

  function saveEditing() {
    if (editingSessionId) {
      updateSessionName(editingSessionId, editingName)
      loadSessions()
      editingSessionId = null
    }
  }

  function cancelEditing() {
    editingSessionId = null
  }

  function handleDeleteSession(sessionId: string) {
    if (confirm($_('sessionSelector.deleteConfirm'))) {
      deleteSession(sessionId)
      loadSessions()
      if (sessionId === currentSessionId) {
        onSessionChange(sessions[0]?.id || '')
      }
    }
  }

  function toggleDropdown() {
    if (isOpen) {
      isOpen = false
    } else {
      loadSessions()
      isOpen = true
    }
  }

  function formatSize(sizeInMB: number): string {
    if (sizeInMB < 0.001) {
      return '< 1 KB'
    } else if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(1)} KB`
    } else {
      return `${sizeInMB.toFixed(2)} MB`
    }
  }

  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      return
    }

    const sessionId = await uploadSession(file)
    if (sessionId) {
      onSessionChange(sessionId)
      loadSessions()
      isOpen = false
    } else {
      alert($_('sessionSelector.failedLoad'))
    }

    input.value = ''
  }

  function openFileDialog() {
    fileInput?.click()
  }
</script>

<div class="relative">
  <button
    onclick={toggleDropdown}
    class="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition flex items-center gap-2"
  >
    <span class="truncate max-w-xs">{getCurrentSessionName()}</span>
    <svg
      class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  </button>

  {#if isOpen}
    <div class="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded shadow-lg z-50">
      <div class="p-3 border-b border-gray-200 space-y-2">
        <button
          onclick={() => {
            onSessionCreated()
            loadSessions()
            isOpen = false
          }}
          class="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {$_('sessionSelector.newSession')}
        </button>
        <button
          onclick={openFileDialog}
          class="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          {$_('sessionSelector.loadSession')}
        </button>
        <input
          bind:this={fileInput}
          type="file"
          accept=".json"
          onchange={handleFileUpload}
          class="hidden"
        />
      </div>

      <div class="max-h-96 overflow-y-auto">
        {#each sessions as session (session.id)}
          <div class="border-b border-gray-100 last:border-b-0">
            {#if editingSessionId === session.id}
              <div class="p-3 space-y-2">
                <input
                  type="text"
                  bind:value={editingName}
                  class="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  autofocus
                />
                <div class="flex gap-2">
                  <button
                    onclick={saveEditing}
                    class="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    {$_('sessionSelector.save')}
                  </button>
                  <button
                    onclick={cancelEditing}
                    class="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                  >
                    {$_('sessionSelector.cancel')}
                  </button>
                </div>
              </div>
            {:else}
              <div
                class="p-3 hover:bg-gray-50 cursor-pointer transition flex justify-between items-center {currentSessionId ===
                session.id
                  ? 'bg-blue-50'
                  : ''}"
              >
                <div class="flex-1 min-w-0" onclick={() => selectSession(session.id)}>
                  <p class="text-sm font-medium truncate">{session.name}</p>
                  <p class="text-xs text-gray-500">
                    {new Date(session.updatedAt).toLocaleDateString()} · {formatSize(getSessionSize(session.id))}
                  </p>
                </div>
                <div class="flex gap-1 ml-2 flex-shrink-0">
                  <button
                    onclick={() => downloadSession(session.id)}
                    class="p-1 text-gray-600 hover:bg-blue-100 hover:text-blue-600 rounded transition"
                    title={$_('sessionSelector.download')}
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onclick={() => startEditing(session)}
                    class="p-1 text-gray-600 hover:bg-gray-200 rounded transition"
                    title={$_('sessionSelector.rename')}
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onclick={() => handleDeleteSession(session.id)}
                    class="p-1 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded transition"
                    title={$_('sessionSelector.delete')}
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
