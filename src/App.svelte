<script lang="ts">
  import type { CSVData } from './types'
  import InputPanel from './components/InputPanel.svelte'
  import PatternPanel from './components/PatternPanel.svelte'
  import PreviewPanel from './components/PreviewPanel.svelte'
  import ExportPanel from './components/ExportPanel.svelte'
  import BasicSettings from './components/design/BasicSettings.svelte'
  import ShapeSettings from './components/design/ShapeSettings.svelte'
  import ColorSettings from './components/design/ColorSettings.svelte'
  import LogoSettings from './components/design/LogoSettings.svelte'
  import TextSettings from './components/design/TextSettings.svelte'
  import { Card, CardContent } from '$lib/components/ui/card'
  import * as Tabs from '$lib/components/ui/tabs'
  import { defaultQRDesign } from './lib/config'
  import {
    initializeFirstSession,
    loadSession,
    saveSession,
    createSession
  } from './lib/sessionStorage'
  import SessionSelector from './components/SessionSelector.svelte'

  let initialized = $state(false)
  let showQRCodes = $state(false)
  let currentSessionId = $state<string | null>(null)
  let currentTab = $state('input')
  let designStep = $state('basics')
  let design = $state(structuredClone(defaultQRDesign))
  let csvData = $state<CSVData | null>(null)
  let urlPattern = $state('https://example.com/')
  let labelPattern = $state('')
  let selectedVariables = $state<Set<string>>(new Set())
  let mode = $state<'single' | 'batch'>('single')
  let labelEnabled = $state(false)
  let previewIndex = $state(0)

  function loadState() {
    if (!currentSessionId) return

    const state = loadSession(currentSessionId)
    if (!state) return

    currentTab = state.currentTab
    designStep = state.designStep
    design = state.design

    // Ensure padding exists after loading
    if (!design.qr.padding) {
      design.qr.padding = {
        top: 16,
        right: 16,
        bottom: 16,
        left: 16
      }
    }

    csvData = state.csvData
    urlPattern = state.urlPattern
    labelPattern = state.labelPattern
    selectedVariables = new Set(state.selectedVariables)
    mode = state.mode
    labelEnabled = state.labelEnabled
  }

  function saveState() {
    if (!currentSessionId) return

    saveSession(currentSessionId, {
      currentTab,
      designStep,
      design,
      csvData,
      urlPattern,
      labelPattern,
      selectedVariables: Array.from(selectedVariables),
      mode,
      labelEnabled
    })
  }

  function clearState() {
    currentTab = 'input'
    designStep = 'basics'
    design = structuredClone(defaultQRDesign)
    csvData = null
    urlPattern = 'https://example.com/'
    labelPattern = ''
    selectedVariables = new Set()
    mode = 'single'
    labelEnabled = false
    saveState()
  }

  function createNewSession() {
    const newSessionId = createSession('New Session')
    currentSessionId = newSessionId
    clearState()
  }

  function handleSessionChange(sessionId: string) {
    saveState()
    currentSessionId = sessionId
    loadState()
  }

  function handleSessionCreated() {
    createNewSession()
  }

  function handleGenerateQRCodes() {
    showQRCodes = true
  }

  $effect(() => {
    if (!initialized) {
      currentSessionId = initializeFirstSession()
      loadState()
      initialized = true
      return
    }

    currentTab
    designStep
    design.qr.size
    design.qr.padding?.top
    design.qr.padding?.right
    design.qr.padding?.bottom
    design.qr.padding?.left
    design.qr.errorCorrection
    design.qr.dpi
    design.qr.moduleShape
    design.logo.enabled
    design.logo.dataURL
    design.logo.size
    design.logo.placement
    design.text.enabled
    design.text.size
    design.text.position
    design.text.offsetX
    design.text.offsetY
    design.text.align
    design.text.font
    design.text.weight
    design.text.color
    design.text.rotation
    design.colors.background
    design.colors.foreground
    design.colors.border
    design.colors.borderWidth
    design.colors.eyeColor
    design.colors.dataModuleColor
    design.gradient.enabled
    design.gradient.type
    design.gradient.start
    design.gradient.end
    design.gradient.angle
    csvData
    urlPattern
    labelPattern
    selectedVariables
    mode
    labelEnabled

    saveState()
  })
</script>

<main class="container mx-auto p-4 md:p-8 max-w-7xl">
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div class="text-center space-y-2 flex-1">
        <h1 class="text-3xl font-bold tracking-tight">QR Code Generator</h1>
        <p class="text-muted-foreground">Generate and download QR codes for tile batches</p>
      </div>
      {#if currentSessionId}
        <SessionSelector
          {currentSessionId}
          onSessionChange={handleSessionChange}
          onSessionCreated={handleSessionCreated}
        />
      {/if}
    </div>

    <Tabs.Root bind:value={currentTab}>
      <Tabs.List class="grid w-full grid-cols-4">
        <Tabs.Trigger value="input">Input</Tabs.Trigger>
        <Tabs.Trigger value="pattern">Pattern</Tabs.Trigger>
        <Tabs.Trigger value="design">Design</Tabs.Trigger>
        <Tabs.Trigger value="export">Export</Tabs.Trigger>
      </Tabs.List>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div class="lg:col-span-2 space-y-6">
          <Tabs.Content value="input" class="space-y-4">
            <InputPanel
              bind:csvData
              bind:mode
              onClearState={clearState}
            />
          </Tabs.Content>

          <Tabs.Content value="pattern" class="space-y-4">
            <PatternPanel
              {csvData}
              bind:urlPattern
              bind:labelPattern
              bind:selectedVariables
              {mode}
              bind:labelEnabled
              {previewIndex}
            />
          </Tabs.Content>

          <Tabs.Content value="design" class="space-y-4">
            <Tabs.Root bind:value={designStep}>
              <Tabs.List class="grid w-full grid-cols-5">
                <Tabs.Trigger value="basics">Basics</Tabs.Trigger>
                <Tabs.Trigger value="module">Shape</Tabs.Trigger>
                <Tabs.Trigger value="colors">Colors</Tabs.Trigger>
                <Tabs.Trigger value="logo">Logo</Tabs.Trigger>
                <Tabs.Trigger value="text">Text</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="basics" class="mt-4">
                <Card>
                  <CardContent class="pt-6">
                    <BasicSettings bind:config={design.qr} />
                  </CardContent>
                </Card>
              </Tabs.Content>

              <Tabs.Content value="module" class="mt-4">
                <Card>
                  <CardContent class="pt-6">
                    <ShapeSettings bind:config={design.qr} />
                  </CardContent>
                </Card>
              </Tabs.Content>

              <Tabs.Content value="colors" class="mt-4">
                <Card>
                  <CardContent class="pt-6">
                    <ColorSettings bind:colors={design.colors} bind:gradient={design.gradient} />
                  </CardContent>
                </Card>
              </Tabs.Content>

              <Tabs.Content value="logo" class="mt-4">
                <Card>
                  <CardContent class="pt-6">
                    <LogoSettings bind:config={design.logo} qrSize={design.qr.size} />
                  </CardContent>
                </Card>
              </Tabs.Content>

              <Tabs.Content value="text" class="mt-4">
                <Card>
                  <CardContent class="pt-6">
                    <TextSettings bind:config={design.text} />
                  </CardContent>
                </Card>
              </Tabs.Content>
            </Tabs.Root>
          </Tabs.Content>

          <Tabs.Content value="export" class="space-y-4">
            <ExportPanel
              {csvData}
              {urlPattern}
              {labelPattern}
              {mode}
              {labelEnabled}
              options={design}
            />
          </Tabs.Content>
        </div>

        <div class="lg:col-span-1">
          <PreviewPanel
            {csvData}
            {urlPattern}
            {labelPattern}
            {selectedVariables}
            {mode}
            {labelEnabled}
            options={design}
            onPreviewIndexChange={(index) => {
              previewIndex = index
            }}
          />
        </div>
      </div>
    </Tabs.Root>
  </div>
</main>
