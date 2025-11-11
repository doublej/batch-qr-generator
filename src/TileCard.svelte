<script lang="ts">
  import type { TileMapping } from './types'
  import { generateQRDataURL, getTileLabel, getTileURL, downloadQR } from './utils'
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'

  interface Props {
    tile: TileMapping
    batchId: string
    baseURL: string
    totalTiles: number
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
    logoDataURL: string
    logoSize: number
    textSize: number
    textMargin: number
    showTileLabel: boolean
    qrSize: number
    qrMargin: number
  }

  let { tile, batchId, baseURL, totalTiles, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin }: Props = $props()
  let qrCode = $state('')
  let loading = $state(true)
  let downloading = $state(false)

  async function handleDownload() {
    downloading = true
    await downloadQR(tile, batchId, baseURL, totalTiles, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin)
    downloading = false
  }

  $effect(() => {
    loading = true
    const url = getTileURL(tile.secure_id, baseURL)
    const tileLabel = getTileLabel(batchId, tile.tile_number, totalTiles)
    generateQRDataURL(url, { tileLabel, errorCorrectionLevel, logoDataURL, logoSize, textSize, textMargin, showTileLabel, qrSize, qrMargin }).then(result => {
      qrCode = result
      loading = false
    })
  })
</script>

<Card class="flex flex-col h-full">
  <CardHeader class="pb-3">
    <h3 class="font-semibold text-center">
      {getTileLabel(batchId, tile.tile_number, totalTiles)}
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
        {getTileURL(tile.secure_id, baseURL)}
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
