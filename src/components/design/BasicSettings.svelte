<script lang="ts">
  import type { QRConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Slider } from '$lib/components/ui/slider'

  let { config = $bindable() }: { config: QRConfig } = $props()

  let sizeArray = $state([config.size])
  let marginTopArray = $state([config.margin.top])
  let marginRightArray = $state([config.margin.right])
  let marginBottomArray = $state([config.margin.bottom])
  let marginLeftArray = $state([config.margin.left])

  $effect(() => {
    config.size = sizeArray[0]
  })

  $effect(() => {
    config.margin.top = marginTopArray[0]
  })

  $effect(() => {
    config.margin.right = marginRightArray[0]
  })

  $effect(() => {
    config.margin.bottom = marginBottomArray[0]
  })

  $effect(() => {
    config.margin.left = marginLeftArray[0]
  })
</script>

<div class="space-y-4">
  <div class="space-y-2">
    <Label for="qr-size">QR Code Dimensions</Label>
    <div class="flex items-center gap-2">
      <Slider id="qr-size" bind:value={sizeArray} min={150} max={800} step={10} class="flex-1" />
      <span class="text-sm font-mono w-16 text-right">{sizeArray[0]}px</span>
    </div>
  </div>

  <div class="space-y-2">
    <Label>Margin</Label>
    <div class="grid grid-cols-2 gap-3">
      <div class="space-y-1">
        <Label for="margin-top" class="text-xs text-muted-foreground">Top</Label>
        <div class="flex items-center gap-2">
          <Slider id="margin-top" bind:value={marginTopArray} min={0} max={100} step={1} class="flex-1" />
          <span class="text-xs font-mono w-10 text-right">{marginTopArray[0]}px</span>
        </div>
      </div>
      <div class="space-y-1">
        <Label for="margin-right" class="text-xs text-muted-foreground">Right</Label>
        <div class="flex items-center gap-2">
          <Slider id="margin-right" bind:value={marginRightArray} min={0} max={100} step={1} class="flex-1" />
          <span class="text-xs font-mono w-10 text-right">{marginRightArray[0]}px</span>
        </div>
      </div>
      <div class="space-y-1">
        <Label for="margin-bottom" class="text-xs text-muted-foreground">Bottom</Label>
        <div class="flex items-center gap-2">
          <Slider id="margin-bottom" bind:value={marginBottomArray} min={0} max={100} step={1} class="flex-1" />
          <span class="text-xs font-mono w-10 text-right">{marginBottomArray[0]}px</span>
        </div>
      </div>
      <div class="space-y-1">
        <Label for="margin-left" class="text-xs text-muted-foreground">Left</Label>
        <div class="flex items-center gap-2">
          <Slider id="margin-left" bind:value={marginLeftArray} min={0} max={100} step={1} class="flex-1" />
          <span class="text-xs font-mono w-10 text-right">{marginLeftArray[0]}px</span>
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
