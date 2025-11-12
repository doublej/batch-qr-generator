<script lang="ts">
  import type { QRConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Slider } from '$lib/components/ui/slider'
  import {
    snapToValidQRSize,
    getEstimatedModuleCount,
    getPixelsPerModule,
    calculateValidQRSizes
  } from '$lib/qr-dimensions'

  let { config = $bindable() }: { config: QRConfig } = $props()

  // Ensure padding exists with default values
  if (!config.padding) {
    config.padding = {
      top: 16,
      right: 16,
      bottom: 16,
      left: 16
    }
  }

  const MIN_SIZE = 150
  const MAX_SIZE = 800

  // Calculate valid snap points
  const validSizes = calculateValidQRSizes(MIN_SIZE, MAX_SIZE)

  // Snap initial size to valid QR size
  const initialSnappedSize = snapToValidQRSize(config.size, MIN_SIZE, MAX_SIZE)
  config.size = initialSnappedSize

  let sizeArray = $state([initialSnappedSize])
  let paddingTopArray = $state([config.padding.top])
  let paddingRightArray = $state([config.padding.right])
  let paddingBottomArray = $state([config.padding.bottom])
  let paddingLeftArray = $state([config.padding.left])

  // Calculate module information
  let estimatedModules = $derived(getEstimatedModuleCount(sizeArray[0]))
  let pixelsPerModule = $derived(getPixelsPerModule(sizeArray[0], estimatedModules))

  // Update config when sliders change
  $effect(() => {
    // Snap to valid QR size
    const snappedSize = snapToValidQRSize(sizeArray[0], MIN_SIZE, MAX_SIZE)
    sizeArray[0] = snappedSize
    config.size = snappedSize
  })

  $effect(() => {
    if (!config.padding) {
      config.padding = { top: 16, right: 16, bottom: 16, left: 16 }
    }
    config.padding.top = paddingTopArray[0]
  })

  $effect(() => {
    if (!config.padding) {
      config.padding = { top: 16, right: 16, bottom: 16, left: 16 }
    }
    config.padding.right = paddingRightArray[0]
  })

  $effect(() => {
    if (!config.padding) {
      config.padding = { top: 16, right: 16, bottom: 16, left: 16 }
    }
    config.padding.bottom = paddingBottomArray[0]
  })

  $effect(() => {
    if (!config.padding) {
      config.padding = { top: 16, right: 16, bottom: 16, left: 16 }
    }
    config.padding.left = paddingLeftArray[0]
  })
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <Label for="qr-size">QR Code Dimensions</Label>
    <div class="flex items-center gap-2">
      <Slider id="qr-size" bind:value={sizeArray} min={MIN_SIZE} max={MAX_SIZE} step={1} class="flex-1" />
      <span class="text-sm font-mono w-16 text-right">{sizeArray[0]}px</span>
    </div>
    <div class="text-xs text-muted-foreground">
      ~{estimatedModules}×{estimatedModules} modules • {pixelsPerModule}px per module
    </div>
  </div>

  <div class="space-y-2">
    <Label>Padding</Label>
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <Label for="padding-top" class="text-xs text-muted-foreground">Top</Label>
        <div class="flex items-center gap-2">
          <Slider id="padding-top" bind:value={paddingTopArray} min={0} max={100} step={1} class="flex-1" />
          <span class="text-xs font-mono w-10 text-right">{paddingTopArray[0]}px</span>
        </div>
      </div>
      <div class="space-y-1">
        <Label for="padding-right" class="text-xs text-muted-foreground">Right</Label>
        <div class="flex items-center gap-2">
          <Slider id="padding-right" bind:value={paddingRightArray} min={0} max={100} step={1} class="flex-1" />
          <span class="text-xs font-mono w-10 text-right">{paddingRightArray[0]}px</span>
        </div>
      </div>
      <div class="space-y-1">
        <Label for="padding-bottom" class="text-xs text-muted-foreground">Bottom</Label>
        <div class="flex items-center gap-2">
          <Slider id="padding-bottom" bind:value={paddingBottomArray} min={0} max={100} step={1} class="flex-1" />
          <span class="text-xs font-mono w-10 text-right">{paddingBottomArray[0]}px</span>
        </div>
      </div>
      <div class="space-y-1">
        <Label for="padding-left" class="text-xs text-muted-foreground">Left</Label>
        <div class="flex items-center gap-2">
          <Slider id="padding-left" bind:value={paddingLeftArray} min={0} max={100} step={1} class="flex-1" />
          <span class="text-xs font-mono w-10 text-right">{paddingLeftArray[0]}px</span>
        </div>
      </div>
    </div>
  </div>

  <div class="space-y-2">
    <Label for="error-correction">Error Correction Level</Label>
    <select
      id="error-correction"
      bind:value={config.errorCorrection}
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="L">Low (7%)</option>
      <option value="M">Medium (15%)</option>
      <option value="Q">Quartile (25%)</option>
      <option value="H">High (30%)</option>
    </select>
  </div>
</div>
