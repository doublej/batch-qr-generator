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
    a.download = `${config.batchId}-tile-${tile.tile_number.toString().padStart(3, '0')}.png`
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

    <div class="w-full space-y-2">
      <p class="text-xs text-muted-foreground font-mono text-center break-all">
        {tile.secure_id}
      </p>
      <p class="text-xs text-primary font-mono text-center break-all">
        {getTileURL(tile.secure_id, config.baseURL)}
      </p>
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
