<script lang="ts">
  import TileCard from './TileCard.svelte'
  import type { TileBatch } from './types'
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

  const BATCH_FILES = [
    'tile-batch1.txt',
    'tile-batch2.txt',
    'tile-batch3.txt'
  ]

  let selectedFile = $state('')
  let batch = $state<TileBatch | null>(null)
  let baseURL = $state('https://haist.one/tile/')
  let showQRCodes = $state(false)
  let currentTab = $state('design')
  let designStep = $state('basics')
  let design = $state(structuredClone(defaultQRDesign))

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
      <Tabs.List class="grid w-full grid-cols-2">
        <Tabs.Trigger value="design">Design</Tabs.Trigger>
        <Tabs.Trigger value="export">Export</Tabs.Trigger>
      </Tabs.List>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div class="lg:col-span-2 space-y-6">
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
              bind:batch
              bind:selectedFile
              bind:baseURL
              options={design}
              batchFiles={BATCH_FILES}
              onGenerateQRCodes={handleGenerateQRCodes}
            />
          </Tabs.Content>
        </div>

        <div class="lg:col-span-1">
          <PreviewPanel batch={batch} options={design} baseURL={baseURL} />
        </div>
      </div>
    </Tabs.Root>

    {#if batch && showQRCodes}
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Generated QR Codes</h2>
          <span class="text-sm text-muted-foreground">{batch.totalTiles} tiles</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {#each batch.tiles as tile}
            <TileCard
              {tile}
              config={{
                batchId: batch.batchId,
                baseURL,
                totalTiles: batch.totalTiles,
                design
              }}
            />
          {/each}
        </div>
      </div>
    {/if}
  </div>
</main>
