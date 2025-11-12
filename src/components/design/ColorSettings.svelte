<script lang="ts">
  import type { ColorConfig, GradientConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Slider } from '$lib/components/ui/slider'
  import { Separator } from '$lib/components/ui/separator'
  import { _ } from '../../lib/i18n'

  let {
    colors = $bindable(),
    gradient = $bindable()
  }: {
    colors: ColorConfig
    gradient: GradientConfig
  } = $props()

  let angleArray = $state([gradient.angle])

  $effect(() => {
    gradient.angle = angleArray[0]
  })

  // Function to convert hex to RGB
  function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `RGB(${r}, ${g}, ${b})`
    }
    return 'RGB(0, 0, 0)'
  }
</script>

<div class="space-y-4">
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-2">
      <Label for="background-color">{$_('colorSettings.backgroundColor')}</Label>
      <div class="flex items-center gap-2">
        <input
          id="background-color"
          type="color"
          bind:value={colors.background}
          class="w-12 h-12 rounded-full border-2 border-input cursor-pointer"
          style="padding: 0; background: {colors.background}"
        />
        <span class="text-xs font-mono text-muted-foreground">{hexToRgb(colors.background)}</span>
      </div>
    </div>
    <div class="space-y-2">
      <Label for="eye-color">{$_('colorSettings.eyeColor')}</Label>
      <div class="flex items-center gap-2">
        <input
          id="eye-color"
          type="color"
          bind:value={colors.eyeColor}
          class="w-12 h-12 rounded-full border-2 border-input cursor-pointer"
          style="padding: 0; background: {colors.eyeColor}"
        />
        <span class="text-xs font-mono text-muted-foreground">{hexToRgb(colors.eyeColor)}</span>
      </div>
    </div>
  </div>

  <div class="space-y-2">
    <Label for="data-module-color">{$_('colorSettings.dataModuleColor')}</Label>
    <div class="flex items-center gap-2">
      <input
        id="data-module-color"
        type="color"
        bind:value={colors.dataModuleColor}
        class="w-12 h-12 rounded-full border-2 border-input cursor-pointer"
        style="padding: 0; background: {colors.dataModuleColor}"
      />
      <span class="text-xs font-mono text-muted-foreground">{hexToRgb(colors.dataModuleColor)}</span>
    </div>
  </div>

  <Separator />

  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <Label for="gradient-enabled">{$_('colorSettings.useGradient')}</Label>
      <Checkbox id="gradient-enabled" bind:checked={gradient.enabled} />
    </div>

    {#if gradient.enabled}
      <div class="space-y-4 pl-4 border-l-2">
        <div class="space-y-2">
          <Label for="gradient-type">{$_('colorSettings.gradientType')}</Label>
          <select
            id="gradient-type"
            bind:value={gradient.type}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="linear">{$_('colorSettings.linear')}</option>
            <option value="radial">{$_('colorSettings.radial')}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="gradient-start">{$_('colorSettings.startColor')}</Label>
            <div class="flex items-center gap-2">
              <input
                id="gradient-start"
                type="color"
                bind:value={gradient.start}
                class="w-12 h-12 rounded-full border-2 border-input cursor-pointer"
                style="padding: 0; background: {gradient.start}"
              />
              <span class="text-xs font-mono text-muted-foreground">{hexToRgb(gradient.start)}</span>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="gradient-end">{$_('colorSettings.endColor')}</Label>
            <div class="flex items-center gap-2">
              <input
                id="gradient-end"
                type="color"
                bind:value={gradient.end}
                class="w-12 h-12 rounded-full border-2 border-input cursor-pointer"
                style="padding: 0; background: {gradient.end}"
              />
              <span class="text-xs font-mono text-muted-foreground">{hexToRgb(gradient.end)}</span>
            </div>
          </div>
        </div>

        {#if gradient.type === 'linear'}
          <div class="space-y-2">
            <Label for="gradient-angle">{$_('colorSettings.gradientAngle')}</Label>
            <div class="flex items-center gap-2">
              <Slider id="gradient-angle" bind:value={angleArray} min={0} max={360} step={15} class="flex-1" />
              <span class="text-sm font-mono w-12 text-right">{angleArray[0]}°</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  input[type="color"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background: none;
    cursor: pointer;
  }

  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  input[type="color"]::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
  }

  input[type="color"]::-moz-color-swatch {
    border: none;
    border-radius: 50%;
  }
</style>
