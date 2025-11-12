<script lang="ts">
  import type { TextConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Slider } from '$lib/components/ui/slider'
  import { Separator } from '$lib/components/ui/separator'

  let { config = $bindable() }: { config: TextConfig } = $props()

  let sizeArray = $state([config.size])
  let offsetXArray = $state([config.offsetX])
  let offsetYArray = $state([config.offsetY])

  $effect(() => {
    config.size = sizeArray[0]
  })

  $effect(() => {
    config.offsetX = offsetXArray[0]
  })

  $effect(() => {
    config.offsetY = offsetYArray[0]
  })
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <Label for="show-label">Show Text Labels</Label>
    <Checkbox id="show-label" bind:checked={config.enabled} />
  </div>

  {#if config.enabled}
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="text-position">Text Position</Label>
        <select
          id="text-position"
          bind:value={config.position}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="top">Above QR Code</option>
          <option value="bottom">Below QR Code</option>
          <option value="left">Left of QR Code</option>
          <option value="right">Right of QR Code</option>
        </select>
      </div>

      <div class="space-y-2">
        <Label for="text-size">Text Size</Label>
        <div class="flex items-center gap-2">
          <Slider id="text-size" bind:value={sizeArray} min={8} max={32} step={1} class="flex-1" />
          <span class="text-sm font-mono w-12 text-right">{sizeArray[0]}px</span>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="text-offset-x">Horizontal Offset</Label>
        <div class="flex items-center gap-2">
          <Slider id="text-offset-x" bind:value={offsetXArray} min={-100} max={100} step={1} class="flex-1" />
          <span class="text-sm font-mono w-12 text-right">{offsetXArray[0]}px</span>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="text-offset-y">Vertical Offset</Label>
        <div class="flex items-center gap-2">
          <Slider id="text-offset-y" bind:value={offsetYArray} min={-100} max={100} step={1} class="flex-1" />
          <span class="text-sm font-mono w-12 text-right">{offsetYArray[0]}px</span>
        </div>
      </div>

      <Separator />

      <div class="space-y-2">
        <Label for="text-align">Text Alignment</Label>
        <select
          id="text-align"
          bind:value={config.align}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div class="space-y-2">
        <Label for="text-font">Font Family</Label>
        <select
          id="text-font"
          bind:value={config.font}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="system-ui">System UI</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="text-weight">Font Weight</Label>
          <select
            id="text-weight"
            bind:value={config.weight}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>

        <div class="space-y-2">
          <Label for="text-color">Text Color</Label>
          <Input id="text-color" type="color" bind:value={config.color} class="h-10" />
        </div>
      </div>

      <div class="space-y-2">
        <Label for="text-rotation">Text Rotation</Label>
        <select
          id="text-rotation"
          bind:value={config.rotation}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value={0}>0° (Horizontal)</option>
          <option value={90}>90° (Clockwise)</option>
          <option value={180}>180° (Upside Down)</option>
          <option value={270}>270° (Counter-Clockwise)</option>
        </select>
      </div>
    </div>
  {/if}
</div>
