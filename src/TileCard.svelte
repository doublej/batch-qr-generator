<script lang="ts">
  import type { TileMapping } from './types'
  import type { QRDesignOptions } from './lib/config'
  import { generateQR } from './lib/qr-generation'
  import { getTileLabel, getTileURL } from './lib/export-handlers'
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'

  interface Props {
    tile: TileMapping
    config: {
      batchId: string
      baseURL: string
      totalTiles: number
      design: QRDesignOptions
    }
  }

  let { tile, config }: Props = $props()
  let qrCode = $state('')
  let loading = $state(true)
  let downloading = $state(false)

  async function handleDownload() {
    downloading = true
    const blob = await (await fetch(qrCode)).blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const label = getTileLabel(config.batchId, tile.tile_number, config.totalTiles)
    a.download = `${config.batchId}-entry-${tile.tile_number.toString().padStart(3, '0')}.png`
    a.click()
    URL.revokeObjectURL(url)
    downloading = false
  }

  $effect(() => {
    loading = true
    const url = getTileURL(tile.secure_id, config.baseURL)
    const tileLabel = getTileLabel(config.batchId, tile.tile_number, config.totalTiles)
    generateQR({ text: url, format: 'png', options: config.design, tileLabel }).then(result => {
      qrCode = result
      loading = false
    })
  })
</script>

<Card class="flex flex-col h-full">
  <CardHeader class="pb-3">
    <h3 class="font-semibold text-center">
      {getTileLabel(config.batchId, tile.tile_number, config.totalTiles)}
    </h3>
  </CardHeader>

  <CardContent class="flex flex-col items-center gap-4 flex-1">
    <div class="w-full flex items-center justify-center min-h-[200px]">
      {#if loading}
        <p class="text-muted-foreground text-sm">Generating QR...</p>
      {:else}
        <img src={qrCode} alt="QR Code for {tile.secure_id}" class="max-w-full h-auto" />
      {/if}
    </div>

    <div class="w-full space-y-3 bg-muted/50 rounded-lg p-3">
      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entry Number</p>
        <p class="text-sm font-mono">{tile.tile_number}</p>
      </div>

      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Secure ID</p>
        <p class="text-sm font-mono break-all">{tile.secure_id}</p>
      </div>

      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">URL</p>
        <p class="text-sm font-mono break-all text-primary">{getTileURL(tile.secure_id, config.baseURL)}</p>
      </div>

      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
        <p class="text-sm font-mono capitalize">{tile.status}</p>
      </div>
    </div>

    <Button
      class="w-full"
      onclick={handleDownload}
      disabled={loading || downloading}
    >
      {downloading ? 'Downloading...' : 'Download'}
    </Button>
  </CardContent>
</Card>
