<script lang="ts">
  import TileCard from './TileCard.svelte'
  import type { TileBatch } from './types'
  import { parseTileBatch } from './parser'
  import { downloadAllQRs, downloadCSV, generateQRDataURL, getTileURL, getTileLabel, downloadPrintPDF } from './utils'
  import { Button } from '$lib/components/ui/button'
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Slider } from '$lib/components/ui/slider'
  import { Checkbox } from '$lib/components/ui/checkbox'

  const BATCH_FILES = [
    'tile-batch1.txt',
    'tile-batch2.txt',
    'tile-batch3.txt'
  ]

  let selectedFile = $state('')
  let batch = $state<TileBatch | null>(null)
  let loading = $state(false)
  let exporting = $state(false)
  let baseURL = $state('https://haist.one/tile/')
  let showQRCodes = $state(false)
  let errorCorrectionLevel = $state<'L' | 'M' | 'Q' | 'H'>('M')
  let logoFile = $state<File | null>(null)
  let logoDataURL = $state<string>('')
  let selectedLogoPath = $state<string>('')
  let logoSize = $state([25])
  let logoEnabled = $state(false)
  let previewQR = $state<string>('')
  let previewLoading = $state(false)
  let textSize = $state([16])
  let textMargin = $state([20])
  let showTileLabel = $state(true)
  let textPosition = $state<'top' | 'bottom'>('bottom')
  let qrSize = $state([300])
  let qrMargin = $state([4])
  let qrBorderWidth = $state([0])
  let qrBorderColor = $state('#000000')
  let qrBackgroundColor = $state('#FFFFFF')
  let qrForegroundColor = $state('#000000')

  const PROJECT_LOGOS = [
    { path: '/logo.png', name: 'Logo' },
    { path: '/inverted_logo.png', name: 'Inverted Logo' }
  ]

  async function loadBatch(filename: string) {
    loading = true
    const response = await fetch(`/kirby-data/${filename}`)
    const content = await response.text()
    batch = parseTileBatch(content)
    loading = false
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLSelectElement
    selectedFile = target.value
    showQRCodes = false
    if (selectedFile) {
      loadBatch(selectedFile)
    } else {
      batch = null
    }
  }

  function handleGenerateQRCodes() {
    showQRCodes = true
  }

  async function handleLogoSelect(event: Event) {
    const target = event.target as HTMLSelectElement
    selectedLogoPath = target.value

    if (selectedLogoPath === 'custom') {
      logoDataURL = ''
      return
    }

    if (selectedLogoPath) {
      const response = await fetch(selectedLogoPath)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onload = (e) => {
        logoDataURL = e.target?.result as string
      }
      reader.readAsDataURL(blob)
    } else {
      logoDataURL = ''
    }
  }

  function handleLogoUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      logoFile = file
      const reader = new FileReader()
      reader.onload = (e) => {
        logoDataURL = e.target?.result as string
        selectedLogoPath = 'custom'
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleExportZIP() {
    if (!batch) return
    exporting = true
    await downloadAllQRs(batch, baseURL, errorCorrectionLevel, logoEnabled ? logoDataURL : '', logoSize[0], textSize[0], textMargin[0], showTileLabel, qrSize[0], qrMargin[0])
    exporting = false
  }

  async function handleExportPDF(pageSize: 'A4' | 'A3') {
    if (!batch) return
    exporting = true
    await downloadPrintPDF(batch, baseURL, errorCorrectionLevel, logoEnabled ? logoDataURL : '', logoSize[0], textSize[0], textMargin[0], showTileLabel, qrSize[0], qrMargin[0], pageSize)
    exporting = false
  }

  function handleExportCSV() {
    if (!batch) return
    downloadCSV(batch, baseURL)
  }

  async function updatePreview() {
    if (!batch) return
    previewLoading = true
    const firstTile = batch.tiles[0]
    const url = getTileURL(firstTile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, firstTile.tile_number, batch.totalTiles)
    const dataUrl = await generateQRDataURL(url, {
      tileLabel,
      errorCorrectionLevel,
      logoDataURL: logoEnabled ? logoDataURL : '',
      logoSize: logoSize[0],
      textSize: textSize[0],
      textMargin: textMargin[0],
      showTileLabel,
      qrSize: qrSize[0],
      qrMargin: qrMargin[0]
    })
    previewQR = dataUrl
    previewLoading = false
  }

  $effect(() => {
    if (batch) {
      updatePreview()
    }
  })
</script>

<main class="container mx-auto p-4 md:p-8 max-w-7xl">
  <div class="space-y-8">
    <div class="text-center space-y-2">
      <h1 class="text-4xl font-bold tracking-tight">Haist QR Code Generator</h1>
      <p class="text-muted-foreground text-lg">Generate and download QR codes for tile batches</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <h2 class="text-2xl font-semibold">Batch Selection</h2>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="batch-file">Select Batch File</Label>
              <select
                id="batch-file"
                value={selectedFile}
                onchange={handleFileSelect}
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Choose a batch --</option>
                {#each BATCH_FILES as file}
                  <option value={file}>{file}</option>
                {/each}
              </select>
            </div>

            <div class="space-y-2">
              <Label for="base-url">Base URL</Label>
              <Input
                id="base-url"
                type="text"
                bind:value={baseURL}
                placeholder="https://haist.ai/t/"
              />
              <p class="text-sm text-muted-foreground font-mono">
                QR codes will link to: {baseURL}[secure-id]
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 class="text-2xl font-semibold">QR Code Settings</h2>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="space-y-2">
              <Label for="qr-size">QR Code Size: {qrSize[0]}px</Label>
              <Slider id="qr-size" bind:value={qrSize} min={150} max={800} step={10} />
              <p class="text-xs text-muted-foreground">150px (small) - 800px (large)</p>
            </div>

            <div class="space-y-2">
              <Label for="qr-margin">QR Quiet Zone: {qrMargin[0]} modules</Label>
              <Slider id="qr-margin" bind:value={qrMargin} min={0} max={10} step={1} />
              <p class="text-xs text-muted-foreground">0 (none) - 10 (large border)</p>
            </div>

            <div class="space-y-2">
              <Label for="error-correction">Error Correction Level</Label>
              <select
                id="error-correction"
                bind:value={errorCorrectionLevel}
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <Label for="logo-enabled" class="text-base font-semibold">Logo Overlay</Label>
                <Checkbox id="logo-enabled" bind:checked={logoEnabled} />
              </div>

              {#if logoEnabled}
                <div class="space-y-4 pl-4 border-l-2 border-border">
                  <div class="space-y-2">
                    <Label for="logo-select">Select Logo</Label>
                    <select
                      id="logo-select"
                      bind:value={selectedLogoPath}
                      onchange={handleLogoSelect}
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">No Logo</option>
                      {#each PROJECT_LOGOS as logo}
                        <option value={logo.path}>{logo.name}</option>
                      {/each}
                      <option value="custom">Custom Upload...</option>
                    </select>
                  </div>

                  {#if selectedLogoPath === 'custom'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onchange={handleLogoUpload}
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  {/if}

                  {#if logoDataURL}
                    <p class="text-sm text-green-600 font-medium">✓ Logo loaded</p>

                    <div class="space-y-2">
                      <Label for="logo-size">Logo Size: {logoSize[0]}%</Label>
                      <Slider id="logo-size" bind:value={logoSize} min={10} max={40} step={1} />
                      <p class="text-xs text-muted-foreground">10% (small) - 40% (large)</p>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <div class="border-t pt-4 space-y-4">
              <h3 class="text-base font-semibold">QR Code Colors</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="qr-fg-color">Foreground</Label>
                  <input
                    id="qr-fg-color"
                    type="color"
                    bind:value={qrForegroundColor}
                    class="h-10 w-full rounded-md border border-input cursor-pointer"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="qr-bg-color">Background</Label>
                  <input
                    id="qr-bg-color"
                    type="color"
                    bind:value={qrBackgroundColor}
                    class="h-10 w-full rounded-md border border-input cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div class="border-t pt-4 space-y-2">
              <Label for="qr-border">Border Width: {qrBorderWidth[0]}px</Label>
              <Slider id="qr-border" bind:value={qrBorderWidth} min={0} max={20} step={1} />
              <p class="text-xs text-muted-foreground">Add a border around the QR code</p>
              {#if qrBorderWidth[0] > 0}
                <div class="space-y-2">
                  <Label for="qr-border-color">Border Color</Label>
                  <input
                    id="qr-border-color"
                    type="color"
                    bind:value={qrBorderColor}
                    class="h-10 w-full rounded-md border border-input cursor-pointer"
                  />
                </div>
              {/if}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 class="text-2xl font-semibold">Text Settings</h2>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="flex items-center justify-between">
              <Label for="show-label" class="text-base font-semibold">Tile Label</Label>
              <Checkbox id="show-label" bind:checked={showTileLabel} />
            </div>

            {#if showTileLabel}
              <div class="space-y-4 pl-4 border-l-2 border-border">
                <div class="space-y-2">
                  <Label for="text-position">Label Position</Label>
                  <select
                    id="text-position"
                    bind:value={textPosition}
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="top">Above QR Code</option>
                    <option value="bottom">Below QR Code</option>
                  </select>
                </div>

                <div class="space-y-2">
                  <Label for="text-size">Text Size: {textSize[0]}px</Label>
                  <Slider id="text-size" bind:value={textSize} min={8} max={32} step={1} />
                  <p class="text-xs text-muted-foreground">8px (tiny) - 32px (large)</p>
                </div>

                <div class="space-y-2">
                  <Label for="text-margin">Text Spacing: {textMargin[0]}%</Label>
                  <Slider id="text-margin" bind:value={textMargin} min={0} max={40} step={1} />
                  <p class="text-xs text-muted-foreground">Space between text and QR code</p>
                </div>
              </div>
            {/if}
          </CardContent>
        </Card>

        {#if batch}
          <Card>
            <CardHeader>
              <h2 class="text-2xl font-semibold">{batch.title}</h2>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-muted-foreground">Batch ID</p>
                  <p class="text-lg font-semibold">{batch.batchId}</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground">Total Tiles</p>
                  <p class="text-lg font-semibold">{batch.totalTiles}</p>
                </div>
              </div>

              {#if !showQRCodes}
                <Button class="w-full" onclick={handleGenerateQRCodes}>
                  Generate QR Codes
                </Button>
              {:else}
                <div class="space-y-2">
                  <Button class="w-full" onclick={handleExportZIP} disabled={exporting}>
                    {exporting ? 'Exporting...' : 'Download All QR Codes (ZIP)'}
                  </Button>
                  <div class="grid grid-cols-2 gap-2">
                    <Button variant="outline" onclick={() => handleExportPDF('A4')} disabled={exporting}>
                      Print Layout (A4)
                    </Button>
                    <Button variant="outline" onclick={() => handleExportPDF('A3')} disabled={exporting}>
                      Print Layout (A3)
                    </Button>
                  </div>
                  <Button variant="secondary" class="w-full" onclick={handleExportCSV}>
                    Export CSV
                  </Button>
                </div>
              {/if}
            </CardContent>
          </Card>
        {/if}
      </div>

      <div class="lg:col-span-1">
        <Card class="sticky top-4">
          <CardHeader>
            <h3 class="text-xl font-semibold">Live Preview</h3>
          </CardHeader>
          <CardContent>
            {#if batch}
              <div class="space-y-4">
                {#if previewLoading}
                  <div class="flex items-center justify-center py-12">
                    <p class="text-muted-foreground">Generating preview...</p>
                  </div>
                {:else if previewQR}
                  <div class="flex flex-col items-center space-y-4">
                    <img src={previewQR} alt="Preview QR Code" class="max-w-full rounded-lg border-2 border-border" />
                    <p class="text-sm text-muted-foreground text-center">
                      Preview of tile 001/{batch.totalTiles}
                    </p>
                  </div>
                {/if}
              </div>
            {:else}
              <div class="flex items-center justify-center py-12">
                <p class="text-muted-foreground text-center">Select a batch file to see preview</p>
              </div>
            {/if}
          </CardContent>
        </Card>
      </div>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <p class="text-lg text-muted-foreground">Loading batch file...</p>
      </div>
    {:else if batch && showQRCodes}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each batch.tiles as tile}
          <TileCard
            {tile}
            batchId={batch.batchId}
            {baseURL}
            totalTiles={batch.totalTiles}
            {errorCorrectionLevel}
            logoDataURL={logoEnabled ? logoDataURL : ''}
            logoSize={logoSize[0]}
            textSize={textSize[0]}
            textMargin={textMargin[0]}
            {showTileLabel}
            qrSize={qrSize[0]}
            qrMargin={qrMargin[0]}
          />
        {/each}
      </div>
    {/if}
  </div>
</main>
