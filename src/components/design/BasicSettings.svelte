<script lang="ts">
  import type { QRConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Slider } from '$lib/components/ui/slider'

  let { config = $bindable() }: { config: QRConfig } = $props()

  let sizeArray = $state([config.size])
  let marginArray = $state([config.margin])

  $effect(() => {
    config.size = sizeArray[0]
  })

  $effect(() => {
    config.margin = marginArray[0]
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
    <Label for="qr-margin">Margin</Label>
    <div class="flex items-center gap-2">
      <Slider id="qr-margin" bind:value={marginArray} min={0} max={100} step={1} class="flex-1" />
      <span class="text-sm font-mono w-16 text-right">{marginArray[0]}px</span>
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
