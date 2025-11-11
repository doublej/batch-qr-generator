<script lang="ts">
  import type { TileBatch } from '../types'
  import type { QRDesignOptions } from '$lib/config'
  import { getTileURL, getTileLabel } from '$lib/export-handlers'
  import { generateQR } from '$lib/qr-generation'
  import { Card, CardContent } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'

  let {
    batch,
    options,
    baseURL
  }: {
    batch: TileBatch | null
    options: QRDesignOptions
    baseURL: string
  } = $props()

  let previewQR = $state<string>('')
  let previewLoading = $state(false)
  let previewIndex = $state(0)
  let dpi = $state(300)

  function nextPreview() {
    if (!batch) return
    previewIndex = (previewIndex + 1) % batch.tiles.length
  }

  function prevPreview() {
    if (!batch) return
    previewIndex = (previewIndex - 1 + batch.tiles.length) % batch.tiles.length
  }

  async function updatePreview() {
    if (!batch) return
    previewLoading = true
    const tile = batch.tiles[previewIndex]
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const dataUrl = await generateQR({ text: url, format: 'png', options, tileLabel })
    previewQR = dataUrl
    previewLoading = false
  }

  function downloadPreview() {
    if (!previewQR || !batch) return
    const tile = batch.tiles[previewIndex]
    const tileLabel = getTileLabel(batch.batchId, tile.tile_number, batch.totalTiles)
    const link = document.createElement('a')
    link.download = `${tileLabel}.png`
    link.href = previewQR
    link.click()
  }

  $effect(() => {
    if (batch) {
      updatePreview()
    }
  })
</script>

<Card class="sticky top-4">
  <CardContent class="pt-6">
    {#if batch}
      <div class="space-y-4">
        {#if previewLoading}
          <div class="flex items-center justify-center py-12">
            <p class="text-muted-foreground">Loading...</p>
          </div>
        {:else if previewQR}
          <div class="space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Live Preview</span>
              <span class="font-mono">{String(previewIndex + 1).padStart(3, '0')}/{String(batch.totalTiles).padStart(3, '0')}</span>
            </div>

            <div class="relative rounded-lg border overflow-hidden" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 99px, rgba(0, 0, 0, 0.25) 99px, rgba(0, 0, 0, 0.25) 100px), repeating-linear-gradient(90deg, transparent, transparent 99px, rgba(0, 0, 0, 0.25) 99px, rgba(0, 0, 0, 0.25) 100px); background-size: 100px 100px;">
              <img src={previewQR} alt="Preview QR Code" class="w-full relative z-10" />
            </div>

            <div class="text-xs text-center text-muted-foreground space-y-1">
              <div>{options.qr.size}px × {options.qr.size}px (100px grid)</div>
              <div class="flex items-center justify-center gap-2">
                <span>Print: {((options.qr.size / dpi) * 25.4).toFixed(1)}mm × {((options.qr.size / dpi) * 25.4).toFixed(1)}mm @</span>
                <select
                  bind:value={dpi}
                  class="h-6 rounded border border-input bg-background px-2 text-xs"
                >
                  <option value={72}>72 DPI</option>
                  <option value={150}>150 DPI</option>
                  <option value={300}>300 DPI</option>
                </select>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex gap-2">
                <Button variant="outline" size="sm" onclick={prevPreview} class="flex-1">
                  Previous
                </Button>
                <Button variant="outline" size="sm" onclick={nextPreview} class="flex-1">
                  Next
                </Button>
              </div>
              <Button size="sm" onclick={downloadPreview} class="w-full">
                Download
              </Button>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex items-center justify-center py-12">
        <p class="text-muted-foreground text-center">Select a batch to preview</p>
      </div>
    {/if}
  </CardContent>
</Card>
