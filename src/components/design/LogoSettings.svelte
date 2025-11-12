<script lang="ts">
  import type { LogoConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Slider } from '$lib/components/ui/slider'
  import { AlertCircle } from 'lucide-svelte'

  let {
    config = $bindable(),
    qrSize,
    errorCorrection = 'M'
  }: {
    config: LogoConfig
    qrSize: number
    errorCorrection?: 'L' | 'M' | 'Q' | 'H'
  } = $props()

  let logoSizeArray = $state([config.size])
  let selectedLogoPath = $state<string>('custom')

  let logoPercentage = $derived((logoSizeArray[0] / qrSize) * 100)
  let shouldWarnECC = $derived(config.enabled && errorCorrection !== 'H' && logoPercentage > 15)

  function handleLogoUpload(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        config.dataURL = e.target?.result as string
        selectedLogoPath = 'custom'
      }
      reader.readAsDataURL(file)
    }
  }

  $effect(() => {
    config.size = logoSizeArray[0]
  })
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <Label for="logo-enabled">Enable Logo Overlay</Label>
    <Checkbox id="logo-enabled" bind:checked={config.enabled} />
  </div>

  {#if config.enabled}
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="logo-upload">Upload Logo</Label>
        <input
          id="logo-upload"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onchange={handleLogoUpload}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
        />
      </div>

      {#if config.dataURL}
        <div class="space-y-4">
          <p class="text-xs text-green-600">✓ Logo loaded successfully</p>

          <div class="space-y-2">
            <Label for="logo-size">Logo Size</Label>
            <div class="flex items-center gap-2">
              <Slider
                id="logo-size"
                bind:value={logoSizeArray}
                min={20}
                max={200}
                step={5}
                class="flex-1"
              />
              <span class="text-sm font-mono w-14 text-right">{logoSizeArray[0]}px</span>
            </div>
            <p class="text-xs text-muted-foreground">Size relative to QR code dimensions ({((logoSizeArray[0] / qrSize) * 100).toFixed(1)}% of QR)</p>
          </div>

          <div class="space-y-2">
            <Label for="logo-placement">Logo Placement</Label>
            <select
              id="logo-placement"
              bind:value={config.placement}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="center">Center</option>
              <option value="top-left">Top-Left</option>
              <option value="top-right">Top-Right</option>
              <option value="bottom-left">Bottom-Left</option>
              <option value="bottom-right">Bottom-Right</option>
            </select>
          </div>

          {#if shouldWarnECC}
            <div class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertCircle class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div class="text-sm text-amber-800 dark:text-amber-200">
                <strong>Consider High Error Correction:</strong> Your logo covers {logoPercentage.toFixed(1)}% of the QR code with "{errorCorrection}" error correction.
                <br />
                <span class="text-xs">For better scannability with large logos, consider using "H" (High) error correction level in the Basics tab.</span>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
