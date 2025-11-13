<script lang="ts">
  import type { LogoConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Slider } from '$lib/components/ui/slider'
  import { _ } from '../../lib/i18n'

  let {
    config = $bindable(),
    qrSize
  }: {
    config: LogoConfig
    qrSize: number
  } = $props()

  let logoSizeArray = $state([config.size])
  let selectedLogoPath = $state<string>('custom')
  let dimensionMode = $state<'square' | 'custom'>('square')
  let widthArray = $state([config.width ?? config.size])
  let heightArray = $state([config.height ?? config.size])
  let aspectLocked = $state(true)

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

  $effect(() => {
    if (dimensionMode === 'custom') {
      config.width = widthArray[0]
      config.height = heightArray[0]
    } else {
      config.width = undefined
      config.height = undefined
    }
  })

  function handleWidthChange(newValue: number[]) {
    widthArray = newValue
    if (aspectLocked && config.width && config.height) {
      const ratio = config.height / config.width
      heightArray = [Math.round(newValue[0] * ratio)]
    }
  }

  function handleHeightChange(newValue: number[]) {
    heightArray = newValue
    if (aspectLocked && config.width && config.height) {
      const ratio = config.width / config.height
      widthArray = [Math.round(newValue[0] * ratio)]
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <Label for="logo-enabled">{$_('logoSettings.enableLogo')}</Label>
    <Checkbox id="logo-enabled" bind:checked={config.enabled} />
  </div>

  {#if config.enabled}
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="logo-upload">{$_('logoSettings.uploadLogo')}</Label>
        <div class="relative">
          <input
            id="logo-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onchange={handleLogoUpload}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
          />
          {#if config.dataURL}
            <div class="absolute right-3 top-1/2 -translate-y-1/2 whitespace-nowrap pointer-events-none">
              <p class="text-xs text-green-600">✓ {$_('logoSettings.logoLoaded')}</p>
            </div>
          {/if}
        </div>
      </div>

      {#if config.dataURL}
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Dimension Mode</Label>
            <div class="flex gap-2">
              <button
                type="button"
                class="flex-1 px-3 py-2 text-sm border rounded-md {dimensionMode === 'square' ? 'bg-primary text-primary-foreground' : 'bg-background'}"
                onclick={() => dimensionMode = 'square'}
              >
                Square Size
              </button>
              <button
                type="button"
                class="flex-1 px-3 py-2 text-sm border rounded-md {dimensionMode === 'custom' ? 'bg-primary text-primary-foreground' : 'bg-background'}"
                onclick={() => dimensionMode = 'custom'}
              >
                Custom Dimensions
              </button>
            </div>
          </div>

          {#if dimensionMode === 'square'}
            <div class="space-y-2">
              <Label for="logo-size">{$_('logoSettings.logoSize')}</Label>
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
              <p class="text-xs text-muted-foreground">{$_('logoSettings.sizeRelative', { values: { percent: ((logoSizeArray[0] / qrSize) * 100).toFixed(1) } })}</p>
            </div>
          {:else}
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label>Custom Dimensions</Label>
                <div class="flex items-center gap-2">
                  <Label for="aspect-lock" class="text-xs">Lock Aspect</Label>
                  <Checkbox id="aspect-lock" bind:checked={aspectLocked} />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="logo-width">Width</Label>
                <div class="flex items-center gap-2">
                  <Slider
                    id="logo-width"
                    value={widthArray}
                    onValueChange={handleWidthChange}
                    min={20}
                    max={300}
                    step={5}
                    class="flex-1"
                  />
                  <span class="text-sm font-mono w-14 text-right">{widthArray[0]}px</span>
                </div>
              </div>

              <div class="space-y-2">
                <Label for="logo-height">Height</Label>
                <div class="flex items-center gap-2">
                  <Slider
                    id="logo-height"
                    value={heightArray}
                    onValueChange={handleHeightChange}
                    min={20}
                    max={300}
                    step={5}
                    class="flex-1"
                  />
                  <span class="text-sm font-mono w-14 text-right">{heightArray[0]}px</span>
                </div>
              </div>
            </div>
          {/if}

          <div class="space-y-2">
            <Label for="logo-fit">Fit Mode</Label>
            <select
              id="logo-fit"
              bind:value={config.fit}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="contain">Contain (fit within, maintain aspect)</option>
              <option value="cover">Cover (fill space, may crop)</option>
              <option value="fill">Fill (stretch to exact size)</option>
              <option value="scale-down">Scale Down (reduce if too large)</option>
            </select>
          </div>

          <div class="space-y-2">
            <Label for="logo-placement">{$_('logoSettings.logoPlacement')}</Label>
            <select
              id="logo-placement"
              bind:value={config.placement}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="center">{$_('logoSettings.center')}</option>
              <option value="top-left">{$_('logoSettings.topLeft')}</option>
              <option value="top-right">{$_('logoSettings.topRight')}</option>
              <option value="bottom-left">{$_('logoSettings.bottomLeft')}</option>
              <option value="bottom-right">{$_('logoSettings.bottomRight')}</option>
            </select>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
