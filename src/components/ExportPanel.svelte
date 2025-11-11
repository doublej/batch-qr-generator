<script lang="ts">
  import type { TileBatch } from '../types'
  import type { QRDesignOptions } from '$lib/config'
  import { downloadAllQRs, downloadPrintPDF, downloadCSV } from '$lib/export-handlers'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Separator } from '$lib/components/ui/separator'
  import { parseTileBatch } from '../parser'

  let {
    batch = $bindable(),
    selectedFile = $bindable(),
    baseURL = $bindable(),
    options,
    batchFiles,
    onGenerateQRCodes
  }: {
    batch: TileBatch | null
    selectedFile: string
    baseURL: string
    options: QRDesignOptions
    batchFiles: string[]
    onGenerateQRCodes: () => void
  } = $props()

  let exporting = $state(false)
  let loading = $state(false)
  let showQRCodes = $state(false)

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
    onGenerateQRCodes()
  }

  async function handleExportZIP(format: 'png' | 'svg') {
    if (!batch) return
    exporting = true
    await downloadAllQRs(batch, baseURL, options, format)
    exporting = false
  }

  async function handleExportPDF(pageSize: 'A4' | 'A3') {
    if (!batch) return
    exporting = true
    await downloadPrintPDF(batch, baseURL, options, pageSize)
    exporting = false
  }

  function handleExportCSV() {
    if (!batch) return
    downloadCSV(batch)
  }
</script>

<Card>
  <CardContent class="pt-6 space-y-4">
    <div class="space-y-2">
      <Label for="batch-file">Select Batch</Label>
      <select
        id="batch-file"
        value={selectedFile}
        onchange={handleFileSelect}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {#each batchFiles as file}
          <option value={file}>{file}</option>
        {/each}
      </select>
    </div>

    {#if batch}
      <Separator />
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="text-muted-foreground">Batch ID</p>
          <p class="font-semibold">{batch.batchId}</p>
        </div>
        <div>
          <p class="text-muted-foreground">Total Tiles</p>
          <p class="font-semibold">{batch.totalTiles}</p>
        </div>
      </div>
    {/if}

    <Separator />

    <div class="space-y-2">
      <Label for="base-url">Base URL</Label>
      <Input
        id="base-url"
        type="text"
        bind:value={baseURL}
        placeholder="https://haist.one/tile/"
      />
      <p class="text-xs text-muted-foreground font-mono">
        {baseURL}[secure-id]
      </p>
    </div>

    {#if batch}
      <Separator />

      {#if !showQRCodes}
        <Button class="w-full" size="lg" onclick={handleGenerateQRCodes}>
          Generate QR Codes
        </Button>
      {:else}
        <div class="space-y-2">
          <div class="grid grid-cols-2 gap-2">
            <Button onclick={() => handleExportZIP('png')} disabled={exporting}>
              {exporting ? 'Exporting...' : 'PNG (ZIP)'}
            </Button>
            <Button onclick={() => handleExportZIP('svg')} disabled={exporting}>
              {exporting ? 'Exporting...' : 'SVG (ZIP)'}
            </Button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" onclick={() => handleExportPDF('A4')} disabled={exporting}>
              PDF (A4)
            </Button>
            <Button variant="outline" onclick={() => handleExportPDF('A3')} disabled={exporting}>
              PDF (A3)
            </Button>
          </div>
          <Button variant="secondary" class="w-full" onclick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
