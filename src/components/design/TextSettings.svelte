<script lang="ts">
  import type { TextConfig } from '$lib/config'
  import { Label } from '$lib/components/ui/label'
  import { Input } from '$lib/components/ui/input'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Slider } from '$lib/components/ui/slider'
  import { Separator } from '$lib/components/ui/separator'
  import { _ } from '../../lib/i18n'

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
    <Label for="show-label">{$_('textSettings.showLabel')}</Label>
    <Checkbox id="show-label" bind:checked={config.enabled} />
  </div>

  {#if config.enabled}
    <div class="space-y-4">
      <div class="space-y-2">
        <Label for="text-position">{$_('textSettings.textPosition')}</Label>
        <select
          id="text-position"
          bind:value={config.position}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="top">{$_('textSettings.positionTop')}</option>
          <option value="bottom">{$_('textSettings.positionBottom')}</option>
          <option value="left">{$_('textSettings.positionLeft')}</option>
          <option value="right">{$_('textSettings.positionRight')}</option>
        </select>
      </div>

      <div class="space-y-2">
        <Label for="text-size">{$_('textSettings.textSize')}</Label>
        <div class="flex items-center gap-2">
          <Slider id="text-size" bind:value={sizeArray} min={8} max={32} step={1} class="flex-1" />
          <span class="text-sm font-mono w-12 text-right">{sizeArray[0]}px</span>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="text-offset-x">{$_('textSettings.horizontalOffset')}</Label>
        <div class="flex items-center gap-2">
          <Slider id="text-offset-x" bind:value={offsetXArray} min={-100} max={100} step={1} class="flex-1" />
          <span class="text-sm font-mono w-12 text-right">{offsetXArray[0]}px</span>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="text-offset-y">{$_('textSettings.verticalOffset')}</Label>
        <div class="flex items-center gap-2">
          <Slider id="text-offset-y" bind:value={offsetYArray} min={-100} max={100} step={1} class="flex-1" />
          <span class="text-sm font-mono w-12 text-right">{offsetYArray[0]}px</span>
        </div>
      </div>

      <Separator />

      <div class="space-y-2">
        <Label for="text-align">{$_('textSettings.textAlign')}</Label>
        <select
          id="text-align"
          bind:value={config.align}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="left">{$_('textSettings.alignLeft')}</option>
          <option value="center">{$_('textSettings.alignCenter')}</option>
          <option value="right">{$_('textSettings.alignRight')}</option>
        </select>
      </div>

      <div class="space-y-2">
        <Label for="text-font">{$_('textSettings.fontFamily')}</Label>
        <select
          id="text-font"
          bind:value={config.font}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="system-ui">{$_('textSettings.fontSystemUI')}</option>
          <option value="serif">{$_('textSettings.fontSerif')}</option>
          <option value="monospace">{$_('textSettings.fontMonospace')}</option>
          <option value="Arial">{$_('textSettings.fontArial')}</option>
          <option value="Times New Roman">{$_('textSettings.fontTimesNewRoman')}</option>
          <option value="Courier New">{$_('textSettings.fontCourierNew')}</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="text-weight">{$_('textSettings.fontWeight')}</Label>
          <select
            id="text-weight"
            bind:value={config.weight}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="normal">{$_('textSettings.fontNormal')}</option>
            <option value="bold">{$_('textSettings.fontBold')}</option>
          </select>
        </div>

        <div class="space-y-2">
          <Label for="text-color">{$_('textSettings.textColor')}</Label>
          <Input id="text-color" type="color" bind:value={config.color} class="h-10" />
        </div>
      </div>

      <div class="space-y-2">
        <Label for="text-rotation">{$_('textSettings.textRotation')}</Label>
        <select
          id="text-rotation"
          bind:value={config.rotation}
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value={0}>{$_('textSettings.rotation0')}</option>
          <option value={90}>{$_('textSettings.rotation90')}</option>
          <option value={180}>{$_('textSettings.rotation180')}</option>
          <option value={270}>{$_('textSettings.rotation270')}</option>
        </select>
      </div>
    </div>
  {/if}
</div>
