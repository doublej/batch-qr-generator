<script lang="ts">
  import type { CSVData } from './types'
  import InputPanel from './components/InputPanel.svelte'
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

  let showQRCodes = $state(false)
  let currentTab = $state('input')
  let designStep = $state('basics')
  let design = $state(structuredClone(defaultQRDesign))
  let csvData = $state<CSVData | null>(null)
  let urlPattern = $state('https://haist.one/tile/')
  let labelPattern = $state('')
  let selectedVariables = $state<Set<string>>(new Set())
  let mode = $state<'single' | 'batch'>('single')

  function handleGenerateQRCodes() {
    showQRCodes = true
  }
</script>

<main class="container mx-auto p-4 md:p-8 max-w-7xl">
  <div class="space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-3xl font-bold tracking-tight">Haist QR Code Generator</h1>
      <p class="text-muted-foreground">Generate and download QR codes for tile batches</p>
    </div>

    <Tabs.Root bind:value={currentTab}>
      <Tabs.List class="grid w-full grid-cols-3">
        <Tabs.Trigger value="input">Input</Tabs.Trigger>
        <Tabs.Trigger value="design">Design</Tabs.Trigger>
        <Tabs.Trigger value="export">Export</Tabs.Trigger>
      </Tabs.List>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div class="lg:col-span-2 space-y-6">
          <Tabs.Content value="input" class="space-y-4">
            <InputPanel
              bind:csvData
              bind:urlPattern
              bind:labelPattern
              bind:selectedVariables
              bind:mode
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
            options={design}
          />
        </div>
      </div>
    </Tabs.Root>
  </div>
</main>
